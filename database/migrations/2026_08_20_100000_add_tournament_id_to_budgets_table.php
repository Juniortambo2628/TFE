<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('budgets', function (Blueprint $table) {
            $table->string('tournament_id')->nullable()->after('user_id');
            $table->index('tournament_id');
        });

        // Backfill existing budgets with the current default tournament
        DB::table('budgets')
            ->whereNull('tournament_id')
            ->update(['tournament_id' => config('tournaments.default', 'afcon_2027')]);
    }

    public function down(): void
    {
        Schema::table('budgets', function (Blueprint $table) {
            $table->dropIndex(['tournament_id']);
            $table->dropColumn('tournament_id');
        });
    }
};
