<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 56 — give the fan profile's "Bio / about you" field somewhere to land.
 *
 * The field has been on the page, and `Fan\ProfileController::update()` has
 * validated `bio` and passed it to `$user->update()`, since the profile was
 * rebuilt — but `users` has no such column and `User::$fillable` has no such
 * key, so every bio a fan wrote was silently discarded. The read side already
 * expects it (`$viewingUser->bio` feeds the profile payload and the "About"
 * card on another fan's profile).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('bio')->nullable()->after('team_support');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('bio');
        });
    }
};
