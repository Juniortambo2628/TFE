<?php

namespace App\Support;

use Illuminate\Support\Collection;

/**
 * "Row 4 · Seats 7–9; Row 5 · Seat 2". Mirrors `describeSeats()` in
 * lib/stadiumBowl.js, which labels a selection before it is bought; this
 * labels it after. tests/Unit/TicketSeatLabelTest.php pins the same cases.
 */
class TicketSeatLabel
{
    /** @param  Collection|array  $seats  items with `row` and `number` */
    public static function for(Collection|array $seats): ?string
    {
        $byRow = [];

        foreach ($seats as $seat) {
            $byRow[(int) data_get($seat, 'row')][] = (int) data_get($seat, 'number');
        }

        if ($byRow === []) {
            return null;
        }

        ksort($byRow);
        $parts = [];

        foreach ($byRow as $row => $numbers) {
            sort($numbers);
            $runs = [];

            foreach ($numbers as $n) {
                $last = count($runs) - 1;

                if ($last >= 0 && $n === $runs[$last][1] + 1) {
                    $runs[$last][1] = $n;
                } else {
                    $runs[] = [$n, $n];
                }
            }

            $text = implode(', ', array_map(fn ($r) => $r[0] === $r[1] ? (string) $r[0] : $r[0].'–'.$r[1], $runs));
            $parts[] = 'Row '.$row.' · Seat'.(count($numbers) > 1 ? 's' : '').' '.$text;
        }

        return implode('; ', $parts);
    }
}
