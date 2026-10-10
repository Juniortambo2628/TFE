<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 66 — M-Pesa. A USD booking paid by M-Pesa is charged in KES, so the
 * payment row's amount/currency (what the gateway took) can differ from what
 * it settles on the booking. `settles_amount` is the latter, in the BOOKING's
 * currency; null means "same as amount".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('settles_amount', 10, 2)->nullable()->after('currency');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('settles_amount');
        });
    }
};
