<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hospitality boxes ("Skybox 6"): sold WHOLE, at one price, per fixture.
 *
 * Separate from the tiers on purpose. A box is not seats in a block: it is
 * booked as a unit, so it has no row or seat numbers, and its seats are not
 * part of `tickets.capacity` (the bowl's sell-through is about the stands).
 *
 * `booked_at` says it is gone, however it went; `ticket_purchase_id` says it
 * went through TFE. A box booked through another channel has the first and
 * not the second.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_boxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->string('code', 8);
            $table->string('name');
            $table->unsignedSmallInteger('seats');
            // The price of the WHOLE box.
            $table->decimal('price', 10, 2);
            $table->timestamp('booked_at')->nullable();
            $table->foreignId('ticket_purchase_id')->nullable()
                ->constrained('ticket_purchases')->nullOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['ticket_id', 'code']);
        });

        Schema::table('ticket_purchases', function (Blueprint $table) {
            $table->foreignId('ticket_box_id')->nullable()->after('block_code')
                ->constrained('ticket_boxes')->nullOnDelete();
            // Receipt snapshot, like tier_name and block_code.
            $table->string('box_name')->nullable()->after('ticket_box_id');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_purchases', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ticket_box_id');
            $table->dropColumn('box_name');
        });

        Schema::dropIfExists('ticket_boxes');
    }
};
