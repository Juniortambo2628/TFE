<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingSettlement;
use App\Services\MpesaService;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Pay for a booking without leaving TFE (Sprint 65).
 *
 * Two rails since Nov 2026: `method=mpesa` takes the DIRECT Daraja STK push
 * when MpesaService is configured (the prompt lands on the fan's SIM and the
 * result comes back server-to-server), otherwise it falls through to
 * Paystack's hosted mobile_money checkout. `method=card` is always Paystack.
 */
class BookingPaymentController extends Controller
{
    public function __construct(
        private PaystackService $paystack,
        private MpesaService $mpesa,
        private BookingSettlement $settlement,
    ) {}

    public function pay(Request $request, Booking $booking)
    {
        $method = $request->validate([
            'method' => 'nullable|in:card,mpesa',
            'phone' => 'nullable|string|max:25',
        ])['method'] ?? 'card';

        abort_unless($booking->user_id === Auth::id(), 403);

        $balance = $this->balance($booking);
        if ($booking->status !== 'pending_payment' || $balance <= 0) {
            return back()->with('error', 'This booking has nothing left to pay.');
        }

        if ($booking->expires_at && $booking->expires_at->isPast()) {
            return back()->with('error', 'This booking hold has expired. Rebook it from the package page.');
        }

        $currency = $booking->currency ?: 'USD';
        $reference = 'TFE-'.$booking->id.'-'.Str::upper(Str::random(10));

        // Direct Daraja STK push (Nov 2026): the prompt lands on the fan's SIM
        // and the result comes back server-to-server — no off-site checkout.
        // Deliberately BEFORE the demo short-circuit: configured keys are an
        // explicit opt-in to real (sandbox) pushes even on a dev machine.
        // Falls through to Paystack's hosted mobile_money when not configured.
        if ($method === 'mpesa' && $this->mpesa->configured()) {
            return $this->payByStk($request, $booking, $balance, $currency, $reference);
        }

        if ($this->paystack->demo()) {
            $this->settlement->settle($booking, $reference, $balance, $currency, 'demo');

            return redirect()->route('fan.bookings.show', $booking)
                ->with('success', 'Demo payment recorded — your booking is confirmed.');
        }

        // What the gateway charges. For M-Pesa that is KES, possibly converted
        // from a USD booking; `settles_amount` remembers the booking-currency
        // balance it clears (Sprint 66).
        $chargeAmount = $balance;
        $chargeCurrency = $currency;
        $channels = null;

        if ($method === 'mpesa') {
            $kes = $this->paystack->mpesaAmount($balance, $currency);
            if (! $this->paystack->enabled() || $kes === null) {
                return back()->with('error', 'M-Pesa is not available for this booking. Try paying by card.');
            }
            [$chargeAmount, $chargeCurrency, $channels] = [$kes, 'KES', ['mobile_money']];
        } elseif (! $this->paystack->enabled() || ! $this->paystack->supports($currency)) {
            return back()->with('error', 'Online payment is not available for this booking. Use the partner checkout link.');
        }

        Payment::create([
            'user_id' => $booking->user_id,
            'booking_id' => $booking->id,
            'amount' => $chargeAmount,
            'currency' => $chargeCurrency,
            'settles_amount' => $balance,
            'payment_method' => $method === 'mpesa' ? 'mpesa' : 'paystack',
            'transaction_id' => $reference,
            'status' => 'pending',
        ]);

        try {
            $url = $this->paystack->initialize(
                Auth::user()->email, $chargeAmount, $chargeCurrency, $reference,
                route('fan.bookings.pay.callback', $booking), $channels,
            );
        } catch (\Throwable $e) {
            Log::error('Paystack initialize failed: '.$e->getMessage());

            return back()->with('error', 'We could not reach the payment provider. Please try again.');
        }

        // Paystack's checkout is off-site; Inertia needs a full-page visit.
        return Inertia::location($url);
    }

    public function callback(Request $request, Booking $booking)
    {
        abort_unless($booking->user_id === Auth::id(), 403);

        $reference = (string) $request->query('reference', '');
        $payment = Payment::where('booking_id', $booking->id)
            ->where('transaction_id', $reference)
            ->first();

        if (! $payment) {
            return redirect()->route('fan.bookings.show', $booking)->with('error', 'Unknown payment reference.');
        }

        if ($payment->status === 'completed') {
            return redirect()->route('fan.bookings.show', $booking)->with('success', 'Payment already received.');
        }

        try {
            [$paid, $amount, $currency] = $this->paystack->verify($reference);
        } catch (\Throwable $e) {
            Log::error('Paystack verify failed: '.$e->getMessage());

            return redirect()->route('fan.bookings.show', $booking)
                ->with('error', 'We could not confirm the payment yet. Refresh in a minute.');
        }

        // The amount and currency must match what we asked for, or a tampered
        // checkout could settle a dear booking with a cheap payment.
        if (! $paid || $currency !== strtoupper($payment->currency) || $amount + 0.001 < (float) $payment->amount) {
            $payment->update(['status' => 'failed']);

            return redirect()->route('fan.bookings.show', $booking)->with('error', 'Payment was not completed.');
        }

        // Settle what the payment covers in the BOOKING's currency, not the
        // gateway's: a KES M-Pesa payment clears a USD balance.
        $this->settlement->settle($booking, $reference, (float) ($payment->settles_amount ?? $payment->amount), $booking->currency ?: 'USD', $payment->payment_method, $payment);

        return redirect()->route('fan.bookings.show', $booking)->with('success', 'Payment received — your booking is confirmed.');
    }

    /**
     * Direct Daraja STK push: the fan stays on this page, the prompt lands on
     * their SIM, and MpesaCallbackController applies the result when Safaricom
     * calls back (recovered by stkQuery on the page poll if that is lost).
     */
    private function payByStk(Request $request, Booking $booking, float $balance, string $currency, string $reference)
    {
        $kes = $this->mpesa->kesAmount($balance, $currency);
        if ($kes === null) {
            return back()->with('error', 'M-Pesa is not available for this booking. Try paying by card.');
        }

        // Daraja takes whole shillings; store exactly what it will charge so
        // the callback's amount check cannot trip on rounding.
        $kes = (float) (int) round($kes);
        if ($kes < 1) {
            return back()->with('error', 'The balance is too small for an M-Pesa payment.');
        }

        $phone = $this->mpesa->normalizePhone($request->input('phone'));
        if (! $phone) {
            return back()->with('error', 'Enter a valid Safaricom number, e.g. 0712345678.');
        }

        // One live prompt at a time — a second push while the first is on the
        // phone could charge the fan twice. Prompts whose window has passed
        // are retired first so they cannot block a retry.
        $stale = Payment::where('booking_id', $booking->id)
            ->where('payment_method', 'mpesa')
            ->where('status', 'pending')
            ->whereNotNull('gateway_reference')
            ->where('created_at', '<', now()->subMinutes(MpesaService::PENDING_TTL_MINUTES));
        $stale->update(['status' => 'failed']);

        $live = Payment::where('booking_id', $booking->id)
            ->where('payment_method', 'mpesa')
            ->where('status', 'pending')
            ->whereNotNull('gateway_reference')
            ->where('created_at', '>=', now()->subMinutes(MpesaService::PENDING_TTL_MINUTES))
            ->exists();

        if ($live) {
            return back()->with('error', 'An M-Pesa prompt is already waiting on your phone. Enter your PIN, or wait for it to expire.');
        }

        $payment = Payment::create([
            'user_id' => $booking->user_id,
            'booking_id' => $booking->id,
            'amount' => $kes,
            'currency' => 'KES',
            'settles_amount' => $balance,
            'payment_method' => 'mpesa',
            'transaction_id' => $reference,
            'status' => 'pending',
        ]);

        $result = $this->mpesa->stkPush(
            $kes,
            $phone,
            'TFE-'.str_pad((string) $booking->id, 6, '0', STR_PAD_LEFT),
            'Booking pay',
            route('mpesa.callback'),
        );

        $checkoutId = $result['CheckoutRequestID'] ?? null;
        if ((string) ($result['ResponseCode'] ?? '') !== '0' || ! filled($checkoutId)) {
            $payment->update(['status' => 'failed']);
            $detail = $result['ResponseDescription'] ?? $result['CustomerMessage'] ?? null;

            return back()->with('error', 'M-Pesa could not start the prompt'.($detail ? ': '.$detail : '. Please try again.'));
        }

        $payment->update(['gateway_reference' => $checkoutId]);

        return redirect()->route('fan.bookings.show', $booking)
            ->with('success', 'Check your phone — enter your M-Pesa PIN to pay KES '.number_format($kes).'.');
    }

    private function balance(Booking $booking): float
    {
        return round(max(0, (float) $booking->total_amount - (float) $booking->amount_paid), 2);
    }
}
