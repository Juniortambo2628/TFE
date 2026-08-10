<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Safety net: ensure FK and nullable are correct even if 070002 partially failed
        if (DB::getDriverName() === 'mysql') {
            // Drop old unique index on (user_id, fixture_id)
            $hasOldUnique = DB::select("SHOW INDEX FROM favorite_matches WHERE Key_name = 'favorite_matches_user_id_fixture_id_unique'");
            if (! empty($hasOldUnique)) {
                DB::statement('ALTER TABLE favorite_matches DROP INDEX favorite_matches_user_id_fixture_id_unique');
            }

            $hasFk = DB::select("SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'favorite_matches' AND CONSTRAINT_NAME = 'favorite_matches_fixture_id_foreign' AND CONSTRAINT_TYPE = 'FOREIGN KEY'");
            $fkExists = ($hasFk[0]->cnt ?? 0) > 0;

            if ($fkExists) {
                DB::statement('ALTER TABLE favorite_matches DROP FOREIGN KEY favorite_matches_fixture_id_foreign');
            }
            DB::statement('ALTER TABLE favorite_matches MODIFY COLUMN fixture_id BIGINT NULL');
            DB::statement('ALTER TABLE favorite_matches ADD CONSTRAINT favorite_matches_fixture_id_foreign FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE SET NULL');
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
            DB::statement('ALTER TABLE favorite_matches MODIFY COLUMN fixture_id BIGINT NOT NULL');
            DB::statement('ALTER TABLE favorite_matches ADD CONSTRAINT favorite_matches_fixture_id_foreign FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE CASCADE');
        }

        Schema::table('favorite_matches', function ($table) {
            $table->dropIndex('fav_external_unique');
        });
    }
};
