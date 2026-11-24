<?php

namespace Tests\Unit;

use App\Support\StadiumLayout;
use PHPUnit\Framework\TestCase;

/**
 * The server half of the stands-and-blocks layout.
 *
 * tests/fixtures/stadium-blocks.json is the contract with
 * resources/js/lib/stadiumBowl.js (tests/JS/stadiumBlocks.test.mjs reads the
 * same file): a fan buys seats in a block by its code, so both sides must put
 * the same code in the same place.
 */
class StadiumLayoutTest extends TestCase
{
    public function test_every_tier_matches_the_shared_fixture(): void
    {
        $fixture = json_decode(file_get_contents(__DIR__.'/../fixtures/stadium-blocks.json'), true);

        foreach ($fixture['tiers'] as $i => $expected) {
            $actual = StadiumLayout::blocks($i + 1);

            $this->assertCount(count($expected), $actual, 'tier '.($i + 1));

            foreach ($actual as $j => $block) {
                $this->assertSame($expected[$j]['code'], $block['code']);
                $this->assertSame($expected[$j]['stand'], $block['stand']);
                $this->assertEqualsWithDelta($expected[$j]['start'], $block['start'], 1e-6);
                $this->assertEqualsWithDelta($expected[$j]['end'], $block['end'], 1e-6);
            }
        }
    }

    public function test_shares_sum_to_one_for_any_ground_shape(): void
    {
        foreach ([null, 1.0, 0.6, 0.42] as $ratio) {
            $this->assertEqualsWithDelta(1.0, array_sum(StadiumLayout::shares($ratio)), 1e-12);
        }
    }

    public function test_the_ends_of_a_long_pitch_hold_more_seats_per_block_than_the_sides(): void
    {
        $blocks = StadiumLayout::blocks(1);
        $shares = StadiumLayout::shares();
        $by = fn (string $stand) => array_values(array_filter(
            array_map(null, $blocks, $shares),
            fn ($pair) => $pair[0]['stand'] === $stand,
        ));

        // Same angle, further out: an end block reaches the pitch's far end.
        $this->assertGreaterThan($by('west')[0][1], $by('north')[0][1]);
    }

    public function test_a_boxier_ground_puts_more_seats_in_its_corners(): void
    {
        $corner = array_search('north_west', array_column(StadiumLayout::blocks(1), 'stand'), true);

        $this->assertGreaterThan(
            StadiumLayout::shares(null)[$corner],
            StadiumLayout::shares(0.42)[$corner],
        );
    }

    public function test_apportion_hands_out_exactly_the_capacity(): void
    {
        $shares = StadiumLayout::shares();

        foreach ([0, 1, 31, 2600, 19188, 40001] as $capacity) {
            $seats = StadiumLayout::apportion($capacity, $shares);
            $this->assertSame($capacity, array_sum($seats), "capacity {$capacity}");
            $this->assertGreaterThanOrEqual(0, min($seats));
        }
    }

    public function test_apportioning_sales_by_block_size_never_overfills_a_block(): void
    {
        $seats = StadiumLayout::apportion(2600, StadiumLayout::shares());
        $sold = StadiumLayout::apportion(2599, $seats);

        $this->assertSame(2599, array_sum($sold));

        foreach ($seats as $i => $cap) {
            $this->assertLessThanOrEqual($cap, $sold[$i]);
        }
    }

    public function test_stand_names_come_from_the_layout(): void
    {
        $this->assertSame('West Stand', StadiumLayout::standName('west'));
        $this->assertSame('North-East Corner', StadiumLayout::standName('north_east'));
        $this->assertNull(StadiumLayout::standName('nope'));
    }
}
