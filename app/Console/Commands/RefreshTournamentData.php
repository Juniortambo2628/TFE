<?php

namespace App\Console\Commands;

use App\Services\TournamentService;
use Illuminate\Console\Command;

/**
 * RefreshTournamentData — Pulls the latest data from Wikipedia for every
 * tournament defined in config/tournaments.php. Designed to be run via
 * Laravel's task scheduler (see app/Console/Kernel.php).
 *
 * Usage:
 *   php artisan tournaments:refresh
 *   php artisan tournaments:refresh --id=wc_2026
 */
class RefreshTournamentData extends Command
{
    protected $signature = 'tournaments:refresh {--id=* : Specific tournament IDs to refresh (defaults to all)}';

    protected $description = 'Refresh cached tournament data from Wikipedia and other sources';

    public function handle(TournamentService $service): int
    {
        $ids = $this->option('id');
        $all = empty($ids);
        $tournaments = $service->all();

        foreach ($tournaments as $t) {
            if (! $all && ! in_array($t['id'], $ids, true)) {
                continue;
            }

            $this->info("Refreshing {$t['name']} ({$t['id']})...");
            $service->clearCache($t['id']);
            $data = $service->get($t['id']);

            $venueCount = count($data['venues'] ?? []);
            $teamCount = count($data['teams'] ?? []);
            $this->line("  - Venues fetched: {$venueCount}");
            $this->line("  - Teams fetched:  {$teamCount}");
            $this->line("  - Status: {$t['status']}");
        }

        $this->info('All tournament data refreshed successfully.');

        return self::SUCCESS;
    }
}
