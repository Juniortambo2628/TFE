<?php

namespace Tests\Feature\Partner;

use App\Models\Budget;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Convert tab — Partner\DashboardController scopes the budget queue by the
 * partner's own listings.
 *
 * Sprint 10 added a fallback so a partner with no published inventory saw
 * the global queue instead of nothing ("legacy partners", mid-pivot).
 * Sprint 56 removed it: the pivot is long done, the seeded ticketing partner
 * publishes nothing, and the effect was that signing in as one showed every
 * fan's travel brief with platform-wide totals on the dashboard tiles. An
 * empty queue is the truth, and the page now says how to fill it.
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

    public function test_partner_with_no_listings_sees_an_empty_queue(): void
    {
        $me = User::factory()->partner()->create();
        $orphan = $this->seedBudget(null);

        $other = User::factory()->partner()->create();
        $theirListing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $other->id,
        ]);
        $theirs = $this->seedBudget($theirListing->id);

        $response = $this->actingAs($me)->get(route('partner.requests'));
        $response->assertStatus(200);
        $requests = $response->viewData('page')['props']['requests'];

        // Was: fell through to every active budget on the platform.
        $ids = collect($requests)->pluck('id')->all();
        $this->assertNotContains($orphan->id, $ids);
        $this->assertNotContains($theirs->id, $ids);
        $this->assertFalse($response->viewData('page')['props']['hasListings']);
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
