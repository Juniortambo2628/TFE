<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Sprint 30 — a fan saving for a trip they'll buy in euros wants to
// see their target and progress in euros. Same shape as budgets and
// bookings (Sprints 28 + 29): a 3-letter ISO code, defaults USD.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('savings_goals', function (Blueprint $table) {
            $table->string('currency', 3)->default('USD')->after('current_amount');
        });
    }

    public function down(): void
    {
        Schema::table('savings_goals', function (Blueprint $table) {
            $table->dropColumn('currency');
        });
    }
};
