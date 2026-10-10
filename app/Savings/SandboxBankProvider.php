<?php

namespace App\Savings;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

/**
 * A simulated bank, so the savings journey can be built and demoed before a
 * banking partner is signed (Sprint 67).
 *
 * It plays the BANK's part — account opening, ledger, deposits, paying a
 * partner — using its own `sandbox_bank_*` tables, which stand in for the
 * bank's systems and are not TFE data. Its "pages" (/sandbox-bank/…) stand in
 * for the bank's hosted onboarding and the M-Pesa prompt on the fan's phone.
 */
class SandboxBankProvider implements SavingsProvider
{
    public function key(): string
    {
        return 'sandbox';
    }

    public function label(): string
    {
        return config('savings.sandbox.label', 'Sandbox Bank');
    }

    public function currencies(): array
    {
        return ['USD', 'KES', 'EUR', 'GBP', 'NGN', 'ZAR', 'XOF'];
    }

    public function onboardingUrl(string $state, string $returnUrl, array $prefill): string
    {
        return URL::temporarySignedRoute('sandbox-bank.onboard', now()->addMinutes(30), [
            'state' => $state,
            'return' => $returnUrl,
            'name' => $prefill['name'] ?? '',
        ]);
    }

    public function completeOnboarding(array $returnParams, string $state): ?string
    {
        if (($returnParams['state'] ?? null) !== $state) {
            return null;
        }
        $ref = (string) ($returnParams['account_ref'] ?? '');

        return DB::table('sandbox_bank_accounts')->where('ref', $ref)->exists() ? $ref : null;
    }

    public function balances(string $accountRef): array
    {
        $rows = DB::table('sandbox_bank_transactions')
            ->where('account_ref', $accountRef)
            ->selectRaw('currency, SUM(amount) as total')
            ->groupBy('currency')
            ->pluck('total', 'currency');

        return [
            'balances' => $rows->map(fn ($v) => round((float) $v, 2))->all(),
            'as_of' => now()->toIso8601String(),
        ];
    }

    public function transactions(string $accountRef): array
    {
        return DB::table('sandbox_bank_transactions')
            ->where('account_ref', $accountRef)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($t) => [
                'reference' => $t->reference,
                'type' => $t->type,
                'amount' => (float) $t->amount,
                'currency' => $t->currency,
                'description' => $t->description,
                'occurred_at' => (string) $t->created_at,
            ])
            ->all();
    }

    public function depositInstruction(string $accountRef, float $amount, string $currency, string $returnUrl): array
    {
        return [
            'type' => 'redirect',
            'url' => URL::temporarySignedRoute('sandbox-bank.approve', now()->addMinutes(10), [
                'ref' => $accountRef,
                'amount' => number_format($amount, 2, '.', ''),
                'currency' => strtoupper($currency),
                'return' => $returnUrl,
            ]),
            'message' => 'Approve the payment request from your bank to complete the deposit.',
        ];
    }

    public function payPartner(string $accountRef, float $amount, string $currency, array $payee): array
    {
        return DB::transaction(function () use ($accountRef, $amount, $currency, $payee) {
            $balance = (float) DB::table('sandbox_bank_transactions')
                ->where('account_ref', $accountRef)->where('currency', $currency)
                ->lockForUpdate()->sum('amount');

            if ($balance + 0.001 < $amount) {
                return ['status' => 'declined', 'reference' => null, 'message' => 'Not enough saved in '.$currency.' for this payment.'];
            }

            $reference = 'SBX-PAY-'.Str::upper(Str::random(10));
            DB::table('sandbox_bank_transactions')->insert([
                'account_ref' => $accountRef,
                'reference' => $reference,
                'type' => 'payment',
                'amount' => -round($amount, 2),
                'currency' => $currency,
                'description' => 'Paid to '.$payee['name'].' ('.$payee['reference'].')',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return ['status' => 'completed', 'reference' => $reference, 'message' => 'Paid by '.$this->label().'.'];
        });
    }

    /** Called by the simulated bank's own pages, never by TFE code paths. */
    public static function openAccount(string $holderName): string
    {
        $ref = (string) Str::uuid();
        DB::table('sandbox_bank_accounts')->insert(['ref' => $ref, 'holder_name' => $holderName, 'created_at' => now(), 'updated_at' => now()]);

        return $ref;
    }

    public static function credit(string $ref, float $amount, string $currency): void
    {
        DB::table('sandbox_bank_transactions')->insert([
            'account_ref' => $ref,
            'reference' => 'SBX-DEP-'.Str::upper(Str::random(10)),
            'type' => 'deposit',
            'amount' => round($amount, 2),
            'currency' => strtoupper($currency),
            'description' => 'Deposit (simulated M-Pesa)',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
