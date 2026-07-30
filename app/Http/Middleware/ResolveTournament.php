<?php

namespace App\Http\Middleware;

use App\Services\TournamentService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ResolveTournament — Sets the active tournament on the request based on
 * ?tournament= query parameter. Must run before HandleInertiaRequests.
 *
 * After this middleware runs, you can access the active tournament via:
 *   $request->attributes->get('tournament_id')
 *   app(\App\Services\TournamentService::class)->current()
 */
class ResolveTournament
{
    public function __construct(protected TournamentService $tournaments) {}

    public function handle(Request $request, Closure $next): Response
    {
        $id = $this->tournaments->resolveFromRequest($request);
        $request->attributes->set('tournament_id', $id);

        return $next($request);
    }
}
