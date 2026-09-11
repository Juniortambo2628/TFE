<?php

namespace Tests\Feature\Fan;

use App\Models\SavingsGoal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 30 — a savings goal remembers the currency it targets so the
 * dashboard cards render "€3,000" for a EUR trip fund rather than the
 * platform default.
 */
class SavingsGoalCurrencyTest extends TestCase
{
    use RefreshDatabase;

    private function fan(): User
    {
        return User::factory()->create(['is_partner' => false, 'is_admin' => false]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Euro trip fund',
            'target_amount' => 3000,
        ], $overrides);
    }

    public function test_store_persists_the_fan_selected_currency(): void
    {
        $fan = $this->fan();

        $this->actingAs($fan)
            ->post(route('fan.savings-goals.store'), $this->payload(['currency' => 'EUR']))
            ->assertRedirect();

        $goal = SavingsGoal::where('user_id', $fan->id)->firstOrFail();
        $this->assertSame('EUR', $goal->currency);
        $this->assertEquals(3000, $goal->target_amount);
    }

    public function test_store_defaults_to_usd_when_currency_absent(): void
    {
        $fan = $this->fan();

        $this->actingAs($fan)
            ->post(route('fan.savings-goals.store'), $this->payload())
            ->assertRedirect();

        $this->assertSame('USD', SavingsGoal::where('user_id', $fan->id)->firstOrFail()->currency);
    }

    public function test_store_rejects_unknown_currency(): void
    {
        $fan = $this->fan();

        $this->actingAs($fan)
            ->post(route('fan.savings-goals.store'), $this->payload(['currency' => 'XXX']))
            ->assertSessionHasErrors('currency');
    }

    public function test_store_accepts_every_whitelisted_currency(): void
    {
        $fan = $this->fan();

        foreach (['USD', 'EUR', 'GBP', 'KES', 'ZAR', 'NGN', 'XOF'] as $code) {
            SavingsGoal::query()->where('user_id', $fan->id)->delete();
            $this->actingAs($fan)
                ->post(route('fan.savings-goals.store'), $this->payload(['currency' => $code]))
                ->assertRedirect()
                ->assertSessionHasNoErrors();
            $this->assertSame($code, SavingsGoal::where('user_id', $fan->id)->firstOrFail()->currency);
        }
    }

    public function test_update_can_change_currency(): void
    {
        $fan = $this->fan();

        $this->actingAs($fan)
            ->post(route('fan.savings-goals.store'), $this->payload(['currency' => 'USD']))
            ->assertRedirect();

        $goal = SavingsGoal::where('user_id', $fan->id)->firstOrFail();

        $this->actingAs($fan)
            ->put(route('fan.savings-goals.update', $goal->id), ['currency' => 'GBP'])
            ->assertRedirect();

        $this->assertSame('GBP', $goal->fresh()->currency);
    }
}
