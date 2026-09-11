<?php

namespace Tests\Feature\Fan;

use App\Models\LoanApplication;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 15 — fan-side "My Financing" surface.
 *
 * The index route already existed; this covers the polished payload:
 * hydrated partner brand, budget summary, rollup tiles, and the
 * finance-partners picker payload for the "new application" form.
 */
class LoanApplicationsTest extends TestCase
{
    use RefreshDatabase;

    private function fan(): User
    {
        return User::factory()->create(['is_partner' => false, 'is_admin' => false]);
    }

    private function financePartner(string $slug, string $display): User
    {
        $u = User::factory()->partner()->create([
            'partner_type' => 'finance_partner',
            'verification_status' => 'verified',
        ]);
        PartnerProfile::create([
            'user_id' => $u->id,
            'slug' => $slug,
            'display_name' => $display,
            'theme_accent' => '#0072CE',
            'is_public' => true,
        ]);

        return $u;
    }

    public function test_fan_sees_only_their_own_loans(): void
    {
        $me = $this->fan();
        $them = $this->fan();
        $bank = $this->financePartner('bank', 'Bank');

        LoanApplication::create([
            'user_id' => $me->id,
            'finance_partner_id' => $bank->id,
            'amount' => 2000,
            'purpose' => 'Mine',
            'status' => 'PENDING',
        ]);
        LoanApplication::create([
            'user_id' => $them->id,
            'finance_partner_id' => $bank->id,
            'amount' => 3000,
            'purpose' => 'Not mine',
            'status' => 'PENDING',
        ]);

        $props = $this->actingAs($me)
            ->get(route('fan.loan-applications'))
            ->viewData('page')['props'];

        $this->assertCount(1, $props['loans']);
        $this->assertSame('Mine', $props['loans'][0]['purpose']);
    }

    public function test_each_loan_carries_partner_brand_when_routed(): void
    {
        $fan = $this->fan();
        $bank = $this->financePartner('ecobank', 'Ecobank');

        LoanApplication::create([
            'user_id' => $fan->id,
            'finance_partner_id' => $bank->id,
            'amount' => 3200,
            'purpose' => 'Trip',
            'status' => 'APPROVED',
            'interest_rate' => 12.5,
        ]);

        $loans = $this->actingAs($fan)
            ->get(route('fan.loan-applications'))
            ->viewData('page')['props']['loans'];

        $this->assertNotNull($loans[0]['partner']);
        $this->assertSame('ecobank', $loans[0]['partner']['slug']);
        $this->assertSame('Ecobank', $loans[0]['partner']['display_name']);
        $this->assertTrue($loans[0]['partner']['verified']);
        $this->assertSame(12.5, (float) $loans[0]['interest_rate']);
    }

    public function test_loan_without_finance_partner_has_null_partner_block(): void
    {
        $fan = $this->fan();
        LoanApplication::create([
            'user_id' => $fan->id,
            'finance_partner_id' => null,
            'amount' => 1200,
            'purpose' => 'Untargeted',
            'status' => 'PENDING',
        ]);

        $loans = $this->actingAs($fan)
            ->get(route('fan.loan-applications'))
            ->viewData('page')['props']['loans'];

        $this->assertNull($loans[0]['partner']);
    }

    public function test_stat_rollup_sums_approved_and_disbursed(): void
    {
        $fan = $this->fan();
        $bank = $this->financePartner('bank', 'Bank');

        LoanApplication::create([
            'user_id' => $fan->id, 'finance_partner_id' => $bank->id,
            'amount' => 1000, 'purpose' => 'a', 'status' => 'PENDING',
        ]);
        LoanApplication::create([
            'user_id' => $fan->id, 'finance_partner_id' => $bank->id,
            'amount' => 2000, 'purpose' => 'b', 'status' => 'APPROVED',
        ]);
        LoanApplication::create([
            'user_id' => $fan->id, 'finance_partner_id' => $bank->id,
            'amount' => 3000, 'purpose' => 'c', 'status' => 'DISBURSED',
        ]);
        LoanApplication::create([
            'user_id' => $fan->id, 'finance_partner_id' => $bank->id,
            'amount' => 500, 'purpose' => 'd', 'status' => 'REJECTED',
        ]);

        $stats = $this->actingAs($fan)
            ->get(route('fan.loan-applications'))
            ->viewData('page')['props']['stats'];

        $this->assertSame(4, $stats['total']);
        $this->assertSame(1, $stats['pending']);
        // APPROVED + DISBURSED = 5000
        $this->assertSame(5000.0, (float) $stats['approved_amount']);
        // DISBURSED only = 3000
        $this->assertSame(3000.0, (float) $stats['disbursed_amount']);
    }

    public function test_finance_partners_picker_payload_is_shaped(): void
    {
        $this->financePartner('a', 'Alpha');
        $this->financePartner('b', 'Beta');

        $partners = $this->actingAs($this->fan())
            ->get(route('fan.loan-applications'))
            ->viewData('page')['props']['financePartners'];

        $this->assertCount(2, $partners);
        $this->assertSame(
            ['id', 'slug', 'display_name', 'tagline', 'logo_url', 'theme_accent', 'verified'],
            array_keys($partners[0]),
        );
    }
}
