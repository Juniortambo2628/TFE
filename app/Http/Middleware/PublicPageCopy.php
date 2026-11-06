<?php

namespace App\Http\Middleware;

use App\Support\LandingContent;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Shares the public pages' copy (config/landing_v2.php `pages`, with Admin ->
 * Content -> Landing v2 overrides) on the public routes that read it, as
 * `v2Pages`. Lazy, so a page that never reads it never builds it.
 */
class PublicPageCopy
{
    public function handle(Request $request, Closure $next): Response
    {
        Inertia::share('v2Pages', fn () => LandingContent::all()['pages'] ?? []);

        return $next($request);
    }
}
