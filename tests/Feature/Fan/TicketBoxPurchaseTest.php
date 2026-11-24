<?php

namespace Tests\Feature\Fan;

use App\Models\Ticket;
use App\Models\TicketBox;
use App\Models\TicketPurchase;
use App\Models\User;
use App\Services\StadiumBowlService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hospitality boxes: sold whole, at the box's price, once.
 */
class TicketBoxPurchaseTest extends TestCase
{
    use RefreshDatabase;

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

        return $ticket->fresh();
    }

    private function box(Ticket $ticket, array $attrs = []): TicketBox
    {
        return TicketBox::create(array_merge([
            'ticket_id' => $ticket->id, 'code' => '6', 'name' => 'Skybox 6', 'seats' => 12, 'price' => 4320, 'sort_order' => 6,
        ], $attrs));
    }

    public function test_a_fan_books_a_whole_box_at_the_box_price(): void
    {
        $ticket = $this->fixture();
        $box = $this->box($ticket);
        $soldBefore = $ticket->sold;

        $this->actingAs(User::factory()->create())
            ->post(route('fan.tickets.buy', $ticket->id), ['quantity' => 1, 'ticket_box_id' => $box->id])
            ->assertRedirect(route('fan.tickets.purchases'));

        $purchase = TicketPurchase::sole();
        $this->assertSame('4320.00', $purchase->total, 'The box price, never quantity x tier price.');
        $this->assertSame(12, $purchase->quantity, 'The whole box, whatever quantity was sent.');
        $this->assertSame('Skybox 6', $purchase->box_name);
        $this->assertNull($purchase->ticket_tier_id);

        $box->refresh();
        $this->assertTrue($box->isBooked());
        $this->assertSame($purchase->id, $box->ticket_purchase_id);

        // Boxes are not part of the stands' inventory.
        $this->assertSame($soldBefore, $ticket->fresh()->sold);
    }

    public function test_a_booked_box_cannot_be_booked_again(): void
    {
        $ticket = $this->fixture();
        $box = $this->box($ticket, ['booked_at' => now()]);

        $this->actingAs(User::factory()->create())
            ->post(route('fan.tickets.buy', $ticket->id), ['quantity' => 1, 'ticket_box_id' => $box->id])
            ->assertSessionHasErrors('ticket_box_id');

        $this->assertSame(0, TicketPurchase::count());
    }

    public function test_a_box_of_another_match_is_refused(): void
    {
        $ticket = $this->fixture();
        $other = $this->fixture(['home_team' => 'Uganda', 'kickoff_at' => now()->addMonths(4)]);
        $box = $this->box($other);

        $this->actingAs(User::factory()->create())
            ->post(route('fan.tickets.buy', $ticket->id), ['quantity' => 1, 'ticket_box_id' => $box->id])
            ->assertSessionHasErrors('ticket_box_id');

        $this->assertFalse($box->fresh()->isBooked());
    }

    public function test_the_fixture_bowl_lists_its_boxes_and_an_aggregate_lists_none(): void
    {
        $ticket = $this->fixture();
        $this->box($ticket);
        $this->box($ticket, ['code' => '7', 'name' => 'Skybox 7', 'booked_at' => now()]);

        $bowl = app(StadiumBowlService::class)->forTicket($ticket->fresh());
        $this->assertSame(['Skybox 6', 'Skybox 7'], array_column($bowl['boxes'], 'name'));
        $this->assertSame([false, true], array_column($bowl['boxes'], 'is_booked'));

        $aggregate = app(StadiumBowlService::class)->forVenue($ticket->venue_name, 'afcon_2027');
        $this->assertSame([], $aggregate['boxes']);
    }

    public function test_the_receipt_names_the_box(): void
    {
        $ticket = $this->fixture();
        $box = $this->box($ticket);
        $fan = User::factory()->create();

        $this->actingAs($fan)->post(route('fan.tickets.buy', $ticket->id), ['quantity' => 1, 'ticket_box_id' => $box->id]);

        $props = $this->actingAs($fan)->get(route('fan.tickets.purchases'))->viewData('page')['props'];
        $this->assertSame('Skybox 6', $props['purchases'][0]['box_name']);
    }
}
