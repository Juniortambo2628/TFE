<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'package_name')) {
                $table->string('package_name')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('bookings', 'package_type')) {
                $table->string('package_type')->nullable()->after('package_name');
            }
            if (!Schema::hasColumn('bookings', 'total_amount')) {
                $table->decimal('total_amount', 12, 2)->default(0)->after('package_type');
            }
            if (!Schema::hasColumn('bookings', 'amount_paid')) {
                $table->decimal('amount_paid', 12, 2)->default(0)->after('total_amount');
            }
            if (!Schema::hasColumn('bookings', 'flight_info')) {
                $table->string('flight_info')->nullable()->after('booking_date');
            }
            if (!Schema::hasColumn('bookings', 'accommodation')) {
                $table->string('accommodation')->nullable()->after('flight_info');
            }
            if (!Schema::hasColumn('bookings', 'matches')) {
                $table->json('matches')->nullable()->after('accommodation');
            }
            
            // Allow some legacy columns to be nullable if they aren't already
            if (Schema::hasColumn('bookings', 'service_type')) {
                $table->string('service_type')->nullable()->change();
            }
            if (Schema::hasColumn('bookings', 'cost')) {
                $table->decimal('cost', 10, 2)->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'package_name',
                'package_type',
                'total_amount',
                'amount_paid',
                'flight_info',
                'accommodation',
                'matches'
            ]);
        });
    }
};
