<?php

namespace Tests\Feature\Admin;

use App\Models\LoanApplication;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 25 — /admin/loan-applications finance-partner overhaul.
 */
class LoanApplicationsAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    private function fan(): User
    {
        return User::factory()->create(['is_partner' => false, 'is_admin' => false]);
    }

    private function financePartner(string $slug, string $name): User
    {
        $u = User::factory()->partner()->create([
            'partner_type' => 'finance_partner',
            'verification_status' => 'verified',
        ]);
        PartnerProfile::create([
            'user_id' => $u->id,
            'slug' => $slug,
            'display_name' => $name,
            'is_public' => true,
        ]);

        return $u;
    }

    public function test_page_hydrates_finance_partners_and_partner_block_on_each_loan(): void
    {
        $bank = $this->financePartner('ecobank', 'Ecobank');
        LoanApplication::create([
            'user_id' => $this->fan()->id,
            'finance_partner_id' => $bank->id,
            'amount' => 3200, 'purpose' => 'Trip', 'status' => 'PENDING',
        ]);
        LoanApplication::create([
            'user_id' => $this->fan()->id,
            'finance_partner_id' => null, // unrouted
            'amount' => 1000, 'purpose' => 'x', 'status' => 'PENDING',
        ]);

        $props = $this->actingAs($this->admin())
            ->get(route('admin.loan-applications'))
            ->viewData('page')['props'];

        $this->assertCount(1, $props['finance_partners']);
        $this->assertSame(2, $props['stats']['total']);
        $this->assertSame(1, $props['stats']['unrouted']);

        $rows = $props['loans']['data'];
        $routed = collect($rows)->firstWhere('partner.slug', 'ecobank');
        $this->assertNotNull($routed);
        $unrouted = collect($rows)->firstWhere('partner', null);
        $this->assertNotNull($unrouted);
    }

    public function test_status_filter_narrows_the_list(): void
    {
        $bank = $this->financePartner('bank', 'Bank');
        LoanApplication::create([
            'user_id' => $this->fan()->id, 'finance_partner_id' => $bank->id,
            'amount' => 1, 'purpose' => 'a', 'status' => 'PENDING',
        ]);
        LoanApplication::create([
            'user_id' => $this->fan()->id, 'finance_partner_id' => $bank->id,
            'amount' => 1, 'purpose' => 'b', 'status' => 'APPROVED',
        ]);

        $props = $this->actingAs($this->admin())
            ->get(route('admin.loan-applications', ['status' => 'APPROVED']))
            ->viewData('page')['props'];

        $this->assertCount(1, $props['loans']['data']);
        $this->assertSame('APPROVED', $props['loans']['data'][0]['status']);
    }

    public function test_partner_filter_narrows_the_list(): void
    {
        $a = $this->financePartner('a', 'Alpha');
        $b = $this->financePartner('b', 'Beta');
        LoanApplication::create([
            'user_id' => $this->fan()->id, 'finance_partner_id' => $a->id,
            'amount' => 1, 'purpose' => 'x', 'status' => 'PENDING',
        ]);
        LoanApplication::create([
            'user_id' => $this->fan()->id, 'finance_partner_id' => $b->id,
            'amount' => 1, 'purpose' => 'y', 'status' => 'PENDING',
        ]);

        $props = $this->actingAs($this->admin())
            ->get(route('admin.loan-applications', ['finance_partner_id' => $a->id]))
            ->viewData('page')['props'];

        $this->assertCount(1, $props['loans']['data']);
    }

    public function test_unrouted_filter_shows_only_orphaned_loans(): void
    {
        $bank = $this->financePartner('bank', 'Bank');
        LoanApplication::create([
            'user_id' => $this->fan()->id, 'finance_partner_id' => $bank->id,
            'amount' => 1, 'purpose' => 'x', 'status' => 'PENDING',
        ]);
        LoanApplication::create([
            'user_id' => $this->fan()->id, 'finance_partner_id' => null,
            'amount' => 1, 'purpose' => 'y', 'status' => 'PENDING',
        ]);

        $props = $this->actingAs($this->admin())
            ->get(route('admin.loan-applications', ['finance_partner_id' => 'unrouted']))
            ->viewData('page')['props'];

        $this->assertCount(1, $props['loans']['data']);
        $this->assertNull($props['loans']['data'][0]['partner']);
    }

    public function test_admin_can_route_an_unrouted_loan_to_a_finance_partner(): void
    {
        $bank = $this->financePartner('bank', 'Bank');
        $loan = LoanApplication::create([
            'user_id' => $this->fan()->id, 'finance_partner_id' => null,
            'amount' => 2000, 'purpose' => 'x', 'status' => 'PENDING',
        ]);

        $this->actingAs($this->admin())
            ->put(route('admin.loan-applications.update', $loan->id), [
                'status' => 'PENDING',
                'finance_partner_id' => $bank->id,
            ])
            ->assertRedirect();

        $this->assertSame($bank->id, $loan->fresh()->finance_partner_id);
    }

    public function test_admin_cannot_route_to_a_non_finance_user(): void
    {
        $notFinance = User::factory()->partner()->create(['partner_type' => 'travel_agent']);
        $loan = LoanApplication::create([
            'user_id' => $this->fan()->id, 'finance_partner_id' => null,
            'amount' => 1, 'purpose' => 'x', 'status' => 'PENDING',
        ]);

        $this->actingAs($this->admin())
            ->put(route('admin.loan-applications.update', $loan->id), [
                'status' => 'PENDING',
                'finance_partner_id' => $notFinance->id,
            ])
            ->assertRedirect();

        // The controller silently drops non-finance routes.
        $this->assertNull($loan->fresh()->finance_partner_id);
    }
}
