<?php

namespace Database\Seeders;

use App\Models\Ticket;
use Illuminate\Database\Seeder;

/**
 * Gives every tiered fixture its numbered blocks.
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
        Ticket::query()->whereHas('tiers')->each(fn (Ticket $ticket) => $ticket->seedDefaultBlocks());
    }
}
