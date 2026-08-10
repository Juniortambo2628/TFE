<?php

use Illuminate\Database\Migrations\Migration;
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

        // Handle fixture_id nullable + FK — driver-specific to avoid MySQL/SQLite incompatibilities
        if (DB::getDriverName() === 'mysql') {
            // MySQL: use raw SQL to drop FK, alter column, re-add FK
            $hasFk = DB::select("SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'favorite_matches' AND CONSTRAINT_NAME = 'favorite_matches_fixture_id_foreign' AND CONSTRAINT_TYPE = 'FOREIGN KEY'");
            $fkExists = ($hasFk[0]->cnt ?? 0) > 0;

            if ($fkExists) {
                DB::statement('ALTER TABLE favorite_matches DROP FOREIGN KEY favorite_matches_fixture_id_foreign');
            }
            DB::statement('ALTER TABLE favorite_matches MODIFY COLUMN fixture_id BIGINT NULL');
            DB::statement('ALTER TABLE favorite_matches ADD CONSTRAINT favorite_matches_fixture_id_foreign FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE SET NULL');
        }
        // SQLite: skip — FKs not enforced, column types are dynamic

        Schema::table('favorite_matches', function (Blueprint $table) {
            if (! Schema::hasIndex('favorite_matches', 'fav_external_unique')) {
                $table->unique(['user_id', 'external_id', 'tournament_id'], 'fav_external_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('favorite_matches', function (Blueprint $table) {
            $table->dropIndex('fav_external_unique');
            $table->dropColumn(['external_id', 'source']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE favorite_matches DROP FOREIGN KEY favorite_matches_fixture_id_foreign');
            DB::statement('ALTER TABLE favorite_matches MODIFY COLUMN fixture_id BIGINT NOT NULL');
            DB::statement('ALTER TABLE favorite_matches ADD CONSTRAINT favorite_matches_fixture_id_foreign FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE CASCADE');
        }
    }
};
