<?php

namespace App\Http\Controllers\WebAuthn;

use App\Traits\HandlesPostLogin;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Laragear\WebAuthn\Http\Requests\AssertedRequest;
use Laragear\WebAuthn\Http\Requests\AssertionRequest;
use Laragear\WebAuthn\Models\WebAuthnCredential;
use Throwable;

/**
 * Passkey sign-in.
 *
 * Both endpoints sit on the same `webauthn/login` URI (GET = challenge,
 * POST = assertion), which is why a browser console only ever shows
 * "webauthn/login" when one of them fails.
 *
 * Laragear's own assertion pipeline only swallows AssertionException — every
 * other throw (a public key that will not decrypt under the current APP_KEY, a
 * malformed stored credential, a write failure on the signature counter)
 * escaped as a bare 500 with nothing logged and nothing shown to the fan. Both
 * actions now translate anything unexpected into a 422 the client can render,
 * and log the real reason so it is diagnosable from storage/logs/laravel.log.
 */
class WebAuthnLoginController
{
    use HandlesPostLogin;

    /**
     * Returns the challenge to assertion.
     */
    public function options(AssertionRequest $request): Responsable|JsonResponse
    {
        $credentials = $request->validate(['email' => 'nullable|email|string']);

        // An empty email must mean "discoverable credential", not "find the user
        // whose email is an empty string" — otherwise the challenge is built for
        // a user lookup that can never match.
        $credentials = array_filter($credentials, static fn ($value) => filled($value));

        try {
            return $request->toVerify($credentials);
        } catch (Throwable $e) {
            $this->logFailure('options', $e, ['email' => $credentials['email'] ?? null]);

            return response()->json([
                'message' => 'We could not start a passkey sign-in just now. Please use your email and password.',
            ], 422);
        }
    }

    /**
     * Log the user in.
     */
    public function login(AssertedRequest $request): RedirectResponse|JsonResponse
    {
        try {
            $user = $request->login();
        } catch (DecryptException $e) {
            // The stored public key cannot be read back under the current
            // APP_KEY (Laragear encrypts it at rest). The passkey is dead
            // weight until it is registered again, so retire it rather than
            // letting every future attempt 500.
            $this->retireUnreadableCredential($request->input('id'), $e);

            return $this->failed(
                'This passkey can no longer be verified on this server. Sign in with your password, then remove and re-add the passkey under Security.'
            );
        } catch (Throwable $e) {
            $this->logFailure('login', $e, ['credential_id' => $request->input('id')]);

            return $this->failed('We could not verify that passkey. Please sign in with your email and password.');
        }

        if (! $user) {
            return $this->failed('That passkey was not recognised. Try again, or sign in with your email and password.');
        }

        // A passkey is a single factor. If the account opted into 2FA, it still
        // owes us the second one — the old 204 response skipped this entirely.
        if ($this->requiresTwoFactor($user)) {
            $this->stashTwoFactorChallenge($request, $user, $request->hasRemember());

            return redirect()->route('login.two-factor');
        }

        $this->recordLoginAndNotify($request, $user);

        // Inertia cannot navigate on a 204, so the fan used to stay parked on
        // the login screen even though the session had been established.
        return redirect()->intended($this->dashboardRouteFor($user));
    }

    /**
     * A sign-in that did not work out, shaped for whichever client asked.
     */
    protected function failed(string $message): RedirectResponse|JsonResponse
    {
        if (request()->expectsJson() && ! request()->header('X-Inertia')) {
            return response()->json(['message' => $message], 422);
        }

        return back()->withErrors(['passkey' => $message]);
    }

    /**
     * Disable a credential whose public key no longer decrypts.
     */
    protected function retireUnreadableCredential(?string $id, Throwable $e): void
    {
        $this->logFailure('login', $e, ['credential_id' => $id, 'action' => 'credential_disabled']);

        if (! $id) {
            return;
        }

        try {
            WebAuthnCredential::whereKey($id)->whereEnabled()->update(['disabled_at' => now()]);
        } catch (Throwable $inner) {
            Log::warning('WebAuthn: could not disable unreadable credential.', [
                'credential_id' => $id,
                'exception' => $inner->getMessage(),
            ]);
        }
    }

    /**
     * Log the real cause so a 422 shown to the fan stays diagnosable.
     */
    protected function logFailure(string $stage, Throwable $e, array $context = []): void
    {
        Log::error("WebAuthn {$stage} failed: ".$e->getMessage(), $context + [
            'exception' => $e::class,
            'file' => $e->getFile().':'.$e->getLine(),
        ]);
    }
}
