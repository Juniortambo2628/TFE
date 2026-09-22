<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Purge orphan site_settings rows for editors removed in the same PR:
 * the landing_* sub-tabs (About/Features/Services/Contact/Footer), the
 * bg_card_* Visual Cards tab, and the fan_*_title/subtitle Fan Dashboard
 * tab (which never had a live writer or reader). Idempotent — reruns
 * on a clean table are a no-op.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('site_settings')) {
            return;
        }

        DB::table('site_settings')
            ->where('key', 'like', 'landing_%')
            ->orWhere('key', 'like', 'bg_card_%')
            ->orWhere('key', 'like', 'fan_%_title')
            ->orWhere('key', 'like', 'fan_%_subtitle')
            ->delete();
    }

    public function down(): void
    {
        // Removed editors, so nothing to restore. Rows can be re-added by
        // hand if these editors ever come back.
    }
};
