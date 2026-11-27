<?php

namespace App\Services;

use App\Models\Payment;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Safaricom Daraja — direct M-Pesa STK push (Nov 2026).
 *
 * This is the fan's phone rail: the push sends a PIN prompt to the SIM, the
 * result arrives server-to-server at route('mpesa.callback') — never through
 * the browser. Paystack keeps the card rail (see PaystackService); with no
 * Daraja keys configured every method falls back to it, so a deployment
 * without these credentials behaves exactly as before.
 *
 * KES only: `kesAmount()` converts a booking balance at
 * `services.mpesa.kes_per_usd`, falling back to the Sprint-66 Paystack rate
 * so one number stays the truth.
 */
class MpesaService
{
    /** A push this old with no callback is treated as expired (STK prompts time out ~60s). */
    public const PENDING_TTL_MINUTES = 15;

    public function __construct(private BookingSettlement $settlement) {}

    public function configured(): bool
    {
        return filled(config('services.mpesa.consumer_key'))
            && filled(config('services.mpesa.consumer_secret'))
            && filled(config('services.mpesa.passkey'))
            && filled(config('services.mpesa.shortcode'));
    }

    public function baseUrl(): string
    {
        return config('services.mpesa.env') === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    /**
     * KES to charge for a booking balance, or null when this booking cannot
     * be paid by M-Pesa (a non-KES balance with no conversion rate set).
     */
    public function kesAmount(float $amount, string $currency): ?float
    {
        if (strtoupper($currency) === 'KES') {
            return $amount;
        }

        $rate = config('services.mpesa.kes_per_usd') ?: config('services.paystack.kes_per_usd');

        return $rate ? $amount * (float) $rate : null;
    }

    /**
     * "0712345678" / "+254712345678" / "254712345678" → "254712345678";
     * anything that is not a Kenyan mobile number → null.
     */
    public function normalizePhone(?string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);

        if (preg_match('/^0(7|1)\d{8}$/', $digits)) {
            return '254'.substr($digits, 1);
        }

        if (preg_match('/^254(7|1)\d{8}$/', $digits)) {
            return $digits;
        }

        if (preg_match('/^(7|1)\d{8}$/', $digits)) {
            return '254'.$digits;
        }

        return null;
    }

    /**
     * Send the PIN prompt. Returns Daraja's response array; on a transport
     * failure it returns [] and the caller reports the outage (a failed push
     * never charges anyone — the prompt never reached a phone).
     *
     * AccountReference is capped at 12 chars and TransactionDesc at 13 —
     * Daraja rejects longer values with 400.002.02.
     */
    public function stkPush(float $kesAmount, string $phone, string $accountReference, string $description, string $callbackUrl): array
    {
        $timestamp = $this->timestamp();

        try {
            $response = $this->client()
                ->post('/mpesa/stkpush/v1/processrequest', [
                    'BusinessShortCode' => config('services.mpesa.shortcode'),
                    'Password' => $this->password($timestamp),
                    'Timestamp' => $timestamp,
                    'TransactionType' => 'CustomerPayBillOnline',
                    // Daraja takes whole shillings only.
                    'Amount' => (int) round($kesAmount),
                    'PartyA' => $phone,
                    'PartyB' => config('services.mpesa.shortcode'),
                    'PhoneNumber' => $phone,
                    'CallBackURL' => $callbackUrl,
                    'AccountReference' => Str::limit($accountReference, 12, ''),
                    'TransactionDesc' => Str::limit($description, 13, ''),
                ]);
        } catch (\Throwable $e) {
            report($e);

            return [];
        }

        return $response->json() ?? [];
    }

    /**
     * Ask Safaricom the fate of a push whose callback never arrived (the
     * browser polls this through the booking page while a prompt is pending).
     */
    public function stkQuery(string $checkoutRequestId): array
    {
        $timestamp = $this->timestamp();

        try {
            $response = $this->client()
                ->post('/mpesa/stkpushquery/v1/query', [
                    'BusinessShortCode' => config('services.mpesa.shortcode'),
                    'Password' => $this->password($timestamp),
                    'Timestamp' => $timestamp,
                    'CheckoutRequestID' => $checkoutRequestId,
                ]);
        } catch (\Throwable $e) {
            report($e);

            return [];
        }

        return $response->json() ?? [];
    }

    /** Daraja's ResultCode: 0 = paid, 1032 = cancelled, 1037 = timed out. */
    public function isSuccess(array $result): bool
    {
        return (int) ($result['ResultCode'] ?? 1) === 0;
    }

    /** The M-Pesa receipt (SGH789345…) from a successful result, if present. */
    public function receipt(array $result): ?string
    {
        foreach ($result['CallbackMetadata']['Item'] ?? [] as $item) {
            if (($item['Name'] ?? null) === 'MpesaReceiptNumber') {
                return (string) ($item['Value'] ?? '');
            }
        }

        return null;
    }

    /** The amount Safaricom actually collected, from a successful result. */
    public function paidAmount(array $result): ?float
    {
        foreach ($result['CallbackMetadata']['Item'] ?? [] as $item) {
            if (($item['Name'] ?? null) === 'Amount') {
                return (float) ($item['Value'] ?? 0);
            }
        }

        return null;
    }

    /**
     * Apply a Daraja result (callback payload or stkQuery reply) to the
     * pending payment — the ONE settlement path for both, so a lost callback
     * recovered by polling settles exactly like a delivered one.
     *
     * Idempotent: a payment already settled or failed is left alone, so the
     * callback and the query racing each other cannot double-credit. Returns
     * 'pending' | 'completed' | 'failed'.
     *
     * Amount check: Safaricom reports what it collected; if that differs from
     * what we asked to charge, something is wrong and nobody gets credited
     * (same rule as the Sprint-65 Paystack verify).
     */
    public function applyResult(Payment $payment, array $result): string
    {
        // Idempotent: a settled payment is never touched again, so the
        // callback and a query racing each other cannot double-credit.
        // A 'failed' row MAY still settle — Safaricom says the money moved
        // and the amount check below proves it is the money we asked for.
        if ($payment->status === 'completed') {
            return 'completed';
        }

        // Still processing (or an empty/transport-failed reply): leave it as it is.
        if (! array_key_exists('ResultCode', $result) || $result['ResultCode'] === null || $result['ResultCode'] === '') {
            return $payment->status;
        }

        if (! $this->isSuccess($result)) {
            $payment->update(['status' => 'failed']);

            return 'failed';
        }

        $paid = $this->paidAmount($result);
        if ($paid !== null && abs($paid - (float) $payment->amount) > 0.01) {
            Log::error('M-Pesa amount mismatch — not settling', [
                'payment_id' => $payment->id,
                'expected' => $payment->amount,
                'reported' => $paid,
            ]);
            $payment->update(['status' => 'failed']);

            return 'failed';
        }

        if ($receipt = $this->receipt($result)) {
            $payment->update(['gateway_receipt' => $receipt]);
        }

        $booking = $payment->booking;
        if (! $booking) {
            // The booking is gone; keep the money's record honest either way.
            $payment->update(['status' => 'completed', 'paid_at' => now()]);

            return 'completed';
        }

        $this->settlement->settle(
            $booking,
            $payment->transaction_id,
            (float) ($payment->settles_amount ?? $payment->amount),
            $booking->currency ?: 'USD',
            'mpesa',
            $payment,
        );

        return 'completed';
    }

    private function client()
    {
        return Http::baseUrl($this->baseUrl())
            ->withToken($this->token())
            ->acceptJson()
            ->timeout(20);
    }

    /** OAuth token, cached just under an hour (Daraja's own expiry). */
    private function token(): string
    {
        $cached = Cache::get('mpesa.access_token');
        if (filled($cached)) {
            return (string) $cached;
        }

        $response = Http::baseUrl($this->baseUrl())
            ->withBasicAuth(
                config('services.mpesa.consumer_key'),
                config('services.mpesa.consumer_secret'),
            )
            ->acceptJson()
            ->timeout(20)
            ->get('/oauth/v1/generate?grant_type=client_credentials');

        $token = (string) $response->json('access_token');

        // Only cache a real token: a transient network failure must not pin
        // an empty Bearer header for the next 55 minutes.
        if (filled($token)) {
            Cache::put('mpesa.access_token', $token, now()->addSeconds(3300));
        }

        return $token;
    }

    /** base64(shortcode + passkey + timestamp), timestamp in East Africa Time. */
    private function password(string $timestamp): string
    {
        return base64_encode(config('services.mpesa.shortcode').config('services.mpesa.passkey').$timestamp);
    }

    private function timestamp(): string
    {
        return now('Africa/Nairobi')->format('YmdHis');
    }
}
