<?php

namespace Tests\Unit;

use App\Models\TicketTier;
use PHPUnit\Framework\TestCase;

/**
 * The tier blueprint's seat shares are not arbitrary — they are the proportion
 * of the bowl's seating AREA each ring covers, taken from the tier radii in
 * `resources/js/lib/stadiumBowl.js`. That is what makes the 3D map a reading of
 * the inventory rather than a picture sitting next to it: a tier that looks
 * like half the bowl holds half the seats.
 *
 * The radii below are a copy of that file's BASE_TIERS, and
 * tests/JS/stadiumBowl.test.mjs asserts the resulting shares from the other
 * direction. Change a radius and both sides fail until the blueprint moves
 * with them.
 */
class TicketTierBlueprintTest extends TestCase
{
    /** Mirrors BASE_TIERS in resources/js/lib/stadiumBowl.js. */
    private const RADII = [
        'vip' => [14, 22],
        'premium' => [22, 34],
        'standard' => [34, 50],
        'upper' => [50, 68],
    ];

    public function test_blueprint_keys_match_the_bowl_rings(): void
    {
        $this->assertSame(
            array_keys(self::RADII),
            array_keys(TicketTier::BLUEPRINT),
            'Tier keys and their order must match the bowl rings exactly.'
        );

        $this->assertSame(array_keys(self::RADII), TicketTier::KEYS);
    }

    public function test_seat_shares_are_the_ring_areas(): void
    {
        $areas = [];

        foreach (self::RADII as $key => [$inner, $outer]) {
            $areas[$key] = ($outer ** 2) - ($inner ** 2);
        }

        $total = array_sum($areas);

        foreach (TicketTier::BLUEPRINT as $key => $spec) {
            $expected = $areas[$key] / $total;

            $this->assertEqualsWithDelta(
                $expected,
                $spec['share'],
                0.0001,
                "Tier {$key}: blueprint share {$spec['share']} does not match its ring area share {$expected}."
            );
        }
    }

    public function test_shares_sum_to_one(): void
    {
        $sum = array_sum(array_column(TicketTier::BLUEPRINT, 'share'));

        $this->assertEqualsWithDelta(1.0, $sum, 0.0001, "Shares summed to {$sum}.");
    }

    public function test_blueprint_allocates_every_seat(): void
    {
        // Deliberately awkward capacities: the rounding remainder must always
        // land somewhere, or the parent total drifts from the sum of its tiers
        // and the sell-through bar disagrees with the bowl.
        foreach ([1, 7, 999, 15000, 20000, 48063, 60000, 99999] as $capacity) {
            $rows = TicketTier::blueprintFor($capacity, 60.0);
            $allocated = array_sum(array_column($rows, 'capacity'));

            $this->assertSame(
                $capacity,
                $allocated,
                "Capacity {$capacity} allocated {$allocated} seats across its tiers."
            );
        }
    }

    public function test_blueprint_never_produces_a_negative_tier(): void
    {
        foreach ([0, 1, 2, 3] as $capacity) {
            foreach (TicketTier::blueprintFor($capacity, 60.0) as $row) {
                $this->assertGreaterThanOrEqual(0, $row['capacity'], 'A tier went negative.');
            }
        }
    }

    public function test_prices_scale_off_the_standard_tier(): void
    {
        $rows = collect(TicketTier::blueprintFor(60000, 60.0))->keyBy('key');

        // Standard IS the base price — the fixture's own `price` column.
        $this->assertSame(60.0, $rows['standard']['price']);
        $this->assertSame(240.0, $rows['vip']['price']);
        $this->assertSame(120.0, $rows['premium']['price']);
        $this->assertSame(36.0, $rows['upper']['price']);

        // The cheapest seat must be cheaper than the base, or a "from {base}"
        // price quote understates nothing and the tiers are pointless.
        $this->assertLessThan(60.0, $rows['upper']['price']);
    }

    public function test_bigger_tiers_are_cheaper(): void
    {
        // Sanity on the shape of the model: seats get cheaper as the ring gets
        // bigger and further from the pitch.
        $rows = TicketTier::blueprintFor(60000, 60.0);

        for ($i = 1; $i < count($rows); $i++) {
            $this->assertGreaterThan(
                $rows[$i - 1]['capacity'],
                $rows[$i]['capacity'],
                "Tier {$rows[$i]['key']} should hold more seats than the ring inside it."
            );
            $this->assertLessThan(
                $rows[$i - 1]['price'],
                $rows[$i]['price'],
                "Tier {$rows[$i]['key']} should be cheaper than the ring inside it."
            );
        }
    }
}
