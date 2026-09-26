<?php

namespace Tests\Feature\Admin;

use App\Models\Listing;
use App\Models\User;
use App\Notifications\ListingModerationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Phase C — the listing safety surface is now takedowns + restores, not a
 * moderation queue. Partners self-publish; admin only acts on live rows.
 */
class ListingTakedownTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_take_down_a_live_listing_with_required_notes(): void
    {
        Notification::fake();
        $admin = User::factory()->admin()->create();
        $partner = User::factory()->partner()->create();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.reject', $listing->id), [
                'notes' => 'Violates the no-alcohol-branding policy — please remove the sponsor logo.',
            ])
            ->assertRedirect();

        $listing->refresh();
        $this->assertSame('rejected', $listing->moderation_status);
        $this->assertFalse((bool) $listing->is_active);
        Notification::assertSentTo($partner, ListingModerationNotification::class);
    }

    public function test_takedown_requires_notes(): void
    {
        $admin = User::factory()->admin()->create();
        $partner = User::factory()->partner()->create();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.reject', $listing->id), ['notes' => ''])
            ->assertSessionHasErrors('notes');

        $listing->refresh();
        $this->assertSame('approved', $listing->moderation_status);
    }

    public function test_admin_can_restore_a_taken_down_listing(): void
    {
        Notification::fake();
        $admin = User::factory()->admin()->create();
        $partner = User::factory()->partner()->create();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'rejected',
            'is_active' => false,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.approve', $listing->id))
            ->assertRedirect();

        $listing->refresh();
        $this->assertSame('approved', $listing->moderation_status);
        $this->assertTrue((bool) $listing->is_active);
    }

    public function test_bulk_takedown_only_touches_live_rows(): void
    {
        Notification::fake();
        $admin = User::factory()->admin()->create();
        $partner = User::factory()->partner()->create();

        $live = Listing::factory()->count(2)->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);
        $alreadyDown = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'rejected',
            'is_active' => false,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.bulk-reject'), [
                'ids' => [...$live->pluck('id')->all(), $alreadyDown->id],
                'notes' => 'Coordinated takedown — see safety brief.',
            ])
            ->assertRedirect();

        foreach ($live as $l) {
            $l->refresh();
            $this->assertSame('rejected', $l->moderation_status);
        }
        $alreadyDown->refresh();
        $this->assertSame('rejected', $alreadyDown->moderation_status); // unchanged
    }

    public function test_non_admin_cannot_take_down(): void
    {
        $fan = User::factory()->create(['is_admin' => false, 'is_partner' => false]);
        $partner = User::factory()->partner()->create();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);

        $this->actingAs($fan)
            ->post(route('admin.listing-approvals.reject', $listing->id), ['notes' => 'x'])
            ->assertStatus(403);
    }
}
