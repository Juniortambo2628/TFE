<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Packages — admin-managed prepacked itineraries at fixed prices.
 *
 * A package is a template a fan can pick as the starting point of a
 * budget instead of building custom from scratch. When picked, its
 * matches/nights/flight class/accommodation pre-fill the wizard; the
 * fan can still tweak. On booking, the resulting Booking records
 * package_id so sold_count can be tracked and capacity enforced.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('packages')) {
            return;
        }

        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            // Which tournament this package belongs to — string ID, matches
            // config/tournaments.php (there is no Tournament DB table).
            $table->string('tournament_id')->index();
            $table->string('name');
            $table->string('slug')->nullable();
            $table->text('description')->nullable();
            $table->string('hero_image')->nullable();

            // Fixed-price data — currency stored alongside so tournaments in
            // different currencies can be represented without conversion.
            $table->decimal('base_price', 12, 2)->default(0);
            $table->string('currency', 8)->default('USD');

            // What's included — mirrors the shape a custom Budget carries.
            $table->json('included_match_ids')->nullable();
            $table->json('included_venues')->nullable();
            $table->unsignedSmallInteger('nights')->default(7);
            $table->string('flight_class')->default('economy');
            $table->string('accommodation_level')->default('3_star');

            // Supply / urgency signals.
            $table->unsignedInteger('capacity')->nullable();
            $table->unsignedInteger('sold_count')->default(0);

            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('display_order')->default(0);

            // Admin metadata for auditing.
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tournament_id', 'is_active']);
            $table->index(['tournament_id', 'is_featured']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
