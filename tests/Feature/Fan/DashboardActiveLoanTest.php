<?php

namespace Tests\Feature\Fan;

use App\Models\LoanApplication;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 16 — active-loan tile on the Fan Dashboard.
 */
class DashboardActiveLoanTest extends TestCase
{
    use RefreshDatabase;

    private function fan(): User
    {
        return User::factory()->create(['is_partner' => false, 'is_admin' => false]);
    }

    private function bank(): User
    {
        $u = User::factory()->partner()->create([
            'partner_type' => 'finance_partner',
            'verification_status' => 'verified',
        ]);
        PartnerProfile::create([
            'user_id' => $u->id,
            'slug' => 'ecobank',
            'display_name' => 'Ecobank',
            'theme_accent' => '#0072CE',
            'is_public' => true,
        ]);

        return $u;
    }

    private function props(User $fan)
    {
        return $this->actingAs($fan)
            ->get(route('fan.dashboard'))
            ->viewData('page')['props'];
    }

    public function test_active_loan_prop_is_null_without_any_loans(): void
    {
        $this->assertNull($this->props($this->fan())['activeLoan']);
    }

    public function test_active_loan_hydrates_pending_application_with_partner_brand(): void
    {
        $fan = $this->fan();
        $bank = $this->bank();

        $loan = LoanApplication::create([
            'user_id' => $fan->id,
            'finance_partner_id' => $bank->id,
            'amount' => 3500,
            'purpose' => 'AFCON trip',
            'status' => 'PENDING',
        ]);

        $tile = $this->props($fan)['activeLoan'];
        $this->assertNotNull($tile);
        $this->assertSame($loan->id, $tile['id']);
        $this->assertSame('PENDING', $tile['status']);
        $this->assertSame(3500.0, (float) $tile['amount']);
        $this->assertSame('ecobank', $tile['partner']['slug']);
        $this->assertTrue($tile['partner']['verified']);
    }

    public function test_rejected_loans_are_not_surfaced(): void
    {
        $fan = $this->fan();
        LoanApplication::create([
            'user_id' => $fan->id,
            'amount' => 3000,
            'purpose' => 'x',
            'status' => 'REJECTED',
        ]);
        $this->assertNull($this->props($fan)['activeLoan']);
    }

    public function test_most_recent_in_flight_loan_wins(): void
    {
        $fan = $this->fan();
        $older = LoanApplication::create([
            'user_id' => $fan->id,
            'amount' => 1000, 'purpose' => 'old', 'status' => 'PENDING',
        ]);
        $older->update(['created_at' => now()->subDays(5)]);

        $newer = LoanApplication::create([
            'user_id' => $fan->id,
            'amount' => 4200, 'purpose' => 'new', 'status' => 'APPROVED',
        ]);

        $tile = $this->props($fan)['activeLoan'];
        $this->assertSame($newer->id, $tile['id']);
        $this->assertSame('APPROVED', $tile['status']);
    }
}
