<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add columns if missing
        if (! Schema::hasColumn('favorite_matches', 'external_id')) {
            Schema::table('favorite_matches', function ($table) {
                $table->string('external_id', 100)->nullable();
            });
        }
        if (! Schema::hasColumn('favorite_matches', 'source')) {
            Schema::table('favorite_matches', function ($table) {
                $table->string('source', 50)->nullable();
            });
        }

        // Handle fixture_id nullable + FK on MySQL only
        // Must drop everything, recreate column as nullable, then re-add constraints
        if (DB::getDriverName() === 'mysql') {
            // Drop FK if exists (MyISAM doesn't support FKs, but clean up any stale InnoDB FK)
            $hasFk = DB::select("SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'favorite_matches' AND CONSTRAINT_NAME = 'favorite_matches_fixture_id_foreign' AND CONSTRAINT_TYPE = 'FOREIGN KEY'");
            if (($hasFk[0]->cnt ?? 0) > 0) {
                DB::statement('ALTER TABLE favorite_matches DROP FOREIGN KEY favorite_matches_fixture_id_foreign');
            }

            // Drop old unique index if exists
            $hasIdx = DB::select("SHOW INDEX FROM favorite_matches WHERE Key_name = 'favorite_matches_user_id_fixture_id_unique'");
            if (! empty($hasIdx)) {
                DB::statement('ALTER TABLE favorite_matches DROP INDEX favorite_matches_user_id_fixture_id_unique');
            }

            // Check current nullability
            $colInfo = DB::select("SHOW COLUMNS FROM favorite_matches WHERE Field = 'fixture_id'");
            $isNullable = ! empty($colInfo) && ($colInfo[0]->Null === 'YES');
            $colType = $colInfo[0]->Type ?? '';

            // Drop and re-create fixture_id as BIGINT UNSIGNED NULL if needed
            if (! $isNullable || ! str_contains($colType, 'unsigned')) {
                DB::statement('ALTER TABLE favorite_matches DROP COLUMN fixture_id');
                DB::statement('ALTER TABLE favorite_matches ADD COLUMN fixture_id BIGINT UNSIGNED NULL AFTER source');
            }

            // Add plain index (NOT FK — fixtures table is MyISAM which doesn't support FKs)
            $hasFkIdx = DB::select("SHOW INDEX FROM favorite_matches WHERE Key_name = 'favorite_matches_fixture_id_foreign'");
            if (empty($hasFkIdx)) {
                DB::statement('ALTER TABLE favorite_matches ADD INDEX favorite_matches_fixture_id_foreign (fixture_id)');
            }
        }

        // Add unique index if missing
        if (! Schema::hasIndex('favorite_matches', 'fav_external_unique')) {
            Schema::table('favorite_matches', function ($table) {
                $table->unique(['user_id', 'external_id', 'tournament_id'], 'fav_external_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::table('favorite_matches', function ($table) {
            $table->dropIndex('fav_external_unique');
            $table->dropColumn(['external_id', 'source']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE favorite_matches DROP INDEX favorite_matches_fixture_id_foreign');
            DB::statement('ALTER TABLE favorite_matches DROP COLUMN fixture_id');
            DB::statement('ALTER TABLE favorite_matches ADD COLUMN fixture_id BIGINT UNSIGNED NOT NULL AFTER tournament_id');
            DB::statement('ALTER TABLE favorite_matches ADD UNIQUE INDEX favorite_matches_user_id_fixture_id_unique (user_id, fixture_id)');
        }
    }
};
