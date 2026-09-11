<?php

namespace Tests\Feature;

use App\Models\LoanApplication;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 14 — finance-partner archetype: routing, scoping, and the
 * loan review authz.
 */
class FinancePartnerTest extends TestCase
{
    use RefreshDatabase;

    private function financePartner(): User
    {
        $u = User::factory()->partner()->create([
            'partner_type' => 'finance_partner',
            'verification_status' => 'verified',
        ]);
        PartnerProfile::create([
            'user_id' => $u->id,
            'slug' => 'ecobank-'.$u->id,
            'display_name' => 'Ecobank '.$u->id,
            'is_public' => true,
        ]);

        return $u;
    }

    private function fan(): User
    {
        return User::factory()->create(['is_partner' => false, 'is_admin' => false]);
    }

    public function test_budget_calculator_exposes_public_finance_partners(): void
    {
        $this->financePartner();
        $this->financePartner();

        session(['active_tournament_id' => 'afcon_2027']);
        $props = $this->actingAs($this->fan())
            ->get(route('fan.budget-calculator'))
            ->viewData('page')['props'];

        $this->assertArrayHasKey('financePartners', $props);
        $this->assertCount(2, $props['financePartners']);
        $this->assertSame(['id', 'slug', 'display_name', 'tagline', 'logo_url', 'theme_accent', 'verified'],
            array_keys($props['financePartners'][0]));
    }

    public function test_fan_can_route_a_loan_application_to_a_finance_partner(): void
    {
        $fan = $this->fan();
        $bank = $this->financePartner();

        $this->actingAs($fan)->post(route('fan.loan-applications.store'), [
            'amount' => 3500,
            'purpose' => 'AFCON 2027 semis',
            'finance_partner_id' => $bank->id,
        ])->assertRedirect();

        $this->assertDatabaseHas('loan_applications', [
            'user_id' => $fan->id,
            'finance_partner_id' => $bank->id,
            'amount' => 3500,
            'status' => 'PENDING',
        ]);
    }

    public function test_bogus_finance_partner_id_is_silently_dropped(): void
    {
        $fan = $this->fan();
        // A travel-agent user id — not a finance partner. Should be
        // ignored rather than accepted or 422'd (fan-facing form should
        // still succeed with an admin-queued application).
        $travel = User::factory()->partner()->create(['partner_type' => 'travel_agent']);

        $this->actingAs($fan)->post(route('fan.loan-applications.store'), [
            'amount' => 2000,
            'purpose' => 'Trip',
            'finance_partner_id' => $travel->id,
        ])->assertRedirect();

        $loan = LoanApplication::firstOrFail();
        $this->assertNull($loan->finance_partner_id);
    }

    public function test_finance_partner_dashboard_shows_only_their_pipeline(): void
    {
        $me = $this->financePartner();
        $them = $this->financePartner();
        $fan = $this->fan();

        LoanApplication::create([
            'user_id' => $fan->id,
            'finance_partner_id' => $me->id,
            'amount' => 4000,
            'purpose' => 'Mine',
            'status' => 'PENDING',
        ]);
        LoanApplication::create([
            'user_id' => $fan->id,
            'finance_partner_id' => $them->id,
            'amount' => 5000,
            'purpose' => 'Theirs',
            'status' => 'PENDING',
        ]);

        $props = $this->actingAs($me)
            ->get(route('partner.dashboard'))
            ->viewData('page')['props'];

        $this->assertSame('finance', $props['variant']);
        $this->assertSame(1, $props['stats']['pending']);
        $this->assertCount(1, $props['requests']);
        $this->assertStringContainsString('Mine', $props['requests'][0]['purpose']);
    }

    public function test_finance_partner_cannot_open_another_partners_loan(): void
    {
        $me = $this->financePartner();
        $them = $this->financePartner();
        $fan = $this->fan();

        $theirs = LoanApplication::create([
            'user_id' => $fan->id,
            'finance_partner_id' => $them->id,
            'amount' => 5000,
            'purpose' => 'Off-limits',
            'status' => 'PENDING',
        ]);

        $this->actingAs($me)
            ->get(route('partner.loans.show', $theirs->id))
            ->assertForbidden();

        $this->actingAs($me)
            ->put(route('partner.loans.update', $theirs->id), ['status' => 'APPROVED'])
            ->assertForbidden();
    }

    public function test_finance_partner_can_approve_their_loan_and_set_rate(): void
    {
        $me = $this->financePartner();
        $fan = $this->fan();
        $loan = LoanApplication::create([
            'user_id' => $fan->id,
            'finance_partner_id' => $me->id,
            'amount' => 4000,
            'purpose' => 'Trip',
            'status' => 'PENDING',
        ]);

        $this->actingAs($me)
            ->put(route('partner.loans.update', $loan->id), [
                'status' => 'APPROVED',
                'interest_rate' => 12.5,
                'notes' => 'Approved with standard terms.',
            ])
            ->assertRedirect();

        $loan->refresh();
        $this->assertSame('APPROVED', $loan->status);
        $this->assertEqualsWithDelta(12.5, $loan->interest_rate, 0.001);
    }

    public function test_travel_partner_loans_route_is_denied(): void
    {
        $travel = User::factory()->partner()->create(['partner_type' => 'travel_agent']);
        $fan = $this->fan();
        $someLoan = LoanApplication::create([
            'user_id' => $fan->id,
            'finance_partner_id' => null,
            'amount' => 1500,
            'purpose' => 'X',
            'status' => 'PENDING',
        ]);

        $this->actingAs($travel)
            ->get(route('partner.loans.show', $someLoan->id))
            ->assertForbidden();
    }
}
