<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * TournamentService — Resolves the active tournament for the current request.
 *
 * Resolution order:
 *   1. ?tournament= query parameter (e.g. ?tournament=afcon-2027)
 *   2. SiteSetting 'active_tournament' (admin can override from admin panel)
 *   3. config('tournaments.default')
 *
 * All tournament data (config + Wikipedia) is cached.
 */
class TournamentService
{
    public function __construct(protected WikipediaService $wikipedia) {}

    /**
     * Resolve the active tournament from a request.
     */
    public function resolveFromRequest(?Request $request = null): string
    {
        if ($request) {
            $requested = $request->query('tournament');
            if ($requested && $this->exists($requested)) {
                return $requested;
            }
        }

        // Fall back to admin-set active_tournament, but only if the table exists
        // (avoids breaking tests / fresh installs where migrations haven't run yet).
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('site_settings')) {
                $adminSetting = \App\Models\SiteSetting::get('active_tournament');
                if ($adminSetting && $this->exists($adminSetting)) {
                    return $adminSetting;
                }
            }
        } catch (\Throwable $e) {
            // Silently fall through to default — SiteSetting is best-effort.
        }

        return config('tournaments.default', 'wc_2026');
    }

    /**
     * Get the full tournament data (config + Wikipedia) for the given ID.
     * If no ID is given, resolves from the current request.
     */
    public function current(?string $id = null): array
    {
        $id = $id ?? $this->resolveFromRequest(request());

        return $this->get($id);
    }

    /**
     * Get full tournament data for a specific ID.
     */
    public function get(string $id): array
    {
        $config = config("tournaments.tournaments.{$id}");
        if (! $config) {
            $id = config('tournaments.default', 'wc_2026');
            $config = config("tournaments.tournaments.{$id}");
        }

        $ttl = $this->ttlFor($config);
        $wikiTitle = $config['wikipedia_title'] ?? $config['name'];

        $wikipedia = Cache::remember(
            "tournament:{$id}:wikipedia",
            $ttl,
            fn () => $this->wikipedia->getAll($wikiTitle, $ttl)
        );

        return array_merge($config, [
            'wikipedia' => $wikipedia,
            'wikipedia_summary' => $wikipedia['summary'] ?? [],
            'venues' => $wikipedia['venues'] ?? [],
            'teams' => $wikipedia['teams'] ?? [],
            'facts' => $wikipedia['facts'] ?? [],
            'is_default' => $id === config('tournaments.default'),
        ]);
    }

    /**
     * List all tournaments with basic info — used by the switcher UI.
     */
    public function all(): array
    {
        $tournaments = [];
        foreach (config('tournaments.tournaments', []) as $id => $config) {
            $tournaments[] = [
                'id' => $id,
                'name' => $config['name'],
                'short_name' => $config['short_name'],
                'slug' => $config['slug'],
                'status' => $config['status'],
                'start_date' => $config['start_date'],
                'end_date' => $config['end_date'],
                'hosts' => $config['hosts'] ?? [],
            ];
        }

        return $tournaments;
    }

    /**
     * Check if a tournament ID exists in config.
     */
    public function exists(string $id): bool
    {
        return array_key_exists($id, config('tournaments.tournaments', []));
    }

    /**
     * Determine the current TTL based on tournament status.
     * - concluded: long cache (data is stable)
     * - ongoing: short cache (results change frequently)
     * - upcoming: medium cache (facts stable but news changes)
     */
    protected function ttlFor(array $config): int
    {
        $status = $config['status'] ?? 'upcoming';
        $cacheConfig = config('tournaments.cache', []);

        return match ($status) {
            'concluded' => $cacheConfig['historical'] ?? 86400 * 30,
            'ongoing' => $cacheConfig['live'] ?? 1800,
            default => $cacheConfig['facts'] ?? 86400 * 7,
        };
    }

    /**
     * Clear all cache for a specific tournament (used by the refresh command).
     */
    public function clearCache(string $id): void
    {
        Cache::forget("tournament:{$id}:wikipedia");
    }
}
