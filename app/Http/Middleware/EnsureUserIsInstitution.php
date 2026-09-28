<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate for the institution surfaces (Sprint 62).
 *
 * Every group route is scoped to the signed-in institution's own rows, but
 * a gate on the whole prefix means a route added later cannot forget it —
 * which is exactly how the partner Convert queue ended up unscoped for six
 * sprints (Sprint 56).
 */
class EnsureUserIsInstitution
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isInstitution()) {
            abort(403, 'This area is for institution accounts.');
        }

        return $next($request);
    }
}
