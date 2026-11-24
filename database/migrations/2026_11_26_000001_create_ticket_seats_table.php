<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Taken seats, one row each ("Block 207, Row 4, Seat 8").
 *
 * Only TAKEN seats are stored: a block's grid is derived from its capacity
 * (App\Support\StadiumLayout::seatGrid), so 40,000 empty seats cost nothing.
 * `ticket_blocks.sold` becomes the count of these rows
 * (`TicketBlock::syncSeatTotals()`).
 *
 * The unique index is the double-sale guard: two fans racing for one seat
 * both pass the "is it free?" read, and the second INSERT fails. Checkout
 * confirms in the same request, so no timed hold is needed; one will be
 * once payment leaves the site.
 *
 * `ticket_purchase_id` is null for a seat sold through another channel
 * (simulated demand, or sales a partner reports), whose buyer TFE never knew.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_block_id')->constrained('ticket_blocks')->cascadeOnDelete();
            $table->unsignedSmallInteger('row');
            $table->unsignedSmallInteger('number');
            $table->foreignId('ticket_purchase_id')->nullable()
                ->constrained('ticket_purchases')->nullOnDelete();
            $table->timestamps();

            $table->unique(['ticket_block_id', 'row', 'number']);
            $table->index('ticket_purchase_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_seats');
    }
};
