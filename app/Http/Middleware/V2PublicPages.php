<?php

namespace App\Http\Middleware;

use App\Support\LandingContent;
use App\Support\PageVersion;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * The /v2/... twins of the public pages (UX review, Nov 2026).
 *
 * Marks the request so the controller renders its V2/ page (PageVersion),
 * shares the v2 page copy (config/landing_v2.php `pages`, with Admin ->
 * Content -> Landing v2 overrides), and keeps every v2 page out of search
 * results until the tester group has chosen a direction — the same
 * X-Robots-Tag the /v2 landing page sends.
 */
class V2PublicPages
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set(PageVersion::ATTRIBUTE, true);

        Inertia::share('v2Pages', fn () => LandingContent::all()['pages'] ?? []);

        $response = $next($request);
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        return $response;
    }
}
