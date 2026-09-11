<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Sprint 28 — the calculator now supports multiple currencies (USD is
// the platform baseline; EUR/GBP/KES/ZAR/NGN/XOF are display-only
// conversions). Each budget records the currency the fan built it in
// so the saved-plans list and the LoanApplications surface show the
// same amount the fan saw when they hit Save.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('budgets', function (Blueprint $table) {
            $table->string('currency', 3)->default('USD')->after('total_cost');
        });
    }

    public function down(): void
    {
        Schema::table('budgets', function (Blueprint $table) {
            $table->dropColumn('currency');
        });
    }
};
