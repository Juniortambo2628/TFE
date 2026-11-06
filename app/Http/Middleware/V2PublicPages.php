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
 * Since the switch to v2 (config app.design) these addresses permanently
 * redirect to the plain ones. With the v1 fallback on, it
 * marks the request so the controller renders its V2/ page (PageVersion),
 * shares the v2 page copy (config/landing_v2.php `pages`, with Admin ->
 * Content -> Landing v2 overrides), and keeps every v2 page out of search
 * results until the tester group has chosen a direction — the same
 * X-Robots-Tag the /v2 landing page sends.
 */
class V2PublicPages
{
    public function handle(Request $request, Closure $next): Response
    {
        // v2 is the site now: the preview address redirects to the real one,
        // so links shared during the comparison keep working.
        if (PageVersion::isDefault()) {
            $path = '/'.ltrim(substr($request->path(), strlen('v2')), '/');
            $query = $request->getQueryString();

            return redirect($path.($query ? "?{$query}" : ''), 301);
        }

        $request->attributes->set(PageVersion::ATTRIBUTE, true);

        Inertia::share('v2Pages', fn () => LandingContent::all()['pages'] ?? []);

        $response = $next($request);
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        return $response;
    }
}
