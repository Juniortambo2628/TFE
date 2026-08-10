<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Safety net: ensure FK and nullable are correct even if 070002 partially failed
        $hasFk = false;
        try {
            if (DB::getDriverName() === 'mysql') {
                $result = DB::select("SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'favorite_matches' AND CONSTRAINT_NAME = 'favorite_matches_fixture_id_foreign' AND CONSTRAINT_TYPE = 'FOREIGN KEY'");
                $hasFk = ($result[0]->cnt ?? 0) > 0;
            } else {
                $result = DB::select("PRAGMA foreign_key_list('favorite_matches')");
                $hasFk = collect($result)->contains('from', 'fixture_id');
            }
        } catch (Exception $e) {
        }

        Schema::table('favorite_matches', function (Blueprint $table) use ($hasFk) {
            if ($hasFk) {
                $table->dropForeign(['fixture_id']);
            }

            // Drop and re-create fixture_id as nullable
            $table->dropColumn('fixture_id');
        });

        Schema::table('favorite_matches', function (Blueprint $table) {
            $table->bigInteger('fixture_id')->nullable()->after('source');
            $table->foreign('fixture_id')->references('id')->on('fixtures')->nullOnDelete();

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
            $table->bigInteger('fixture_id')->nullable(false)->change();
            $table->foreign('fixture_id')->references('id')->on('fixtures')->cascadeOnDelete();
        });
    }
};
