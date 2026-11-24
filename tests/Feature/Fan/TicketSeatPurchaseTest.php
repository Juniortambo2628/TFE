<?php

namespace Tests\Feature\Fan;

use App\Models\Ticket;
use App\Models\TicketBlock;
use App\Models\TicketPurchase;
use App\Models\TicketSeat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Buying named seats ("Block 110, Row 3, Seats 4–5").
 *
 * Seats own the count: a block's `sold` is its seat rows, and the tier and
 * fixture totals follow. Only taken seats are stored. Seat numbers arrive
 * from the client, so each is checked against the block's grid and its
 * taken seats, and the unique index stops two fans buying one seat.
 */
class TicketSeatPurchaseTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(): Ticket
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'ticketing_partner']);

        $ticket = Ticket::create([
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
        ]);

        $ticket->seedDefaultTiers();

        return $ticket->fresh('tiers.blocks');
    }

    // Seat numbers in these tests stay within 1-2 of rows 1-4: every block's
    // grid has those, however its capacity rounds.
    private function vipBlock(Ticket $ticket, string $code = '110'): TicketBlock
    {
        return $ticket->tiers->firstWhere('key', 'vip')->blocks->firstWhere('code', $code);
    }

    private function buy(Ticket $ticket, array $data, ?User $fan = null)
    {
        return $this->actingAs($fan ?? User::factory()->create())
            ->post(route('fan.tickets.buy', $ticket->id), $data);
    }

    public function test_a_fan_buys_the_exact_seats_they_picked(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);

        $this->buy($ticket, [
            'quantity' => 2,
            'ticket_tier_id' => $block->ticket_tier_id,
            'ticket_block_id' => $block->id,
            'seats' => ['3:1', '3:2'],
        ])->assertRedirect(route('fan.tickets.purchases'));

        $purchase = TicketPurchase::sole();
        $this->assertSame([[3, 1], [3, 2]], $purchase->seats->map(fn ($s) => [$s->row, $s->number])->all());

        // Seats own the count, all the way up.
        $this->assertSame(2, $block->fresh()->sold);
        $this->assertSame(2, $block->tier->fresh()->sold);
        $this->assertSame(2, $ticket->fresh()->sold);
    }

    public function test_without_seats_the_order_is_seated_together(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);

        $this->buy($ticket, ['quantity' => 3, 'ticket_tier_id' => $block->ticket_tier_id, 'ticket_block_id' => $block->id])
            ->assertRedirect();

        $seats = TicketPurchase::sole()->seats;
        $this->assertCount(3, $seats);
        $this->assertCount(1, $seats->pluck('row')->unique());
        $this->assertSame([0, 1, 2], $seats->map(fn ($s) => $s->number - $seats[0]->number)->all());
    }

    public function test_a_taken_seat_cannot_be_bought_again(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);
        $data = ['quantity' => 1, 'ticket_tier_id' => $block->ticket_tier_id, 'ticket_block_id' => $block->id, 'seats' => ['2:2']];

        $this->buy($ticket, $data)->assertRedirect(route('fan.tickets.purchases'));
        $this->buy($ticket, $data)->assertSessionHasErrors('seats');

        $this->assertSame(1, TicketPurchase::count(), 'The failed order was rolled back.');
        $this->assertSame(1, TicketSeat::count());
        $this->assertSame(1, $block->fresh()->sold);
    }

    public function test_a_seat_outside_the_blocks_grid_is_refused(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);
        $grid = $block->grid();

        $this->buy($ticket, [
            'quantity' => 1, 'ticket_tier_id' => $block->ticket_tier_id, 'ticket_block_id' => $block->id,
            'seats' => [($grid['rows'] + 1).':1'],
        ])->assertSessionHasErrors('seats');

        $this->buy($ticket, [
            'quantity' => 1, 'ticket_tier_id' => $block->ticket_tier_id, 'ticket_block_id' => $block->id,
            'seats' => ['1:'.($grid['per_row'] + 1)],
        ])->assertSessionHasErrors('seats');

        $this->assertSame(0, TicketPurchase::count());
    }

    public function test_the_seat_count_must_match_the_quantity(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);

        $this->buy($ticket, [
            'quantity' => 3, 'ticket_tier_id' => $block->ticket_tier_id, 'ticket_block_id' => $block->id,
            'seats' => ['1:1', '1:2'],
        ])->assertSessionHasErrors('seats');

        $this->assertSame(0, TicketPurchase::count());
    }

    public function test_seats_need_a_block(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);

        $this->buy($ticket, ['quantity' => 1, 'ticket_tier_id' => $block->ticket_tier_id, 'seats' => ['1:1']])
            ->assertSessionHasErrors('seats');
    }

    public function test_the_same_seat_twice_in_one_order_is_refused(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);

        $this->buy($ticket, [
            'quantity' => 2, 'ticket_tier_id' => $block->ticket_tier_id, 'ticket_block_id' => $block->id,
            'seats' => ['1:1', '1:1'],
        ])->assertSessionHasErrors('seats.0');

        $this->assertSame(0, TicketPurchase::count());
    }

    public function test_sales_without_seats_get_them_without_changing_the_count(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);

        // Sold before seats existed: a count and no seat rows.
        $block->update(['sold' => 30]);
        $block->seatAllSales();
        $block->seatAllSales(); // idempotent

        $this->assertSame(30, $block->fresh()->sold);
        $this->assertSame(30, $block->seats()->count());
        $this->assertSame(30, $block->seats()->whereNull('ticket_purchase_id')->count(), 'Sold elsewhere.');
    }

    public function test_a_new_order_never_gets_a_seat_an_older_sale_holds(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);
        $block->update(['sold' => $block->capacity - 2]);

        // The only free seats once older sales are seated are two; ask for 2.
        $this->buy($ticket, ['quantity' => 2, 'ticket_tier_id' => $block->ticket_tier_id, 'ticket_block_id' => $block->id])
            ->assertRedirect();

        $this->assertSame($block->capacity, $block->fresh()->sold);
        $this->assertSame($block->capacity, $block->seats()->count());
    }

    public function test_the_seat_map_lists_taken_seats_for_this_fixtures_block_only(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);
        $this->buy($ticket, ['quantity' => 1, 'ticket_tier_id' => $block->ticket_tier_id, 'ticket_block_id' => $block->id, 'seats' => ['2:3']]);

        $json = $this->actingAs(User::factory()->create())
            ->getJson(route('fan.tickets.blocks.seats', [$ticket->id, $block->id]))
            ->assertOk()
            ->json();

        $this->assertSame('110', $json['code']);
        $this->assertSame(['2:3'], $json['taken']);
        $this->assertSame($block->grid()['rows'], $json['rows']);

        // Another fixture's URL with this block: not found.
        $other = $this->fixture();
        $this->actingAs(User::factory()->create())
            ->getJson(route('fan.tickets.blocks.seats', [$other->id, $block->id]))
            ->assertNotFound();
    }

    public function test_the_receipt_names_its_seats(): void
    {
        $ticket = $this->fixture();
        $block = $this->vipBlock($ticket);
        $fan = User::factory()->create();

        $this->buy($ticket, [
            'quantity' => 2, 'ticket_tier_id' => $block->ticket_tier_id, 'ticket_block_id' => $block->id,
            'seats' => ['4:2', '4:1'],
        ], $fan);

        $props = $this->actingAs($fan)->get(route('fan.tickets.purchases'))->viewData('page')['props'];

        $this->assertSame('Row 4 · Seats 1–2', $props['purchases'][0]['seat_label']);
    }
}
