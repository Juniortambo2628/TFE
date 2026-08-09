<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('favorite_matches', function (Blueprint $table) {
            if (! Schema::hasColumn('favorite_matches', 'external_id')) {
                $table->string('external_id', 100)->nullable()->after('user_id');
            }
            if (! Schema::hasColumn('favorite_matches', 'source')) {
                $table->string('source', 50)->nullable()->after('external_id');
            }
            // Drop FK only if fixture_id is still non-nullable
            $columns = Schema::getColumns('favorite_matches');
            $fixtureCol = collect($columns)->firstWhere('name', 'fixture_id');
            if ($fixtureCol && $fixtureCol['nullable'] === false) {
                $table->dropForeign(['fixture_id']);
                $table->bigInteger('fixture_id')->nullable()->change();
                $table->foreign('fixture_id')->references('id')->on('fixtures')->nullOnDelete();
            }
            if (! Schema::hasIndex('favorite_matches', 'fav_external_unique')) {
                $table->unique(['user_id', 'external_id', 'tournament_id'], 'fav_external_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('favorite_matches', function (Blueprint $table) {
            $table->dropForeign(['fixture_id']);
            $table->dropIndex('fav_external_unique');
            $table->dropColumn(['external_id', 'source']);
            $table->bigInteger('fixture_id')->nullable(false)->change();
            $table->foreign('fixture_id')->references('id')->on('fixtures')->cascadeOnDelete();
        });
    }
};
