<?php

namespace Tests\Feature\Admin;

use App\Models\Listing;
use App\Models\User;
use App\Notifications\ListingModerationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Sprint 19 — bulk approve / bulk reject on the admin approval queue.
 */
class BulkApprovalTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    private function pendingListingFor(User $partner): Listing
    {
        return Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'pending',
            'is_active' => false,
        ]);
    }

    public function test_bulk_approve_flips_status_and_activates_each(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $partnerA = User::factory()->partner()->create();
        $partnerB = User::factory()->partner()->create();
        $one = $this->pendingListingFor($partnerA);
        $two = $this->pendingListingFor($partnerB);

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.bulk-approve'), [
                'ids' => [$one->id, $two->id],
            ])
            ->assertRedirect();

        foreach ([$one, $two] as $l) {
            $l->refresh();
            $this->assertSame('approved', $l->moderation_status);
            $this->assertTrue($l->is_active);
        }

        Notification::assertSentTo($partnerA, ListingModerationNotification::class);
        Notification::assertSentTo($partnerB, ListingModerationNotification::class);
    }

    public function test_bulk_approve_ignores_already_approved(): void
    {
        $admin = $this->admin();
        $partner = User::factory()->partner()->create();
        $already = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);
        $original = $already->updated_at;

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.bulk-approve'), ['ids' => [$already->id]])
            ->assertRedirect();

        // Untouched — controller filters out non-eligible IDs.
        $this->assertTrue($already->fresh()->updated_at->equalTo($original));
    }

    public function test_bulk_reject_requires_notes(): void
    {
        $admin = $this->admin();
        $partner = User::factory()->partner()->create();
        $listing = $this->pendingListingFor($partner);

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.bulk-reject'), ['ids' => [$listing->id]])
            ->assertSessionHasErrors('notes');
    }

    public function test_bulk_reject_writes_shared_notes_and_notifies(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $partnerA = User::factory()->partner()->create();
        $partnerB = User::factory()->partner()->create();
        $one = $this->pendingListingFor($partnerA);
        $two = $this->pendingListingFor($partnerB);

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.bulk-reject'), [
                'ids' => [$one->id, $two->id],
                'notes' => 'Include venues + a photo before resubmitting.',
            ])
            ->assertRedirect();

        foreach ([$one, $two] as $l) {
            $l->refresh();
            $this->assertSame('rejected', $l->moderation_status);
            $this->assertFalse($l->is_active);
            $this->assertStringContainsString('venues', $l->moderation_notes);
        }
        Notification::assertSentTo($partnerA, ListingModerationNotification::class,
            fn ($n) => $n->decision === 'rejected');
        Notification::assertSentTo($partnerB, ListingModerationNotification::class,
            fn ($n) => $n->decision === 'rejected');
    }

    public function test_bulk_endpoints_reject_empty_ids(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.listing-approvals.bulk-approve'), ['ids' => []])
            ->assertSessionHasErrors('ids');
    }

    public function test_non_admin_cannot_bulk_act(): void
    {
        $partner = User::factory()->partner()->create();
        $listing = $this->pendingListingFor($partner);

        $this->actingAs($partner)
            ->post(route('admin.listing-approvals.bulk-approve'), ['ids' => [$listing->id]])
            ->assertStatus(403);
    }
}
