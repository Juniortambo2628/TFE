<?php

namespace Tests\Feature\Partner;

use App\Models\Budget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PartnerDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function createPartner(): User
    {
        return User::factory()->partner()->create();
    }

    private function createFan(): User
    {
        return User::factory()->create([
            'is_admin' => false,
            'is_partner' => false,
        ]);
    }

    public function test_guest_cannot_access_partner_dashboard(): void
    {
        $response = $this->get(route('partner.dashboard'));
        $response->assertRedirect('/login');
    }

    public function test_non_partner_cannot_access_partner_dashboard(): void
    {
        $fan = $this->createFan();
        $response = $this->actingAs($fan)->get(route('partner.dashboard'));
        $response->assertStatus(403);
    }

    public function test_partner_can_access_dashboard(): void
    {
        $partner = $this->createPartner();
        $response = $this->actingAs($partner)->get(route('partner.dashboard'));
        $response->assertStatus(200);
    }

    public function test_partner_can_access_requests(): void
    {
        $partner = $this->createPartner();
        $response = $this->actingAs($partner)->get(route('partner.requests'));
        $response->assertStatus(200);
    }

    public function test_partner_can_access_profile(): void
    {
        $partner = $this->createPartner();
        $response = $this->actingAs($partner)->get(route('partner.profile'));
        $response->assertStatus(200);
    }

    public function test_partner_can_access_security(): void
    {
        $partner = $this->createPartner();
        $response = $this->actingAs($partner)->get(route('partner.security'));
        $response->assertStatus(200);
    }

    public function test_partner_can_access_messages(): void
    {
        $partner = $this->createPartner();
        $response = $this->actingAs($partner)->get(route('partner.messages'));
        $response->assertStatus(200);
    }

    public function test_partner_can_view_budget_request(): void
    {
        $partner = $this->createPartner();
        $budget = Budget::create([
            'user_id' => User::factory()->create()->id,
            'is_active' => true,
            'partner_status' => 'pending',
            'total_cost' => 50000,
            'breakdown' => ['flights' => 25000, 'hotels' => 25000],
            'accommodation_level' => 'mid-range',
            'flight_class' => 'economy',
            'nights' => 7,
            'match_ids' => [1, 2],
        ]);

        $response = $this->actingAs($partner)->get(route('partner.requests.show', $budget->id));
        $response->assertStatus(200);
    }

    public function test_partner_can_update_budget_request(): void
    {
        $partner = $this->createPartner();
        $budget = Budget::create([
            'user_id' => User::factory()->create()->id,
            'is_active' => true,
            'partner_status' => 'pending',
            'total_cost' => 50000,
            'breakdown' => ['flights' => 25000, 'hotels' => 25000],
            'accommodation_level' => 'mid-range',
            'flight_class' => 'economy',
            'nights' => 7,
            'match_ids' => [1, 2],
        ]);

        $response = $this->actingAs($partner)->put(route('partner.requests.update', $budget->id), [
            'partner_cost' => 45000,
            'partner_breakdown' => ['flights' => 20000, 'hotels' => 15000, 'tickets' => 10000],
            'partner_notes' => 'Special discount applied',
            'status' => 'modified',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('budgets', [
            'id' => $budget->id,
            'partner_status' => 'modified',
            'partner_cost' => 45000,
        ]);
    }

    public function test_partner_can_update_profile(): void
    {
        $partner = $this->createPartner();

        $response = $this->actingAs($partner)->post(route('partner.profile.update'), [
            'name' => 'Updated Partner Name',
            'phone' => '+254700000000',
            'company_name' => 'Updated Travel Co',
            'company_address' => '123 Nairobi St',
        ]);

        $response->assertRedirect();
    }

    public function test_partner_messages_store_requires_budget_id(): void
    {
        $partner = $this->createPartner();

        $response = $this->actingAs($partner)->post(route('partner.messages.store'), [
            'budget_id' => '',
            'body' => 'Hello',
        ]);

        $response->assertSessionHasErrors();
    }
}
