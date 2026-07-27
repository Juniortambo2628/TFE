<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_is_admin_middleware_blocks_guests(): void
    {
        $response = $this->get(route('admin.dashboard'));
        $response->assertRedirect('/login');
    }

    public function test_is_admin_middleware_blocks_non_admin_users(): void
    {
        $fan = User::factory()->create([
            'is_admin' => false,
            'is_partner' => false,
        ]);

        $response = $this->actingAs($fan)->get(route('admin.dashboard'));
        $response->assertStatus(403);
    }

    public function test_is_admin_middleware_allows_admin_users(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));
        $response->assertStatus(200);
    }

    public function test_partner_routes_block_non_partners(): void
    {
        $fan = User::factory()->create([
            'is_admin' => false,
            'is_partner' => false,
        ]);

        $response = $this->actingAs($fan)->get(route('partner.dashboard'));
        $response->assertStatus(403);
    }

    public function test_partner_routes_allow_partners(): void
    {
        $partner = User::factory()->partner()->create();

        $response = $this->actingAs($partner)->get(route('partner.dashboard'));
        $response->assertStatus(200);
    }

    public function test_fan_routes_block_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get(route('fan.dashboard'));
        $response->assertStatus(200);
    }

    public function test_fan_routes_block_partner_redirect(): void
    {
        $partner = User::factory()->partner()->create();

        $response = $this->actingAs($partner)->get(route('fan.dashboard'));
        $response->assertRedirect(route('partner.dashboard'));
    }

    public function test_dashboard_route_redirects_admin_to_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/dashboard');
        $response->assertRedirect(route('admin.dashboard'));
    }

    public function test_dashboard_route_redirects_partner_to_partner_dashboard(): void
    {
        $partner = User::factory()->partner()->create();

        $response = $this->actingAs($partner)->get('/dashboard');
        $response->assertRedirect(route('partner.dashboard'));
    }

    public function test_dashboard_route_redirects_fan_to_fan_dashboard(): void
    {
        $fan = User::factory()->create([
            'is_admin' => false,
            'is_partner' => false,
        ]);

        $response = $this->actingAs($fan)->get('/dashboard');
        $response->assertRedirect(route('fan.dashboard'));
    }
}
