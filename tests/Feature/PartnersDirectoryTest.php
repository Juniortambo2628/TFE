<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 11 /partners public directory — search, type + tournament
 * filters, and the "only public profiles" gate.
 */
class PartnersDirectoryTest extends TestCase
{
    use RefreshDatabase;

    private function publishedPartner(array $partnerAttrs, array $profileAttrs = []): User
    {
        $user = User::factory()->partner()->create($partnerAttrs);
        PartnerProfile::create(array_merge([
            'user_id' => $user->id,
            'display_name' => $user->name,
            'tagline' => 'Trusted operator',
            'about' => 'Booking tournament trips since 2016.',
            'is_public' => true,
            'published_at' => now(),
        ], $profileAttrs));

        return $user;
    }

    public function test_index_lists_public_profiles_only(): void
    {
        $this->publishedPartner(['partner_type' => 'travel_agent']);
        $draftUser = User::factory()->partner()->create(['partner_type' => 'travel_agent']);
        PartnerProfile::create([
            'user_id' => $draftUser->id,
            'display_name' => 'Hidden',
            'is_public' => false,
        ]);

        $response = $this->get(route('partners.index'));
        $response->assertStatus(200);
        $profiles = $response->viewData('page')['props']['profiles'];

        $names = collect($profiles)->pluck('display_name')->all();
        $this->assertNotContains('Hidden', $names);
        $this->assertCount(1, $profiles);
    }

    public function test_type_filter_narrows_by_partner_type(): void
    {
        $this->publishedPartner(['partner_type' => 'travel_agent'], ['display_name' => 'Serengeti']);
        $this->publishedPartner(['partner_type' => 'finance_partner'], ['display_name' => 'Ecobank']);

        $response = $this->get(route('partners.index', ['type' => 'finance_partner']));
        $profiles = $response->viewData('page')['props']['profiles'];

        $this->assertCount(1, $profiles);
        $this->assertSame('Ecobank', $profiles[0]['display_name']);
    }

    public function test_search_matches_display_name_and_tagline(): void
    {
        $this->publishedPartner(['partner_type' => 'travel_agent'],
            ['display_name' => 'Kilimanjaro Sports Travel', 'tagline' => 'East Africa specialists']);
        $this->publishedPartner(['partner_type' => 'airline'],
            ['display_name' => 'AtlanticJet', 'tagline' => 'Business-class matchday flights']);

        $byName = $this->get(route('partners.index', ['q' => 'Kilimanjaro']))
            ->viewData('page')['props']['profiles'];
        $this->assertCount(1, $byName);
        $this->assertSame('Kilimanjaro Sports Travel', $byName[0]['display_name']);

        $byTag = $this->get(route('partners.index', ['q' => 'matchday']))
            ->viewData('page')['props']['profiles'];
        $this->assertCount(1, $byTag);
        $this->assertSame('AtlanticJet', $byTag[0]['display_name']);
    }

    public function test_tournament_filter_drops_partners_with_no_matching_approved_listings(): void
    {
        $seren = $this->publishedPartner(['partner_type' => 'travel_agent'], ['display_name' => 'Serengeti']);
        $ecobank = $this->publishedPartner(['partner_type' => 'finance_partner'], ['display_name' => 'Ecobank']);

        Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $seren->id,
            'tournament_id' => 'afcon_2027',
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);
        Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $ecobank->id,
            'tournament_id' => 'euro_2024',
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);

        $profiles = $this->get(route('partners.index', ['tournament_id' => 'afcon_2027']))
            ->viewData('page')['props']['profiles'];

        $names = collect($profiles)->pluck('display_name')->all();
        $this->assertContains('Serengeti', $names);
        $this->assertNotContains('Ecobank', $names);
    }

    public function test_hub_only_lists_approved_active_listings(): void
    {
        $partner = $this->publishedPartner(['partner_type' => 'travel_agent'],
            ['slug' => 'test-hub', 'display_name' => 'Test Hub']);

        Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'name' => 'Public Package',
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);
        Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'name' => 'Draft Package',
            'moderation_status' => 'draft',
            'is_active' => false,
        ]);

        $listings = $this->get(route('partners.hub', 'test-hub'))
            ->viewData('page')['props']['listings'];

        $names = collect($listings)->pluck('name')->all();
        $this->assertContains('Public Package', $names);
        $this->assertNotContains('Draft Package', $names);
    }
}
