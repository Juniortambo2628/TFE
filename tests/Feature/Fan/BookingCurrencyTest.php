<?php

namespace Tests\Feature\Fan;

use App\Models\Booking;
use App\Models\Budget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 29 — bookings carry the currency the fan built the plan in
 * so the Journey + Wallet surfaces render the amount the fan
 * confirmed, not the platform default.
 */
class BookingCurrencyTest extends TestCase
{
    use RefreshDatabase;

    private function fan(): User
    {
        return User::factory()->create(['is_partner' => false, 'is_admin' => false]);
    }

    private function approvedBudget(User $fan, string $currency): Budget
    {
        return Budget::create([
            'user_id' => $fan->id,
            'tournament_id' => 'wc_2026',
            'name' => 'My Trip',
            'total_cost' => 4200,
            'currency' => $currency,
            'match_ids' => [1, 2, 3],
            'accommodation_level' => '3_star',
            'flight_class' => 'economy',
            'breakdown' => ['match_tickets' => 1000],
            'nights' => 7,
            'is_active' => true,
            'partner_status' => 'approved',
        ]);
    }

    public function test_confirm_propagates_the_budgets_currency_onto_the_booking(): void
    {
        $fan = $this->fan();
        $budget = $this->approvedBudget($fan, 'EUR');

        $this->actingAs($fan)
            ->post(route('fan.budget.confirm', $budget->id))
            ->assertRedirect(route('fan.journey'));

        $booking = Booking::where('user_id', $fan->id)->firstOrFail();
        $this->assertSame('EUR', $booking->currency);
        $this->assertEquals(4200, $booking->total_amount);
    }

    public function test_confirm_carries_currency_for_each_supported_code(): void
    {
        foreach (['USD', 'EUR', 'GBP', 'KES', 'ZAR', 'NGN', 'XOF'] as $code) {
            $fan = $this->fan();
            $budget = $this->approvedBudget($fan, $code);

            $this->actingAs($fan)
                ->post(route('fan.budget.confirm', $budget->id))
                ->assertRedirect(route('fan.journey'));

            $this->assertSame(
                $code,
                Booking::where('user_id', $fan->id)->firstOrFail()->currency,
                "Booking for $code budget should carry $code",
            );
        }
    }
}
