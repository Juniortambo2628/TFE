<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('favorite_matches', function (Blueprint $table) {
            $table->string('external_id', 100)->nullable()->change();
            $table->string('source', 50)->nullable()->change();
            $table->string('tournament_id', 50)->nullable()->change();
            if (! Schema::hasIndex('favorite_matches', 'fav_external_unique')) {
                $table->unique(['user_id', 'external_id', 'tournament_id'], 'fav_external_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('favorite_matches', function (Blueprint $table) {
            $table->dropIndex('fav_external_unique');
            $table->string('external_id')->nullable()->change();
            $table->string('source')->nullable()->change();
            $table->string('tournament_id')->nullable()->change();
        });
    }
};
