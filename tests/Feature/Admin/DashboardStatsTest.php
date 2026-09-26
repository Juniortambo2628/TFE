<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 56 — the admin dashboard's headline numbers mean what they say.
 *
 * "Registered fans" read `total_users`, which counts partners and staff too,
 * so the tile disagreed with the Fans bar in the chart directly beneath it.
 * And `userGrowth` was queried on every page load and rendered nowhere; now
 * that it is a chart, it has to be zero-filled — a grouped query returns
 * only the days that had a signup, so drawing it raw closes the gaps and a
 * quiet week looks busy.
 */
class DashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function props(User $admin): array
    {
        return $this->actingAs($admin)->get(route('admin.dashboard'))->viewData('page')['props'];
    }

    public function test_registered_fans_counts_fans_not_every_account(): void
    {
        $admin = $this->admin();
        User::factory()->count(3)->create(['is_admin' => false, 'is_partner' => false]);
        User::factory()->count(2)->partner()->create();

        $props = $this->props($admin);

        $this->assertSame(3, $props['stats']['total_fans'], 'Fans only — no partners, no staff.');
        $this->assertSame(6, $props['stats']['total_users'], 'Everyone, for the role chart.');

        // The tile and the chart bar beside it must agree.
        $fansBar = collect($props['usersByRole'])->firstWhere('Tier', 'Fans');
        $this->assertSame($props['stats']['total_fans'], $fansBar['Users']);
    }

    public function test_new_today_counts_fans_who_signed_up_today(): void
    {
        $admin = $this->admin();
        User::factory()->create(['is_admin' => false, 'is_partner' => false]);
        User::factory()->create(['is_admin' => false, 'is_partner' => false, 'created_at' => now()->subWeek()]);
        User::factory()->partner()->create();

        $this->assertSame(1, $this->props($admin)['stats']['new_fans_today']);
    }

    public function test_the_growth_series_is_seven_days_of_fans_zero_filled(): void
    {
        $admin = $this->admin();
        User::factory()->count(2)->create([
            'is_admin' => false, 'is_partner' => false, 'created_at' => now()->subDays(3),
        ]);
        // A partner signing up must not show in a fan-reach chart.
        User::factory()->partner()->create(['created_at' => now()->subDays(3)]);

        $growth = $this->props($admin)['userGrowth'];

        $this->assertCount(7, $growth, 'One bucket per day, whether or not anyone signed up.');
        $this->assertSame(2, collect($growth)->firstWhere('Signups', 2)['Signups']);
        $this->assertGreaterThan(0, collect($growth)->where('Signups', 0)->count(), 'Quiet days must be present as zero.');
        $this->assertSame(array_keys($growth[0]), ['date', 'Signups']);
    }

    public function test_recent_sign_ups_are_fans_so_the_two_activity_cards_do_not_repeat(): void
    {
        $admin = $this->admin();
        $fan = User::factory()->create(['is_admin' => false, 'is_partner' => false, 'name' => 'A Fan']);
        User::factory()->partner()->create(['name' => 'A Partner']);

        $names = collect($this->props($admin)['recentUsers'])->pluck('name');

        $this->assertTrue($names->contains('A Fan'));
        $this->assertFalse($names->contains('A Partner'), 'Partners have their own card beside this one.');
    }
}
