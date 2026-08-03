<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
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
     * Get an HTTP client configured for Wikipedia API access.
     * Uses shorter timeout on local dev (SSL issues = wasted wait time).
     */
    protected function http(): PendingRequest
    {
        $timeout = app()->environment('local') ? 3 : 8;
        $http = Http::timeout($timeout)->withHeaders([
            'User-Agent' => 'TFE/1.0 (https://tfe.okjtech.co.ke; contact@tfe.okjtech.co.ke)',
        ]);

        if (app()->environment('local')) {
            $http = $http->withoutVerifying();
        }

        return $http;
    }

    /**
     * Get the page summary for a tournament — returns title, extract, thumbnail.
     */
    public function getSummary(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:summary:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title) {
            try {
                $response = $this->http()->get($this->summaryBase.rawurlencode(str_replace(' ', '_', $title)));
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
                $response = $this->http()->get($this->actionBase, [
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
                $response = $this->http()->get($this->actionBase, [
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
     * Enriches each venue with Wikipedia summary data (thumbnail, extract).
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

            // Words that indicate non-venue entries (cities, orgs, tournaments)
            $excludePatterns = [
                '/^UEFA\b/i', '/^FIFA\b/i', '/^CONMEBOL\b/i', '/^CAF\b/i',
                '/^European Championship/i', '/^World Cup/i', '/^Copa America/i',
                '/^Africa Cup/i', '/^COVID/i', '/^Kicker\b/i',
                '/^German Football/i', '/^Football Association/i',
                '/^\d{4}\s+FIFA/i', '/^UEFA Euro \d/i',
                '/^North Rhine/i', '/^Rhine-Ruhr/i',
                '/^(\d+)\s+stadium/i',
            ];

            $venues = [];
            $seen = [];

            // Primary: parse "Venue (City)" pattern from wikitext tables
            if (preg_match_all('/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]\s*\((?:[^)]*Stadion|[^)]*Arena|[^)]*Field|[^)]*Park)[^)]*\)/i', $wikitext, $stadiumMatches)) {
                foreach ($stadiumMatches[1] as $idx => $link) {
                    if (str_starts_with($link, 'File:') || str_starts_with($link, 'Category:')) {
                        continue;
                    }
                    $display = $stadiumMatches[2][$idx] ?: $link;
                    if (! isset($seen[$link])) {
                        $seen[$link] = true;
                        $venues[] = ['name' => trim($display), 'wikipedia_title' => trim($link)];
                    }
                }
            }

            // Secondary: parse "Venues ==" section for known stadium links
            if (empty($venues) && preg_match('/==\s*Venues?\s*==(.+?)(?===\s*[A-Z]|\z)/s', $wikitext, $matches)) {
                $section = $matches[1];
                if (preg_match_all('/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/', $section, $linkMatches)) {
                    foreach ($linkMatches[1] as $idx => $link) {
                        if (str_starts_with($link, 'File:') || str_starts_with($link, 'Image:') || str_starts_with($link, 'Category:')) {
                            continue;
                        }
                        $display = $linkMatches[2][$idx] ?: $link;

                        // Skip excluded patterns
                        $skip = false;
                        foreach ($excludePatterns as $pattern) {
                            if (preg_match($pattern, $display)) {
                                $skip = true;
                                break;
                            }
                        }
                        if ($skip) {
                            continue;
                        }

                        if (! isset($seen[$link]) && count($venues) < 20) {
                            $seen[$link] = true;
                            $venues[] = ['name' => trim($display), 'wikipedia_title' => trim($link)];
                        }
                    }
                }
            }

            return array_values($venues);
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
     * Parse tournament results from the infobox — champion, runner-up, top scorer, stats.
     * Works for World Cups, Euros, Copa America, AFCON, UCL.
     */
    public function getTournamentResults(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.historical');
        $key = 'wikipedia:results:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title) {
            $wikitext = $this->getWikitext($title);
            if (empty($wikitext)) {
                return [];
            }

            $infobox = $this->extractInfobox($wikitext, 'Infobox international football competition');
            if (empty($infobox)) {
                return [];
            }

            return [
                'champion' => $this->cleanWikiValue($this->getField($infobox, 'champion')),
                'second' => $this->cleanWikiValue($this->getField($infobox, 'second')),
                'third' => $this->cleanWikiValue($this->getField($infobox, 'third')),
                'fourth' => $this->cleanWikiValue($this->getField($infobox, 'fourth')),
                'top_scorer' => $this->cleanWikiValue($this->getField($infobox, 'top_scorer')),
                'best_player' => $this->cleanWikiValue($this->getField($infobox, 'player')),
                'best_goalkeeper' => $this->cleanWikiValue($this->getField($infobox, 'goalkeeper')),
                'young_player' => $this->cleanWikiValue($this->getField($infobox, 'young_player')),
                'num_teams' => $this->extractIntFromField($this->getField($infobox, 'num_teams') ?? $this->getField($infobox, 'teams')),
                'matches_played' => $this->extractIntFromField($this->getField($infobox, 'matches') ?? $this->getField($infobox, 'matches_played')),
                'total_goals' => $this->extractIntFromField($this->getField($infobox, 'goals') ?? $this->getField($infobox, 'total_goals')),
                'host_country' => $this->cleanWikiValue($this->getField($infobox, 'country')),
                'dates' => $this->cleanWikiValue($this->getField($infobox, 'dates')),
                'tourney_name' => $this->cleanWikiValue($this->getField($infobox, 'tourney_name')),
            ];
        });
    }

    /**
     * Parse the final match details — score, venue, penalty result.
     * Tries "{Tournament} final" or "{Tournament} Championship match" pages.
     */
    public function getFinalMatch(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.historical');
        $key = 'wikipedia:final:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title) {
            $finalPages = [
                $title.' final',
                str_replace('UEFA Champions League', 'UEFA Champions League', $title).' final',
            ];

            foreach ($finalPages as $page) {
                $wikitext = $this->getWikitext($page);
                if (empty($wikitext)) {
                    continue;
                }

                $infobox = $this->extractInfobox($wikitext, 'Infobox football match');
                if (empty($infobox)) {
                    continue;
                }

                $team1 = $this->cleanWikiValue($this->getField($infobox, 'team1'));
                $team2 = $this->cleanWikiValue($this->getField($infobox, 'team2'));
                $score1 = trim($this->getField($infobox, 'team1score') ?? '');
                $score2 = trim($this->getField($infobox, 'team2score') ?? '');
                $stadium = $this->cleanWikiValue($this->getField($infobox, 'stadium'));
                $city = $this->cleanWikiValue($this->getField($infobox, 'city'));
                $details = $this->cleanWikiValue($this->getField($infobox, 'details'));
                $date = $this->cleanWikiValue($this->getField($infobox, 'date'));

                $score = ($score1 !== '' && $score2 !== '') ? "{$score1}-{$score2}" : null;

                return [
                    'team1' => $team1,
                    'team2' => $team2,
                    'score1' => $score1 !== '' ? (int) $score1 : null,
                    'score2' => $score2 !== '' ? (int) $score2 : null,
                    'score' => $score,
                    'stadium' => $stadium,
                    'city' => $city,
                    'details' => $details,
                    'date' => $date,
                ];
            }

            return [];
        });
    }

    /**
     * Get stadium data from Wikipedia — capacity, year opened, location, photo.
     */
    public function getStadiumData(string $stadiumTitle, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:stadium:'.md5($stadiumTitle);

        return Cache::remember($key, $ttl, function () use ($stadiumTitle, $ttl) {
            $summary = $this->getSummary($stadiumTitle, $ttl);
            $wikitext = $this->getWikitext($stadiumTitle);

            $data = [
                'name' => $summary['title'] ?? $stadiumTitle,
                'extract' => $summary['extract'] ?? '',
                'thumbnail' => $summary['thumbnail'] ?? null,
                'url' => $summary['url'] ?? null,
                'capacity' => null,
                'opened' => null,
                'location' => null,
                'coordinates' => null,
            ];

            if (! empty($wikitext)) {
                $infobox = $this->extractInfobox($wikitext, 'Infobox stadium');
                if (empty($infobox)) {
                    $infobox = $this->extractInfobox($wikitext, 'Infobox football venue');
                }
                if (! empty($infobox)) {
                    $data['capacity'] = $this->getField($infobox, 'capacity');
                    $data['opened'] = $this->cleanWikiValue($this->getField($infobox, 'opened'));
                    $data['location'] = $this->cleanWikiValue($this->getField($infobox, 'location'));
                    $data['coordinates'] = $this->cleanWikiValue($this->getField($infobox, 'coordinates'));
                }
            }

            return $data;
        });
    }

    /**
     * Get the tournament logo/badge from Wikipedia — page image or summary thumbnail.
     */
    public function getTournamentLogo(string $title, ?int $ttl = null): ?string
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:logo:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title, $ttl) {
            // Try pageimages first (usually the official logo/badge)
            try {
                $response = $this->http()->get($this->actionBase, [
                    'action' => 'query',
                    'titles' => $title,
                    'prop' => 'pageimages',
                    'pilicense' => 'any',
                    'piprop' => 'thumbnail',
                    'pithumbsize' => 400,
                    'format' => 'json',
                ]);
                if ($response->successful()) {
                    $pages = $response->json()['query']['pages'] ?? [];
                    foreach ($pages as $page) {
                        if (! empty($page['thumbnail']['source'])) {
                            return $page['thumbnail']['source'];
                        }
                    }
                }
            } catch (\Exception $e) {
                // Fall through to summary thumbnail
            }

            // Fallback to summary thumbnail
            $summary = $this->getSummary($title, $ttl);

            return $summary['thumbnail'] ?? null;
        });
    }

    /**
     * Batch-fetch flag thumbnails from Wikipedia for a list of country codes.
     * Returns a map of code => thumbnail URL.
     */
    public function getFlagImages(array $codes, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');
        $key = 'wikipedia:flags:'.md5(implode(',', $codes));

        return Cache::remember($key, $ttl, function () use ($codes) {
            $codeToCountry = [
                'ar' => 'Argentina', 'au' => 'Australia', 'at' => 'Austria', 'be' => 'Belgium',
                'br' => 'Brazil', 'cm' => 'Cameroon', 'ca' => 'Canada', 'hr' => 'Croatia',
                'ci' => "Côte d'Ivoire", 'cu' => 'Cuba', 'cz' => 'Czech Republic',
                'dk' => 'Denmark', 'ec' => 'Ecuador', 'eg' => 'Egypt', 'gb' => 'England',
                'fr' => 'France', 'de' => 'Germany', 'gh' => 'Ghana', 'gr' => 'Greece',
                'ht' => 'Haiti', 'ir' => 'Iran', 'it' => 'Italy', 'jm' => 'Jamaica',
                'jp' => 'Japan', 'ke' => 'Kenya', 'kr' => 'South Korea', 'ma' => 'Morocco',
                'mx' => 'Mexico', 'nl' => 'Netherlands', 'nz' => 'New Zealand',
                'ng' => 'Nigeria', 'no' => 'Norway', 'pa' => 'Panama', 'pl' => 'Poland',
                'pt' => 'Portugal', 'qa' => 'Qatar', 'sa' => 'Saudi Arabia', 'sn' => 'Senegal',
                'rs' => 'Serbia', 'es' => 'Spain', 'ch' => 'Switzerland', 'tn' => 'Tunisia',
                'tr' => 'Turkey', 'ua' => 'Ukraine', 'us' => 'United States',
                'uy' => 'Uruguay', 'uz' => 'Uzbekistan', 've' => 'Venezuela',
                'tz' => 'Tanzania', 'ug' => 'Uganda', 'zm' => 'Zambia', 'zw' => 'Zimbabwe',
                'dz' => 'Algeria', 'bf' => 'Burkina Faso', 'bi' => 'Burundi',
                'cv' => 'Cape Verde', 'cf' => 'Central African Republic', 'cg' => 'Congo',
                'ga' => 'Gabon', 'gn' => 'Guinea', 'gw' => 'Guinea-Bissau',
                'mg' => 'Madagascar', 'ml' => 'Mali', 'mr' => 'Mauritania',
                'mz' => 'Mozambique', 'na' => 'Namibia', 'za' => 'South Africa',
                'bo' => 'Bolivia', 'cl' => 'Chile', 'co' => 'Colombia',
                'py' => 'Paraguay', 'pe' => 'Peru', 'sc' => 'Scotland',
                'al' => 'Albania', 'sk' => 'Slovakia', 'si' => 'Slovenia',
                'ro' => 'Romania', 'hu' => 'Hungary', 'ge' => 'Georgia',
                'jo' => 'Jordan', 'cw' => 'Curaçao', 'eu' => 'European Union',
            ];

            // Map codes to country names (only for codes we know)
            $titles = [];
            $codeMap = [];
            foreach ($codes as $code) {
                $code = strtolower($code);
                if (isset($codeToCountry[$code])) {
                    $titles[] = $codeToCountry[$code];
                    $codeMap[$codeToCountry[$code]] = $code;
                }
            }

            if (empty($titles)) {
                return [];
            }

            // Batch request (max 50 titles per request)
            $results = [];
            $chunks = array_chunk($titles, 50);
            foreach ($chunks as $chunk) {
                try {
                    $response = $this->http()->get($this->actionBase, [
                        'action' => 'query',
                        'titles' => implode('|', $chunk),
                        'prop' => 'pageimages',
                        'pilicense' => 'any',
                        'piprop' => 'thumbnail',
                        'pithumbsize' => 40,
                        'format' => 'json',
                    ]);
                    if ($response->successful()) {
                        $pages = $response->json()['query']['pages'] ?? [];
                        foreach ($pages as $page) {
                            $title = $page['title'] ?? '';
                            $code = $codeMap[$title] ?? null;
                            $thumb = $page['thumbnail']['source'] ?? null;
                            if ($code && $thumb) {
                                $results[$code] = $thumb;
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // Silently fail — local PNGs are the primary source
                }
            }

            return $results;
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
                $response = $this->http()->get($this->actionBase, [
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
     * Parse match fixtures from Wikipedia group and knockout subpages.
     * Returns structured match data for all groups + knockout rounds.
     */
    public function getMatches(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.historical');
        $key = 'wikipedia:matches:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title) {
            $matches = [];
            $consecutiveFailures = 0;

            // Detect group naming convention (A-H for most tournaments, numbered for others)
            $groupLetters = range('A', 'H');
            $groupSubpages = [];
            foreach ($groupLetters as $letter) {
                $groupSubpages[] = "{$title} Group {$letter}";
            }
            // Also try numbered groups (1-8) for some tournaments
            for ($i = 1; $i <= 8; $i++) {
                $groupSubpages[] = "{$title} Group {$i}";
            }

            foreach ($groupSubpages as $subpage) {
                $groupMatches = $this->parseMatchesFromPage($subpage);
                if (! empty($groupMatches)) {
                    $matches = array_merge($matches, $groupMatches);
                    $consecutiveFailures = 0;
                } else {
                    $consecutiveFailures++;
                    // If 2 consecutive subpages return nothing, SSL/API is likely broken — bail
                    if ($consecutiveFailures >= 2) {
                        break;
                    }
                }
            }

            // Knockout stages
            $koPages = [
                "{$title} knockout stage",
                "{$title} knockout rounds",
            ];
            foreach ($koPages as $koPage) {
                $koMatches = $this->parseMatchesFromPage($koPage);
                if (! empty($koMatches)) {
                    $matches = array_merge($matches, $koMatches);
                }
            }

            return $matches;
        });
    }

    /**
     * Parse awards (Golden Ball, Golden Boot, etc.) from the tournament page.
     * Handles both wikitable format (FIFA-style) and prose format (UEFA-style).
     */
    public function getAwards(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.historical');
        $key = 'wikipedia:awards:'.md5($title);

        return Cache::remember($key, $ttl, function () use ($title) {
            $wikitext = $this->getWikitext($title);
            if (empty($wikitext)) {
                return [];
            }

            $awards = [];

            if (preg_match('/==\s*Awards?\s*==(.+?)(?===\s*[A-Z]|\z)/si', $wikitext, $m)) {
                $section = $m[1];

                // Strip image/file lines to avoid false matches on captions
                $section = preg_replace('/\[\[File:[^\]]*\]\]/si', '', $section);

                // Try wikitable format first (FIFA-style awards table)
                if (preg_match('/\{\|\s*class="wikitable"(.+?)\|\}/s', $section, $wtMatch)) {
                    $wikitable = $wtMatch[1];
                    $rows = preg_split('/\|-/', $wikitable);

                    $currentAward = null;
                    foreach ($rows as $row) {
                        // Header row: !...| [[Award Name]]
                        if (preg_match('/!\s*(?:colspan[^|]*\||)(?:scope[^|]*\||)(?:style[^|]*\||)\s*\[\[FIFA World Cup (Golden Ball|Golden Boot|Golden Glove|Young Player Award|Fair Play Trophy)(?:\|([^\]]+))?\]\]/i', $row, $hm)) {
                            $awardKey = match (strtolower($hm[1])) {
                                'golden ball' => 'golden_ball',
                                'golden boot' => 'golden_boot',
                                'golden glove' => 'golden_glove',
                                'young player award' => 'best_young',
                                'fair play trophy' => 'fair_play',
                            };
                            $currentAward = $awardKey;

                            continue;
                        }

                        // Data row: |{{#invoke:flagg|...|ARG}} [[Player Name]]
                        if ($currentAward && preg_match('/\|\s*(?:.*?\[\[([^\]|]+?)(?:\|([^\]]+))?\]\])/', $row, $dm)) {
                            if (! isset($awards[$currentAward])) {
                                $awards[$currentAward] = $this->cleanWikiValue($dm[2] ?? $dm[1]);
                            }
                            $currentAward = null;
                        }
                    }
                }

                // Fallback: prose format
                if (empty($awards)) {
                    if (preg_match_all('/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]\s*[–—-]\s*\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/', $section, $awardMatches)) {
                        for ($i = 0; $i < count($awardMatches[0]); $i++) {
                            $awardName = $this->cleanWikiValue($awardMatches[2][$i] ?: $awardMatches[1][$i]);
                            $playerName = $this->cleanWikiValue($awardMatches[4][$i] ?: $awardMatches[3][$i]);
                            if (stripos($awardName, 'Boot') !== false) {
                                $awards['golden_boot'] = $playerName;
                            } elseif (stripos($awardName, 'Ball') !== false) {
                                $awards['golden_ball'] = $playerName;
                            } elseif (stripos($awardName, 'Glove') !== false) {
                                $awards['golden_glove'] = $playerName;
                            }
                        }
                    }
                }

                // Second fallback: prose "Player won the Golden Ball"
                if (empty($awards)) {
                    if (preg_match('/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]\s+won\s+the\s+\[\[FIFA World Cup Golden Boot/i', $section, $m)) {
                        $awards['golden_boot'] = $this->cleanWikiValue($m[2] ?: $m[1]);
                    }
                    if (preg_match('/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]\s+won\s+the\s+\[\[FIFA World Cup Golden Ball/i', $section, $m)) {
                        $awards['golden_ball'] = $this->cleanWikiValue($m[2] ?: $m[1]);
                    }
                    if (preg_match('/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]\s+won\s+the\s+\[\[FIFA World Cup Golden Glove/i', $section, $m)) {
                        $awards['golden_glove'] = $this->cleanWikiValue($m[2] ?: $m[1]);
                    }
                }
            }

            return $awards;
        });
    }

    /**
     * Extract player name from a wikitable award cell like "{{#invoke:flagg|main|...|ARG}} [[Lionel Messi]]"
     */
    protected function cleanTeamNameFromAward(string $cell): ?string
    {
        // Extract [[Player Name]] or [[Link|Display]]
        if (preg_match('/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/', $cell, $m)) {
            return $this->cleanWikiValue($m[2] ?: $m[1]);
        }

        return $this->cleanWikiValue($cell);
    }

    /**
     * Get all Wikipedia data for a tournament in one call — convenient for sharing.
     */
    public function getAll(string $title, ?int $ttl = null): array
    {
        $ttl = $ttl ?? config('tournaments.cache.facts');

        $venues = $this->getVenues($title, $ttl);

        // Enrich each venue with stadium data (capacity, opened, location, thumbnail)
        foreach ($venues as &$venue) {
            $stadiumData = $this->getStadiumData($venue['wikipedia_title'] ?? $venue['name'], $ttl);
            $venue = array_merge($venue, $stadiumData);
        }
        unset($venue);

        return [
            'summary' => $this->getSummary($title, $ttl),
            'extract' => $this->getExtract($title, $ttl),
            'venues' => $venues,
            'teams' => $this->getTeams($title, $ttl),
            'facts' => $this->getKeyFacts($title, $ttl),
            'results' => $this->getTournamentResults($title, $ttl),
            'final_match' => $this->getFinalMatch($title, $ttl),
            'logo' => $this->getTournamentLogo($title, $ttl),
            'matches' => $this->getMatches($title, $ttl),
            'awards' => $this->getAwards($title, $ttl),
            'flags' => $this->getFlagImages($this->getTeamCodesFromConfig($title), $ttl),
        ];
    }

    /**
     * Get team flag codes from the tournament config for flag image fetching.
     */
    protected function getTeamCodesFromConfig(string $title): array
    {
        // Find the tournament ID from the config by matching wikipedia_title
        foreach (config('tournaments.tournaments', []) as $id => $config) {
            if (($config['wikipedia_title'] ?? '') === $title) {
                return $config['team_flag_codes'] ?? [];
            }
        }

        return [];
    }

    /**
     * Parse Football Box match templates from a Wikipedia page.
     * Handles both {{#invoke:Football box|main|...}} and {{Football box|...}} formats.
     * Uses balanced brace matching to handle nested {{ }} inside templates.
     */
    protected function parseMatchesFromPage(string $pageTitle): array
    {
        $wikitext = $this->getWikitext($pageTitle);
        if (empty($wikitext)) {
            return [];
        }

        $matches = [];
        // Find all Football box templates using position-based search
        $searchPatterns = ['{{#invoke:Football box', '{{Football box'];
        foreach ($searchPatterns as $searchStr) {
            $pos = 0;
            while (($start = strpos($wikitext, $searchStr, $pos)) !== false) {
                // Extract balanced content using brace matching (start at opening {{)
                $content = $this->extractBalancedTemplate($wikitext, $start);
                if ($content !== null) {
                    // Strip the template name prefix — find first | after template name
                    // Handles both "main|..." (#invoke format) and "\n|..." (plain format)
                    $prefixEnd = strpos($content, '|');
                    if ($prefixEnd !== false) {
                        $boxContent = substr($content, $prefixEnd + 1);
                        $match = $this->parseFootballBox($boxContent);
                        if ($match) {
                            $matches[] = $match;
                        }
                    }
                }
                $pos = $start + 2;
            }
        }

        return $matches;
    }

    /**
     * Extract a balanced {{...}} template starting at the opening {{.
     */
    protected function extractBalancedTemplate(string $wikitext, int $start): ?string
    {
        if (substr($wikitext, $start, 2) !== '{{') {
            return null;
        }

        $depth = 0;
        $len = strlen($wikitext);
        $content = '';

        for ($i = $start; $i < $len; $i++) {
            if ($wikitext[$i] === '{' && isset($wikitext[$i + 1]) && $wikitext[$i + 1] === '{') {
                $depth++;
                $content .= '{{';
                $i++;
            } elseif ($wikitext[$i] === '}' && isset($wikitext[$i + 1]) && $wikitext[$i + 1] === '}') {
                $depth--;
                $content .= '}}';
                $i++;
                if ($depth === 0) {
                    // Return content between outer {{ and }}
                    return substr($content, 2, -2);
                }
            } else {
                $content .= $wikitext[$i];
            }
        }

        return null;
    }

    /**
     * Parse a single Football Box template into a structured match array.
     */
    protected function parseFootballBox(string $boxContent): ?array
    {
        // Extract fields by splitting on | at the top level (not inside {{ }})
        $fields = $this->splitTopLevel($boxContent, '|');
        $data = [];
        foreach ($fields as $field) {
            $parts = explode('=', $field, 2);
            if (count($parts) === 2) {
                $data[trim($parts[0])] = trim($parts[1]);
            }
        }

        // Extract score from "score link" template: {{score link|...|5–1}}
        $score = null;
        if (! empty($data['score'])) {
            $scoreRaw = $data['score'];
            // Match score at end of score link: |5–1}}  (handles both – and -)
            if (preg_match('/(\d+)\s*[\x{2013}\x{2014}-]\s*(\d+)/u', $scoreRaw, $sm)) {
                $score = $sm[1].'-'.$sm[2];
            }
        } elseif (! empty($data['score1']) && ! empty($data['score2'])) {
            $score = trim($data['score1']).'-'.trim($data['score2']);
        }

        // Extract date from Start date template: {{Start date|2024|6|14|df=y}}
        $date = null;
        if (! empty($data['date'])) {
            if (preg_match('/\{\{Start date\|(\d{4})\|(\d{1,2})\|(\d{1,2})/', $data['date'], $dm)) {
                $date = $dm[2].'/'.$dm[3].'/'.$dm[1];
            } else {
                $date = $this->cleanWikiValue($data['date']);
            }
        }

        $team1 = $this->cleanTeamName($data['team1'] ?? null);
        $team2 = $this->cleanTeamName($data['team2'] ?? null);
        if (empty($team1) || empty($team2)) {
            return null;
        }

        return [
            'team1' => $team1,
            'team2' => $team2,
            'score' => $score,
            'date' => $date,
            'time' => $data['time'] ?? null,
            'stadium' => $this->cleanWikiValue($data['stadium'] ?? $data['venue'] ?? null),
            'attendance' => $this->cleanWikiValue($data['attendance'] ?? null),
            'referee' => $this->cleanWikiValue($data['referee'] ?? null),
            'goals1' => $this->cleanWikiValue($data['goals1'] ?? null),
            'goals2' => $this->cleanWikiValue($data['goals2'] ?? null),
            'section' => $data['section'] ?? null,
        ];
    }

    /**
     * Clean a team name from wikitext format like {{fb|GER}}, {{fb-rt|GER}},
     * or {{#invoke:flagg|main|...|VAR|CODE}}.
     */
    protected function cleanTeamName(?string $raw): ?string
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        $val = $raw;
        // {{fb|CODE}} or {{fb-rt|CODE}} -> CODE
        if (preg_match('/\{\{fb(?:-rt)?\|([A-Z]{2,3})\}\}/i', $val, $m)) {
            return strtoupper($m[1]);
        }
        // {{#invoke:flagg|main|...|CODE}} -> CODE (last param before closing }})
        if (preg_match('/\{\{#invoke:flagg\|main\|[^|]+\|avar=fb\|([A-Z]{2,3})\}\}/i', $val, $m)) {
            return strtoupper($m[1]);
        }

        // Fallback: clean wiki markup
        return $this->cleanWikiValue($val);
    }

    /**
     * Split a string by a delimiter, respecting nested {{ }} braces.
     */
    protected function splitTopLevel(string $input, string $delimiter): array
    {
        $result = [];
        $current = '';
        $depth = 0;
        $len = strlen($input);

        for ($i = 0; $i < $len; $i++) {
            if ($input[$i] === '{' && isset($input[$i + 1]) && $input[$i + 1] === '{') {
                $depth++;
                $current .= $input[$i];
            } elseif ($input[$i] === '}' && isset($input[$i + 1]) && $input[$i + 1] === '}') {
                $depth--;
                $current .= $input[$i];
            } elseif ($input[$i] === $delimiter && $depth === 0) {
                $result[] = $current;
                $current = '';
            } else {
                $current .= $input[$i];
            }
        }
        $result[] = $current;

        return $result;
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

    /**
     * Extract an infobox template from wikitext using balanced brace matching.
     */
    protected function extractInfobox(string $wikitext, string $templateName): string
    {
        $start = strpos($wikitext, '{{'.$templateName);
        if ($start === false) {
            return '';
        }

        $depth = 0;
        $infobox = '';
        $started = false;
        $len = strlen($wikitext);

        for ($i = $start; $i < $len; $i++) {
            if ($wikitext[$i] === '{' && isset($wikitext[$i + 1]) && $wikitext[$i + 1] === '{') {
                $depth++;
                $started = true;
                $i++;
            } elseif ($wikitext[$i] === '}' && isset($wikitext[$i + 1]) && $wikitext[$i + 1] === '}') {
                $depth--;
                $i++;
            }
            if ($started) {
                $infobox .= $wikitext[$i];
            }
            if ($started && $depth === 0) {
                break;
            }
        }

        return $infobox;
    }

    /**
     * Extract a field value from infobox wikitext by name.
     */
    protected function getField(string $infobox, string $field): ?string
    {
        if (preg_match('/\|\s*'.preg_quote($field, '/').'\s*=\s*(.+)/', $infobox, $m)) {
            return trim($m[1]);
        }

        return null;
    }

    /**
     * Extract an integer from a field value — handles raw numbers and template strings.
     */
    protected function extractIntFromField(?string $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        // Direct integer
        if (preg_match('/^\d+$/', trim($value))) {
            return (int) trim($value);
        }
        // Number with commas: "51,000" -> 51
        if (preg_match('/^[\d,]+$/', trim($value))) {
            return (int) str_replace(',', '', trim($value));
        }
        // Extract first number from template or mixed string
        if (preg_match('/(\d[\d,]*)/', $value, $m)) {
            return (int) str_replace(',', '', $m[1]);
        }

        return null;
    }

    /**
     * Clean Wikipedia markup from a field value — removes templates, links, refs, HTML.
     */
    protected function cleanWikiValue(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $val = $value;
        // [[link|display]] -> display
        $val = preg_replace('/\[\[([^\]|]+)\|([^\]]+)\]\]/', '$2', $val);
        // [[link]] -> link
        $val = preg_replace('/\[\[([^\]]+)\]\]/', '$1', $val);
        // {{template}} -> '' (recursively)
        while (preg_match('/\{\{[^{}]*\}\}/', $val)) {
            $val = preg_replace('/\{\{[^{}]*\}\}/', '', $val);
        }
        // <ref>...</ref> -> ''
        $val = preg_replace('/<ref[^>]*>.*?<\/ref>/s', '', $val);
        // <ref .../> -> ''
        $val = preg_replace('/<ref[^>]*\/\s*>/s', '', $val);
        // <tag> -> ''
        $val = preg_replace('/<[^>]+>/', '', $val);
        // Collapse whitespace
        $val = preg_replace('/\s+/', ' ', $val);

        $val = trim($val);

        return $val === '' ? null : $val;
    }
}
