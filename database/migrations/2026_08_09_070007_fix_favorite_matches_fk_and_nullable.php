<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Safety net: ensure fixture_id is nullable and FK exists
        if (DB::getDriverName() === 'mysql') {
            // Drop FK if exists
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

            if (! $isNullable) {
                DB::statement('ALTER TABLE favorite_matches DROP COLUMN fixture_id');
                DB::statement('ALTER TABLE favorite_matches ADD COLUMN fixture_id BIGINT NULL AFTER source');
            }

            // Re-add FK if missing
            $hasFkAfter = DB::select("SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'favorite_matches' AND CONSTRAINT_NAME = 'favorite_matches_fixture_id_foreign' AND CONSTRAINT_TYPE = 'FOREIGN KEY'");
            if (($hasFkAfter[0]->cnt ?? 0) === 0) {
                DB::statement('ALTER TABLE favorite_matches ADD CONSTRAINT favorite_matches_fixture_id_foreign FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE SET NULL');
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
            DB::statement('ALTER TABLE favorite_matches DROP FOREIGN KEY favorite_matches_fixture_id_foreign');
            DB::statement('ALTER TABLE favorite_matches DROP COLUMN fixture_id');
            DB::statement('ALTER TABLE favorite_matches ADD COLUMN fixture_id BIGINT NOT NULL AFTER tournament_id');
            DB::statement('ALTER TABLE favorite_matches ADD CONSTRAINT favorite_matches_fixture_id_foreign FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE CASCADE');
        }

        Schema::table('favorite_matches', function ($table) {
            $table->dropIndex('fav_external_unique');
        });
    }
};
