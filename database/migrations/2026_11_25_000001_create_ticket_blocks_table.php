<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Seat blocks: each tier split into the numbered blocks a ticket names
 * ("West Stand · Block 207"), laid out by App\Support\StadiumLayout.
 *
 * Blocks own the counts now. `ticket_tiers.capacity` / `.sold` become
 * totals derived by `TicketTier::syncBlockTotals()`, exactly as the tiers
 * already feed `Ticket::syncTierTotals()`. Never increment a tier's `sold`
 * by hand once it has blocks.
 *
 * No backfill here: existing tiers get their blocks from
 * `TicketBlockSeeder` (it runs on every deploy and is idempotent), which
 * reads the live layout. A migration that froze a copy of the layout would
 * be correct only until the layout next moved.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_tier_id')->constrained('ticket_tiers')->cascadeOnDelete();
            // "207": tier number then position round the ground.
            $table->string('code', 8);
            // north | north_west | west | … (StadiumLayout::stands()).
            $table->string('stand', 24);
            $table->unsignedInteger('capacity');
            $table->unsignedInteger('sold')->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['ticket_tier_id', 'code']);
            $table->index(['ticket_tier_id', 'sort_order']);
        });

        Schema::table('ticket_purchases', function (Blueprint $table) {
            // Nullable for the same reasons as ticket_tier_id: older
            // purchases have none, and a receipt must survive the block.
            $table->foreignId('ticket_block_id')->nullable()->after('tier_name')
                ->constrained('ticket_blocks')->nullOnDelete();
            $table->string('block_code', 8)->nullable()->after('ticket_block_id');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_purchases', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ticket_block_id');
            $table->dropColumn('block_code');
        });

        Schema::dropIfExists('ticket_blocks');
    }
};
