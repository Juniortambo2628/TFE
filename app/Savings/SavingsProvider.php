<?php

namespace App\Savings;

/**
 * What TFE needs from a bank partner's savings product (Sprint 67).
 *
 * One adapter per bank implements this; TFE code only ever talks to the
 * interface. Every read is LIVE — implementations must not cache balances or
 * transactions on TFE's side, because TFE does not keep financial data.
 */
interface SavingsProvider
{
    public function key(): string;

    /** The bank's name as the fan should see it. */
    public function label(): string;

    /** ISO codes this bank can hold in a trip-savings account. */
    public function currencies(): array;

    /**
     * Where to send the fan to open an account. The bank runs KYC there; TFE
     * passes only what the fan consented to share.
     *
     * @param  array{name: string, email: string}  $prefill
     */
    public function onboardingUrl(string $state, string $returnUrl, array $prefill): string;

    /** Exchange the bank's return parameters for the opaque account ref, or null. */
    public function completeOnboarding(array $returnParams, string $state): ?string;

    /** @return array{balances: array<string, float>, as_of: string} */
    public function balances(string $accountRef): array;

    /** @return list<array{reference: string, type: string, amount: float, currency: string, description: string, occurred_at: string}> */
    public function transactions(string $accountRef): array;

    /**
     * How the fan pays INTO their account — straight to the bank, never via
     * TFE. Returns an instruction the UI shows or follows (a redirect, an STK
     * push message, or a paybill + account reference).
     *
     * @return array{type: string, url?: string, message: string}
     */
    public function depositInstruction(string $accountRef, float $amount, string $currency, string $returnUrl): array;

    /**
     * Ask the bank to pay a partner from the account. Called only after the
     * fan has authorised this exact payment. The bank moves the money.
     *
     * @param  array{name: string, reference: string}  $payee
     * @return array{status: string, reference: ?string, message: string}
     */
    public function payPartner(string $accountRef, float $amount, string $currency, array $payee): array;
}
