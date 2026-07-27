<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        return User::factory()->admin()->create();
    }

    private function createFan(): User
    {
        return User::factory()->create([
            'is_admin' => false,
            'is_partner' => false,
        ]);
    }

    public function test_guest_cannot_access_admin_dashboard(): void
    {
        $response = $this->get(route('admin.dashboard'));
        $response->assertRedirect('/login');
    }

    public function test_non_admin_cannot_access_admin_dashboard(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('admin.dashboard'));
        $response->assertStatus(403);
    }

    public function test_admin_can_access_dashboard(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.dashboard'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_users(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.users'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_profile(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.profile'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_payments(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.payments'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_events(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.events'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_content(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.content'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_news(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.news.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_ads(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.ads.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_settings(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.settings'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_announcements(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.announcements'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_messages(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.messages'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_analytics(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.analytics'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_loan_applications(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.loan-applications'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_prizes(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.prizes.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_savings_goals(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.savings-goals.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_bookings(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.bookings.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_products(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.products.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_tribes(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.tribes.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_access_stories(): void
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->get(route('admin.stories.index'));
        $response->assertStatus(200);
    }

    public function test_non_admin_cannot_access_admin_users(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('admin.users'));
        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_access_admin_payments(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('admin.payments'));
        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_access_admin_events(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('admin.events'));
        $response->assertStatus(403);
    }
}
