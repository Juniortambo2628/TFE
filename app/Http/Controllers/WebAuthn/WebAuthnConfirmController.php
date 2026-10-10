<?php

namespace App\Http\Controllers\WebAuthn;

use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laragear\WebAuthn\Http\Requests\AssertedRequest;
use Laragear\WebAuthn\Http\Requests\AssertionRequest;
use Throwable;

/**
 * "Confirm it's you" with a passkey instead of a password (Sprint 68).
 *
 * The savings pages sit behind a fresh password check, but a fan who signed
 * up with Google or only ever used passkeys has no password they know — they
 * were locked out of their own savings view. A passkey assertion by the SAME
 * signed-in user stamps the same `auth.password_confirmed_at` the password
 * flow does.
 */
class WebAuthnConfirmController
{
    public function options(AssertionRequest $request): Responsable|JsonResponse
    {
        try {
            // Challenge for THIS user's credentials only.
            return $request->toVerify(Auth::user());
        } catch (Throwable $e) {
            Log::error('WebAuthn confirm options failed: '.$e->getMessage());

            return response()->json(['message' => 'Passkey check is unavailable. Use your password.'], 422);
        }
    }

    public function confirm(AssertedRequest $request): RedirectResponse
    {
        $userId = Auth::id();

        try {
            // `attemptWhen` only accepts the assertion if it belongs to the
            // signed-in user, so someone else's passkey can neither confirm
            // this session nor swap who is signed in.
            $user = $request->login(callbacks: [fn ($candidate) => (int) $candidate->getAuthIdentifier() === (int) $userId]);
        } catch (Throwable $e) {
            Log::warning('WebAuthn confirm failed: '.$e->getMessage());
            $user = null;
        }

        if (! $user || (int) $user->getAuthIdentifier() !== (int) $userId) {
            return back()->withErrors(['passkey' => 'That passkey could not confirm this account. Try again or use your password.']);
        }

        $request->session()->put('auth.password_confirmed_at', time());

        return redirect()->intended(route('fan.dashboard', absolute: false));
    }
}
