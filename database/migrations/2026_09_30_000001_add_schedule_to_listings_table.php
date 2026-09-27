<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When and where a listing actually runs.
 *
 * `listings` could say what something costs and how many places it has, but
 * never when it happens. A trip package got away with it — its dates come
 * from the matches it includes — but a schools programme cannot: "AFCON
 * Schools Cup, Nairobi, 12-15 Jun 2026" had nowhere to live, so the hub
 * could list a programme and not say when to turn up.
 *
 * Deliberately three plain columns rather than a sessions table. A single
 * run with a start, an end and a place is what every current listing type
 * needs; a programme with many separate sessions is a real modelling
 * question and should get its own table when something actually asks for
 * one, not a speculative join now.
 *
 * All nullable: most existing rows have no schedule and that is correct for
 * them, so nothing is backfilled and nothing is invented.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->timestamp('starts_at')->nullable()->after('accommodation_level');
            $table->timestamp('ends_at')->nullable()->after('starts_at');
            $table->string('location')->nullable()->after('ends_at');

            // The hub and the Learning Hub both list "what is coming up",
            // which is an ordered scan over this column.
            $table->index('starts_at');
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropIndex(['starts_at']);
            $table->dropColumn(['starts_at', 'ends_at', 'location']);
        });
    }
};
