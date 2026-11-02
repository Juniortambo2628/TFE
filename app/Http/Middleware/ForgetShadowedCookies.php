<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

/**
 * Expire stale copies of the session + CSRF cookies left under another domain.
 *
 * On cPanel, production ran with SESSION_DOMAIN=".okjtech.co.ke", so a browser
 * that used the old site holds `the-football-experience-session` and
 * `XSRF-TOKEN` scoped to the PARENT domain. The VPS issues the same names
 * scoped to `tfe.okjtech.co.ke`. A cookie is identified by name + domain +
 * path, so the browser keeps both and sends both — and PHP reads the first,
 * which is the stale one. The session therefore never survives from the login
 * page to the login POST, and every sign-in answers 419 "Page Expired".
 *
 * The request does not say which domain a cookie came from, only that a name
 * arrived twice. When it does, we send an expired copy for every domain that
 * is NOT the one we currently issue on, which deletes the stale copy and
 * leaves the live one alone. The next request carries one of each again.
 */
class ForgetShadowedCookies
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $names = $this->shadowedNames($request);

        if ($names === []) {
            return $response;
        }

        $path = config('session.path', '/');
        $current = ltrim((string) config('session.domain'), '.');
        $domains = array_values(array_filter(
            $this->parentDomains($request->getHost()),
            fn (string $d) => $d !== $current,
        ));

        // A configured domain means the live cookie is a domain cookie, so a
        // host-only copy (no Domain attribute) is a stale one too.
        if ($current !== '') {
            $domains[] = null;
        }

        foreach ($names as $name) {
            foreach ($domains as $domain) {
                $response->headers->setCookie(new Cookie(
                    $name, '', 1, $path, $domain === null ? null : '.'.$domain,
                    $request->isSecure(), $name !== 'XSRF-TOKEN', false, Cookie::SAMESITE_LAX,
                ));
            }
        }

        return $response;
    }

    /**
     * Names from the cookies we own that arrived more than once.
     *
     * @return list<string>
     */
    private function shadowedNames(Request $request): array
    {
        $header = (string) $request->headers->get('cookie', '');

        if ($header === '') {
            return [];
        }

        $counts = [];
        foreach (explode(';', $header) as $pair) {
            $name = trim(strstr($pair, '=', true) ?: $pair);
            $counts[$name] = ($counts[$name] ?? 0) + 1;
        }

        return array_values(array_filter(
            [config('session.cookie'), 'XSRF-TOKEN'],
            fn ($name) => ($counts[$name] ?? 0) > 1,
        ));
    }

    /**
     * The host and each parent domain with at least two labels
     * ("tfe.okjtech.co.ke" → tfe.okjtech.co.ke, okjtech.co.ke, co.ke). A public
     * suffix like co.ke is rejected by the browser, which is harmless here.
     *
     * @return list<string>
     */
    private function parentDomains(string $host): array
    {
        if (filter_var($host, FILTER_VALIDATE_IP) || ! str_contains($host, '.')) {
            return [];
        }

        $labels = explode('.', $host);
        $domains = [];
        while (count($labels) >= 2) {
            $domains[] = implode('.', $labels);
            array_shift($labels);
        }

        return $domains;
    }
}
