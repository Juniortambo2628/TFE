<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Savings data is the fan's money, read live from their bank, so it sits
 * behind a FRESH password check (Sprint 67) — `savings.reauth_seconds`, five
 * minutes by default, not the app-wide three hours. Responses are marked
 * no-store so the browser, a shared computer or a proxy keeps no copy either.
 */
class RequireFreshPassword
{
    public function handle(Request $request, Closure $next): Response
    {
        $confirmedAt = (int) $request->session()->get('auth.password_confirmed_at', 0);

        if (time() - $confirmedAt > config('savings.reauth_seconds', 300)) {
            // A POST cannot be replayed after the password screen, so send the
            // fan back to the page they acted from.
            $request->session()->put('url.intended', $request->isMethod('GET') ? $request->fullUrl() : url()->previous());

            return redirect()->route('password.confirm');
        }

        $response = $next($request);
        $response->headers->set('Cache-Control', 'no-store, private');
        $response->headers->set('Pragma', 'no-cache');

        return $response;
    }
}
