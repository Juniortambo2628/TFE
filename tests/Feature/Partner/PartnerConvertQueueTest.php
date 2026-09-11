<?php

namespace Tests\Feature\Partner;

use App\Models\Budget;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 10 Convert tab — Partner\DashboardController scopes the
 * budget queue by the partner's own listings once they publish
 * anything, and falls through to the global queue for legacy
 * partners with no inventory.
 */
class PartnerConvertQueueTest extends TestCase
{
    use RefreshDatabase;

    private function seedBudget(?int $listingId, string $status = 'pending'): Budget
    {
        return Budget::create([
            'user_id' => User::factory()->create()->id,
            'listing_id' => $listingId,
            'is_active' => true,
            'partner_status' => $status,
            'total_cost' => 42000,
            'breakdown' => ['flights' => 20000, 'hotels' => 22000],
            'accommodation_level' => '4_star',
            'flight_class' => 'economy',
            'nights' => 5,
            'match_ids' => [1],
        ]);
    }

    public function test_partner_with_listings_sees_only_their_listing_budgets(): void
    {
        $me = User::factory()->partner()->create();
        $them = User::factory()->partner()->create();

        $myListing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $me->id,
        ]);
        $theirListing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $them->id,
        ]);

        $mine = $this->seedBudget($myListing->id);
        $theirs = $this->seedBudget($theirListing->id);
        $orphan = $this->seedBudget(null); // no listing at all

        $response = $this->actingAs($me)->get(route('partner.requests'));
        $response->assertStatus(200);
        $requests = $response->viewData('page')['props']['requests'];

        $ids = collect($requests)->pluck('id')->all();
        $this->assertContains($mine->id, $ids);
        $this->assertNotContains($theirs->id, $ids);
        $this->assertNotContains($orphan->id, $ids);
    }

    public function test_partner_with_no_listings_falls_through_to_global_queue(): void
    {
        $me = User::factory()->partner()->create();
        $someone = $this->seedBudget(null);

        $response = $this->actingAs($me)->get(route('partner.requests'));
        $response->assertStatus(200);
        $requests = $response->viewData('page')['props']['requests'];

        $this->assertContains($someone->id, collect($requests)->pluck('id')->all());
    }

    public function test_dashboard_stats_use_the_scoped_queue(): void
    {
        $me = User::factory()->partner()->create();
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $me->id,
        ]);

        $this->seedBudget($listing->id, 'pending');
        $this->seedBudget($listing->id, 'approved');
        $this->seedBudget(null, 'pending'); // out of scope — must not count

        $response = $this->actingAs($me)->get(route('partner.dashboard'));
        $stats = $response->viewData('page')['props']['stats'];

        $this->assertSame(1, $stats['pending']);
        $this->assertSame(1, $stats['approved']);
    }
}
