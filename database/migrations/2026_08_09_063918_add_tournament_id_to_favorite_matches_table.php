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
        Schema::table('favorite_matches', function (Blueprint $table) {
            $table->string('tournament_id')->nullable()->after('user_id');
            $table->index(['user_id', 'tournament_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('favorite_matches', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'tournament_id']);
            $table->dropColumn('tournament_id');
        });
    }
};
