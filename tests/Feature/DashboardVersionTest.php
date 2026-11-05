<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The per-person "Try the new dashboard" switch (UX review, Nov 2026). */
class DashboardVersionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_is_off_by_default_and_reaches_every_page(): void
    {
        $fan = User::factory()->create()->fresh(); // as the auth guard loads it

        $user = $this->actingAs($fan)->get(route('fan.dashboard'))->viewData('page')['props']['auth']['user'];

        $this->assertFalse($user['dashboard_v2']);
    }

    public function test_any_role_can_switch_it_on_and_back(): void
    {
        foreach ([User::factory()->create(), User::factory()->partner()->create(), User::factory()->admin()->create()] as $user) {
            $this->actingAs($user)->from('/somewhere')
                ->post(route('account.dashboard-version'), ['v2' => true])
                ->assertRedirect('/somewhere');
            $this->assertTrue($user->fresh()->dashboard_v2);

            $this->post(route('account.dashboard-version'), ['v2' => false]);
            $this->assertFalse($user->fresh()->dashboard_v2);
        }
    }

    public function test_it_needs_a_signed_in_user_and_a_real_choice(): void
    {
        $this->post(route('account.dashboard-version'), ['v2' => true])->assertRedirect(route('login'));

        $fan = User::factory()->create();
        $this->actingAs($fan)->post(route('account.dashboard-version'), ['v2' => 'maybe'])->assertSessionHasErrors('v2');
        $this->assertFalse($fan->fresh()->dashboard_v2);
    }

    public function test_a_profile_save_cannot_flip_it(): void
    {
        $fan = User::factory()->create();
        $fan->fill(['dashboard_v2' => true])->save();

        $this->assertFalse($fan->fresh()->dashboard_v2, 'dashboard_v2 is not mass-assignable');
    }
}
