<?php

namespace App\Http\Controllers;

use App\Savings\SandboxBankProvider;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * The SIMULATED BANK's own screens (Sprint 67) — its hosted onboarding and
 * the "approve on your phone" deposit prompt. They stand in for pages a real
 * bank serves on its own domain, and are reached only by signed URLs that
 * SandboxBankProvider issues. Off unless `savings.sandbox.enabled`.
 */
class SandboxBankController extends Controller
{
    public function onboard(Request $request)
    {
        return Inertia::render('SandboxBank/Onboard', [
            'bank' => config('savings.sandbox.label'),
            'name' => (string) $request->query('name', ''),
            'action' => $request->fullUrl(),
        ]);
    }

    public function open(Request $request)
    {
        $ref = SandboxBankProvider::openAccount((string) $request->query('name', 'Fan'));
        $return = (string) $request->query('return');

        return $this->backTo($return, ['state' => $request->query('state'), 'account_ref' => $ref]);
    }

    public function approve(Request $request)
    {
        return Inertia::render('SandboxBank/Approve', [
            'bank' => config('savings.sandbox.label'),
            'amount' => (float) $request->query('amount'),
            'currency' => (string) $request->query('currency'),
            'action' => $request->fullUrl(),
            'cancel' => (string) $request->query('return'),
        ]);
    }

    public function confirm(Request $request)
    {
        SandboxBankProvider::credit((string) $request->query('ref'), (float) $request->query('amount'), (string) $request->query('currency'));

        return $this->backTo((string) $request->query('return'), []);
    }

    /** Only ever send the fan back into this app. */
    private function backTo(string $return, array $params)
    {
        $base = rtrim(config('app.url'), '/');
        abort_unless(str_starts_with($return, $base.'/') || str_starts_with($return, url('/').'/'), 400);

        $sep = str_contains($return, '?') ? '&' : '?';

        return Inertia::location($return.($params ? $sep.http_build_query($params) : ''));
    }
}
