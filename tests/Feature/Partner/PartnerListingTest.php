<?php

namespace Tests\Feature\Partner;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 10 Publish tab + Sprint 10 admin approval flow.
 */
class PartnerListingTest extends TestCase
{
    use RefreshDatabase;

    private function partner(array $overrides = []): User
    {
        return User::factory()->partner()->create($overrides);
    }

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    private function otherPartner(): User
    {
        return User::factory()->partner()->create();
    }

    public function test_partner_sees_only_their_own_listings_in_publish_index(): void
    {
        $me = $this->partner();
        $them = $this->otherPartner();

        Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $me->id,
            'name' => 'My Listing',
        ]);
        Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $them->id,
            'name' => 'Their Listing',
        ]);

        $response = $this->actingAs($me)->get(route('partner.listings.index'));

        $response->assertStatus(200);
        $listings = $response->viewData('page')['props']['listings'];
        $this->assertCount(1, $listings);
        $this->assertSame('My Listing', $listings[0]['name']);
    }

    public function test_partner_can_create_a_listing_as_draft(): void
    {
        $me = $this->partner();

        $this->actingAs($me)->post(route('partner.listings.store'), [
            'tournament_id' => 'afcon_2027',
            'name' => 'Weekend in Lagos',
            'base_price' => 1200,
            'currency' => 'USD',
            'nights' => 3,
            'flight_class' => 'economy',
            'accommodation_level' => '3_star',
            'moderation_status' => 'draft',
        ])->assertRedirect();

        $this->assertDatabaseHas('listings', [
            'name' => 'Weekend in Lagos',
            'publisher_id' => $me->id,
            'publisher_type' => User::class,
            'moderation_status' => 'draft',
            'is_active' => false,
        ]);
    }

    public function test_partner_submitting_flips_status_to_pending_and_stamps_submitted_at(): void
    {
        $me = $this->partner();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $me->id,
            'moderation_status' => 'draft',
            'submitted_at' => null,
        ]);

        $this->actingAs($me)->post(route('partner.listings.submit', $listing->id))->assertRedirect();

        $listing->refresh();
        $this->assertSame('pending', $listing->moderation_status);
        $this->assertNotNull($listing->submitted_at);
    }

    public function test_partner_cannot_touch_another_partners_listing(): void
    {
        $me = $this->partner();
        $them = $this->otherPartner();
        $theirs = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $them->id,
            'moderation_status' => 'draft',
        ]);

        $this->actingAs($me)
            ->post(route('partner.listings.submit', $theirs->id))
            ->assertForbidden();

        $this->actingAs($me)
            ->delete(route('partner.listings.destroy', $theirs->id))
            ->assertForbidden();
    }

    public function test_partner_cannot_self_feature_via_update(): void
    {
        $me = $this->partner();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $me->id,
            'is_featured' => false,
        ]);

        $this->actingAs($me)->put(route('partner.listings.update', $listing->id), [
            'tournament_id' => $listing->tournament_id,
            'name' => $listing->name,
            'base_price' => $listing->base_price,
            'currency' => $listing->currency,
            'nights' => $listing->nights,
            'flight_class' => $listing->flight_class,
            'accommodation_level' => $listing->accommodation_level,
            'is_featured' => true, // ignored — controller preserves the flag
        ])->assertRedirect();

        $this->assertFalse($listing->fresh()->is_featured);
    }

    public function test_admin_approve_makes_listing_active_and_public(): void
    {
        $admin = $this->admin();
        $partner = $this->partner();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'pending',
            'is_active' => false,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.approve', $listing->id))
            ->assertRedirect();

        $listing->refresh();
        $this->assertSame('approved', $listing->moderation_status);
        $this->assertTrue($listing->is_active);
    }

    public function test_admin_reject_requires_notes_and_returns_to_partner(): void
    {
        $admin = $this->admin();
        $partner = $this->partner();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'pending',
        ]);

        // Missing notes → validation error.
        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.reject', $listing->id), [])
            ->assertSessionHasErrors('notes');

        // With notes → rejected + inactive + notes stored.
        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.reject', $listing->id), [
                'notes' => 'Please add included venues before we can list this.',
            ])
            ->assertRedirect();

        $listing->refresh();
        $this->assertSame('rejected', $listing->moderation_status);
        $this->assertFalse($listing->is_active);
        $this->assertStringContainsString('venues', $listing->moderation_notes);
    }

    public function test_non_admin_cannot_reach_approval_queue(): void
    {
        $partner = $this->partner();
        $this->actingAs($partner)
            ->get(route('admin.listing-approvals.index'))
            ->assertStatus(403);
    }
}
