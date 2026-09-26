<?php

namespace App\Services;

use App\Models\SiteSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * Resolves a venue name to a locally-hosted stadium image (and its geodata).
 *
 * Replaces the old "whatever thumbnail Wikipedia returned" path in the hero
 * slider. The catalogue lives in config/stadiums.php; per-stadium admin
 * overrides live in SiteSetting under `stadium_image_{slug}` and win over the
 * committed default. The committed default is never removed, so an override
 * that points at a deleted upload still degrades to a real image.
 *
 * Name matching is the interesting part: venue names reach us as free text
 * parsed out of Wikipedia wikitext, so "Moi International Sports Centre",
 * "Kasarani Stadium" and "Moi International Sports Centre, Kasarani" all
 * denote the same ground. Every entry carries an alias list, and both the
 * incoming name and the aliases are normalized before comparison.
 */
class StadiumImageService
{
    public const SETTING_PREFIX = 'stadium_image_';

    /**
     * Sprint 48 — free-text venue image override, used for tournaments that
     * don't have a config catalogue (WC 2026, Euro 2024). Key shape:
     * `stadium_name_{tournament_id}_{normalized_venue_name}`. Reads from
     * SiteSetting and is merged into lookup() alongside the catalogue.
     */
    public const NAME_PREFIX = 'stadium_name_';

    protected const CACHE_KEY = 'stadiums:resolved:';

    /**
     * Normalize a venue name for matching.
     *
     * Lowercases, strips accents/punctuation, collapses whitespace, and drops
     * the noise words that vary freely between sources ("stadium", "the",
     * "national" is deliberately NOT dropped — "Nyayo National" and "Mandela
     * National" would still be distinct, but dropping it loses signal for
     * grounds whose only distinguishing word it is).
     *
     * Kept public + static so the JS side can mirror it exactly; the shared
     * Inertia map is keyed by the output of this method.
     */
    public static function normalize(?string $name): string
    {
        if ($name === null) {
            return '';
        }

        $n = mb_strtolower(trim($name));

        // Strip diacritics where the intl/iconv path is available; harmless no-op otherwise.
        $translit = @iconv('UTF-8', 'ASCII//TRANSLIT', $n);
        if ($translit !== false) {
            $n = $translit;
        }

        // Punctuation (commas, hyphens, apostrophes, parentheses) to spaces.
        $n = preg_replace('/[^a-z0-9]+/i', ' ', $n);
        $n = preg_replace('/\s+/', ' ', $n);
        $n = trim($n);

        // Drop trailing/leading noise words that carry no identifying signal.
        $n = preg_replace('/\b(stadium|stadia|arena|ground|complex|the)\b/', ' ', $n);
        $n = trim(preg_replace('/\s+/', ' ', $n));

        return $n;
    }

    /**
     * Do two already-normalized venue names denote the same ground?
     *
     * Exact match, or one fully containing the other — but a containment match
     * only counts when the shared run is at least two words. That guard is
     * what stops "Zanzibar Fumba Stadium" resolving to Amaan Stadium on the
     * strength of the single token "zanzibar": both are Zanzibar grounds, and
     * showing the wrong stadium's photo is worse than showing none.
     *
     * Mirrored by venueNamesMatch() in resources/js/Data/stadiumImages.js.
     */
    public static function matches(string $a, string $b): bool
    {
        if ($a === '' || $b === '') {
            return false;
        }

        if ($a === $b) {
            return true;
        }

        if (! str_contains($a, $b) && ! str_contains($b, $a)) {
            return false;
        }

        $shorter = mb_strlen($a) <= mb_strlen($b) ? $a : $b;

        return count(explode(' ', $shorter)) >= 2;
    }

    /**
     * The catalogue for one tournament, with admin overrides applied.
     *
     * @return array<string, array> slug => entry (entry gains a resolved `url`)
     */
    public function catalogue(string $tournamentId): array
    {
        $ttl = (int) config('stadiums.cache_ttl', 900);

        return Cache::remember(self::CACHE_KEY.$tournamentId, $ttl, function () use ($tournamentId) {
            $set = config("stadiums.sets.{$tournamentId}", []);

            if (empty($set)) {
                return [];
            }

            // One query for every override in this set rather than N lookups.
            //
            // Guarded the same way TournamentService::loadOverrides is: on a
            // fresh install (or a test that doesn't migrate) site_settings
            // does not exist yet, and the committed config defaults are a
            // perfectly good answer. Imagery must never be the reason a page
            // 500s.
            $overrides = collect();

            try {
                if (Schema::hasTable('site_settings')) {
                    $keys = array_map(fn ($slug) => self::SETTING_PREFIX.$slug, array_keys($set));
                    $overrides = SiteSetting::whereIn('key', $keys)->pluck('value', 'key');
                }
            } catch (\Throwable $e) {
                // best-effort — config defaults still apply.
            }

            $out = [];

            foreach ($set as $slug => $entry) {
                $override = $overrides[self::SETTING_PREFIX.$slug] ?? null;

                $entry['slug'] = $slug;
                $entry['default_url'] = $this->toUrl($entry['image'] ?? null);
                $entry['url'] = $override
                    ? $this->toUrl($override)
                    : $entry['default_url'];
                $entry['is_overridden'] = (bool) $override;

                $out[$slug] = $entry;
            }

            return $out;
        });
    }

    /**
     * Flat lookup consumed by the frontend: normalized venue name => image url.
     *
     * Both the canonical name and every alias map to the same url, so a
     * client-side resolver only has to normalize and index — it never needs a
     * copy of the alias table. That keeps config/stadiums.php the single
     * source of truth rather than something to be kept in sync with a JS file.
     *
     * @return array<string, string>
     */
    public function lookup(string $tournamentId): array
    {
        $map = [];

        foreach ($this->catalogue($tournamentId) as $slug => $entry) {
            if (empty($entry['url'])) {
                continue;
            }

            $names = array_merge(
                [$entry['name'] ?? $slug, $slug],
                $entry['aliases'] ?? []
            );

            foreach ($names as $name) {
                $key = self::normalize($name);
                if ($key !== '') {
                    $map[$key] = $entry['url'];
                }
            }
        }

        // Sprint 48 — layer per-name overrides on top so uncatalogued
        // tournaments (or ad-hoc venues admin uploaded outside the config)
        // also resolve. Config catalogue still wins if both are present.
        foreach ($this->nameOverrides($tournamentId) as $normalized => $url) {
            if (! isset($map[$normalized])) {
                $map[$normalized] = $url;
            }
        }

        return $map;
    }

    /**
     * @return array<string, string> normalized_venue_name => url
     */
    public function nameOverrides(string $tournamentId): array
    {
        try {
            if (! Schema::hasTable('site_settings')) {
                return [];
            }
        } catch (\Throwable $e) {
            return [];
        }

        $prefix = self::NAME_PREFIX.$tournamentId.'_';

        return SiteSetting::query()
            ->where('key', 'like', $prefix.'%')
            ->pluck('value', 'key')
            ->mapWithKeys(fn ($url, $key) => [substr($key, strlen($prefix)) => $this->toUrl($url)])
            ->all();
    }

    /**
     * Resolve one venue name to an image url, or null when nothing matches.
     */
    public function resolve(?string $venueName, string $tournamentId): ?string
    {
        $key = self::normalize($venueName);

        if ($key === '') {
            return null;
        }

        $lookup = $this->lookup($tournamentId);

        if (isset($lookup[$key])) {
            return $lookup[$key];
        }

        // Substring fallback — catches "Benjamin Mkapa Stadium, Dar es Salaam"
        // style names that carry a trailing locality the alias list doesn't
        // enumerate. Longest key first so "mkapa" can't win over a more
        // specific match.
        //
        // Deliberately conservative: the shared token run must be at least two
        // words. A one-word overlap is how "Zanzibar Fumba Stadium" used to
        // resolve to Amaan Stadium — a different ground in the same city.
        // Returning the WRONG stadium photo is worse than returning none, so a
        // single-token near-miss falls through to null and the caller's
        // placeholder.
        $keys = array_keys($lookup);
        usort($keys, fn ($a, $b) => mb_strlen($b) <=> mb_strlen($a));

        foreach ($keys as $candidate) {
            if (self::matches($key, $candidate)) {
                return $lookup[$candidate];
            }
        }

        return null;
    }

    /**
     * Find the catalogue entry (not just the url) behind a venue name.
     */
    public function entryFor(?string $venueName, string $tournamentId): ?array
    {
        $key = self::normalize($venueName);

        if ($key === '') {
            return null;
        }

        foreach ($this->catalogue($tournamentId) as $entry) {
            $names = array_merge(
                [$entry['name'] ?? '', $entry['slug'] ?? ''],
                $entry['aliases'] ?? []
            );

            foreach ($names as $name) {
                if (self::matches($key, self::normalize($name))) {
                    return $entry;
                }
            }
        }

        return null;
    }

    /**
     * Does this tournament have a curated stadium catalogue?
     *
     * When it does, the catalogue — not Wikipedia's venue parse — is the
     * source of truth for which grounds exist.
     */
    public function hasCatalogue(string $tournamentId): bool
    {
        return ! empty(config("stadiums.sets.{$tournamentId}"));
    }

    /**
     * Build the venue rows for a tournament straight from the catalogue.
     *
     * This is the inversion of the original design, and the reason the hero
     * slider now resolves every slide. Wikipedia's "Venues" section is free
     * prose: it lists grounds under whatever name an editor last used, often
     * abbreviates them, sometimes emits bare city names as if they were
     * stadiums, and changes between fetches. Deriving our venue list from it
     * meant a slide could exist for a ground we had no image of, and a ground
     * we *did* have an image of could be missing entirely.
     *
     * We already hold the authoritative list — 12 real stadiums that are not
     * going to change. So the catalogue drives the list, and Wikipedia is
     * demoted to enrichment keyed on `wikipedia_title`, a name we chose.
     * Every row therefore has an image by construction.
     *
     * Rows come back in config order and carry the shape the frontend already
     * expects from a Wikipedia venue row, so nothing downstream had to change.
     *
     * @return array<int, array>
     */
    public function catalogueVenues(string $tournamentId): array
    {
        $out = [];

        foreach ($this->catalogue($tournamentId) as $entry) {
            $location = trim(
                ($entry['city'] ?? '').', '.($entry['country'] ?? ''),
                ', '
            );

            $out[] = [
                'name' => $entry['name'] ?? $entry['slug'],
                'slug' => $entry['slug'],
                'city' => $entry['city'] ?? null,
                'country' => $entry['country'] ?? null,
                'country_code' => $entry['country_code'] ?? null,
                'location' => $location ?: null,
                'lat' => $entry['lat'] ?? null,
                'lng' => $entry['lng'] ?? null,
                'capacity' => $entry['capacity'] ?? null,
                'image' => $entry['url'],
                'thumbnail' => $entry['url'],
                'image_source' => 'local',
                'is_overridden' => $entry['is_overridden'] ?? false,
                // What Wikipedia should be asked about this ground. Falls back
                // to the canonical name when no explicit article is set.
                'wikipedia_title' => $entry['wikipedia_title'] ?? ($entry['name'] ?? null),
                // Filled in by WikipediaService::enrichStadiums().
                'extract' => '',
                'opened' => null,
                'url' => null,
            ];
        }

        return $out;
    }

    /**
     * Overlay local imagery + coordinates onto the Wikipedia venue rows.
     *
     * Wikipedia stays the source for prose (extract), capacity and opening
     * year — it is good at those. It is no longer the source for the hero
     * image, and it is only the fallback source for coordinates, which it
     * frequently fails to parse out of the infobox.
     *
     * @param  array<int, array>  $venues
     * @return array<int, array>
     */
    public function applyToVenues(array $venues, string $tournamentId): array
    {
        if (empty(config("stadiums.sets.{$tournamentId}"))) {
            return $venues;
        }

        foreach ($venues as &$venue) {
            $entry = $this->entryFor($venue['name'] ?? null, $tournamentId);

            if (! $entry) {
                // Once a tournament is catalogued, its imagery is ours
                // entirely — an unmatched row must NOT keep falling back to a
                // remote Wikipedia thumbnail. Leaving those in place was the
                // whole problem: a slow third-party image on an unpredictable
                // URL. Nulling them hands the decision to each surface's own
                // local placeholder (the tournament backdrop in the hero, the
                // generic stadium shot in the budget calculator).
                //
                // Note this also covers the city names Wikipedia's venue
                // parser emits as if they were grounds ("Nairobi", "Kampala") —
                // those would otherwise render a cityscape photo in a slide
                // labelled like a stadium.
                $venue['image'] = null;
                $venue['thumbnail'] = null;
                $venue['image_source'] = null;

                continue;
            }

            // Local image wins outright — that is the whole point of the swap.
            $venue['image'] = $entry['url'];
            $venue['thumbnail'] = $entry['url'];
            $venue['image_source'] = 'local';
            $venue['slug'] = $entry['slug'];

            // Coordinates: only fill the gaps Wikipedia left. A real parsed
            // infobox coordinate is more precise than our approximation.
            if (! isset($venue['lat']) || ! is_numeric($venue['lat'])) {
                $venue['lat'] = $entry['lat'] ?? null;
            }
            if (! isset($venue['lng']) || ! is_numeric($venue['lng'])) {
                $venue['lng'] = $entry['lng'] ?? null;
            }

            if (empty($venue['location']) && ! empty($entry['city'])) {
                $venue['location'] = trim($entry['city'].', '.($entry['country'] ?? ''), ', ');
            }
        }
        unset($venue);

        return $venues;
    }

    /**
     * Every catalogued stadium for a tournament, in config order, as the
     * admin grid renders them.
     *
     * @return array<int, array>
     */
    public function all(string $tournamentId): array
    {
        return array_values($this->catalogue($tournamentId));
    }

    /**
     * Tournament ids that have a catalogue, for the admin tournament picker.
     *
     * @return array<int, string>
     */
    public function tournamentIds(): array
    {
        return array_keys(config('stadiums.sets', []));
    }

    /**
     * True when a tournament has any config-level catalogue entries.
     * Uncatalogued tournaments fall back to Wikipedia venues + admin
     * per-name overrides (see nameOverrides()).
     */
    public function hasCatalogueSet(string $tournamentId): bool
    {
        return ! empty(config("stadiums.sets.{$tournamentId}", []));
    }

    public function clearCache(?string $tournamentId = null): void
    {
        if ($tournamentId) {
            Cache::forget(self::CACHE_KEY.$tournamentId);

            return;
        }

        foreach ($this->tournamentIds() as $id) {
            Cache::forget(self::CACHE_KEY.$id);
        }
    }

    /**
     * Turn a stored path into a browser-resolvable url.
     *
     * Handles the three shapes that reach us: an absolute url, an already
     * rooted path (`/storage/...`, what an admin upload stores), and a
     * repo-relative public path (`stadiums/AFCON/foo.webp`, the config default).
     */
    protected function toUrl(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return '/'.ltrim($path, '/');
    }
}
