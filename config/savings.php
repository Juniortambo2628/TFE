<?php

use App\Savings\SandboxBankProvider;

/**
 * Saving for a trip with a bank partner (Sprint 67).
 *
 * `providers` maps an adapter key to its class. Each real bank gets its own
 * adapter implementing App\Savings\SavingsProvider; until one is signed, the
 * sandbox bank stands in. `sandbox.enabled` keeps the simulated bank off a
 * production site unless deliberately switched on for a demo.
 */
return [
    'default' => env('SAVINGS_PROVIDER', 'sandbox'),

    'providers' => [
        'sandbox' => SandboxBankProvider::class,
    ],

    'sandbox' => [
        'enabled' => env('SAVINGS_SANDBOX', env('APP_ENV') !== 'production'),
        'label' => env('SAVINGS_SANDBOX_LABEL', 'Sandbox Bank'),
    ],

    // Seconds a fresh password check unlocks savings data for. Short on
    // purpose: this is the fan's money, read live from the bank.
    'reauth_seconds' => (int) env('SAVINGS_REAUTH_SECONDS', 300),
];
