<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->index(['visibility', 'created_at']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->index(['date', 'is_featured']);
        });

        Schema::table('savings_goals', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['visibility', 'created_at']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['date', 'is_featured']);
        });

        Schema::table('savings_goals', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
        });
    }
};
