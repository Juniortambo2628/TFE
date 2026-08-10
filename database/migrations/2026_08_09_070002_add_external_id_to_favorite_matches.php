<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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
        });

        // Check if FK exists (works on MySQL and SQLite)
        $hasFk = false;
        try {
            if (DB::getDriverName() === 'mysql') {
                $result = DB::select("SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'favorite_matches' AND CONSTRAINT_NAME = 'favorite_matches_fixture_id_foreign' AND CONSTRAINT_TYPE = 'FOREIGN KEY'");
                $hasFk = ($result[0]->cnt ?? 0) > 0;
            } else {
                // SQLite: check via pragma
                $result = DB::select("PRAGMA foreign_key_list('favorite_matches')");
                $hasFk = collect($result)->contains('from', 'fixture_id');
            }
        } catch (\Exception $e) {}

        Schema::table('favorite_matches', function (Blueprint $table) use ($hasFk) {
            if ($hasFk) {
                $table->dropForeign(['fixture_id']);
            }

            $columns = Schema::getColumns('favorite_matches');
            $fixtureCol = collect($columns)->firstWhere('name', 'fixture_id');
            if ($fixtureCol && $fixtureCol['nullable'] === false) {
                $table->bigInteger('fixture_id')->nullable()->change();
            }

            $table->foreign('fixture_id')->references('id')->on('fixtures')->nullOnDelete();
        });

        Schema::table('favorite_matches', function (Blueprint $table) {
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
