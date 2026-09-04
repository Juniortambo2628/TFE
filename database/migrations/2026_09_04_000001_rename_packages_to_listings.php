<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rename `packages` → `listings` and turn it polymorphic.
 *
 * Sprint 9 pivots on the ASE deck's realisation: what we call a Package
 * today is one shape of a broader "Listing" concept that covers
 * packages, offers, events, camps — anything a partner or admin
 * publishes to fans. Same table, one new `type` column, plus a
 * polymorphic `publisher_type / publisher_id` so we can attribute a
 * listing to an admin or a partner user.
 *
 * budgets.package_id and bookings.package_id are renamed to
 * listing_id in the same migration so the whole flow speaks one word.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('packages')) {
            return;
        }

        // 1) Drop the FKs pointing at packages so the rename doesn't
        //    fail on drivers that check constraints eagerly.
        if (Schema::hasColumn('budgets', 'package_id')) {
            Schema::table('budgets', function (Blueprint $t) {
                try {
                    $t->dropForeign(['package_id']);
                } catch (Throwable $e) {
                    // best-effort — SQLite may not have named the FK.
                }
            });
        }
        if (Schema::hasColumn('bookings', 'package_id')) {
            Schema::table('bookings', function (Blueprint $t) {
                try {
                    $t->dropForeign(['package_id']);
                } catch (Throwable $e) {
                    // best-effort
                }
            });
        }

        // 2) Rename the table.
        Schema::rename('packages', 'listings');

        // 3) Add the two new dimensions: type + polymorphic publisher.
        Schema::table('listings', function (Blueprint $t) {
            if (! Schema::hasColumn('listings', 'type')) {
                $t->string('type', 32)->default('package')->after('tournament_id');
                $t->index('type');
            }
            if (! Schema::hasColumn('listings', 'publisher_type')) {
                $t->string('publisher_type')->nullable()->after('type');
                $t->unsignedBigInteger('publisher_id')->nullable()->after('publisher_type');
                $t->index(['publisher_type', 'publisher_id']);
            }
        });

        // 4) Backfill existing rows — a package with a created_by is
        //    owned by that user; everything else defaults to a "system"
        //    publisher (still nullable so admin-orphan rows survive).
        DB::table('listings')->whereNull('type')->update(['type' => 'package']);
        DB::table('listings')
            ->whereNotNull('created_by')
            ->whereNull('publisher_type')
            ->update(['publisher_type' => 'App\\Models\\User']);
        DB::statement('UPDATE listings SET publisher_id = created_by WHERE publisher_id IS NULL AND created_by IS NOT NULL');

        // 5) Rename FK columns on budgets + bookings.
        foreach (['budgets', 'bookings'] as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'package_id')) {
                continue;
            }
            // Add listing_id, copy data, drop package_id. This works
            // across every driver without needing renameColumn's
            // doctrine dance and keeps rollback trivial.
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('listing_id')->nullable()->after('tournament_id')
                    ->constrained('listings')->nullOnDelete();
            });
            DB::statement("UPDATE {$table} SET listing_id = package_id WHERE package_id IS NOT NULL");
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('package_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('listings')) {
            return;
        }

        // Reverse FK column rename on budgets + bookings.
        foreach (['budgets', 'bookings'] as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'listing_id')) {
                continue;
            }
            Schema::table($table, function (Blueprint $t) {
                try {
                    $t->dropForeign(['listing_id']);
                } catch (Throwable $e) {
                }
            });
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('package_id')->nullable()->after('tournament_id')
                    ->constrained('packages')->nullOnDelete();
            });
            DB::statement("UPDATE {$table} SET package_id = listing_id WHERE listing_id IS NOT NULL");
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('listing_id');
            });
        }

        Schema::table('listings', function (Blueprint $t) {
            if (Schema::hasColumn('listings', 'publisher_type')) {
                $t->dropIndex(['publisher_type', 'publisher_id']);
                $t->dropColumn(['publisher_type', 'publisher_id']);
            }
            if (Schema::hasColumn('listings', 'type')) {
                $t->dropIndex(['type']);
                $t->dropColumn('type');
            }
        });

        Schema::rename('listings', 'packages');
    }
};
