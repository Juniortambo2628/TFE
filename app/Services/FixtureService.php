<?php

namespace App\Services;

use App\Models\Fixture;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * FixtureService — Dynamically fetches tournament fixture data from free external sources.
 *
 * Routes to the correct source based on config/tournaments.php data_source field:
 *   - 'thestatsapi'  → TheStatsAPI free JSON (no API key)
 *   - 'openfootball' → openfootball GitHub JSON (public domain)
 *   - 'wikipedia'    → WikipediaService::getMatches() (already built)
 *   - 'database'     → fixtures table (fallback)
 */
class FixtureService
{
    public function __construct(protected WikipediaService $wikipedia) {}

    /**
     * Get all fixtures for a tournament in standardized format.
     */
    public function getFixtures(string $tournamentId): array
    {
        $config = config("tournaments.tournaments.{$tournamentId}");
        if (! $config) {
            return $this->fetchFromDatabase($tournamentId);
        }

        $source = $config['data_source'] ?? 'database';
        $ttl = $this->ttlFor($config);
        $cacheKey = "fixtures:{$tournamentId}:".md5($source);

        return Cache::remember($cacheKey, $ttl, function () use ($source, $config, $tournamentId) {
            $fixtures = match ($source) {
                'thestatsapi' => $this->fetchFromTheStatsApi($config),
                'openfootball' => $this->fetchFromOpenFootball($config),
                'wikipedia' => $this->fetchFromWikipedia($config),
                default => [],
            };

            // Fallback to database if primary source returns empty
            if (empty($fixtures)) {
                return $this->fetchFromDatabase($tournamentId);
            }

            // For concluded tournaments: enrich with Wikipedia scores if primary source has none
            $status = TournamentService::computedStatus($config);
            if ($status === 'concluded') {
                $hasScores = collect($fixtures)->contains(fn ($f) => $f['homeScore'] !== null);
                if (! $hasScores) {
                    $fixtures = $this->enrichWithWikipediaScores($config, $fixtures);
                }
            }

            return $fixtures;
        });
    }

    /**
     * Enrich fixtures with scores from Wikipedia for concluded tournaments.
     */
    protected function enrichWithWikipediaScores(array $config, array $fixtures): array
    {
        try {
            $wikiTitle = $config['wikipedia_title'] ?? $config['name'] ?? '';
            if (empty($wikiTitle)) {
                return $fixtures;
            }

            $wikiMatches = $this->wikipedia->getMatches($wikiTitle);
            if (empty($wikiMatches)) {
                return $fixtures;
            }

            // Build lookup by normalized team names + date
            $wikiLookup = [];
            foreach ($wikiMatches as $wm) {
                $key = $this->normalizeForLookup($wm['team1'] ?? '', $wm['team2'] ?? '', $wm['date'] ?? '');
                $wikiLookup[$key] = $wm;
            }

            // Enrich each fixture with Wikipedia scores
            foreach ($fixtures as &$fixture) {
                $key = $this->normalizeForLookup($fixture['homeTeam'], $fixture['awayTeam'], $fixture['date']);
                if (isset($wikiLookup[$key])) {
                    $wm = $wikiLookup[$key];
                    $score = $wm['score'] ?? null;
                    if ($score && str_contains($score, '-')) {
                        $parts = explode('-', $score);
                        $fixture['homeScore'] = (int) trim($parts[0]);
                        $fixture['awayScore'] = (int) trim($parts[1]);
                        $fixture['status'] = 'completed';
                    }
                    // Use Wikipedia venue if fixture has none
                    if (empty($fixture['venue']) && ! empty($wm['stadium'])) {
                        $fixture['venue'] = $wm['stadium'];
                    }
                }
            }
            unset($fixture);

            return $fixtures;
        } catch (\Throwable $e) {
            return $fixtures;
        }
    }

    /**
     * Normalize team names + date for fuzzy lookup matching.
     */
    protected function normalizeForLookup(string $home, string $away, string $date): string
    {
        $home = strtolower(trim($home));
        $away = strtolower(trim($away));

        // Normalize common name variations
        $normalizations = [
            'usa' => 'united states',
            'us' => 'united states',
            'korea republic' => 'south korea',
            'korea' => 'south korea',
            'ir iran' => 'iran',
            'cote d\'ivoire' => 'ivory coast',
            'czech republic' => 'czechia',
            'congo dr' => 'dr congo',
            'congo democratic republic' => 'dr congo',
            'cabo verde' => 'cape verde',
            'turkiye' => 'turkey',
            'brasil' => 'brazil',
        ];

        $home = $normalizations[$home] ?? $home;
        $away = $normalizations[$away] ?? $away;

        // Normalize date to YYYY-MM-DD
        if (preg_match('/(\d{1,2})\/(\d{1,2})\/(\d{4})/', $date, $dm)) {
            $date = $dm[3].'-'.str_pad($dm[1], 2, '0', STR_PAD_LEFT).'-'.str_pad($dm[2], 2, '0', STR_PAD_LEFT);
        }

        return "{$home}|{$away}|{$date}";
    }

    /**
     * Fetch from TheStatsAPI free JSON endpoint (no API key required).
     */
    protected function fetchFromTheStatsApi(array $config): array
    {
        $url = $config['data_source_url'] ?? null;
        if (! $url) {
            return [];
        }

        try {
            $timeout = app()->environment('local') ? 5 : 10;
            $http = Http::timeout($timeout)
                ->withHeaders(['User-Agent' => 'TFE/1.0']);
            if (app()->environment('local')) {
                $http = $http->withoutVerifying();
            }
            $response = $http->get($url);

            if (! $response->successful()) {
                return [];
            }

            $data = $response->json();
            $fixtures = $data['fixtures'] ?? [];

            return array_map(fn ($f) => $this->normalizeTheStatsApi($f), $fixtures);
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Fetch from openfootball GitHub JSON (public domain, no API key).
     */
    protected function fetchFromOpenFootball(array $config): array
    {
        $url = $config['data_source_url'] ?? null;
        if (! $url) {
            return [];
        }

        try {
            $timeout = app()->environment('local') ? 5 : 10;
            $http = Http::timeout($timeout)
                ->withHeaders(['User-Agent' => 'TFE/1.0']);
            if (app()->environment('local')) {
                $http = $http->withoutVerifying();
            }
            $response = $http->get($url);

            if (! $response->successful()) {
                return [];
            }

            $data = $response->json();
            $matches = $data['matches'] ?? [];

            return array_map(fn ($f) => $this->normalizeOpenFootball($f), $matches);
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Fetch from Wikipedia via existing WikipediaService::getMatches().
     */
    protected function fetchFromWikipedia(array $config): array
    {
        $wikiTitle = $config['wikipedia_title'] ?? $config['name'] ?? '';
        if (empty($wikiTitle)) {
            return [];
        }

        try {
            $wikiMatches = $this->wikipedia->getMatches($wikiTitle);

            return array_map(fn ($f) => $this->normalizeWikipedia($f), $wikiMatches);
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Fetch from the database fixtures table (fallback).
     */
    protected function fetchFromDatabase(string $tournamentId): array
    {
        return Fixture::where('tournament_id', $tournamentId)
            ->orderBy('date')
            ->orderBy('time')
            ->get()
            ->map(fn ($f) => $this->normalizeDatabase($f))
            ->toArray();
    }

    // ─── Normalizers ───────────────────────────────────────────────────────

    /**
     * Normalize TheStatsAPI fixture to standard format.
     */
    protected function normalizeTheStatsApi(array $f): array
    {
        $kickoffUtc = $f['kickoffUtc'] ?? $f['date'] ?? '';
        $time = '';
        if ($kickoffUtc && str_contains($kickoffUtc, 'T')) {
            $time = date('H:i', strtotime($kickoffUtc));
        }

        $stage = $f['stage'] ?? '';
        $group = $f['group'] ?? null;

        return [
            'id' => 'ts_'.($f['matchNumber'] ?? 0),
            'date' => $f['date'] ?? '',
            'time' => $time,
            'homeTeam' => $f['homeTeam'] ?? '',
            'awayTeam' => $f['awayTeam'] ?? '',
            'group' => $group,
            'venue' => $f['stadium'] ?? '',
            'stage' => $this->normalizeStage($stage),
            'matchday' => $this->extractMatchday($f),
            'homeScore' => null,
            'awayScore' => null,
            'status' => 'scheduled',
            'hostCity' => $f['hostCity'] ?? '',
        ];
    }

    /**
     * Normalize openfootball match to standard format.
     */
    protected function normalizeOpenFootball(array $f): array
    {
        $score = $f['score'] ?? null;
        $homeScore = $score['ft'][0] ?? null;
        $awayScore = $score['ft'][1] ?? null;
        $hasScore = $homeScore !== null && $awayScore !== null;

        $round = $f['round'] ?? '';
        $group = $f['group'] ?? null;
        if ($group && str_starts_with($group, 'Group ')) {
            $group = str_replace('Group ', '', $group);
        }

        return [
            'id' => 'of_'.md5(($f['team1'] ?? '').($f['team2'] ?? '').($f['date'] ?? '')),
            'date' => $f['date'] ?? '',
            'time' => $f['time'] ?? '',
            'homeTeam' => $f['team1'] ?? '',
            'awayTeam' => $f['team2'] ?? '',
            'group' => $group,
            'venue' => $f['ground'] ?? '',
            'stage' => $this->normalizeStage($round),
            'matchday' => $this->extractMatchdayFromRound($round),
            'homeScore' => $homeScore,
            'awayScore' => $awayScore,
            'status' => $hasScore ? 'completed' : 'scheduled',
        ];
    }

    /**
     * Normalize Wikipedia match (from parseFootballBox) to standard format.
     */
    protected function normalizeWikipedia(array $f): array
    {
        $score = $f['score'] ?? null;
        $homeScore = null;
        $awayScore = null;
        if ($score && str_contains($score, '-')) {
            $parts = explode('-', $score);
            $homeScore = (int) trim($parts[0]);
            $awayScore = (int) trim($parts[1]);
        }

        $dateRaw = $f['date'] ?? '';
        $date = '';
        if ($dateRaw) {
            // Handle M/D/YYYY format from Wikipedia
            if (preg_match('/(\d{1,2})\/(\d{1,2})\/(\d{4})/', $dateRaw, $dm)) {
                $date = $dm[3].'-'.str_pad($dm[1], 2, '0', STR_PAD_LEFT).'-'.str_pad($dm[2], 2, '0', STR_PAD_LEFT);
            } else {
                $date = $dateRaw;
            }
        }

        return [
            'id' => 'wiki_'.md5(($f['team1'] ?? '').($f['team2'] ?? '').$date),
            'date' => $date,
            'time' => $f['time'] ?? '',
            'homeTeam' => $f['team1'] ?? '',
            'awayTeam' => $f['team2'] ?? '',
            'group' => $f['section'] ?? null,
            'venue' => $f['stadium'] ?? '',
            'stage' => $this->normalizeStage($f['section'] ?? ''),
            'matchday' => null,
            'homeScore' => $homeScore,
            'awayScore' => $awayScore,
            'status' => ($homeScore !== null) ? 'completed' : 'scheduled',
        ];
    }

    /**
     * Normalize a DB Fixture model to standard format.
     */
    protected function normalizeDatabase(Fixture $f): array
    {
        return [
            'id' => 'db_'.$f->id,
            'date' => $f->date->format('Y-m-d'),
            'time' => $f->time ?? '00:00',
            'homeTeam' => $f->home_team,
            'awayTeam' => $f->away_team,
            'group' => $f->group,
            'venue' => $f->venue,
            'stage' => $f->stage,
            'matchday' => $f->matchday,
            'homeScore' => $f->home_score,
            'awayScore' => $f->away_score,
            'status' => $f->status ?? 'scheduled',
        ];
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    /**
     * Normalize stage names to consistent labels.
     */
    protected function normalizeStage(string $stage): string
    {
        $lower = strtolower(trim($stage));

        return match (true) {
            str_contains($lower, 'group') => 'Group Stage',
            str_contains($lower, 'round of 32') || str_contains($lower, 'round-of-32') => 'Round of 32',
            str_contains($lower, 'round of 16') || str_contains($lower, 'round-of-16') => 'Round of 16',
            str_contains($lower, 'quarter') => 'Quarter-finals',
            str_contains($lower, 'semi') => 'Semi-finals',
            str_contains($lower, 'third') => 'Third Place',
            str_contains($lower, 'final') && ! str_contains($lower, 'semi') && ! str_contains($lower, 'quarter') => 'Final',
            str_contains($lower, 'knockout') => 'Knockout',
            default => $stage ?: 'Group Stage',
        };
    }

    /**
     * Extract matchday from TheStatsAPI data.
     */
    protected function extractMatchday(array $f): ?int
    {
        $round = $f['round'] ?? $f['matchday'] ?? null;
        if (is_int($round)) {
            return $round;
        }
        if (preg_match('/(\d+)/', (string) $round, $m)) {
            return (int) $m[1];
        }

        return null;
    }

    /**
     * Extract matchday from openfootball round string like "Matchday 1".
     */
    protected function extractMatchdayFromRound(string $round): ?int
    {
        if (preg_match('/Matchday\s+(\d+)/i', $round, $m)) {
            return (int) $m[1];
        }

        return null;
    }

    /**
     * Determine cache TTL based on tournament status.
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
}
