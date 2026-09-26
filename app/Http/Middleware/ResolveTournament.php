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
 *
 * Sprint 53 — the active context is now always an ongoing or upcoming
 * tournament. A concluded one can no longer be selected, by query string or
 * out of a stale session: it carries a full venue catalogue, stadium
 * photography and Wikipedia enrichment that every context-aware surface then
 * loads for an event nobody can travel to. Past tournaments keep their own
 * read-only page at `/tournaments/{slug}`, which resolves its tournament from
 * the route and never touches the session.
 */
class ResolveTournament
{
    public function __construct(protected TournamentService $tournaments) {}

    public function handle(Request $request, Closure $next): Response
    {
        // An explicit ?tournament= wins, but only if it is one you may
        // actually switch to. A concluded id is ignored rather than honoured
        // and then corrected, so it never reaches the session.
        $requested = $request->query('tournament');
        if ($requested && $this->tournaments->exists($requested) && $this->tournaments->isSwitchable($requested)) {
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

        // Anything that resolved to a concluded tournament — a session stored
        // before this rule, an admin default that has since finished — moves
        // on to the next live/upcoming one and is written back, so the
        // correction happens once rather than on every request.
        if (! $this->tournaments->isSwitchable($id)) {
            $nextActive = $this->tournaments->nextActive();
            if ($nextActive) {
                $id = $nextActive['id'];
                $request->session()->put('active_tournament', $id);
            }
        }

        $request->attributes->set('tournament_id', $id);

        return $next($request);
    }
}
