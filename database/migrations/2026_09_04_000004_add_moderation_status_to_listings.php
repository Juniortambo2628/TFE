<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 10: partners now author their own listings, so admin needs a
 * moderation gate before a partner-authored row goes public. `moderation_status`
 * covers all listings; admin-authored rows are auto-approved on backfill.
 *
 * Values: draft (partner still editing) | pending (awaiting admin) |
 *         approved (public) | rejected (returned with feedback).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('listings')) {
            return;
        }

        Schema::table('listings', function (Blueprint $t) {
            if (! Schema::hasColumn('listings', 'moderation_status')) {
                $t->string('moderation_status', 16)->default('approved')->after('is_featured');
                $t->index('moderation_status');
            }
            if (! Schema::hasColumn('listings', 'moderation_notes')) {
                $t->text('moderation_notes')->nullable()->after('moderation_status');
            }
            if (! Schema::hasColumn('listings', 'submitted_at')) {
                $t->timestamp('submitted_at')->nullable()->after('moderation_notes');
            }
        });

        // Everything that already exists was published by an admin
        // (Sprint 3 seed + Sprint 9 demo adoption). Keep them public.
        DB::table('listings')->whereNull('moderation_status')->update(['moderation_status' => 'approved']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('listings')) {
            return;
        }

        Schema::table('listings', function (Blueprint $t) {
            if (Schema::hasColumn('listings', 'submitted_at')) {
                $t->dropColumn('submitted_at');
            }
            if (Schema::hasColumn('listings', 'moderation_notes')) {
                $t->dropColumn('moderation_notes');
            }
            if (Schema::hasColumn('listings', 'moderation_status')) {
                $t->dropIndex(['moderation_status']);
                $t->dropColumn('moderation_status');
            }
        });
    }
};
