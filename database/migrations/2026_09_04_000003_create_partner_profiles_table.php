<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * partner_profiles — the branded content behind a Partner Hub.
 *
 * 1:1 with users (the partner). Split into its own table because most
 * users never have one (only partners do) and its columns are all
 * publishing metadata that would bloat the users row.
 *
 * MVP shape per the Ecobank Finance Hub deck slide: slug, hero image,
 * tagline, about copy, an accent colour that themes the public hub,
 * and a JSON stats bag for the badge strip. is_public gates visibility
 * — admin can flip it while a partner is drafting.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('partner_profiles')) {
            return;
        }

        Schema::create('partner_profiles', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('slug')->unique();
            $t->string('display_name');
            $t->string('tagline')->nullable();
            $t->text('about')->nullable();
            $t->string('hero_image')->nullable();
            $t->string('logo_url')->nullable();
            // Hex accent (e.g. #0072CE for Ecobank) — themes CTAs and
            // headings on the public hub. Falls back to platform default.
            $t->string('theme_accent', 12)->nullable();
            // Stats band: [{label, value, icon?}, ...] for the "15+ countries"
            // strip on the hub. JSON so partners can add/remove rows.
            $t->json('stats')->nullable();
            // Partner-declared service tags (extra granularity beyond
            // users.services_offered). Free-form strings.
            $t->json('service_tags')->nullable();
            // Contact + external links exposed on the hub.
            $t->string('contact_email')->nullable();
            $t->string('contact_phone')->nullable();
            $t->string('website_url')->nullable();

            $t->boolean('is_public')->default(false);
            $t->timestamp('published_at')->nullable();
            $t->timestamps();

            $t->index(['is_public']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_profiles');
    }
};
