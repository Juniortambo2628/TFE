<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('favorite_matches', function (Blueprint $table) {
            $table->string('external_id', 100)->nullable()->after('user_id');
            $table->string('source', 50)->nullable()->after('external_id');
            $table->bigInteger('fixture_id')->nullable()->change();
            $table->unique(['user_id', 'external_id', 'tournament_id'], 'fav_external_unique');
        });
    }

    public function down(): void
    {
        Schema::table('favorite_matches', function (Blueprint $table) {
            $table->dropIndex('fav_external_unique');
            $table->dropColumn(['external_id', 'source']);
            $table->bigInteger('fixture_id')->nullable(false)->change();
        });
    }
};
