<?php

namespace Tests\Feature\Fan;

use App\Models\Ticket;
use App\Models\TicketPurchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tiered ticket purchase.
 *
 * `tickets` used to carry one flat price/capacity/sold per fixture, so every
 * seat-map surface showing four tiers was showing invented figures. Inventory
 * now lives in `ticket_tiers`, which makes two things load-bearing:
 *
 *  - the tier id arrives from the client, so it must be scoped to the fixture
 *    in the URL or a fan could pay an Upper price for a VIP seat;
 *  - `tickets.capacity` / `tickets.sold` are DERIVED from the tier rows and
 *    must only ever be written by `Ticket::syncTierTotals()`.
 */
class TicketTierPurchaseTest extends TestCase
{
    use RefreshDatabase;

    private function fan(): User
    {
        return User::factory()->create();
    }

    private function fixture(array $attrs = []): Ticket
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'ticketing_partner']);

        $ticket = Ticket::create(array_merge([
            'tournament_id' => 'afcon_2027',
            'partner_id' => $partner->id,
            'home_team' => 'Kenya',
            'away_team' => 'Nigeria',
            'venue_slug' => 'moi-kasarani',
            'venue_name' => 'Moi International Sports Centre, Kasarani',
            'venue_city' => 'Nairobi',
            'venue_country' => 'Kenya',
            'venue_capacity' => 48000,
            'stage' => 'Group Stage',
            'kickoff_at' => now()->addMonths(3),
            'price' => 60,
            'currency' => 'USD',
            'capacity' => 40000,
            'sold' => 0,
            'is_active' => true,
        ], $attrs));

        $ticket->seedDefaultTiers();

        return $ticket->fresh('tiers');
    }

    public function test_a_fan_buys_seats_in_a_chosen_tier_at_that_tiers_price(): void
    {
        $ticket = $this->fixture();
        $vip = $ticket->tiers->firstWhere('key', 'vip');

        $this->actingAs($this->fan())
            ->post(route('fan.tickets.buy', $ticket->id), [
                'quantity' => 2,
                'ticket_tier_id' => $vip->id,
            ])
            ->assertRedirect(route('fan.tickets.purchases'));

        $purchase = TicketPurchase::sole();

        // 4x the fixture's base price, from the tier — never from the request.
        $this->assertSame('240.00', $purchase->unit_price);
        $this->assertSame('480.00', $purchase->total);
        $this->assertSame($vip->id, $purchase->ticket_tier_id);
        $this->assertSame('VIP', $purchase->tier_name, 'The tier label is snapshotted onto the receipt.');
    }

    public function test_the_sale_lands_on_the_tier_and_the_parent_totals_follow(): void
    {
        $ticket = $this->fixture();
        $upper = $ticket->tiers->firstWhere('key', 'upper');

        $this->actingAs($this->fan())
            ->post(route('fan.tickets.buy', $ticket->id), [
                'quantity' => 5,
                'ticket_tier_id' => $upper->id,
            ]);

        $this->assertSame(5, $upper->fresh()->sold);

        // The parent is derived, not incremented in parallel.
        $fresh = $ticket->fresh('tiers');
        $this->assertSame(5, $fresh->sold);
        $this->assertSame($fresh->tiers->sum('sold'), $fresh->sold);
        $this->assertSame($fresh->tiers->sum('capacity'), $fresh->capacity);
    }

    public function test_a_tier_belonging_to_another_fixture_is_rejected(): void
    {
        // The tier id is client-supplied. Without scoping it to the fixture in
        // the URL, a fan could pay a cheap fixture's price into a dear one.
        $cheap = $this->fixture(['price' => 20]);
        $dear = $this->fixture(['price' => 400, 'kickoff_at' => now()->addMonths(4)]);

        $cheapVip = $cheap->tiers->firstWhere('key', 'vip');

        $this->actingAs($this->fan())
            ->post(route('fan.tickets.buy', $dear->id), [
                'quantity' => 1,
                'ticket_tier_id' => $cheapVip->id,
            ])
            ->assertSessionHasErrors('ticket_tier_id');

        $this->assertSame(0, TicketPurchase::count());
        $this->assertSame(0, $cheapVip->fresh()->sold);
    }

    public function test_a_tier_cannot_be_oversold_even_when_the_fixture_has_room(): void
    {
        $ticket = $this->fixture();
        $vip = $ticket->tiers->firstWhere('key', 'vip');

        // VIP nearly gone, but the fixture as a whole has tens of thousands
        // of seats left — the old flat check would have waved this through.
        $vip->update(['sold' => $vip->capacity - 1]);
        $ticket->syncTierTotals();

        $this->actingAs($this->fan())
            ->post(route('fan.tickets.buy', $ticket->id), [
                'quantity' => 4,
                'ticket_tier_id' => $vip->id,
            ])
            ->assertSessionHasErrors('quantity');

        $this->assertSame(0, TicketPurchase::count());
        $this->assertGreaterThan(0, $ticket->fresh()->remaining, 'The fixture still had room.');
    }

    public function test_a_tier_is_required_once_a_fixture_has_tiers(): void
    {
        $ticket = $this->fixture();

        $this->actingAs($this->fan())
            ->post(route('fan.tickets.buy', $ticket->id), ['quantity' => 1])
            ->assertSessionHasErrors('ticket_tier_id');

        $this->assertSame(0, TicketPurchase::count());
    }

    public function test_an_untiered_legacy_fixture_stays_purchasable(): void
    {
        // Rows predating tiered inventory must not become unbuyable.
        $ticket = $this->fixture();
        $ticket->tiers()->delete();

        $this->actingAs($this->fan())
            ->post(route('fan.tickets.buy', $ticket->id), ['quantity' => 3])
            ->assertRedirect(route('fan.tickets.purchases'));

        $purchase = TicketPurchase::sole();

        $this->assertNull($purchase->ticket_tier_id);
        $this->assertNull($purchase->tier_name);
        $this->assertSame('60.00', $purchase->unit_price, 'Falls back to the fixture price.');
        $this->assertSame(3, $ticket->fresh()->sold);
    }

    public function test_an_inactive_fixture_cannot_be_bought(): void
    {
        $ticket = $this->fixture(['is_active' => false]);

        $this->actingAs($this->fan())
            ->post(route('fan.tickets.buy', $ticket->id), [
                'quantity' => 1,
                'ticket_tier_id' => $ticket->tiers->first()->id,
            ])
            ->assertNotFound();
    }

    public function test_seeding_tiers_is_idempotent_and_never_clobbers_edited_prices(): void
    {
        $ticket = $this->fixture();
        $vip = $ticket->tiers->firstWhere('key', 'vip');
        $vip->update(['price' => 999, 'sold' => 10]);

        $ticket->fresh()->seedDefaultTiers();

        $this->assertSame(4, $ticket->fresh()->tiers()->count(), 'Tiers were duplicated.');
        $this->assertSame('999.00', $vip->fresh()->price);
        $this->assertSame(10, $vip->fresh()->sold);
    }

    public function test_sync_leaves_an_untiered_fixture_alone(): void
    {
        // Zeroing a legacy row's totals because it has no tiers would silently
        // wipe its sales history.
        $ticket = $this->fixture(['sold' => 0]);
        $ticket->tiers()->delete();
        $ticket->forceFill(['capacity' => 40000, 'sold' => 12345])->save();

        $ticket->fresh()->syncTierTotals();

        $this->assertSame(12345, $ticket->fresh()->sold);
        $this->assertSame(40000, $ticket->fresh()->capacity);
    }

    public function test_the_tickets_page_exposes_tiers_and_a_bowl(): void
    {
        $this->fixture();

        $props = $this->actingAs($this->fan())
            ->get(route('fan.tickets.index'))
            ->assertOk()
            ->viewData('page')['props'];

        $ticket = $props['tickets'][0];

        $this->assertCount(4, $ticket['tiers']);
        $this->assertNotNull($ticket['bowl'], 'A catalogued venue should carry a bowl payload.');
        $this->assertSame('fixture', $ticket['bowl']['source']);
        $this->assertSame('dome', $ticket['bowl']['roof_style']);
    }
}
