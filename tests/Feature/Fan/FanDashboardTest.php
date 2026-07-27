<?php

namespace Tests\Feature\Fan;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FanDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function createFan(): User
    {
        return User::factory()->create([
            'is_admin' => false,
            'is_partner' => false,
        ]);
    }

    public function test_guest_cannot_access_fan_dashboard(): void
    {
        $response = $this->get(route('fan.dashboard'));
        $response->assertRedirect('/login');
    }

    public function test_fan_can_access_dashboard(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.dashboard'));
        $response->assertStatus(200);
    }

    public function test_partner_redirected_from_fan_dashboard(): void
    {
        $partner = User::factory()->partner()->create();
        $response = $this->actingAs($partner)->get(route('fan.dashboard'));
        $response->assertRedirect(route('partner.dashboard'));
    }

    public function test_fan_can_access_feed(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.feed'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_profile(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.profile'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_budget_calculator(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.budget-calculator'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_match_schedule(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.match-schedule'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_wallet(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.wallet'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_events(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.events'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_security(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.security'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_communication(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.communication'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_tribes(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.tribes'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_stories(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.stories'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_payments(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.payments'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_activities(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.activities'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_store(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.store'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_predict_win(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.predict-win'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_contact(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.contact'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_itineraries(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.itineraries'));
        $response->assertStatus(200);
    }

    public function test_fan_can_access_journey(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('fan.journey'));
        $response->assertStatus(200);
    }
}
