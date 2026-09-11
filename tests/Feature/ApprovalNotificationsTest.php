<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Listing;
use App\Models\LoanApplication;
use App\Models\PartnerProfile;
use App\Models\User;
use App\Notifications\BudgetResponseNotification;
use App\Notifications\ListingModerationNotification;
use App\Notifications\LoanStatusNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Sprint 17 — every approval / rejection now fires an in-app
 * notification. This locks the wiring down so a controller refactor
 * that drops the notify() call fails loudly.
 */
class ApprovalNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_listing_approve_notifies_the_partner(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $partner = User::factory()->partner()->create();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.approve', $listing->id))
            ->assertRedirect();

        Notification::assertSentTo($partner, ListingModerationNotification::class,
            fn ($n) => $n->decision === 'approved' && $n->listing->id === $listing->id);
    }

    public function test_listing_reject_notifies_the_partner_with_feedback(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $partner = User::factory()->partner()->create();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.listing-approvals.reject', $listing->id), [
                'notes' => 'Add venues before we can list this.',
            ])
            ->assertRedirect();

        Notification::assertSentTo($partner, ListingModerationNotification::class,
            fn ($n) => $n->decision === 'rejected');
    }

    public function test_loan_decision_notifies_the_fan(): void
    {
        Notification::fake();

        $fan = User::factory()->create(['is_partner' => false, 'is_admin' => false]);
        $bank = User::factory()->partner()->create(['partner_type' => 'finance_partner']);
        PartnerProfile::create([
            'user_id' => $bank->id, 'slug' => 'bank', 'display_name' => 'Bank', 'is_public' => true,
        ]);
        $loan = LoanApplication::create([
            'user_id' => $fan->id,
            'finance_partner_id' => $bank->id,
            'amount' => 3000,
            'purpose' => 'Trip',
            'status' => 'PENDING',
        ]);

        $this->actingAs($bank)
            ->put(route('partner.loans.update', $loan->id), [
                'status' => 'APPROVED',
                'interest_rate' => 10.5,
            ])
            ->assertRedirect();

        Notification::assertSentTo($fan, LoanStatusNotification::class,
            fn ($n) => $n->loan->status === 'APPROVED');
    }

    public function test_budget_response_notifies_the_fan(): void
    {
        Notification::fake();

        $fan = User::factory()->create(['is_partner' => false, 'is_admin' => false]);
        $partner = User::factory()->partner()->create(['partner_type' => 'travel_agent']);
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
        ]);
        $budget = Budget::create([
            'user_id' => $fan->id,
            'listing_id' => $listing->id,
            'is_active' => true,
            'partner_status' => 'pending',
            'total_cost' => 42000,
            'breakdown' => ['flights' => 20000, 'hotels' => 22000],
            'accommodation_level' => '4_star',
            'flight_class' => 'economy',
            'nights' => 5,
            'match_ids' => [1],
        ]);

        $this->actingAs($partner)
            ->put(route('partner.requests.update', $budget->id), [
                'partner_cost' => 38000,
                'partner_breakdown' => ['flights' => 18000, 'hotels' => 20000],
                'partner_notes' => 'Small discount.',
                'status' => 'modified',
            ])
            ->assertRedirect();

        Notification::assertSentTo($fan, BudgetResponseNotification::class,
            fn ($n) => $n->budget->id === $budget->id);
    }

    public function test_notification_shape_carries_title_body_icon(): void
    {
        $partner = User::factory()->partner()->create();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'name' => 'Weekend in Lagos',
        ]);

        $notif = new ListingModerationNotification($listing, 'approved');
        $data = $notif->toArray($partner);
        $this->assertSame('Listing approved', $data['title']);
        $this->assertStringContainsString('Weekend in Lagos', $data['body']);
        $this->assertSame('fas fa-check-circle', $data['icon']);
        $this->assertSame(route('partner.listings.index'), $data['action_url']);
    }
}
