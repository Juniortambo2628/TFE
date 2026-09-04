<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Services\FixtureService;
use App\Services\TournamentService;
use App\Traits\ResolvesTournament;
use Inertia\Inertia;

/**
 * Fan-facing package pages.
 *
 * `show` renders a full detail view with hero, description, included
 * matches, stadium seat map for the primary venue, itinerary map for
 * every included venue, and capacity urgency. The "Use this package"
 * CTA links back to the BudgetCalculator with ?package= so the wizard
 * pre-fills at step 2.
 */
class PackageController extends Controller
{
    use ResolvesTournament;

    public function show(Package $package)
    {
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

        // The seat map wants a single stadium. Pick the venue used by
        // the most included matches, then fall back to the first
        // configured tournament venue if the package has no matches.
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
            'stadiumName' => $stadiumName,
        ]);
    }
}
