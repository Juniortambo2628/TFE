<?php

namespace Database\Seeders;

use App\Models\Ticket;
use Illuminate\Database\Seeder;

/**
 * Gives every tiered fixture its numbered blocks, and every sale a seat.
 *
 * This is the backfill for tiers created before blocks existed, and it runs
 * on every deploy (the deploy seeds), so it must be idempotent:
 * `TicketTier::seedDefaultBlocks()` leaves a tier that already has blocks
 * alone, and spreads any seats a tier had already sold across its new blocks
 * so no fixture loses occupancy.
 */
class TicketBlockSeeder extends Seeder
{
    public function run(): void
    {
        Ticket::query()->whereHas('tiers')->each(function (Ticket $ticket) {
            $ticket->seedDefaultBlocks();

            // Then a seat for every sale that has none (TicketBlock::seatAllSales):
            // TFE purchases together, other channels in a fixed scatter. Also
            // idempotent, and `sold` is unchanged by it.
            foreach ($ticket->tiers()->with('blocks.tier')->get() as $tier) {
                $tier->blocks->each->seatAllSales();
            }
        });
    }
}
