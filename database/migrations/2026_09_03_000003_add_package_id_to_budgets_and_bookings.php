<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('budgets') && ! Schema::hasColumn('budgets', 'package_id')) {
            Schema::table('budgets', function (Blueprint $table) {
                // Nullable FK — a budget started from scratch has no package.
                $table->foreignId('package_id')->nullable()->after('tournament_id')
                    ->constrained('packages')->nullOnDelete();
            });
        }

        if (Schema::hasTable('bookings') && ! Schema::hasColumn('bookings', 'package_id')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->foreignId('package_id')->nullable()->after('tournament_id')
                    ->constrained('packages')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'package_id')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropConstrainedForeignId('package_id');
            });
        }
        if (Schema::hasTable('budgets') && Schema::hasColumn('budgets', 'package_id')) {
            Schema::table('budgets', function (Blueprint $table) {
                $table->dropConstrainedForeignId('package_id');
            });
        }
    }
};
