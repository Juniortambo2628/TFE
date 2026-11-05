<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Fixture;
use Database\Seeders\DemoAfconFixturesSeeder;
use Database\Seeders\DemoFanActivitySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The demo plans open as what their names say (found while capturing the
 * landing v2 screenshots, Nov 2026). Every demo plan was seeded with no
 * matches, a breakdown in keys the calculator does not read, and — when
 * approved — no quoted price, so "Nairobi group stage — 3 matches" opened as
 * "0 matches" with a third of its cost missing, and a partner with two
 * approvals read "$0.00 Total Revenue".
 */
class DemoFanActivityTest extends TestCase
{
    use RefreshDatabase;

    /** The keys lib/tripEstimate.js writes and the Budget Calculator reads. */
    private const ESTIMATE_KEYS = [
        'match_tickets', 'flights', 'accommodation', 'food_and_drink', 'local_transport',
        'insurance', 'visa', 'merchandise', 'miscellaneous',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DemoAfconFixturesSeeder::class);
        $this->seed(DemoFanActivitySeeder::class);
    }

    public function test_a_plan_has_the_matches_its_name_promises(): void
    {
        $plan = Budget::where('name', 'Nairobi group stage — 3 matches')->firstOrFail();

        $this->assertCount(3, $plan->match_ids);
        $ids = array_map(fn ($id) => (int) str_replace('db_', '', $id), $plan->match_ids);
        $fixtures = Fixture::whereIn('id', $ids)->get();
        $this->assertCount(3, $fixtures, 'Every match id is a real fixture, in the db_{id} form.');
        $this->assertSame(['Group Stage'], $fixtures->pluck('stage')->unique()->values()->all());
    }

    public function test_every_demo_plan_has_matches_and_a_breakdown_the_calculator_reads(): void
    {
        $plans = Budget::all(); // only this seeder runs here
        $this->assertNotEmpty($plans);

        foreach ($plans as $plan) {
            $this->assertNotEmpty($plan->match_ids, "{$plan->name} has no matches.");
            foreach (array_keys($plan->breakdown) as $key) {
                $this->assertContains($key, self::ESTIMATE_KEYS, "{$plan->name}: '{$key}' is not a key the calculator reads.");
            }
        }
    }

    public function test_an_approved_quote_has_a_price(): void
    {
        $approved = Budget::where('partner_status', 'approved')->get();

        $this->assertNotEmpty($approved);
        foreach ($approved as $plan) {
            $this->assertGreaterThan(0, (float) $plan->partner_cost, "{$plan->name} is approved with no price.");
        }
    }
}
