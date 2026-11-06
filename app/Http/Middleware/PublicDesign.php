<?php

namespace App\Http\Middleware;

use App\Support\LandingContent;
use App\Support\PageVersion;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * The public pages at their plain addresses render in the site's design
 * (config app.design). With v2 on, the controller names its V2/ page
 * (PageVersion) and the page copy is shared, exactly as on the /v2 twins,
 * but indexable. With the v1 fallback it does nothing.
 */
class PublicDesign
{
    public function handle(Request $request, Closure $next): Response
    {
        if (PageVersion::isDefault()) {
            $request->attributes->set(PageVersion::ATTRIBUTE, true);
            Inertia::share('v2Pages', fn () => LandingContent::all()['pages'] ?? []);
        }

        return $next($request);
    }
}
