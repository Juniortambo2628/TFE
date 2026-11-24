<?php

namespace App\Support;

/**
 * Stands and blocks: the ground divided the way a ticket names a seat.
 *
 * MIRRORS `standLayout()` / `blockLayout()` in resources/js/lib/stadiumBowl.js.
 * The codes and angles both sides produce are pinned by
 * tests/fixtures/stadium-blocks.json, asserted by tests/Unit/StadiumLayoutTest.php
 * here and tests/JS/stadiumBlocks.test.mjs there. Change one side and both
 * fail until the other follows.
 *
 * What only this side does is decide how many SEATS each block holds. The
 * blocks are equal angles, not equal areas: a block at the end of a long
 * pitch reaches further out than one on the side, so it holds more. Each
 * block's share is its slice of the footprint's area, the same reasoning
 * `TicketTier::BLUEPRINT` uses for the tiers, so a block that looks big on
 * the map is big in the inventory.
 */
class StadiumLayout
{
    /** Footprint proportions: length along the pitch, width across it. */
    public const LEN_K = 1.32;

    public const WID_K = 0.85;

    public const CORNER_HALF = 0.2;

    public const BLOCK_SPAN = 0.2;

    /** Integration steps per block, for the area shares. */
    private const STEPS = 48;

    /**
     * The eight stands, in angle order from the north end.
     *
     * @return array<int, array{key:string, name:string, start:float, end:float}>
     */
    public static function stands(): array
    {
        $c = atan2(self::WID_K, self::LEN_K);
        $h = self::CORNER_HALF;
        $pi = M_PI;

        return [
            ['key' => 'north', 'name' => 'North Stand', 'start' => -($c - $h), 'end' => $c - $h],
            ['key' => 'north_west', 'name' => 'North-West Corner', 'start' => $c - $h, 'end' => $c + $h],
            ['key' => 'west', 'name' => 'West Stand', 'start' => $c + $h, 'end' => $pi - $c - $h],
            ['key' => 'south_west', 'name' => 'South-West Corner', 'start' => $pi - $c - $h, 'end' => $pi - $c + $h],
            ['key' => 'south', 'name' => 'South Stand', 'start' => $pi - $c + $h, 'end' => $pi + $c - $h],
            ['key' => 'south_east', 'name' => 'South-East Corner', 'start' => $pi + $c - $h, 'end' => $pi + $c + $h],
            ['key' => 'east', 'name' => 'East Stand', 'start' => $pi + $c + $h, 'end' => 2 * $pi - $c - $h],
            ['key' => 'north_east', 'name' => 'North-East Corner', 'start' => 2 * $pi - $c - $h, 'end' => 2 * $pi - $c + $h],
        ];
    }

    /** Display name for a stand key, or null for one that does not exist. */
    public static function standName(?string $key): ?string
    {
        foreach (self::stands() as $stand) {
            if ($stand['key'] === $key) {
                return $stand['name'];
            }
        }

        return null;
    }

    /**
     * Every block of one tier, in order round the ground. `$tierNumber` is
     * the tier's 1-based position and leads the code (block 307 = third
     * tier, seventh block).
     *
     * @return array<int, array{code:string, stand:string, start:float, end:float}>
     */
    public static function blocks(int $tierNumber): array
    {
        $out = [];

        foreach (self::stands() as $stand) {
            $span = $stand['end'] - $stand['start'];
            $n = max(1, (int) round($span / self::BLOCK_SPAN));

            for ($i = 0; $i < $n; $i++) {
                $out[] = [
                    'code' => (string) ($tierNumber * 100 + count($out) + 1),
                    'stand' => $stand['key'],
                    'start' => $stand['start'] + $span * $i / $n,
                    'end' => $stand['start'] + $span * ($i + 1) / $n,
                ];
            }
        }

        return $out;
    }

    /**
     * Each block's share of its tier's seats, summing to 1.
     *
     * A ring's area between two angles goes as the integral of r(θ)², and
     * every tier is the same footprint scaled, so the scale cancels and the
     * shares are the same for every tier of one ground. They do depend on
     * the ground's `corner_ratio` (a boxier ground puts more seats in its
     * corners), which is why it is a parameter.
     *
     * @return array<int, float> indexed like blocks()
     */
    public static function shares(?float $cornerRatio = null): array
    {
        $areas = array_map(function (array $b) use ($cornerRatio) {
            $dt = ($b['end'] - $b['start']) / self::STEPS;
            $sum = 0.0;

            // Midpoint rule: smooth integrand, 48 steps is far below a seat.
            for ($i = 0; $i < self::STEPS; $i++) {
                $r = self::discoRadius($b['start'] + ($i + 0.5) * $dt, self::LEN_K, self::WID_K, $cornerRatio);
                $sum += $r * $r * $dt;
            }

            return $sum;
        }, self::blocks(1));

        $total = array_sum($areas) ?: 1.0;

        return array_map(fn (float $a) => $a / $total, $areas);
    }

    /**
     * Split `$capacity` seats across the blocks by area, exactly: the largest
     * remainders get the leftover seats, so the blocks always add back up to
     * the tier's capacity and the tier total never drifts from its blocks.
     *
     * @return array<int, int> indexed like blocks()
     */
    public static function apportion(int $capacity, array $weights): array
    {
        $capacity = max(0, $capacity);
        $total = array_sum($weights);

        if ($weights === [] || $total <= 0) {
            return array_fill(0, count($weights), 0);
        }

        $exact = array_map(fn ($w) => $capacity * $w / $total, $weights);
        $floors = array_map(fn ($x) => (int) floor($x), $exact);
        $left = $capacity - array_sum($floors);

        $order = array_keys($exact);
        // Largest fractional part first; ties go to the earlier block so the
        // result is deterministic.
        usort($order, function ($a, $b) use ($exact, $floors) {
            $fa = $exact[$a] - $floors[$a];
            $fb = $exact[$b] - $floors[$b];

            return $fb <=> $fa ?: $a <=> $b;
        });

        for ($i = 0; $i < $left; $i++) {
            $floors[$order[$i]]++;
        }

        return $floors;
    }

    /**
     * Distance from the centre to the footprint outline at `$angle`. A port
     * of `discoRadius()` in lib/stadiumBowl.js — the rounded-rectangle solver.
     */
    public static function discoRadius(float $angle, float $halfLen, float $halfWid, ?float $cornerRatio): float
    {
        $ratio = $cornerRatio ?? 1.0;
        $r = $halfWid * $ratio;
        $dx = cos($angle);
        $dz = sin($angle);
        $ax = $halfLen - $r;
        $az = $halfWid - $r;

        if (abs($dz) > 1e-6) {
            $t = ($dz > 0 ? $halfWid : -$halfWid) / $dz;
            if (abs($dx * $t) <= $ax + 1e-6) {
                return $t;
            }
        }

        if (abs($dx) > 1e-6) {
            $t = ($dx > 0 ? $halfLen : -$halfLen) / $dx;
            if (abs($dz * $t) <= $az + 1e-6) {
                return $t;
            }
        }

        $ccx = $dx >= 0 ? $ax : -$ax;
        $ccz = $dz >= 0 ? $az : -$az;
        $b = -2 * ($dx * $ccx + $dz * $ccz);
        $c = $ccx * $ccx + $ccz * $ccz - $r * $r;
        $disc = max(0, $b * $b - 4 * $c);

        return (-$b + sqrt($disc)) / 2;
    }
}
