<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Services\FixtureService;
use App\Services\StadiumBowlService;
use App\Services\TournamentService;
use App\Traits\ResolvesTournament;
use Inertia\Inertia;

/**
 * Fan-facing package pages.
 *
 * `show` renders a full detail view with hero, description, included
 * matches, a 3D seat map of the package's venues, itinerary map for
 * every included venue, and capacity urgency. The "Use this package"
 * CTA links back to the BudgetCalculator with ?package= so the wizard
 * pre-fills at step 2.
 */
class PackageController extends Controller
{
    use ResolvesTournament;

    public function __construct(private StadiumBowlService $bowls) {}

    public function show(Listing $package)
    {
        // Sprint 22 — only expose approved + active listings on the
        // fan-facing detail surface. Route model binding pulls by ID
        // without status filtering, which previously let fans (or a
        // scripted account) walk /fan/packages/{id} and read draft or
        // rejected partner-authored listings before admin review.
        // 404 rather than 403 so we don't confirm the ID exists.
        abort_if(
            ($package->moderation_status && $package->moderation_status !== 'approved') || ! $package->is_active,
            404,
        );

        $package->load('publisher.partnerProfile');

        // If the package's tournament isn't the one the fan is viewing
        // right now, silently swap context to it so the whole page
        // (Hero, TournamentSwitcher, everything else) matches. This is
        // done by resolving through TournamentService — the actual
        // ResolveTournament middleware ran before we got here, so we
        // just fetch the target tournament's payload directly.
        $tournamentService = app(TournamentService::class);
        $tournament = $tournamentService->get($package->tournament_id);

        // Enrich included matches with venue coordinates so the map
        // draws distance chips even for deep links.
        $fixtureService = app(FixtureService::class);
        $allFixtures = collect($fixtureService->getFixtures($package->tournament_id));
        $includedMatches = $allFixtures
            ->filter(fn ($f) => in_array($f['id'], $package->included_match_ids ?? [], true))
            ->values()
            ->toArray();

        // Which venue the seat map should OPEN on: the one used by the most
        // included matches, falling back to the tournament's first configured
        // venue when the package names no matches. The map itself offers every
        // venue this package visits, so this only decides the lead.
        $stadiumName = collect($includedMatches)
            ->pluck('venue')
            ->filter()
            ->countBy()
            ->sortDesc()
            ->keys()
            ->first();

        if (! $stadiumName) {
            $stadiumName = collect($tournament['venues'] ?? [])->first()['name'] ?? null;
        }

        return Inertia::render('Fan/PackageDetail', [
            'package' => [
                'id' => $package->id,
                'name' => $package->name,
                'slug' => $package->slug,
                'description' => $package->description,
                'hero_image' => $package->hero_image,
                'base_price' => $package->base_price,
                'currency' => $package->currency,
                'included_match_ids' => $package->included_match_ids ?? [],
                'included_venues' => $package->included_venues ?? [],
                'nights' => $package->nights,
                'flight_class' => $package->flight_class,
                'accommodation_level' => $package->accommodation_level,
                'capacity' => $package->capacity,
                'sold_count' => $package->sold_count,
                'seats_left' => $package->seats_left,
                'availability_pct' => $package->availability_pct,
                'is_sold_out' => $package->is_sold_out,
                'is_featured' => $package->is_featured,
                'tournament_id' => $package->tournament_id,
                'publisher' => $package->publisherSummary(),
            ],
            'tournamentSummary' => [
                'id' => $tournament['id'],
                'name' => $tournament['name'],
                'short_name' => $tournament['short_name'] ?? null,
                'hosts' => $tournament['hosts'] ?? [],
                'venues' => $tournament['venues'] ?? [],
                'pricing' => [
                    'currency' => $tournament['pricing']['currency'] ?? 'USD',
                    'ticket_prices' => $tournament['pricing']['ticket_prices'] ?? [],
                ],
            ],
            'includedMatches' => $includedMatches,

            // One bowl per venue this package actually visits, primary first,
            // so the seat map's own switcher covers the whole trip. Built from
            // the tournament set and filtered rather than resolved per name,
            // which keeps it to a single ticket query.
            'venueBowls' => $this->bowlsForVenues($tournament['id'], $stadiumName, $includedMatches),
        ]);
    }

    /**
     * The package's own venues as bowl payloads, primary venue first.
     *
     * Falls back to every catalogued venue when the package names none, so the
     * seat map still has something real to draw rather than disappearing.
     *
     * @param  array<int, array<string, mixed>>  $includedMatches
     * @return array<int, array<string, mixed>>
     */
    private function bowlsForVenues(string $tournamentId, ?string $primary, array $includedMatches): array
    {
        $all = $this->bowls->forTournament($tournamentId);

        $wanted = collect($includedMatches)->pluck('venue')->filter()->unique();

        if ($primary) {
            $wanted = $wanted->prepend($primary)->unique();
        }

        if ($wanted->isEmpty()) {
            return $all;
        }

        // Match on the resolved slug: a fixture's venue string and the
        // catalogue's canonical name routinely differ, so comparing the two
        // names directly would drop most venues.
        $slugs = $wanted
            ->map(fn ($name) => $this->bowls->slugFor($name, $tournamentId))
            ->filter()
            ->values();

        $ordered = $slugs
            ->map(fn ($slug) => collect($all)->firstWhere('slug', $slug))
            ->filter()
            ->values()
            ->all();

        return $ordered ?: $all;
    }
}
