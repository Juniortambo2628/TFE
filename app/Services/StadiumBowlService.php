<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketTier;
use Illuminate\Support\Collection;

/**
 * StadiumBowlService — the one payload the 3D seat map reads.
 *
 * Every fan surface that draws a bowl (the ticketing match view, the budget
 * calculator's price summary, a package's venue panel) goes through here, so
 * there is exactly one definition of "which venue is this and how full is it".
 * The component (`Components/Common/StadiumBowl3D`) consumes this shape and
 * nothing else.
 *
 * Three entry points, one shape, distinguished by `source` + `has_inventory`:
 *
 *   forTicket()  source=fixture   real tiers of one match, purchasable
 *                                 (each tier carries its `tier_id`).
 *   forVenue()   source=venue     tiers aggregated across every active
 *                                 fixture at that ground, indicative only.
 *   forName()    source=catalogue geometry only — no ticket rows exist, so
 *                                 `has_inventory` is false and the client
 *                                 shows a layout, not percentages.
 *
 * That last case is the point of the flag. The surfaces this feeds used to
 * invent an occupancy figure when they had none (the landing hero hashed the
 * stadium name into a 20-85% "urgency signal"). A bowl with no inventory
 * behind it now says so instead.
 */
class StadiumBowlService
{
    public function __construct(private StadiumImageService $images) {}

    /**
     * One fixture's own tiered inventory — the live, purchasable case.
     */
    public function forTicket(Ticket $ticket): ?array
    {
        $venue = $this->venueFor($ticket->venue_name, $ticket->tournament_id);

        if ($venue === null) {
            return null;
        }

        $tiers = $ticket->relationLoaded('tiers') ? $ticket->tiers : $ticket->tiers()->get();

        return $this->payload($venue, $tiers->map(fn (TicketTier $t) => [
            'tier_id' => $t->id,
            'key' => $t->key,
            'name' => $t->name,
            'price' => (float) $t->price,
            'capacity' => $t->capacity,
            'sold' => $t->sold,
            'remaining' => $t->remaining,
            'sold_pct' => $t->sold_pct,
            'is_sold_out' => $t->is_sold_out,
        ])->all(), 'fixture', $ticket->currency);
    }

    /**
     * Every active fixture at one ground, summed per tier.
     *
     * Used where the fan has picked a venue but not a match — the budget
     * calculator and a package's venue panel. Occupancy is real (it is the
     * sum of real tier rows) but it is not one match's, so no `tier_id` is
     * exposed and the client must not offer a purchase from it.
     */
    public function forVenue(?string $venueName, string $tournamentId): ?array
    {
        $venue = $this->venueFor($venueName, $tournamentId);

        if ($venue === null) {
            return null;
        }

        $tickets = Ticket::query()
            ->active()
            ->forTournament($tournamentId)
            ->with('tiers')
            ->get()
            ->filter(fn (Ticket $t) => $this->sameVenue($t, $venue, $tournamentId));

        $tiers = $this->aggregate($tickets);

        if ($tiers === []) {
            return $this->payload($venue, $this->blueprintTiers($venue), 'catalogue', null);
        }

        return $this->payload($venue, $tiers, 'venue', $tickets->first()?->currency);
    }

    /**
     * Every catalogued venue of a tournament, in config order.
     *
     * One pass over the tournament's tickets rather than `forVenue()` per
     * ground — that is 12 identical ticket queries on AFCON 2027, and the
     * surfaces that want a venue switcher (the budget calculator) want all of
     * them at once so switching costs no request.
     *
     * @return array<int, array<string, mixed>>
     */
    public function forTournament(string $tournamentId): array
    {
        $tickets = Ticket::query()
            ->active()
            ->forTournament($tournamentId)
            ->with('tiers')
            ->get();

        // Bucket the fixtures by the catalogue slug their venue name resolves
        // to, so each ground is matched once instead of once per ground.
        $byVenue = [];

        foreach ($tickets as $ticket) {
            $slug = $this->images->entryFor($ticket->venue_name, $tournamentId)['slug'] ?? null;

            if ($slug === null) {
                continue;
            }

            $byVenue[$slug][] = $ticket;
        }

        $out = [];

        foreach ($this->images->catalogue($tournamentId) as $slug => $venue) {
            $fixtures = collect($byVenue[$slug] ?? []);
            $tiers = $this->aggregate($fixtures);

            $out[] = $tiers === []
                ? $this->payload($venue, $this->blueprintTiers($venue), 'catalogue', null)
                : $this->payload($venue, $tiers, 'venue', $fixtures->first()?->currency);
        }

        return $out;
    }

    /**
     * Geometry for a venue name with no inventory attached at all.
     */
    public function forName(?string $venueName, string $tournamentId): ?array
    {
        $venue = $this->venueFor($venueName, $tournamentId);

        if ($venue === null) {
            return null;
        }

        return $this->payload($venue, $this->blueprintTiers($venue), 'catalogue', null);
    }

    /**
     * Sum matching fixtures' tiers into one set of four.
     *
     * @param  Collection<int, Ticket>  $tickets
     * @return array<int, array<string, mixed>>
     */
    private function aggregate(Collection $tickets): array
    {
        $acc = [];

        foreach ($tickets as $ticket) {
            foreach ($ticket->tiers as $tier) {
                $key = $tier->key;

                if (! isset($acc[$key])) {
                    $acc[$key] = [
                        'tier_id' => null,
                        'key' => $key,
                        'name' => $tier->name,
                        'price' => (float) $tier->price,
                        'capacity' => 0,
                        'sold' => 0,
                        'sort' => $tier->sort_order,
                    ];
                }

                $acc[$key]['capacity'] += $tier->capacity;
                $acc[$key]['sold'] += $tier->sold;
                // Cheapest seat in the tier across the ground's fixtures is
                // the useful number for a fan planning a budget.
                $acc[$key]['price'] = min($acc[$key]['price'], (float) $tier->price);
            }
        }

        if ($acc === []) {
            return [];
        }

        $rows = array_values($acc);
        usort($rows, fn ($a, $b) => $a['sort'] <=> $b['sort']);

        return array_map(function (array $row) {
            $remaining = max(0, $row['capacity'] - $row['sold']);

            return [
                'tier_id' => null,
                'key' => $row['key'],
                'name' => $row['name'],
                'price' => $row['price'],
                'capacity' => $row['capacity'],
                'sold' => $row['sold'],
                'remaining' => $remaining,
                'sold_pct' => $row['capacity'] > 0 ? (int) round($row['sold'] / $row['capacity'] * 100) : 0,
                'is_sold_out' => $remaining <= 0,
            ];
        }, $rows);
    }

    /**
     * The tier SHAPE for a ground with no fixtures — capacities only, so the
     * bowl can be drawn to the right proportions with nothing sold claimed.
     *
     * @return array<int, array<string, mixed>>
     */
    private function blueprintTiers(array $venue): array
    {
        $capacity = (int) ($venue['capacity'] ?? 0);

        return array_map(fn (array $row) => [
            'tier_id' => null,
            'key' => $row['key'],
            'name' => $row['name'],
            'price' => null,
            'capacity' => $row['capacity'],
            'sold' => null,
            'remaining' => null,
            'sold_pct' => null,
            'is_sold_out' => false,
        ], TicketTier::blueprintFor($capacity, 0.0));
    }

    /**
     * Resolve a free-text venue name to its catalogue entry.
     *
     * Goes through StadiumImageService::entryFor, which alias-matches — venue
     * strings reach us from fixtures, ticket rows and Wikipedia and none of
     * them agree on a spelling. Deliberately NOT a slug lookup: `venue_slug`
     * on a ticket row is partner-supplied and does not have to match a
     * catalogue key (the seeded Kasarani row proves it — it carried
     * `moi-international-sports-centre` against a catalogue key of
     * `moi-kasarani`).
     */
    private function venueFor(?string $venueName, string $tournamentId): ?array
    {
        $entry = $this->images->entryFor($venueName, $tournamentId);

        return $entry ?: null;
    }

    /**
     * The catalogue slug a free-text venue name resolves to, or null.
     *
     * Public because callers that already hold a list of bowls (a package's
     * venues, a fan's selected matches) need to line their own venue strings
     * up against it, and they must not reimplement the alias matching to do it.
     */
    public function slugFor(?string $venueName, string $tournamentId): ?string
    {
        return $this->images->entryFor($venueName, $tournamentId)['slug'] ?? null;
    }

    private function sameVenue(Ticket $ticket, array $venue, string $tournamentId): bool
    {
        return $this->slugFor($ticket->venue_name, $tournamentId) === ($venue['slug'] ?? null);
    }

    /**
     * Assemble the shape the component reads.
     *
     * @param  array<int, array<string, mixed>>  $tiers
     */
    private function payload(array $venue, array $tiers, string $source, ?string $currency): array
    {
        $capacity = (int) ($venue['capacity'] ?? 0);
        $totalSeats = array_sum(array_map(fn ($t) => (int) ($t['capacity'] ?? 0), $tiers));
        $totalSold = array_sum(array_map(fn ($t) => (int) ($t['sold'] ?? 0), $tiers));
        $hasInventory = $source !== 'catalogue';

        return [
            'slug' => $venue['slug'] ?? null,
            'name' => $venue['name'] ?? null,
            'formerly' => $venue['formerly'] ?? null,
            'city' => $venue['city'] ?? null,
            'country' => $venue['country'] ?? null,
            'country_code' => $venue['country_code'] ?? null,
            'location' => trim(($venue['city'] ?? '').', '.($venue['country'] ?? ''), ', ') ?: null,
            'capacity' => $capacity,
            'image' => $venue['url'] ?? null,

            // Bowl geometry (config/stadiums.php). Defaults match the
            // prototype's: a generic flat-ring canopy on a full
            // discorectangle footprint.
            'roof_style' => $venue['roof_style'] ?? 'canopy',
            'corner_ratio' => $venue['corner_ratio'] ?? null,
            'partial_bowl' => (bool) ($venue['partial_bowl'] ?? false),
            'is_alternate' => (bool) ($venue['is_alternate'] ?? false),

            'source' => $source,
            'has_inventory' => $hasInventory,
            'currency' => $currency ?? 'USD',
            'seats' => $totalSeats,
            'sold' => $hasInventory ? $totalSold : null,
            'sold_pct' => $hasInventory && $totalSeats > 0
                ? (int) round($totalSold / $totalSeats * 100)
                : null,
            'tiers' => $tiers,
        ];
    }
}
