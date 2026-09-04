<?php

namespace App\Traits;

use App\Services\TournamentService;

/**
 * ResolvesTournament — Shared helper for controllers that need the
 * currently active tournament. Removes the 3-line block that was
 * copy-pasted across Fan/Admin controllers, and prevents the wc_2026
 * fallback drift.
 *
 * Usage inside a controller:
 *   use \App\Traits\ResolvesTournament;
 *   $t = $this->activeTournament();
 *   $id = $this->activeTournamentId();
 */
trait ResolvesTournament
{
    protected function tournamentService(): TournamentService
    {
        return app(TournamentService::class);
    }

    /**
     * Full active tournament payload (config + Wikipedia).
     */
    protected function activeTournament(): array
    {
        return $this->tournamentService()->current();
    }

    /**
     * Just the active tournament ID.
     */
    protected function activeTournamentId(): string
    {
        $t = $this->activeTournament();

        return $t['id'] ?? config('tournaments.default');
    }

    /**
     * Whether the active tournament has concluded.
     */
    protected function isTournamentConcluded(?array $tournament = null): bool
    {
        $tournament = $tournament ?? $this->activeTournament();

        return ($tournament['status'] ?? '') === 'concluded';
    }
}
