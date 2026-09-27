<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tiered ticket inventory.
 *
 * `tickets` carried one flat price/capacity/sold per fixture, so there was
 * exactly ONE real occupancy number per match. Every seat-map surface that
 * showed four tiers was therefore showing invented figures — the landing hero
 * literally hashed the stadium name to produce a plausible-looking percentage.
 *
 * Seat inventory lives here instead, one row per tier per fixture. The parent
 * `tickets.capacity` / `tickets.sold` stay as denormalized totals because the
 * ticket cards and the partner sell-through stat read them directly; they are
 * owned by `Ticket::syncTierTotals()` and must never be incremented by hand
 * (same rule as `Tribe::syncCounts()`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            // vip | premium | standard | upper — matches the bowl's tier keys.
            $table->string('key', 32);
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->unsignedInteger('capacity');
            $table->unsignedInteger('sold')->default(0);
            // Innermost tier first, so the bowl renders rings in order.
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['ticket_id', 'key']);
            $table->index(['ticket_id', 'sort_order']);
        });

        Schema::table('ticket_purchases', function (Blueprint $table) {
            // Nullable: purchases made before tiers existed have no tier, and
            // nullOnDelete keeps a past e-Ticket readable if a partner later
            // removes the tier it was bought from.
            $table->foreignId('ticket_tier_id')->nullable()->after('ticket_id')
                ->constrained('ticket_tiers')->nullOnDelete();
            // Snapshot of the tier label at purchase time, so a receipt still
            // reads correctly once the FK is gone.
            $table->string('tier_name')->nullable()->after('ticket_tier_id');
        });

        $this->backfillExistingFixtures();
    }

    /**
     * Give every pre-existing fixture the four tiers, so an install that
     * already had ticket rows doesn't silently lose its occupancy data to the
     * "no inventory" path the moment tiers become the source of truth.
     *
     * The shares and multipliers below are a deliberately FROZEN copy of
     * `TicketTier::BLUEPRINT` as of this migration. A migration must describe
     * what happened at the time it ran, so it must not follow a constant that
     * can be edited later — re-running history would then produce different
     * rows than it did the first time. Query builder for the same reason: no
     * model, no events, no assumptions about today's schema.
     */
    private function backfillExistingFixtures(): void
    {
        $blueprint = [
            ['key' => 'vip', 'name' => 'VIP', 'share' => 0.065, 'multiplier' => 4.0, 'sort' => 0],
            ['key' => 'premium', 'name' => 'Premium', 'share' => 0.152, 'multiplier' => 2.0, 'sort' => 1],
            ['key' => 'standard', 'name' => 'Standard', 'share' => 0.303, 'multiplier' => 1.0, 'sort' => 2],
            ['key' => 'upper', 'name' => 'Upper', 'share' => 0.480, 'multiplier' => 0.6, 'sort' => 3],
        ];

        $now = now();

        DB::table('tickets')->orderBy('id')->chunkById(100, function ($tickets) use ($blueprint, $now) {
            $rows = [];

            foreach ($tickets as $ticket) {
                $capacity = (int) $ticket->capacity;
                $sold = (int) $ticket->sold;
                $price = (float) $ticket->price;

                $seatsAllocated = 0;
                $soldAllocated = 0;
                $tierRows = [];

                foreach ($blueprint as $spec) {
                    $seats = (int) floor($capacity * $spec['share']);
                    // The one real occupancy number this fixture has, spread
                    // proportionally. It is not per-tier truth — there never
                    // was any — but it preserves the total exactly and is the
                    // honest reading of what the old data said.
                    $tierSold = min($seats, (int) floor($sold * $spec['share']));

                    $seatsAllocated += $seats;
                    $soldAllocated += $tierSold;

                    $tierRows[] = [
                        'ticket_id' => $ticket->id,
                        'key' => $spec['key'],
                        'name' => $spec['name'],
                        'price' => round($price * $spec['multiplier'], 2),
                        'capacity' => $seats,
                        'sold' => $tierSold,
                        'sort_order' => $spec['sort'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                // Rounding remainders go to the largest tier so the tiers sum
                // back to the fixture's own capacity and sold figures.
                $last = count($tierRows) - 1;
                $tierRows[$last]['capacity'] += max(0, $capacity - $seatsAllocated);
                $tierRows[$last]['sold'] = min(
                    $tierRows[$last]['capacity'],
                    $tierRows[$last]['sold'] + max(0, $sold - $soldAllocated)
                );

                $rows = array_merge($rows, $tierRows);
            }

            if ($rows !== []) {
                DB::table('ticket_tiers')->insert($rows);
            }
        });
    }

    public function down(): void
    {
        Schema::table('ticket_purchases', function (Blueprint $table) {
            $table->dropForeign(['ticket_tier_id']);
            $table->dropColumn(['ticket_tier_id', 'tier_name']);
        });

        Schema::dropIfExists('ticket_tiers');
    }
};
