<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 47 Phase A — drop the payment_transactions table.
 *
 * TFE no longer processes payments. Every transaction happens on the
 * partner's rails (Ecobank, MatchDay, GoalBet, Simba Air, …), who hold the
 * license, the KYC, and the settlement stack. We keep zero money history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('payment_transactions');
    }

    public function down(): void
    {
        // Intentionally not recreated. If revenue-tracking ever comes back on
        // TFE it will be a fresh design, not a resurrected schema.
    }
};
