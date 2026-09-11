<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 12 — the publisherSummary block that fan controllers
 * hydrate onto their listing payloads so PoweredByBadge can render.
 */
class PublisherSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_authored_listing_has_null_publisher(): void
    {
        $listing = Listing::factory()->create([
            'publisher_type' => null,
            'publisher_id' => null,
        ]);

        $this->assertNull($listing->publisherSummary());
    }

    public function test_partner_authored_listing_returns_summary_when_profile_public(): void
    {
        $partner = User::factory()->partner()->create([
            'verification_status' => 'verified',
        ]);
        PartnerProfile::create([
            'user_id' => $partner->id,
            'slug' => 'serengeti-test',
            'display_name' => 'Serengeti Test',
            'theme_accent' => '#0072CE',
            'logo_url' => '/logo.png',
            'is_public' => true,
        ]);

        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
        ]);

        $summary = $listing->publisherSummary();
        $this->assertNotNull($summary);
        $this->assertSame('serengeti-test', $summary['slug']);
        $this->assertSame('Serengeti Test', $summary['display_name']);
        $this->assertSame('#0072CE', $summary['theme_accent']);
        $this->assertTrue($summary['verified']);
    }

    public function test_partner_with_non_public_profile_returns_null_summary(): void
    {
        $partner = User::factory()->partner()->create();
        PartnerProfile::create([
            'user_id' => $partner->id,
            'slug' => 'draft-hub',
            'display_name' => 'Draft Hub',
            'is_public' => false,
        ]);

        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
        ]);

        $this->assertNull($listing->publisherSummary());
    }

    public function test_budget_calculator_passes_publisher_block_on_packages(): void
    {
        $fan = User::factory()->create();
        $partner = User::factory()->partner()->create();
        PartnerProfile::create([
            'user_id' => $partner->id,
            'slug' => 'seren-bc',
            'display_name' => 'Serengeti BC',
            'is_public' => true,
        ]);
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'tournament_id' => 'afcon_2027',
            'is_active' => true,
        ]);

        session(['active_tournament_id' => 'afcon_2027']);
        $packages = $this->actingAs($fan)
            ->get(route('fan.budget-calculator'))
            ->viewData('page')['props']['packages'];

        $found = collect($packages)->firstWhere('id', $listing->id);
        $this->assertNotNull($found, 'Partner listing should appear in the picker');
        $this->assertNotNull($found['publisher']);
        $this->assertSame('seren-bc', $found['publisher']['slug']);
    }
}
