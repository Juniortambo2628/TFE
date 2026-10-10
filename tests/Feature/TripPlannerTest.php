<?php

namespace Tests\Feature;

use App\Http\Controllers\TripPlannerController;
use App\Models\Booking;
use App\Models\Budget;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The public "Plan my trip" dialog and the estimate's trip through sign-in
 * (Sprint 64).
 */
class TripPlannerTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'intent' => 'book',
            'tournament_id' => 'afcon_2027',
            'total_cost' => 4321.5,
            'currency' => 'USD',
            'breakdown' => ['match_tickets' => 450, 'flights' => 1300],
            'match_ids' => [],
            'match_count' => 3,
            'nights' => 7,
            'group_size' => 2,
            'flight_class' => 'economy',
            'flight_origin' => 'africa',
            'accommodation_level' => '3_star',
            'listing_id' => null,
        ], $overrides);
    }

    public function test_data_is_public_and_lists_only_published_packages(): void
    {
        $live = Listing::factory()->create(['tournament_id' => 'afcon_2027', 'moderation_status' => 'approved']);
        Listing::factory()->create(['tournament_id' => 'afcon_2027', 'moderation_status' => 'pending']);
        Listing::factory()->create(['tournament_id' => 'afcon_2027', 'moderation_status' => 'approved', 'is_active' => false]);

        $res = $this->getJson(route('plan-trip.data', ['tournament' => 'afcon_2027']))->assertOk();

        $this->assertSame('afcon_2027', $res->json('tournament.id'));
        $this->assertSame([$live->id], array_column($res->json('packages'), 'id'));
    }

    public function test_guest_handoff_keeps_the_estimate_and_goes_to_register(): void
    {
        $this->post(route('plan-trip.handoff'), $this->payload())
            ->assertRedirect(route('register', ['from' => 'planner']))
            ->assertSessionHas(TripPlannerController::SESSION_KEY.'.total_cost', 4321.5)
            ->assertSessionHas('url.intended', route('plan-trip.resume'));
    }

    public function test_booking_a_package_after_sign_in_creates_a_pending_payment_booking(): void
    {
        $fan = User::factory()->create();
        $listing = Listing::factory()->create([
            'tournament_id' => 'afcon_2027', 'moderation_status' => 'approved', 'base_price' => 1000, 'capacity' => 10,
        ]);

        $this->withSession([TripPlannerController::SESSION_KEY => $this->payload(['listing_id' => $listing->id])])
            ->actingAs($fan)
            ->get(route('plan-trip.resume'))
            ->assertRedirect(route('fan.bookings.show', Booking::first()));

        $booking = Booking::first();
        $this->assertSame('pending_payment', $booking->status);
        $this->assertEquals(2000, $booking->total_amount); // per traveller x 2
        $this->assertSame(1, $listing->fresh()->sold_count);

        $budget = Budget::first();
        $this->assertEquals(4321.5, $budget->total_cost);
        $this->assertSame($listing->id, $budget->listing_id);
    }

    public function test_a_custom_plan_is_saved_and_opened_in_the_calculator(): void
    {
        $fan = User::factory()->create();

        $this->withSession([TripPlannerController::SESSION_KEY => $this->payload()])
            ->actingAs($fan)
            ->get(route('plan-trip.resume'))
            ->assertRedirect(route('fan.budget-calculator', ['id' => Budget::first()->id]));

        $this->assertSame(0, Booking::count());
    }

    public function test_explore_carries_the_estimate_to_the_calculator(): void
    {
        $fan = User::factory()->create();

        $this->withSession([TripPlannerController::SESSION_KEY => $this->payload(['intent' => 'explore'])])
            ->actingAs($fan)
            ->get(route('plan-trip.resume'))
            ->assertRedirect(route('fan.budget-calculator', ['from' => 'planner']))
            ->assertSessionHas('planner.estimate.total_cost', 4321.5);

        $this->assertSame(0, Budget::count());
    }

    public function test_a_draft_listing_cannot_be_booked_through_the_handoff(): void
    {
        $fan = User::factory()->create();
        $draft = Listing::factory()->create(['tournament_id' => 'afcon_2027', 'moderation_status' => 'pending']);

        $this->withSession([TripPlannerController::SESSION_KEY => $this->payload(['listing_id' => $draft->id])])
            ->actingAs($fan)
            ->get(route('plan-trip.resume'));

        $this->assertSame(0, Booking::count());
        $this->assertNull(Budget::first()->listing_id);
    }

    public function test_book_now_on_a_public_listing_goes_straight_to_a_booking(): void
    {
        $fan = User::factory()->create();
        $listing = Listing::factory()->create([
            'tournament_id' => 'afcon_2027', 'moderation_status' => 'approved', 'base_price' => 800, 'capacity' => 10,
        ]);

        $this->actingAs($fan)
            ->post(route('listings.book', $listing), ['group_size' => 3])
            ->assertRedirect(route('plan-trip.resume'));

        $this->actingAs($fan)->get(route('plan-trip.resume'))
            ->assertRedirect(route('fan.bookings.show', Booking::first()));

        $this->assertEquals(2400, Booking::first()->total_amount);
    }

    public function test_book_now_refuses_a_non_trip_listing(): void
    {
        $listing = Listing::factory()->create(['moderation_status' => 'approved', 'type' => 'offer']);

        $this->post(route('listings.book', $listing), ['group_size' => 1])->assertNotFound();
    }
}
