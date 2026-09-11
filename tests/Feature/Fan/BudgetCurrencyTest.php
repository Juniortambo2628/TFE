<?php

namespace Tests\Feature\Fan;

use App\Models\Budget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 28 — the budget calculator now persists the currency the fan
 * built the plan in so downstream surfaces (loan applications, saved
 * itineraries, admin queue) can render the exact amount the fan saw
 * when they saved.
 */
class BudgetCurrencyTest extends TestCase
{
    use RefreshDatabase;

    private function fan(): User
    {
        return User::factory()->create(['is_partner' => false, 'is_admin' => false]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'My Trip',
            'total_cost' => 5000,
            'match_ids' => [1, 2, 3],
            'accommodation_level' => '3_star',
            'flight_class' => 'economy',
            'breakdown' => [
                'match_tickets' => 1200,
                'flights' => 1500,
                'accommodation' => 1000,
                'food_and_drink' => 500,
                'local_transport' => 200,
                'insurance' => 100,
                'visa' => 50,
                'merchandise' => 150,
                'miscellaneous' => 300,
            ],
            'nights' => 7,
        ], $overrides);
    }

    public function test_store_persists_the_fan_selected_currency(): void
    {
        $fan = $this->fan();

        $this->actingAs($fan)
            ->post(route('fan.budget.save'), $this->payload(['currency' => 'EUR']))
            ->assertRedirect();

        $budget = Budget::where('user_id', $fan->id)->firstOrFail();
        $this->assertSame('EUR', $budget->currency);
    }

    public function test_store_defaults_currency_to_usd_when_absent(): void
    {
        $fan = $this->fan();

        $this->actingAs($fan)
            ->post(route('fan.budget.save'), $this->payload())
            ->assertRedirect();

        $budget = Budget::where('user_id', $fan->id)->firstOrFail();
        $this->assertSame('USD', $budget->currency);
    }

    public function test_store_rejects_an_unknown_currency_code(): void
    {
        $fan = $this->fan();

        $this->actingAs($fan)
            ->post(route('fan.budget.save'), $this->payload(['currency' => 'XXX']))
            ->assertSessionHasErrors('currency');
    }

    public function test_update_carries_currency_forward_when_not_repeated(): void
    {
        $fan = $this->fan();

        // First save — pick GBP.
        $this->actingAs($fan)
            ->post(route('fan.budget.save'), $this->payload(['currency' => 'GBP']))
            ->assertRedirect();

        $budget = Budget::where('user_id', $fan->id)->firstOrFail();
        $this->assertSame('GBP', $budget->currency);

        // Second save without currency — the existing GBP stays.
        $this->actingAs($fan)
            ->post(route('fan.budget.save'), $this->payload(['id' => $budget->id, 'total_cost' => 7000]))
            ->assertRedirect();

        $budget->refresh();
        $this->assertSame('GBP', $budget->currency);
        $this->assertEquals(7000, $budget->total_cost);
    }

    public function test_accepts_every_whitelisted_currency(): void
    {
        $fan = $this->fan();

        foreach (['USD', 'EUR', 'GBP', 'KES', 'ZAR', 'NGN', 'XOF'] as $code) {
            Budget::query()->where('user_id', $fan->id)->delete();
            $this->actingAs($fan)
                ->post(route('fan.budget.save'), $this->payload(['currency' => $code]))
                ->assertRedirect()
                ->assertSessionHasNoErrors();
            $this->assertSame($code, Budget::where('user_id', $fan->id)->firstOrFail()->currency);
        }
    }
}
