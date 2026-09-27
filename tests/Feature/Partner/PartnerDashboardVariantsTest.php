<?php

namespace Tests\Feature\Partner;

use App\Models\Ticket;
use App\Models\TicketPurchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 56 — the partner dashboard speaks the partner's own archetype.
 *
 * Finance partners got their own variant in Sprint 14. Everyone else got the
 * travel one, so a ticketing partner's front page counted travel briefs they
 * can never receive (five tiles of zero once the global-queue fallback went)
 * and its shortcuts pointed at Publish and Convert — surfaces their own
 * sidebar does not even show them. Their numbers already existed behind the
 * Tickets page; this puts them on the dashboard, from the same helper so the
 * two cannot disagree.
 */
class PartnerDashboardVariantsTest extends TestCase
{
    use RefreshDatabase;

    private function ticketingPartnerWithSales(): User
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'ticketing_partner']);
        $fan = User::factory()->create();

        $ticket = Ticket::create([
            'partner_id' => $partner->id,
            'tournament_id' => 'afcon_2027',
            'home_team' => 'Kenya',
            'away_team' => 'Nigeria',
            'venue_slug' => 'talanta-sports-city',
            'venue_name' => 'Talanta Sports City Stadium',
            'venue_city' => 'Nairobi',
            'venue_country' => 'Kenya',
            'venue_capacity' => 60000,
            'kickoff_at' => now()->addMonths(3),
            'price' => 60,
            'currency' => 'USD',
            'capacity' => 100,
            'sold' => 40,
            'is_active' => true,
        ]);

        TicketPurchase::create([
            'user_id' => $fan->id,
            'ticket_id' => $ticket->id,
            'quantity' => 3,
            'unit_price' => 60,
            'total' => 180,
            'currency' => 'USD',
            'reference' => 'TKT-TEST01',
            'status' => 'PAID',
            'paid_with' => 'card',
        ]);

        return $partner;
    }

    public function test_a_ticketing_partner_sees_ticket_numbers_not_travel_briefs(): void
    {
        $partner = $this->ticketingPartnerWithSales();

        $props = $this->actingAs($partner)->get(route('partner.dashboard'))->viewData('page')['props'];

        $this->assertSame('ticketing', $props['variant']);
        $this->assertSame(3, $props['stats']['seats_sold']);
        $this->assertSame(1, $props['stats']['orders']);
        $this->assertSame(1, $props['stats']['listings']);
        $this->assertEquals(180, $props['stats']['total_revenue']);
        $this->assertCount(1, $props['requests']);
        $this->assertSame('Kenya vs Nigeria', $props['requests'][0]['match_label']);
    }

    public function test_the_dashboard_and_the_tickets_page_report_the_same_figures(): void
    {
        $partner = $this->ticketingPartnerWithSales();

        $dash = $this->actingAs($partner)->get(route('partner.dashboard'))->viewData('page')['props'];
        $tickets = $this->actingAs($partner)->get(route('partner.tickets.index'))->viewData('page')['props'];

        foreach (['seats_sold', 'orders', 'sellthrough'] as $key) {
            $this->assertSame(
                $tickets['stats'][$key],
                $dash['stats'][$key],
                "{$key} must come from one helper, not two copies of the sum"
            );
        }

        $this->assertEquals($tickets['stats']['revenue'], $dash['stats']['total_revenue']);
    }

    public function test_a_finance_partner_still_gets_the_loan_variant(): void
    {
        $finance = User::factory()->partner()->create(['partner_type' => 'finance_partner']);

        $props = $this->actingAs($finance)->get(route('partner.dashboard'))->viewData('page')['props'];

        $this->assertSame('finance', $props['variant']);
    }

    public function test_a_travel_partner_still_gets_the_travel_dashboard(): void
    {
        $travel = User::factory()->partner()->create(['partner_type' => 'travel_agent']);

        $props = $this->actingAs($travel)->get(route('partner.dashboard'))->viewData('page')['props'];

        // No variant key means the component's 'travel' default.
        $this->assertArrayNotHasKey('variant', $props);
        $this->assertArrayHasKey('hasListings', $props);
    }
}
