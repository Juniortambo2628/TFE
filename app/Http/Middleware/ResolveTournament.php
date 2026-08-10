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
        // Check for explicit ?tournament= parameter
        $requested = $request->query('tournament');
        if ($requested && $this->tournaments->exists($requested)) {
            $request->session()->put('active_tournament', $requested);
            $id = $requested;
        } else {
            // Fall back to session-stored tournament, then config default
            $id = $request->session()->get('active_tournament')
                ?? $this->tournaments->resolveFromRequest($request);
        }

        // Validate the resolved ID still exists
        if (! $this->tournaments->exists($id)) {
            $id = config('tournaments.default', 'afcon_2027');
        }

        $request->attributes->set('tournament_id', $id);

        return $next($request);
    }
}
