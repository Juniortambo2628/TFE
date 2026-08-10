<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Safety net: ensure fixture_id is nullable index (not FK — fixtures is MyISAM)
        if (DB::getDriverName() === 'mysql') {
            // Drop FK if exists (stale from previous attempts)
            $hasFk = DB::select("SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'favorite_matches' AND CONSTRAINT_NAME = 'favorite_matches_fixture_id_foreign' AND CONSTRAINT_TYPE = 'FOREIGN KEY'");
            if (($hasFk[0]->cnt ?? 0) > 0) {
                DB::statement('ALTER TABLE favorite_matches DROP FOREIGN KEY favorite_matches_fixture_id_foreign');
            }

            // Drop old unique index if exists
            $hasIdx = DB::select("SHOW INDEX FROM favorite_matches WHERE Key_name = 'favorite_matches_user_id_fixture_id_unique'");
            if (! empty($hasIdx)) {
                DB::statement('ALTER TABLE favorite_matches DROP INDEX favorite_matches_user_id_fixture_id_unique');
            }

            // Check nullability
            $colInfo = DB::select("SHOW COLUMNS FROM favorite_matches WHERE Field = 'fixture_id'");
            $isNullable = ! empty($colInfo) && ($colInfo[0]->Null === 'YES');
            $colType = $colInfo[0]->Type ?? '';

            if (! $isNullable || ! str_contains($colType, 'unsigned')) {
                DB::statement('ALTER TABLE favorite_matches DROP COLUMN fixture_id');
                DB::statement('ALTER TABLE favorite_matches ADD COLUMN fixture_id BIGINT UNSIGNED NULL AFTER source');
            }

            // Add plain index (not FK — MyISAM)
            $hasFkIdx = DB::select("SHOW INDEX FROM favorite_matches WHERE Key_name = 'favorite_matches_fixture_id_foreign'");
            if (empty($hasFkIdx)) {
                DB::statement('ALTER TABLE favorite_matches ADD INDEX favorite_matches_fixture_id_foreign (fixture_id)');
            }
        }

        if (! Schema::hasIndex('favorite_matches', 'fav_external_unique')) {
            Schema::table('favorite_matches', function ($table) {
                $table->unique(['user_id', 'external_id', 'tournament_id'], 'fav_external_unique');
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE favorite_matches DROP INDEX favorite_matches_fixture_id_foreign');
        }

        Schema::table('favorite_matches', function ($table) {
            $table->dropIndex('fav_external_unique');
        });
    }
};
