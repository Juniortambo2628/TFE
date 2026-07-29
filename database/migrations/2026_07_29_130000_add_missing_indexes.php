<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('status');
            $table->index('google_id');
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->index('partner_status');
            $table->index('is_active');
        });

        Schema::table('fixtures', function (Blueprint $table) {
            $table->index('status');
            $table->index(['date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['google_id']);
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->dropIndex(['partner_status']);
            $table->dropIndex(['is_active']);
        });

        Schema::table('fixtures', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['date', 'status']);
        });
    }
};
