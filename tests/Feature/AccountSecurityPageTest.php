<?php

namespace Tests\Feature;

use App\Models\LoginHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 56 — the security page's "Account standing" pane reports real
 * numbers.
 *
 * `SecurityService` has always counted every sign-in and every failed
 * attempt and shipped them as `stats`, but the shared AccountSecurity
 * component ignored that prop and showed `loginHistory.length` instead — the
 * ten rows the page fetches. An account with 400 sign-ins reported 10, and
 * failed attempts were counted server-side and displayed nowhere.
 *
 * These assert the payload the pane reads, for all three roles (one service,
 * one component, three wrappers).
 */
class AccountSecurityPageTest extends TestCase
{
    use RefreshDatabase;

    /** LoginHistory has no factory — the app only ever writes it on login. */
    private function logins(User $user, int $successful, int $failed): void
    {
        foreach ([[true, $successful], [false, $failed]] as [$ok, $count]) {
            for ($i = 0; $i < $count; $i++) {
                LoginHistory::create([
                    'user_id' => $user->id,
                    'ip_address' => '127.0.0.1',
                    'user_agent' => 'PHPUnit',
                    'device' => 'Desktop',
                    'location' => 'Unknown',
                    'successful' => $ok,
                ]);
            }
        }
    }

    public function test_the_page_ships_total_counts_not_just_the_fetched_rows(): void
    {
        $fan = User::factory()->create(['is_admin' => false, 'is_partner' => false]);
        $this->logins($fan, 14, 3);

        $props = $this->actingAs($fan)
            ->get(route('fan.security'))
            ->viewData('page')['props'];

        // The list itself stays capped — it is a "recent logins" list.
        $this->assertCount(10, $props['loginHistory']);

        // …but the counters behind the pane are the real totals.
        $this->assertSame(17, $props['stats']['login_count']);
        $this->assertSame(3, $props['stats']['failed_logins']);
    }

    public function test_every_role_gets_the_same_security_payload(): void
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'travel_agent']);
        $admin = User::factory()->create(['is_admin' => true]);

        foreach ([[$partner, 'partner.security'], [$admin, 'admin.security']] as [$user, $routeName]) {
            $this->logins($user, 2, 1);

            $props = $this->actingAs($user)
                ->get(route($routeName))
                ->viewData('page')['props'];

            $this->assertSame(3, $props['stats']['login_count'], "{$routeName} must ship login counts");
            $this->assertSame(1, $props['stats']['failed_logins']);
            $this->assertArrayHasKey('security_settings', $props);
            $this->assertArrayHasKey('passkeys', $props);
        }
    }
}
