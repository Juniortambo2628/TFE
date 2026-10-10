<?php

namespace Tests\Feature\Fan;

use App\Models\Booking;
use App\Models\Budget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The fan dashboard leads with the one thing to do next (Sprint 65).
 */
class NextActionTest extends TestCase
{
    use RefreshDatabase;

    private function nextAction(User $fan): ?array
    {
        return $this->actingAs($fan)->get(route('fan.dashboard'))
            ->assertOk()->viewData('page')['props']['nextAction'];
    }

    public function test_a_fan_with_nothing_is_invited_to_plan(): void
    {
        $this->assertSame('plan', $this->nextAction(User::factory()->create())['kind']);
    }

    public function test_a_held_booking_comes_first(): void
    {
        $fan = User::factory()->create();
        Budget::create([
            'user_id' => $fan->id, 'tournament_id' => 'afcon_2027', 'name' => 'Quoted', 'total_cost' => 10,
            'match_ids' => [], 'accommodation_level' => '3_star', 'flight_class' => 'economy', 'breakdown' => [],
            'partner_status' => 'approved',
        ]);
        $booking = Booking::create([
            'user_id' => $fan->id, 'tournament_id' => 'afcon_2027', 'package_name' => 'Held', 'package_type' => 'Held',
            'status' => 'pending_payment', 'total_amount' => 900, 'currency' => 'USD', 'amount_paid' => 0,
            'booking_date' => now(), 'expires_at' => now()->addDay(), 'flight_info' => 'economy',
            'accommodation' => '3_star', 'matches' => [],
        ]);

        $action = $this->nextAction($fan);
        $this->assertSame('pay', $action['kind']);
        $this->assertSame(route('fan.bookings.show', $booking), $action['href']);
    }

    public function test_a_partner_quote_links_straight_to_its_accept_dialog(): void
    {
        $fan = User::factory()->create();
        $budget = Budget::create([
            'user_id' => $fan->id, 'tournament_id' => 'afcon_2027', 'name' => 'Quoted', 'total_cost' => 10,
            'match_ids' => [], 'accommodation_level' => '3_star', 'flight_class' => 'economy', 'breakdown' => [],
            'partner_status' => 'modified',
        ]);

        $action = $this->nextAction($fan);
        $this->assertSame('accept', $action['kind']);
        $this->assertSame(route('fan.itineraries', ['accept' => $budget->id]), $action['href']);
    }
}
