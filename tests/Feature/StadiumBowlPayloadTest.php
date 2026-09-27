<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Ticket;
use App\Models\User;
use App\Services\StadiumBowlService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Inertia;
use Tests\TestCase;

/**
 * StadiumBowlService is the only thing that decides what a venue is and how
 * full it is, for every surface that draws the 3D seat map. The behaviour worth
 * pinning is the honesty of the occupancy figure: before tiered inventory
 * existed, surfaces that had no real number invented one (the landing hero
 * hashed the stadium name into a 20-85% "urgency signal"). A ground with no
 * inventory must now say so rather than shade as if it were empty.
 */
class StadiumBowlPayloadTest extends TestCase
{
    use RefreshDatabase;

    private const TOURNAMENT = 'afcon_2027';

    private function service(): StadiumBowlService
    {
        return app(StadiumBowlService::class);
    }

    private function fixture(array $attrs = []): Ticket
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'ticketing_partner']);

        $ticket = Ticket::create(array_merge([
            'tournament_id' => self::TOURNAMENT,
            'partner_id' => $partner->id,
            'home_team' => 'Kenya',
            'away_team' => 'Nigeria',
            'venue_slug' => 'moi-kasarani',
            'venue_name' => 'Moi International Sports Centre, Kasarani',
            'venue_city' => 'Nairobi',
            'venue_country' => 'Kenya',
            'venue_capacity' => 48000,
            'stage' => 'Group Stage',
            'kickoff_at' => now()->addMonths(3),
            'price' => 60,
            'currency' => 'USD',
            'capacity' => 40000,
            'sold' => 0,
            'is_active' => true,
        ], $attrs));

        $ticket->seedDefaultTiers();

        return $ticket->fresh('tiers');
    }

    public function test_every_catalogued_venue_carries_bowl_geometry(): void
    {
        $bowls = $this->service()->forTournament(self::TOURNAMENT);

        $this->assertCount(12, $bowls, 'AFCON 2027 has 12 catalogued grounds.');

        foreach ($bowls as $bowl) {
            $this->assertNotNull($bowl['slug']);
            $this->assertNotNull($bowl['name']);
            $this->assertGreaterThan(0, $bowl['capacity'], "{$bowl['slug']} has no capacity.");
            $this->assertContains(
                $bowl['roof_style'],
                ['shield', 'dome', 'arch', 'crown', 'petal', 'facet', 'canopy'],
                "{$bowl['slug']} has a roof style the renderer cannot draw."
            );
            $this->assertIsBool($bowl['partial_bowl']);
            $this->assertCount(4, $bowl['tiers'], "{$bowl['slug']} should have four tiers.");

            if ($bowl['corner_ratio'] !== null) {
                $this->assertGreaterThan(0, $bowl['corner_ratio']);
                $this->assertLessThanOrEqual(1, $bowl['corner_ratio']);
            }
        }
    }

    public function test_a_ground_with_no_fixtures_reports_no_inventory(): void
    {
        // Nyayo has no ticket rows in this test, so there is no honest
        // occupancy figure for it and the payload must not imply one.
        $bowl = $this->service()->forVenue('Nyayo National Stadium', self::TOURNAMENT);

        $this->assertSame('catalogue', $bowl['source']);
        $this->assertFalse($bowl['has_inventory']);
        $this->assertNull($bowl['sold']);
        $this->assertNull($bowl['sold_pct']);

        foreach ($bowl['tiers'] as $tier) {
            $this->assertNull($tier['sold'], 'An unknown tier must not read as zero sold.');
            $this->assertNull($tier['sold_pct']);
            $this->assertNull($tier['tier_id'], 'A layout-only tier must not be purchasable.');
            $this->assertGreaterThan(0, $tier['capacity'], 'Capacities are still real.');
        }
    }

    public function test_a_fixture_payload_is_purchasable_and_reports_real_occupancy(): void
    {
        $ticket = $this->fixture();
        $ticket->tiers->each(fn ($t) => $t->update(['sold' => (int) round($t->capacity * 0.5)]));
        $ticket->syncTierTotals();

        $bowl = $this->service()->forTicket($ticket->fresh('tiers'));

        $this->assertSame('fixture', $bowl['source']);
        $this->assertTrue($bowl['has_inventory']);
        $this->assertSame(50, $bowl['sold_pct']);

        foreach ($bowl['tiers'] as $tier) {
            $this->assertNotNull($tier['tier_id'], 'A fixture tier must be purchasable.');
            $this->assertSame(50, $tier['sold_pct']);
        }
    }

    public function test_an_aggregate_payload_is_real_but_not_purchasable(): void
    {
        // Two fixtures at the same ground: the venue view sums them, but there
        // is no single tier row to buy from, so no tier_id may be exposed.
        $this->fixture(['kickoff_at' => now()->addMonths(3)]);
        $this->fixture(['kickoff_at' => now()->addMonths(4)]);

        $bowl = $this->service()->forVenue('Kasarani Stadium', self::TOURNAMENT);

        $this->assertSame('venue', $bowl['source']);
        $this->assertTrue($bowl['has_inventory']);
        $this->assertSame(80000, $bowl['seats'], 'Both fixtures should be summed.');

        foreach ($bowl['tiers'] as $tier) {
            $this->assertNull($tier['tier_id'], 'An aggregate tier must not be purchasable.');
        }
    }

    public function test_venues_resolve_through_aliases_not_slugs(): void
    {
        // A ticket row's venue_slug is partner-supplied and need not match a
        // catalogue key — the seeded Kasarani row carried
        // `moi-international-sports-centre` against a key of `moi-kasarani`.
        // Resolution therefore goes by name through the alias table.
        $ticket = $this->fixture(['venue_slug' => 'not-a-catalogue-key']);

        $bowl = $this->service()->forTicket($ticket);

        $this->assertSame('moi-kasarani', $bowl['slug']);
        $this->assertSame('dome', $bowl['roof_style']);
    }

    public function test_both_the_old_and_new_talanta_names_resolve(): void
    {
        // Renamed to Raila Odinga International Stadium in December 2025, and
        // Wikipedia flips between the two between edits.
        foreach (['Talanta Sports City Stadium', 'Raila Odinga International Stadium'] as $name) {
            $bowl = $this->service()->forName($name, self::TOURNAMENT);

            $this->assertNotNull($bowl, "{$name} did not resolve.");
            $this->assertSame('talanta-sports-city', $bowl['slug']);
            $this->assertSame('Raila Odinga International Stadium', $bowl['name'], 'The user-facing name must be the current one.');
            $this->assertSame('Talanta Sports City Stadium', $bowl['formerly']);
        }
    }

    public function test_an_unknown_venue_returns_null_rather_than_a_wrong_ground(): void
    {
        // Matching is deliberately conservative: showing the wrong ground's
        // bowl is worse than showing none.
        $this->assertNull($this->service()->forName('Zanzibar Fumba Stadium', self::TOURNAMENT));
        $this->assertNull($this->service()->forName('Nairobi', self::TOURNAMENT));
        $this->assertNull($this->service()->forName(null, self::TOURNAMENT));
        $this->assertNull($this->service()->forName('', self::TOURNAMENT));
    }

    public function test_kipchoge_keino_is_flagged_as_an_alternate_venue(): void
    {
        $bowl = $this->service()->forName('Kipchoge Keino Stadium', self::TOURNAMENT);

        $this->assertTrue($bowl['is_alternate'], 'Kipchoge Keino is a reserve/training ground, not a primary match venue.');
    }

    public function test_tier_capacities_sum_to_the_fixture_capacity(): void
    {
        $bowl = $this->service()->forTicket($this->fixture(['capacity' => 40000]));

        $this->assertSame(40000, array_sum(array_column($bowl['tiers'], 'capacity')));
        $this->assertSame(40000, $bowl['seats']);
    }

    public function test_the_budget_calculator_defers_its_venue_bowls(): void
    {
        $fan = User::factory()->create();

        // Deferred props are absent from the first response on purpose — the
        // seat map sits well down the results step and must not hold up paint.
        $first = $this->actingAs($fan)
            ->get(route('fan.budget-calculator'))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertArrayNotHasKey('venueBowls', $first, 'venueBowls should be deferred, not eager.');

        // …and arrive on the partial reload Inertia fires next.
        $props = $this->actingAs($fan)
            ->withHeaders([
                'X-Inertia' => 'true',
                // The real asset version, or Inertia answers 409 and forces a
                // full reload instead of serving the partial.
                'X-Inertia-Version' => (string) Inertia::getVersion(),
                'X-Inertia-Partial-Component' => 'Fan/BudgetCalculator',
                'X-Inertia-Partial-Data' => 'venueBowls',
            ])
            ->get(route('fan.budget-calculator'))
            ->assertOk()
            ->json('props');

        $this->assertCount(12, $props['venueBowls']);
        $this->assertSame('talanta-sports-city', $props['venueBowls'][0]['slug']);
    }

    public function test_a_package_carries_bowls_for_its_own_venues(): void
    {
        $listing = Listing::factory()->create([
            'tournament_id' => self::TOURNAMENT,
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);

        $props = $this->actingAs(User::factory()->create())
            ->get(route('fan.packages.show', $listing->id))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertNotEmpty($props['venueBowls'], 'A package must have venues to draw.');

        foreach ($props['venueBowls'] as $bowl) {
            $this->assertArrayHasKey('roof_style', $bowl);
            $this->assertCount(4, $bowl['tiers']);
        }
    }

    public function test_an_uncatalogued_tournament_yields_no_bowls(): void
    {
        $this->assertSame([], $this->service()->forTournament('wc_2026'));
        $this->assertNull($this->service()->forName('Some Ground', 'wc_2026'));
    }
}
