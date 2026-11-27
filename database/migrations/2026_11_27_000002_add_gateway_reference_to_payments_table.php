<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Direct M-Pesa (Daraja, Nov 2026). `gateway_reference` is Safaricom's
 * CheckoutRequestID — how the server-to-server callback finds the payment it
 * settles. `gateway_receipt` is the M-Pesa receipt number (SGH789345…), kept
 * as the fan's proof of payment and for reconciliation.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('gateway_reference')->nullable()->after('transaction_id');
            $table->string('gateway_receipt')->nullable()->after('gateway_reference');
            $table->index('gateway_reference');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['gateway_reference']);
            $table->dropColumn(['gateway_reference', 'gateway_receipt']);
        });
    }
};
