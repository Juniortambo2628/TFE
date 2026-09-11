<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Sprint 29 — when a fan confirms an itinerary, the booking should
// carry the same currency the budget was built in so the Journey
// and wallet surfaces render the amount the fan agreed to instead
// of the platform default. Defaults to USD to match the pre-Sprint
// 28 default for every existing row.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('currency', 3)->default('USD')->after('total_amount');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('currency');
        });
    }
};
