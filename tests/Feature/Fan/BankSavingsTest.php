<?php

namespace Tests\Feature\Fan;

use App\Models\BankSavingsLink;
use App\Models\Booking;
use App\Models\SavingsGoal;
use App\Models\User;
use App\Savings\SandboxBankProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Saving for a trip with a bank partner (Sprint 67) — against the sandbox bank.
 */
class BankSavingsTest extends TestCase
{
    use RefreshDatabase;

    private function goal(User $fan): SavingsGoal
    {
        return SavingsGoal::create([
            'user_id' => $fan->id, 'name' => 'AFCON 2027', 'target_amount' => 140000,
            'current_amount' => 0, 'currency' => 'KES', 'target_date' => now()->addMonths(6), 'status' => 'active',
        ]);
    }

    /** Open an account through the sandbox bank's onboarding, as a fan would. */
    private function openAccount(User $fan, SavingsGoal $goal): BankSavingsLink
    {
        $res = $this->actingAs($fan)->post(route('fan.bank-savings.connect', $goal), ['consent' => '1'], ['X-Inertia' => 'true']);
        $onboardUrl = $res->headers->get('X-Inertia-Location');
        $this->assertStringContainsString('/sandbox-bank/onboard', $onboardUrl);

        $back = $this->actingAs($fan)->post($onboardUrl, [], ['X-Inertia' => 'true'])->headers->get('X-Inertia-Location');
        $this->actingAs($fan)->get($back)->assertRedirect();

        return BankSavingsLink::firstOrFail();
    }

    private function fresh(): array
    {
        return ['auth.password_confirmed_at' => time()];
    }

    public function test_tfe_stores_a_link_and_consent_but_no_financial_data(): void
    {
        $columns = Schema::getColumnListing('bank_savings_links');
        foreach (['balance', 'amount', 'account_number', 'transactions'] as $forbidden) {
            $this->assertNotContains($forbidden, $columns, "bank_savings_links must not hold {$forbidden}");
        }

        $fan = User::factory()->create();
        $link = $this->openAccount($fan, $this->goal($fan));

        $this->assertTrue($link->isActive());
        $this->assertSame(BankSavingsLink::SCOPES, $link->consent_scopes);
        // The account reference is encrypted at rest.
        $raw = \DB::table('bank_savings_links')->value('external_ref');
        $this->assertNotSame($link->external_ref, $raw);
    }

    public function test_connecting_needs_consent(): void
    {
        $fan = User::factory()->create();
        $this->actingAs($fan)->post(route('fan.bank-savings.connect', $this->goal($fan)))->assertSessionHasErrors('consent');
        $this->assertSame(0, BankSavingsLink::count());
    }

    public function test_savings_are_shown_only_after_a_fresh_password_check_and_never_cached(): void
    {
        $fan = User::factory()->create();
        $link = $this->openAccount($fan, $this->goal($fan));
        SandboxBankProvider::credit($link->external_ref, 20000, 'KES');

        $this->actingAs($fan)->withSession(['auth.password_confirmed_at' => time() - 3600])
            ->get(route('fan.bank-savings.show', $link))
            ->assertRedirect(route('password.confirm'));

        $res = $this->actingAs($fan)->withSession($this->fresh())->get(route('fan.bank-savings.show', $link))->assertOk();
        $props = $res->viewData('page')['props'];
        $this->assertEquals(20000, $props['balances']['KES']);
        $this->assertCount(1, $props['transactions']);
        $this->assertStringContainsString('no-store', $res->headers->get('Cache-Control'));
    }

    public function test_another_fan_cannot_see_the_account(): void
    {
        $owner = User::factory()->create();
        $link = $this->openAccount($owner, $this->goal($owner));

        $this->actingAs(User::factory()->create())->withSession($this->fresh())
            ->get(route('fan.bank-savings.show', $link))->assertForbidden();
    }

    public function test_the_bank_pays_a_booking_only_with_the_fans_authorisation(): void
    {
        $fan = User::factory()->create();
        $link = $this->openAccount($fan, $this->goal($fan));
        SandboxBankProvider::credit($link->external_ref, 2000, 'USD');
        $booking = Booking::create([
            'user_id' => $fan->id, 'tournament_id' => 'afcon_2027', 'package_name' => 'Weekender', 'package_type' => 'Weekender',
            'status' => 'pending_payment', 'total_amount' => 1500, 'currency' => 'USD', 'amount_paid' => 0,
            'booking_date' => now(), 'expires_at' => now()->addDay(), 'flight_info' => 'economy', 'accommodation' => '3_star', 'matches' => [],
        ]);

        $this->actingAs($fan)->withSession($this->fresh())
            ->post(route('fan.bookings.pay-from-savings', $booking), ['link_id' => $link->id])
            ->assertSessionHasErrors('authorise');
        $this->assertSame('pending_payment', $booking->fresh()->status);

        $this->actingAs($fan)->withSession($this->fresh())
            ->post(route('fan.bookings.pay-from-savings', $booking), ['link_id' => $link->id, 'authorise' => '1'])
            ->assertRedirect(route('fan.bookings.show', $booking));

        $this->assertSame('confirmed', $booking->fresh()->status);
        $this->assertEquals(500, app(SandboxBankProvider::class)->balances($link->external_ref)['balances']['USD']);
    }

    public function test_the_bank_declines_when_there_is_not_enough_saved(): void
    {
        $fan = User::factory()->create();
        $link = $this->openAccount($fan, $this->goal($fan));
        SandboxBankProvider::credit($link->external_ref, 100, 'USD');
        $booking = Booking::create([
            'user_id' => $fan->id, 'tournament_id' => 'afcon_2027', 'package_name' => 'W', 'package_type' => 'W',
            'status' => 'pending_payment', 'total_amount' => 1500, 'currency' => 'USD', 'amount_paid' => 0,
            'booking_date' => now(), 'expires_at' => now()->addDay(), 'flight_info' => 'economy', 'accommodation' => '3_star', 'matches' => [],
        ]);

        $this->actingAs($fan)->withSession($this->fresh())
            ->post(route('fan.bookings.pay-from-savings', $booking), ['link_id' => $link->id, 'authorise' => '1'])
            ->assertSessionHas('error');
        $this->assertSame('pending_payment', $booking->fresh()->status);
    }

    public function test_disconnecting_forgets_the_link_but_not_the_bank_account(): void
    {
        $fan = User::factory()->create();
        $link = $this->openAccount($fan, $this->goal($fan));
        $ref = $link->external_ref;

        $this->actingAs($fan)->delete(route('fan.bank-savings.disconnect', $link));

        $this->assertSame(0, BankSavingsLink::count());
        $this->assertTrue(\DB::table('sandbox_bank_accounts')->where('ref', $ref)->exists());
    }
}
