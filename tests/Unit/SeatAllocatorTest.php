<?php

namespace Tests\Unit;

use App\Support\SeatAllocator;
use App\Support\TicketSeatLabel;
use PHPUnit\Framework\TestCase;

/**
 * Seat choice inside one block, and the receipt's wording of it.
 */
class SeatAllocatorTest extends TestCase
{
    private array $grid = ['rows' => 6, 'per_row' => 10, 'last_row' => 4];

    public function test_together_seats_a_party_side_by_side_near_the_middle(): void
    {
        $seats = SeatAllocator::together($this->grid, [], 3);

        // Preferred row is a third of the way back (ceil(6 * 0.35) = 3),
        // centred in a 10-seat row.
        $this->assertSame([[3, 4], [3, 5], [3, 6]], $seats);
    }

    public function test_together_steps_round_taken_seats(): void
    {
        $taken = ['3:4' => true, '3:5' => true];
        $seats = SeatAllocator::together($this->grid, $taken, 3);

        $rows = array_unique(array_column($seats, 0));
        $this->assertCount(1, $rows, 'Still one row.');
        $this->assertSame([0, 1, 2], array_map(fn ($s) => $s[1] - $seats[0][1], $seats), 'Still side by side.');
        $this->assertEmpty(array_filter($seats, fn ($s) => isset($taken["{$s[0]}:{$s[1]}"])));
    }

    public function test_together_is_null_when_no_row_has_room_side_by_side(): void
    {
        // Every other seat taken in every row: lots free, never two together.
        $taken = [];
        for ($r = 1; $r <= 6; $r++) {
            for ($n = 1; $n <= 10; $n += 2) {
                $taken["{$r}:{$n}"] = true;
            }
        }

        $this->assertNull(SeatAllocator::together($this->grid, $taken, 2));
        $this->assertCount(2, SeatAllocator::nearest($this->grid, $taken, 2));
    }

    public function test_the_short_back_row_is_never_overfilled(): void
    {
        $grid = ['rows' => 1, 'per_row' => 4, 'last_row' => 4];

        $this->assertNull(SeatAllocator::together($grid, [], 5));
        $this->assertNull(SeatAllocator::nearest($grid, [], 5));
    }

    public function test_scatter_is_repeatable_and_avoids_taken_seats(): void
    {
        $taken = ['1:1' => true];
        $a = SeatAllocator::scatter($this->grid, $taken, 20, 'seed');
        $b = SeatAllocator::scatter($this->grid, $taken, 20, 'seed');

        $this->assertSame($a, $b, 'No randomness: the same block fills the same way.');
        $this->assertCount(20, $a);
        $this->assertNotContains([1, 1], $a);
        $this->assertCount(20, array_unique(array_map(fn ($s) => "{$s[0]}:{$s[1]}", $a)));
        $this->assertNotSame($a, SeatAllocator::scatter($this->grid, $taken, 20, 'other'));
    }

    public function test_scatter_returns_only_what_is_free(): void
    {
        $this->assertCount(54, SeatAllocator::scatter($this->grid, [], 1000, 'x'));
    }

    public function test_the_receipt_label_groups_runs_by_row(): void
    {
        $seats = [
            ['row' => 4, 'number' => 9], ['row' => 4, 'number' => 7], ['row' => 4, 'number' => 8],
            ['row' => 5, 'number' => 2], ['row' => 4, 'number' => 12],
        ];

        // Same cases as describeSeats() in tests/JS/stadiumBlocks.test.mjs.
        $this->assertSame('Row 4 · Seats 7–9, 12; Row 5 · Seat 2', TicketSeatLabel::for($seats));
        $this->assertSame('Row 1 · Seat 3', TicketSeatLabel::for([['row' => 1, 'number' => 3]]));
        $this->assertNull(TicketSeatLabel::for([]));
    }
}
