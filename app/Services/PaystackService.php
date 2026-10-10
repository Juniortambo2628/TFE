<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Paystack checkout (Sprint 65).
 *
 * TFE has historically left payment on the partner's rails. This is opt-in:
 * with no PAYSTACK_SECRET_KEY the booking page keeps the partner checkout
 * link and nothing here is reached. `demo` mode (local/testing only, no key)
 * settles a booking without a gateway so the flow can be demoed end to end.
 */
class PaystackService
{
    /** Currencies Paystack settles. Others fall back to the partner link. */
    public const CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES', 'USD'];

    public function enabled(): bool
    {
        return filled(config('services.paystack.secret'));
    }

    public function demo(): bool
    {
        return ! $this->enabled() && app()->environment('local', 'testing');
    }

    public function supports(string $currency): bool
    {
        return in_array(strtoupper($currency), self::CURRENCIES, true);
    }

    /**
     * Start a transaction; returns Paystack's hosted checkout URL.
     */
    public function initialize(string $email, float $amount, string $currency, string $reference, string $callbackUrl): string
    {
        $res = $this->client()->post('/transaction/initialize', [
            'email' => $email,
            // Paystack takes the smallest currency unit.
            'amount' => (int) round($amount * 100),
            'currency' => strtoupper($currency),
            'reference' => $reference,
            'callback_url' => $callbackUrl,
        ])->throw()->json();

        return $res['data']['authorization_url'];
    }

    /**
     * Verify a reference server-side. Returns [paid, amountMajor, currency].
     * Never trust the callback's query string on its own.
     */
    public function verify(string $reference): array
    {
        $data = $this->client()->get('/transaction/verify/'.rawurlencode($reference))
            ->throw()->json('data') ?? [];

        return [
            ($data['status'] ?? null) === 'success',
            ((int) ($data['amount'] ?? 0)) / 100,
            strtoupper($data['currency'] ?? ''),
        ];
    }

    private function client()
    {
        return Http::baseUrl('https://api.paystack.co')
            ->withToken(config('services.paystack.secret'))
            ->acceptJson()
            ->timeout(15);
    }
}
