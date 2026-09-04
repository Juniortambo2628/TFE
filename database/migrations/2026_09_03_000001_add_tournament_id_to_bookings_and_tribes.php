<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $defaultTournament = config('tournaments.default', 'afcon_2027');

        if (Schema::hasTable('bookings') && ! Schema::hasColumn('bookings', 'tournament_id')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->string('tournament_id')->nullable()->after('user_id');
                $table->index('tournament_id');
            });

            DB::table('bookings')
                ->whereNull('tournament_id')
                ->update(['tournament_id' => $defaultTournament]);
        }

        if (Schema::hasTable('tribes') && ! Schema::hasColumn('tribes', 'tournament_id')) {
            Schema::table('tribes', function (Blueprint $table) {
                $table->string('tournament_id')->nullable()->after('id');
                $table->index('tournament_id');
            });

            // Tribes stay open by default — leave nullable rows alone so an
            // existing tribe is visible across every tournament until an
            // owner explicitly pins it to one.
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'tournament_id')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropIndex(['tournament_id']);
                $table->dropColumn('tournament_id');
            });
        }

        if (Schema::hasTable('tribes') && Schema::hasColumn('tribes', 'tournament_id')) {
            Schema::table('tribes', function (Blueprint $table) {
                $table->dropIndex(['tournament_id']);
                $table->dropColumn('tournament_id');
            });
        }
    }
};
