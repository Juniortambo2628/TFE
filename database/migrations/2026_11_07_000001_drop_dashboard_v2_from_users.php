<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The per-person "Try the new dashboard" switch is gone: the new dashboard is
 * the only one since the switch to v2 (Nov 2026).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'dashboard_v2')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('dashboard_v2');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'dashboard_v2')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('dashboard_v2')->default(false);
            });
        }
    }
};
