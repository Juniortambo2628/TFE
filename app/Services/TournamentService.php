<?php

namespace App\Services;

use App\Models\SiteSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

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
            if (Schema::hasTable('site_settings')) {
                $adminSetting = SiteSetting::get('active_tournament');
                if ($adminSetting && $this->exists($adminSetting)) {
                    return $adminSetting;
                }
            }
        } catch (\Throwable $e) {
            // Silently fall through to default — SiteSetting is best-effort.
        }

        return config('tournaments.default');
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
     *
     * The entire assembled payload (config + Wikipedia + admin overrides)
     * is cached under a single key so every Inertia request is a single
     * cache read instead of ~15 array merges. The inner Wikipedia call
     * remains cached separately for the refresh command.
     */
    public function get(string $id): array
    {
        $config = config("tournaments.tournaments.{$id}");
        if (! $config) {
            $id = config('tournaments.default');
            $config = config("tournaments.tournaments.{$id}");
        }

        $ttl = $this->ttlFor($config);

        // Include the admin hero override in the cache key so an admin
        // upload invalidates the cache next request instead of showing
        // the previous hero for the whole TTL. Also include a hash of
        // the wiki payload key so refresh command clears the assembled
        // payload as well.
        $adminHero = null;
        try {
            if (Schema::hasTable('site_settings')) {
                $adminHero = SiteSetting::get("hero_bg_{$id}");
            }
        } catch (\Throwable $e) {
            // best-effort
        }
        $fullKey = "tournament:{$id}:full:".md5((string) $adminHero);

        return Cache::remember($fullKey, $ttl, function () use ($id, $config, $ttl, $adminHero) {
            return $this->assemble($id, $config, $ttl, $adminHero);
        });
    }

    /**
     * Build the full tournament payload from config + Wikipedia + admin
     * overrides. Extracted from get() so the outer cache wraps everything.
     */
    protected function assemble(string $id, array $config, int $ttl, ?string $adminHero): array
    {
        $wikiTitle = $config['wikipedia_title'] ?? $config['name'];

        $wikipedia = Cache::remember(
            "tournament:{$id}:wikipedia",
            $ttl,
            fn () => $this->wikipedia->getAll($wikiTitle, $ttl)
        );

        // Merge Wikipedia results for concluded tournaments — config values are
        // the fallback if Wikipedia parsing returns empty.
        $wikiResults = $wikipedia['results'] ?? [];
        $finalMatch = $wikipedia['final_match'] ?? [];
        $winner = $config['winner'] ?? ($wikiResults['champion'] ?? null);
        $topScorer = $config['top_scorer'] ?? null;

        // Build top scorer from Wikipedia if config doesn't have it
        if (empty($topScorer) && ! empty($wikiResults['top_scorer'])) {
            $tsRaw = $wikiResults['top_scorer'];
            // Parse "Kylian Mbappé (8 goals)" pattern
            if (preg_match('/^(.+?)\s*\((\d+)\s*goals?\)/i', $tsRaw, $m)) {
                $topScorer = ['name' => trim($m[1]), 'goals' => (int) $m[2]];
            } else {
                $topScorer = ['name' => $tsRaw, 'goals' => null];
            }
        }

        $finalScore = $config['final_score'] ?? null;
        if (empty($finalScore) && ! empty($finalMatch['score'])) {
            $finalScore = $finalMatch['team1'].' '.$finalMatch['score'].' '.$finalMatch['team2'];
            if (! empty($finalMatch['details'])) {
                $finalScore .= ' ('.$finalMatch['details'].')';
            }
        }

        $finalVenue = $config['final_venue'] ?? null;
        if (empty($finalVenue) && ! empty($finalMatch['stadium'])) {
            $finalVenue = $finalMatch['stadium'].($finalMatch['city'] ? ', '.$finalMatch['city'] : '');
        }

        // Admin-uploaded hero background overrides the config default.
        // $adminHero was resolved once in get() and passed in — no per-call
        // SiteSetting query, and the cache key already accounts for it.
        $heroImage = $adminHero ?: ($config['hero_image'] ?? null);

        return array_merge($config, [
            'status' => self::computedStatus($config),
            'wikipedia' => $wikipedia,
            'wikipedia_summary' => $wikipedia['summary'] ?? [],
            'venues' => $wikipedia['venues'] ?? [],
            'teams' => $wikipedia['teams'] ?? [],
            'team_flag_codes' => $config['team_flag_codes'] ?? [],
            'facts' => $wikipedia['facts'] ?? [],
            'is_default' => $id === config('tournaments.default'),
            // Hero image: admin upload > config default
            'hero_image' => $heroImage,
            // Wikipedia logo (overrides hardcoded hero_image when available)
            'wikipedia_logo' => $wikipedia['logo'] ?? null,
            // Merged results (config fallback + Wikipedia)
            'winner' => $winner,
            'runner_up' => $config['runner_up'] ?? ($wikiResults['runner_up'] ?? null),
            'second_runner_up' => $config['second_runner_up'] ?? ($wikiResults['second_runner_up'] ?? null),
            'top_scorer' => $topScorer,
            'final_score' => $finalScore,
            'final_venue' => $finalVenue,
            // Stats from Wikipedia (with config fallback)
            'num_teams' => $wikiResults['num_teams'] ?? $config['num_teams'] ?? null,
            'matches_played' => $wikiResults['matches_played'] ?? $config['matches_played'] ?? null,
            'total_goals' => $wikiResults['total_goals'] ?? $config['total_goals'] ?? null,
            // Detailed results from Wikipedia
            'wikipedia_results' => $wikiResults,
            'wikipedia_final_match' => $finalMatch,
            // Matches from Wikipedia (all groups + knockout)
            'wikipedia_matches' => $wikipedia['matches'] ?? [],
            // Awards from Wikipedia
            'wikipedia_awards' => $wikipedia['awards'] ?? [],
            // Flag images from Wikipedia (fallback for missing local PNGs)
            'wikipedia_flags' => $wikipedia['flags'] ?? [],
        ]);
    }

    /**
     * Compute tournament status from dates (overrides static config status).
     */
    public static function computedStatus(array $config): string
    {
        $now = now();
        $start = isset($config['start_date']) ? Carbon::parse($config['start_date']) : null;
        $end = isset($config['end_date']) ? Carbon::parse($config['end_date']) : null;

        if ($start && $now->lt($start)) {
            return 'upcoming';
        }
        if ($end && $now->gt($end)) {
            return 'concluded';
        }
        if ($start && $end && $now->gte($start) && $now->lte($end)) {
            return 'ongoing';
        }

        return $config['status'] ?? 'upcoming';
    }

    /**
     * Find the next active or upcoming tournament (not concluded).
     */
    public function nextActive(): ?array
    {
        $now = now();
        $best = null;

        foreach (config('tournaments.tournaments', []) as $id => $config) {
            $status = self::computedStatus($config);
            if ($status === 'concluded') {
                continue;
            }

            $start = isset($config['start_date']) ? Carbon::parse($config['start_date']) : null;

            if (! $best || ($start && $start->lt($best['_start'] ?? $now->addYears(10)))) {
                $best = array_merge($config, ['_start' => $start]);
            }
        }

        return $best ? collect($best)->except('_start')->toArray() : null;
    }

    /**
     * List all tournaments with computed status — used by the switcher UI.
     *
     * Cached for an hour so the shared HandleInertiaRequests prop doesn't
     * rebuild the sorted list per request. Cache invalidates itself hourly
     * (matches the shortest interesting status-transition window) and is
     * cleared explicitly by clearCache() when the refresh command runs.
     */
    public function all(): array
    {
        return Cache::remember('tournament:list:all', 3600, function () {
            $tournaments = [];
            foreach (config('tournaments.tournaments', []) as $id => $config) {
                $computedStatus = self::computedStatus($config);
                $tournaments[] = [
                    'id' => $id,
                    'name' => $config['name'],
                    'short_name' => $config['short_name'],
                    'slug' => $config['slug'],
                    'status' => $computedStatus,
                    'start_date' => $config['start_date'],
                    'end_date' => $config['end_date'],
                    'hosts' => $config['hosts'] ?? [],
                ];
            }

            // Sort: ongoing first, then upcoming (by start_date), then concluded
            $order = ['ongoing' => 0, 'upcoming' => 1, 'concluded' => 2];
            usort($tournaments, function ($a, $b) use ($order) {
                $oa = $order[$a['status']] ?? 3;
                $ob = $order[$b['status']] ?? 3;
                if ($oa !== $ob) {
                    return $oa <=> $ob;
                }

                return $a['start_date'] <=> $b['start_date'];
            });

            return $tournaments;
        });
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
    public function ttlFor(array $config): int
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
     * Clear all cached data for a specific tournament — the Wikipedia
     * payload AND every assembled variant (there is one per admin hero
     * override), plus the switcher list. Used by the refresh command
     * and by the admin "Refresh" button.
     */
    public function clearCache(string $id): void
    {
        Cache::forget("tournament:{$id}:wikipedia");
        Cache::forget('tournament:list:all');

        // Assembled payloads are keyed on the admin hero hash, so we
        // clear both the "no hero" variant and any currently-set one.
        Cache::forget('tournament:'.$id.':full:'.md5(''));
        try {
            if (Schema::hasTable('site_settings')) {
                $adminHero = SiteSetting::get("hero_bg_{$id}");
                if ($adminHero) {
                    Cache::forget('tournament:'.$id.':full:'.md5($adminHero));
                }
            }
        } catch (\Throwable $e) {
            // best-effort
        }
    }
}
