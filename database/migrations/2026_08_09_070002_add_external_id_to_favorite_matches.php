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
            // 1. Drop FK if exists
            $hasFk = DB::select("SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'favorite_matches' AND CONSTRAINT_NAME = 'favorite_matches_fixture_id_foreign' AND CONSTRAINT_TYPE = 'FOREIGN KEY'");
            if (($hasFk[0]->cnt ?? 0) > 0) {
                DB::statement('ALTER TABLE favorite_matches DROP FOREIGN KEY favorite_matches_fixture_id_foreign');
            }

            // 2. Drop old unique index if exists
            $hasIdx = DB::select("SHOW INDEX FROM favorite_matches WHERE Key_name = 'favorite_matches_user_id_fixture_id_unique'");
            if (! empty($hasIdx)) {
                DB::statement('ALTER TABLE favorite_matches DROP INDEX favorite_matches_user_id_fixture_id_unique');
            }

            // 3. Check current nullability
            $colInfo = DB::select("SHOW COLUMNS FROM favorite_matches WHERE Field = 'fixture_id'");
            $isNullable = ! empty($colInfo) && ($colInfo[0]->Null === 'YES');

            if (! $isNullable) {
                // 4. Drop and re-create fixture_id as nullable
                DB::statement('ALTER TABLE favorite_matches DROP COLUMN fixture_id');
                DB::statement('ALTER TABLE favorite_matches ADD COLUMN fixture_id BIGINT NULL AFTER source');
            }

            // 5. Re-add FK (now safe since fixture_id is nullable)
            $hasFkAfter = DB::select("SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'favorite_matches' AND CONSTRAINT_NAME = 'favorite_matches_fixture_id_foreign' AND CONSTRAINT_TYPE = 'FOREIGN KEY'");
            if (($hasFkAfter[0]->cnt ?? 0) === 0) {
                DB::statement('ALTER TABLE favorite_matches ADD CONSTRAINT favorite_matches_fixture_id_foreign FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE SET NULL');
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
            DB::statement('ALTER TABLE favorite_matches DROP FOREIGN KEY favorite_matches_fixture_id_foreign');
            DB::statement('ALTER TABLE favorite_matches MODIFY COLUMN fixture_id BIGINT NOT NULL');
            DB::statement('ALTER TABLE favorite_matches ADD CONSTRAINT favorite_matches_fixture_id_foreign FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE CASCADE');
            DB::statement('ALTER TABLE favorite_matches ADD UNIQUE INDEX favorite_matches_user_id_fixture_id_unique (user_id, fixture_id)');
        }
    }
};
