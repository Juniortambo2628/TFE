<?php

namespace Database\Seeders;

use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * DemoPartnerSeeder — creates a verified travel-agent partner with a
 * published /partners/{slug} hub and adopts some existing package
 * listings so the admin directory, hub grid, and partner dashboard
 * all have real state to render against.
 *
 * Idempotent — a subsequent run only fills gaps, never duplicates.
 *
 * Credentials (dev only):
 *   Admin   : admin@tfe.com   / password
 *   Partner : partner@tfe.com / password
 */
class DemoPartnerSeeder extends Seeder
{
    public function run(): void
    {
        $partner = User::firstOrCreate(
            ['email' => 'partner@tfe.com'],
            [
                'name' => 'Serengeti Sports Travel',
                'first_name' => 'Serengeti',
                'last_name' => 'Sports Travel',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_admin' => false,
                'is_partner' => true,
                'partner_type' => 'travel_agent',
                'verification_status' => 'verified',
                'services_offered' => ['Package curation', 'Ticket bundling', 'Hotel + flight booking', '24/7 on-the-ground support'],
                'phone' => '+254700000000',
                'country' => 'Kenya',
                'company_name' => 'Serengeti Sports Travel Ltd.',
            ],
        );

        // Backfill flags if the row already existed pre-Sprint-9.
        $partner->fill([
            'is_partner' => true,
            'partner_type' => $partner->partner_type ?: 'travel_agent',
            'verification_status' => $partner->verification_status ?: 'verified',
            'services_offered' => $partner->services_offered ?: ['Package curation', 'Ticket bundling'],
        ])->save();

        // Branded hub — /partners/serengeti-sports-travel
        $profile = PartnerProfile::firstOrCreate(
            ['user_id' => $partner->id],
            [
                'slug' => 'serengeti-sports-travel',
                'display_name' => 'Serengeti Sports Travel',
                'tagline' => 'East Africa\'s sports travel specialists — matchday, done right.',
                'about' => 'We\'ve run football-fan trips across East Africa for over a decade — AFCON qualifiers, club friendlies, and everything in between. Every itinerary comes with a local guide, verified match tickets, and 24/7 support from a real human in-country.',
                'theme_accent' => '#0072CE',
                'stats' => [
                    ['label' => 'Countries', 'value' => '8+'],
                    ['label' => 'Fans served', 'value' => '12K+'],
                    ['label' => 'Tournaments', 'value' => '25'],
                    ['label' => 'On-time booking rate', 'value' => '99%'],
                ],
                'service_tags' => ['Match tickets', 'Hotels', 'Flights', 'Airport transfers', 'Local guides', 'Group bookings'],
                'contact_email' => 'hello@serengetisports.example',
                'website_url' => 'https://serengetisports.example',
                'is_public' => true,
                'published_at' => now(),
            ],
        );

        // Attribute a couple of existing package listings to this partner so
        // both the hub grid and the admin directory show a non-zero count.
        // Only touches listings that don't already have a publisher set.
        Listing::query()
            ->whereNull('publisher_type')
            ->limit(3)
            ->update([
                'publisher_type' => User::class,
                'publisher_id' => $partner->id,
            ]);

        $this->command->info('Demo partner seeded: partner@tfe.com / password');
        $this->command->info("Public hub: /partners/{$profile->slug}");
    }
}
