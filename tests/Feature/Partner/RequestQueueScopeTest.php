<?php

namespace Tests\Feature\Partner;

use App\Models\Budget;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Sprint 56 — a partner's Convert queue is their own briefs and nobody
 * else's.
 *
 * Two holes, both from the Sprint 10 pivot:
 *
 *  - `baseQuery()` fell back to EVERY active budget on the platform when the
 *    partner had published no listings. The seeded ticketing partner has
 *    none, so signing in as one showed every fan's travel brief and put
 *    platform-wide totals on the dashboard tiles as if they were that
 *    partner's own.
 *  - `show()` and `update()` had no ownership check at all, so any partner
 *    could open any budget by id — fan itinerary, costs, notes — and
 *    overwrite its quote, which then notified the fan.
 */
class RequestQueueScopeTest extends TestCase
{
    use RefreshDatabase;

    private function partnerWithListing(): array
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'travel_agent']);
        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
        ]);

        return [$partner, $listing];
    }

    private function brief(?Listing $listing, string $status = 'pending'): Budget
    {
        return Budget::create([
            'user_id' => User::factory()->create()->id,
            'listing_id' => $listing?->id,
            'tournament_id' => 'afcon_2027',
            'total_cost' => 2400,
            'partner_status' => $status,
            'accommodation_level' => 'premium',
            'flight_class' => 'economy',
            'nights' => 7,
            'match_ids' => [1, 2],
            'breakdown' => ['flights' => 900, 'hotel' => 700],
            'is_active' => true,
        ]);
    }

    public function test_a_partner_sees_only_briefs_for_their_own_listings(): void
    {
        [$mine, $myListing] = $this->partnerWithListing();
        [, $theirListing] = $this->partnerWithListing();

        $this->brief($myListing);
        $this->brief($theirListing);
        $this->brief(null); // no listing — belongs to no partner

        $props = $this->actingAs($mine)->get(route('partner.dashboard'))->viewData('page')['props'];

        $this->assertCount(1, $props['requests']);
        $this->assertSame(1, $props['stats']['pending']);
    }

    public function test_a_partner_with_no_listings_sees_an_empty_queue_not_everyone_elses(): void
    {
        [, $someoneElsesListing] = $this->partnerWithListing();
        $this->brief($someoneElsesListing);
        $this->brief(null);

        // A travel partner who has not published anything yet — the case the
        // Sprint 10 fallback was written for. (A ticketing partner gets its
        // own dashboard variant now; see PartnerDashboardVariantsTest.)
        $unpublished = User::factory()->partner()->create(['partner_type' => 'travel_agent']);

        $props = $this->actingAs($unpublished)->get(route('partner.dashboard'))->viewData('page')['props'];

        $this->assertCount(0, $props['requests'], 'A partner with no listings must not see other partners\' briefs.');
        $this->assertSame(0, $props['stats']['pending']);
        $this->assertFalse($props['hasListings'], 'The page needs to know so it can say why the queue is empty.');
    }

    public function test_revenue_counts_only_this_partners_approved_briefs(): void
    {
        [$mine, $myListing] = $this->partnerWithListing();
        [, $theirListing] = $this->partnerWithListing();

        $this->brief($myListing, 'approved')->update(['partner_cost' => 1500]);
        $this->brief($theirListing, 'approved')->update(['partner_cost' => 9000]);

        $props = $this->actingAs($mine)->get(route('partner.dashboard'))->viewData('page')['props'];

        $this->assertEquals(1500, $props['stats']['total_revenue']);
    }

    public function test_a_partner_cannot_open_another_partners_brief(): void
    {
        [$mine] = $this->partnerWithListing();
        [, $theirListing] = $this->partnerWithListing();
        $theirBrief = $this->brief($theirListing);

        $this->actingAs($mine)
            ->get(route('partner.requests.show', $theirBrief))
            ->assertForbidden();
    }

    public function test_a_partner_cannot_quote_on_another_partners_brief(): void
    {
        Notification::fake();

        [$mine] = $this->partnerWithListing();
        [, $theirListing] = $this->partnerWithListing();
        $theirBrief = $this->brief($theirListing);

        $this->actingAs($mine)
            ->put(route('partner.requests.update', $theirBrief), [
                'partner_cost' => 1,
                'partner_breakdown' => ['flights' => 1],
                'status' => 'approved',
            ])
            ->assertForbidden();

        $this->assertNull($theirBrief->fresh()->partner_cost);
        Notification::assertNothingSent();
    }

    public function test_a_partner_can_still_open_and_quote_their_own_brief(): void
    {
        Notification::fake();

        [$mine, $myListing] = $this->partnerWithListing();
        $brief = $this->brief($myListing);

        $this->actingAs($mine)->get(route('partner.requests.show', $brief))->assertOk();

        $this->actingAs($mine)
            ->put(route('partner.requests.update', $brief), [
                'partner_cost' => 2600,
                'partner_breakdown' => ['flights' => 900, 'hotel' => 700],
                'partner_notes' => 'Includes airport transfers.',
                'status' => 'approved',
            ])
            ->assertRedirect();

        $this->assertEquals(2600, $brief->fresh()->partner_cost);
        $this->assertSame('approved', $brief->fresh()->partner_status);
    }
}
