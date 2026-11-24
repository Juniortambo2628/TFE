<?php

namespace Tests\Feature\Fan;

use App\Models\Ticket;
use App\Models\TicketBlock;
use App\Models\TicketPurchase;
use App\Models\User;
use App\Services\StadiumBowlService;
use Database\Seeders\TicketBlockSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Buying seats by block ("West Stand · Block 207").
 *
 * Blocks own the counts, and the tier and fixture totals are derived from
 * them. A block id arrives from the client, so it is scoped to the tier of
 * the fixture in the URL, and an order is seated in ONE block so a party
 * bought together sits together.
 */
class TicketBlockPurchaseTest extends TestCase
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

        return $ticket->fresh('tiers.blocks');
    }

    private function buy(Ticket $ticket, array $data)
    {
        return $this->actingAs(User::factory()->create())
            ->post(route('fan.tickets.buy', $ticket->id), $data);
    }

    public function test_seeding_tiers_splits_each_into_32_blocks_that_add_back_up(): void
    {
        $ticket = $this->fixture();

        foreach ($ticket->tiers as $tier) {
            $this->assertCount(32, $tier->blocks);
            $this->assertSame($tier->capacity, (int) $tier->blocks->sum('capacity'));
        }

        $this->assertSame(40000, $ticket->fresh()->capacity, 'No seats lost to rounding.');
        $this->assertSame('101', $ticket->tiers->firstWhere('key', 'vip')->blocks->first()->code);
        $this->assertSame('401', $ticket->tiers->firstWhere('key', 'upper')->blocks->first()->code);
    }

    public function test_a_fan_buys_seats_in_a_chosen_block(): void
    {
        $ticket = $this->fixture();
        $vip = $ticket->tiers->firstWhere('key', 'vip');
        $block = $vip->blocks->firstWhere('code', '110');

        $this->buy($ticket, ['quantity' => 3, 'ticket_tier_id' => $vip->id, 'ticket_block_id' => $block->id])
            ->assertRedirect(route('fan.tickets.purchases'));

        $purchase = TicketPurchase::sole();
        $this->assertSame($block->id, $purchase->ticket_block_id);
        $this->assertSame('110', $purchase->block_code);
        $this->assertSame('240.00', $purchase->unit_price, 'A block costs its tier price.');

        // The block owns the count; tier and fixture totals follow it.
        $this->assertSame(3, $block->fresh()->sold);
        $this->assertSame(3, $vip->fresh()->sold);
        $this->assertSame(3, $ticket->fresh()->sold);
    }

    public function test_without_a_block_the_order_goes_to_the_block_with_most_room(): void
    {
        $ticket = $this->fixture();
        $vip = $ticket->tiers->firstWhere('key', 'vip');
        // Most room; several end blocks tie on size, and the earliest wins.
        $max = $vip->blocks->max('capacity');
        $roomiest = $vip->blocks->where('capacity', $max)->sortBy('sort_order')->first();

        $this->buy($ticket, ['quantity' => 2, 'ticket_tier_id' => $vip->id])->assertRedirect();

        $this->assertSame($roomiest->code, TicketPurchase::sole()->block_code);
        $this->assertSame(2, $roomiest->fresh()->sold);
    }

    public function test_a_block_from_another_fixture_is_rejected(): void
    {
        $ticket = $this->fixture();
        $other = $this->fixture(['home_team' => 'Uganda', 'kickoff_at' => now()->addMonths(4)]);
        $vip = $ticket->tiers->firstWhere('key', 'vip');
        $foreign = $other->tiers->firstWhere('key', 'vip')->blocks->first();

        $this->buy($ticket, ['quantity' => 1, 'ticket_tier_id' => $vip->id, 'ticket_block_id' => $foreign->id])
            ->assertSessionHasErrors('ticket_block_id');

        $this->assertSame(0, TicketPurchase::count());
        $this->assertSame(0, $foreign->fresh()->sold);
    }

    public function test_a_block_from_another_tier_of_the_same_fixture_is_rejected(): void
    {
        // Otherwise a fan could pay the Upper price for a VIP block.
        $ticket = $this->fixture();
        $upper = $ticket->tiers->firstWhere('key', 'upper');
        $vipBlock = $ticket->tiers->firstWhere('key', 'vip')->blocks->first();

        $this->buy($ticket, ['quantity' => 1, 'ticket_tier_id' => $upper->id, 'ticket_block_id' => $vipBlock->id])
            ->assertSessionHasErrors('ticket_block_id');

        $this->assertSame(0, TicketPurchase::count());
    }

    public function test_a_chosen_block_cannot_be_oversold(): void
    {
        $ticket = $this->fixture();
        $vip = $ticket->tiers->firstWhere('key', 'vip');
        $block = $vip->blocks->first();
        $block->update(['sold' => $block->capacity - 1]);
        $vip->syncBlockTotals();

        $this->buy($ticket, ['quantity' => 2, 'ticket_tier_id' => $vip->id, 'ticket_block_id' => $block->id])
            ->assertSessionHasErrors('quantity');

        $this->assertSame(0, TicketPurchase::count());
    }

    public function test_an_order_is_never_split_across_blocks(): void
    {
        $ticket = $this->fixture();
        $vip = $ticket->tiers->firstWhere('key', 'vip');

        // Leave exactly 1 seat in every block: the tier has 32 left, but no
        // two of them together.
        foreach ($vip->blocks as $block) {
            $block->update(['sold' => $block->capacity - 1]);
        }
        $vip->syncBlockTotals();

        $this->buy($ticket, ['quantity' => 2, 'ticket_tier_id' => $vip->id])
            ->assertSessionHasErrors('quantity');

        $this->buy($ticket, ['quantity' => 1, 'ticket_tier_id' => $vip->id])->assertRedirect();
        $this->assertSame(1, TicketPurchase::count());
    }

    public function test_backfilling_blocks_keeps_a_tiers_existing_sales_exactly(): void
    {
        $ticket = $this->fixture();
        $vip = $ticket->tiers->firstWhere('key', 'vip');

        // A tier as it was before blocks: sales on the tier, no block rows.
        TicketBlock::query()->delete();
        $vip->update(['sold' => 1234]);
        $ticket->syncTierTotals();

        $this->seed(TicketBlockSeeder::class);
        $this->seed(TicketBlockSeeder::class); // idempotent

        $vip->refresh();
        $this->assertSame(32, $vip->blocks()->count());
        $this->assertSame(1234, $vip->sold);
        $this->assertSame(1234, (int) $vip->blocks()->sum('sold'));
        $this->assertTrue($vip->blocks->every(fn ($b) => $b->sold <= $b->capacity));
    }

    public function test_the_fixture_bowl_carries_blocks_with_ids_and_real_counts(): void
    {
        $ticket = $this->fixture();
        $vip = $ticket->tiers->firstWhere('key', 'vip');
        $block = $vip->blocks->firstWhere('code', '110');
        $block->update(['sold' => 10]);

        $bowl = app(StadiumBowlService::class)->forTicket($ticket->fresh('tiers.blocks'));
        $row = collect(collect($bowl['tiers'])->firstWhere('key', 'vip')['blocks'])->firstWhere('code', '110');

        $this->assertSame($block->id, $row['id']);
        $this->assertSame(10, $row['sold']);
        $this->assertSame('west', $row['stand']);
    }

    public function test_an_aggregate_bowl_exposes_no_blocks_to_buy(): void
    {
        $this->fixture();

        $bowl = app(StadiumBowlService::class)->forVenue('Moi International Sports Centre, Kasarani', 'afcon_2027');

        foreach ($bowl['tiers'] as $tier) {
            $this->assertArrayNotHasKey('blocks', $tier);
        }
    }

    public function test_the_receipt_names_its_block(): void
    {
        $ticket = $this->fixture();
        $vip = $ticket->tiers->firstWhere('key', 'vip');
        $block = $vip->blocks->firstWhere('code', '110');

        $fan = User::factory()->create();
        $this->actingAs($fan)->post(route('fan.tickets.buy', $ticket->id), [
            'quantity' => 1, 'ticket_tier_id' => $vip->id, 'ticket_block_id' => $block->id,
        ]);

        $props = $this->actingAs($fan)->get(route('fan.tickets.purchases'))->viewData('page')['props'];

        $this->assertSame('110', $props['purchases'][0]['block_code']);
        $this->assertSame('West Stand', $props['purchases'][0]['block_stand']);
    }
}
