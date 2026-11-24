<?php

namespace App\Support;

/**
 * Chooses seats inside one block's grid. Pure: it is handed the grid and the
 * set of taken seats ("row:number" => true) and returns [row, number] pairs,
 * so the rules are testable without a database.
 *
 * "Best" is a forward-of-middle row and the centre of it: roughly where a
 * box office would put you first.
 */
class SeatAllocator
{
    /**
     * `$quantity` seats side by side in one row, best first; null when no
     * row has that many free together.
     *
     * @param  array{rows:int, per_row:int, last_row:int}  $grid
     * @param  array<string, bool>  $taken
     * @return array<int, array{0:int, 1:int}>|null
     */
    public static function together(array $grid, array $taken, int $quantity): ?array
    {
        $best = null;
        $bestScore = INF;

        for ($row = 1; $row <= $grid['rows']; $row++) {
            $count = StadiumLayout::seatsInRow($grid, $row);
            $run = 0;

            for ($n = 1; $n <= $count; $n++) {
                $run = isset($taken["{$row}:{$n}"]) ? 0 : $run + 1;

                if ($run >= $quantity) {
                    $first = $n - $quantity + 1;
                    $score = self::score($grid, $row, ($first + $n) / 2, $count);

                    if ($score < $bestScore) {
                        $bestScore = $score;
                        $best = [$row, $first];
                    }
                }
            }
        }

        if ($best === null) {
            return null;
        }

        return array_map(fn ($i) => [$best[0], $best[1] + $i], range(0, $quantity - 1));
    }

    /**
     * The `$quantity` best free seats wherever they are in the block — the
     * fallback when no row has them together. Null if the block has fewer.
     *
     * @return array<int, array{0:int, 1:int}>|null
     */
    public static function nearest(array $grid, array $taken, int $quantity): ?array
    {
        $free = [];

        foreach (self::free($grid, $taken) as [$row, $n]) {
            $free[] = [self::score($grid, $row, $n, StadiumLayout::seatsInRow($grid, $row)), $row, $n];
        }

        if (count($free) < $quantity) {
            return null;
        }

        usort($free, fn ($a, $b) => $a[0] <=> $b[0] ?: $a[1] <=> $b[1] ?: $a[2] <=> $b[2]);

        return array_map(fn ($f) => [$f[1], $f[2]], array_slice($free, 0, $quantity));
    }

    /**
     * `$count` free seats spread over the block in a fixed, repeatable
     * pattern — for seats sold through another channel, whose positions TFE
     * was never told. Ranked by a hash of the block code and seat, so the
     * same block always fills the same way (no randomness: a screenshot must
     * be reproducible). Returns fewer if fewer are free.
     *
     * @return array<int, array{0:int, 1:int}>
     */
    public static function scatter(array $grid, array $taken, int $count, string $seed): array
    {
        $ranked = [];

        foreach (self::free($grid, $taken) as [$row, $n]) {
            $ranked[] = [crc32("{$seed}|{$row}|{$n}"), $row, $n];
        }

        usort($ranked, fn ($a, $b) => $a[0] <=> $b[0] ?: $a[1] <=> $b[1] ?: $a[2] <=> $b[2]);

        return array_map(fn ($r) => [$r[1], $r[2]], array_slice($ranked, 0, max(0, $count)));
    }

    /** @return \Generator<array{0:int, 1:int}> */
    private static function free(array $grid, array $taken): \Generator
    {
        for ($row = 1; $row <= $grid['rows']; $row++) {
            $count = StadiumLayout::seatsInRow($grid, $row);

            for ($n = 1; $n <= $count; $n++) {
                if (! isset($taken["{$row}:{$n}"])) {
                    yield [$row, $n];
                }
            }
        }
    }

    /** Lower is better: distance from the preferred row, then from the row's centre. */
    private static function score(array $grid, int $row, float $centre, int $count): float
    {
        $preferred = max(1, (int) ceil($grid['rows'] * 0.35));

        return abs($row - $preferred) * 1000 + abs($centre - ($count + 1) / 2);
    }
}
