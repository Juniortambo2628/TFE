<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * WorldCupSeeder created its welcome message with a bare create(), and the
 * deploy seeds on every release (Sprint 63) — so each deploy added another
 * identical "Welcome to TFE!" to the same inbox. Keep the oldest per user,
 * delete the rest. The seeder is idempotent from Sprint 70 on.
 *
 * Scoped to the exact system message (no sender, that subject) so nothing a
 * person wrote can match.
 */
return new class extends Migration
{
    public function up(): void
    {
        $keep = DB::table('messages')
            ->whereNull('sender_id')
            ->where('subject', 'Welcome to TFE!')
            ->groupBy('user_id')
            ->selectRaw('MIN(id) as id')
            ->pluck('id');

        DB::table('messages')
            ->whereNull('sender_id')
            ->where('subject', 'Welcome to TFE!')
            ->whereNotIn('id', $keep)
            ->delete();
    }

    public function down(): void
    {
        // Deleted duplicates are not restored.
    }
};
