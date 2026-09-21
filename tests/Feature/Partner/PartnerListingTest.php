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

    public function test_partner_creating_a_listing_publishes_it_immediately(): void
    {
        $me = $this->partner();

        // No review step: a saved package listing goes live (approved + active).
        $this->actingAs($me)->post(route('partner.listings.store'), [
            'tournament_id' => 'afcon_2027',
            'type' => 'package',
            'name' => 'Weekend in Lagos',
            'base_price' => 1200,
            'currency' => 'USD',
            'nights' => 3,
            'flight_class' => 'economy',
            'accommodation_level' => '3_star',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('listings', [
            'name' => 'Weekend in Lagos',
            'publisher_id' => $me->id,
            'publisher_type' => User::class,
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);
    }

    public function test_partner_can_create_an_offer_without_trip_fields(): void
    {
        // A finance/airline/betting "offer" isn't forced to supply nights,
        // flight class or accommodation (contextual create form).
        $me = $this->partner(['partner_type' => 'finance_partner']);

        $this->actingAs($me)->post(route('partner.listings.store'), [
            'tournament_id' => 'afcon_2027',
            'type' => 'offer',
            'name' => 'Trip financing — 12 months',
            'base_price' => 99,
            'currency' => 'USD',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('listings', [
            'name' => 'Trip financing — 12 months',
            'type' => 'offer',
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);
    }

    public function test_partner_can_toggle_a_listing_between_published_and_hidden(): void
    {
        $me = $this->partner();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $me->id,
            'is_active' => true,
        ]);

        $this->actingAs($me)->post(route('partner.listings.toggle', $listing->id))->assertRedirect();
        $this->assertFalse($listing->fresh()->is_active);

        $this->actingAs($me)->post(route('partner.listings.toggle', $listing->id))->assertRedirect();
        $this->assertTrue($listing->fresh()->is_active);
    }

    public function test_partner_cannot_touch_another_partners_listing(): void
    {
        $me = $this->partner();
        $them = $this->otherPartner();
        $theirs = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $them->id,
        ]);

        $this->actingAs($me)
            ->post(route('partner.listings.toggle', $theirs->id))
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
            'type' => $listing->type,
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
