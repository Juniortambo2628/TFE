<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * WikipediaService — Fetches structured tournament data from the free
 * Wikipedia REST and Action APIs (no API key required).
 *
 * Endpoints used:
 *  - https://en.wikipedia.org/api/rest_v1/page/summary/{title}     — hero summary + thumbnail
 *  - https://en.wikipedia.org/w/api.php?action=query&prop=extracts — clean plain-text intro
 *  - https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext — raw wikitext for parsing
 *  - https://en.wikipedia.org/w/api.php?action=query&prop=images    — venue/team logos
 *
 * All methods cache their results using the TTLs defined in
 * config/tournaments.php — see cache('facts'), cache('live'), cache('historical').
 */
class WikipediaService
{
    protected $summaryBase = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

    protected $actionBase = 'https://en.wikipedia.org/w/api.php';

    /**
     * Get the page summary for a tournament — returns title, extract, thumbnail.
     */
    public function getSummary(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:summary:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title) {
            try {
                $response = Http::timeout(8)->get($this->summaryBase.rawurlencode(str_replace(' ', '_', $title)));
                if (! $response->successful()) {
                    return $this->emptySummary($title);
                }
                $data = $response->json();

                return [
                    'title' => $data['title'] ?? $title,
                    'extract' => $data['extract'] ?? '',
                    'thumbnail' => $data['thumbnail']['source'] ?? null,
                    'url' => $data['content_urls']['desktop']['page'] ?? null,
                ];
            } catch (\Exception $e) {
                return $this->emptySummary($title);
            }
        });
    }

    /**
     * Get the full plain-text intro paragraph (longer than summary extract).
     */
    public function getExtract(string $title, ?int $ttl = null): string
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:extract:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title) {
            try {
                $response = Http::timeout(8)->get($this->actionBase, [
                    'action' => 'query',
                    'titles' => $title,
                    'prop' => 'extracts',
                    'exintro' => 1,
                    'explaintext' => 1,
                    'format' => 'json',
                ]);
                if (! $response->successful()) {
                    return '';
                }
                $pages = $response->json()['query']['pages'] ?? [];
                foreach ($pages as $page) {
                    return $page['extract'] ?? '';
                }

                return '';
            } catch (\Exception $e) {
                return '';
            }
        });
    }

    /**
     * Get the wikitext source for a page (useful for parsing structured data).
     */
    public function getWikitext(string $title, ?int $ttl = null): string
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:wikitext:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title) {
            try {
                $response = Http::timeout(8)->get($this->actionBase, [
                    'action' => 'parse',
                    'page' => $title,
                    'prop' => 'wikitext',
                    'format' => 'json',
                ]);
                if (! $response->successful()) {
                    return '';
                }

                return $response->json()['parse']['wikitext']['*'] ?? '';
            } catch (\Exception $e) {
                return '';
            }
        });
    }

    /**
     * Extract venue/stadium names from tournament wikitext.
     * Looks for the "== Venues ==" section and parses wikitext links.
     */
    public function getVenues(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:venues:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title, $ttl) {
            $wikitext = $this->getWikitext($title, $ttl);
            if (empty($wikitext)) {
                return [];
            }

            $venues = [];
            // Find the Venues section
            if (preg_match('/==\s*Venues?\s*==(.+?)(?===\s*[A-Z]|\z)/s', $wikitext, $matches)) {
                $section = $matches[1];
                // Extract [[link|display]] patterns (Wikipedia links)
                if (preg_match_all('/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/', $section, $linkMatches)) {
                    foreach ($linkMatches[1] as $idx => $link) {
                        // Skip non-stadium links (e.g. file:, image:, category:)
                        if (str_starts_with($link, 'File:') || str_starts_with($link, 'Image:') || str_starts_with($link, 'Category:')) {
                            continue;
                        }
                        $display = $linkMatches[2][$idx] ?: $link;
                        $venues[] = [
                            'name' => trim($display),
                            'wikipedia_title' => trim($link),
                        ];
                    }
                }
            }

            return $venues;
        });
    }

    /**
     * Extract team list from tournament wikitext.
     * Looks for the "== Qualified teams ==" or "== Teams ==" section.
     */
    public function getTeams(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:teams:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title, $ttl) {
            $wikitext = $this->getWikitext($title, $ttl);
            if (empty($wikitext)) {
                return [];
            }

            $teams = [];
            // Look for "Qualified teams" or "Teams" section
            if (preg_match('/==\s*(?:Qualified teams|Teams|Group stage teams)\s*==(.+?)(?===\s*[A-Z]|\z)/s', $wikitext, $matches)) {
                $section = $matches[1];
                if (preg_match_all('/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/', $section, $linkMatches)) {
                    foreach ($linkMatches[1] as $idx => $link) {
                        if (str_starts_with($link, 'File:') || str_starts_with($link, 'Image:') || str_starts_with($link, 'Category:')) {
                            continue;
                        }
                        $display = $linkMatches[2][$idx] ?: $link;
                        $teams[] = [
                            'name' => trim($display),
                            'wikipedia_title' => trim($link),
                        ];
                    }
                }
            }

            return $teams;
        });
    }

    /**
     * Get basic key facts (host countries, dates, number of teams/matches).
     * Returns structured data parsed from the summary + extract.
     */
    public function getKeyFacts(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:facts:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title, $ttl) {
            $extract = $this->getExtract($title, $ttl);

            $facts = [
                'teams' => null,
                'matches' => null,
                'venues' => null,
            ];

            // Parse "X teams" pattern
            if (preg_match('/(\d+)\s+teams?/i', $extract, $m)) {
                $facts['teams'] = (int) $m[1];
            }

            // Parse "Y matches" pattern
            if (preg_match('/(\d+)\s+matches?/i', $extract, $m)) {
                $facts['matches'] = (int) $m[1];
            }

            return $facts;
        });
    }

    /**
     * Search Wikipedia for a page title — useful when the exact title is unknown.
     */
    public function searchTitle(string $query, ?int $ttl = null): ?string
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:search:'.md5($query);

        return Cache::remember($key, $ttl, function () use ($query) {
            try {
                $response = Http::timeout(8)->get($this->actionBase, [
                    'action' => 'opensearch',
                    'search' => $query,
                    'limit' => 1,
                    'format' => 'json',
                ]);
                if (! $response->successful()) {
                    return null;
                }
                $results = $response->json();

                return $results[1][0] ?? null;
            } catch (\Exception $e) {
                return null;
            }
        });
    }

    /**
     * Get all Wikipedia data for a tournament in one call — convenient for sharing.
     */
    public function getAll(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');

        return [
            'summary' => $this->getSummary($title, $ttl),
            'extract' => $this->getExtract($title, $ttl),
            'venues' => $this->getVenues($title, $ttl),
            'teams' => $this->getTeams($title, $ttl),
            'facts' => $this->getKeyFacts($title, $ttl),
        ];
    }

    protected function emptySummary(string $title): array
    {
        return [
            'title' => $title,
            'extract' => '',
            'thumbnail' => null,
            'url' => null,
        ];
    }
}
