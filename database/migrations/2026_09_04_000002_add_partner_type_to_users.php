<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Add partner_type / verification_status / services_offered to users.
 *
 * Sprint 9 pivots partners from a single flag (is_partner=true) to a
 * multi-archetype model informed by the ASE deck (Travel · Hospitality
 * · Events · Retail · Communities · Investment). Keeping is_partner
 * as the gate (so IsPartner middleware / route middleware still work),
 * partner_type just labels what KIND of partner they are.
 *
 * Existing partners are backfilled as travel_agent + verified — that's
 * what today's Partner/DashboardController assumes.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $t) {
            if (! Schema::hasColumn('users', 'partner_type')) {
                // Stored as string so we can extend without a migration —
                // callers should treat the set as an enum in app code.
                $t->string('partner_type', 32)->nullable()->after('is_partner');
                $t->index('partner_type');
            }
            if (! Schema::hasColumn('users', 'verification_status')) {
                $t->string('verification_status', 16)->default('unverified')->after('partner_type');
            }
            if (! Schema::hasColumn('users', 'services_offered')) {
                $t->json('services_offered')->nullable()->after('verification_status');
            }
        });

        // Backfill existing partners: they were all travel-agent-shaped
        // (budget reviewers) before Sprint 9. Mark them verified so their
        // existing dashboard doesn't suddenly show "pending".
        DB::table('users')
            ->where('is_partner', true)
            ->whereNull('partner_type')
            ->update([
                'partner_type' => 'travel_agent',
                'verification_status' => 'verified',
            ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $t) {
            if (Schema::hasColumn('users', 'services_offered')) {
                $t->dropColumn('services_offered');
            }
            if (Schema::hasColumn('users', 'verification_status')) {
                $t->dropColumn('verification_status');
            }
            if (Schema::hasColumn('users', 'partner_type')) {
                $t->dropIndex(['partner_type']);
                $t->dropColumn('partner_type');
            }
        });
    }
};
