<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketPurchase;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $partnerId = $request->user()->id;

        $tickets = Ticket::query()
            ->where('partner_id', $partnerId)
            ->orderBy('kickoff_at')
            ->get()
            ->map(fn (Ticket $t) => $this->format($t))
            ->all();

        $sales = TicketPurchase::whereHas('ticket', fn ($q) => $q->where('partner_id', $partnerId))->get();
        $stats = [
            'seats_sold' => (int) $sales->sum('quantity'),
            'orders' => $sales->count(),
            'revenue' => round((float) $sales->sum('total'), 2),
            'sellthrough' => $tickets ? (int) round(collect($tickets)->avg('sold_pct')) : 0,
        ];

        return Inertia::render('Partner/Tickets', [
            'tickets' => $tickets,
            'stats' => $stats,
        ]);
    }

    public function sales(Request $request)
    {
        $partnerId = $request->user()->id;

        $sales = TicketPurchase::query()
            ->with('ticket', 'user')
            ->whereHas('ticket', fn ($q) => $q->where('partner_id', $partnerId))
            ->orderByDesc('created_at')
            ->get()
            ->map(function (TicketPurchase $p) {
                return [
                    'id' => $p->id,
                    'reference' => $p->reference,
                    'quantity' => $p->quantity,
                    'total' => (float) $p->total,
                    'currency' => $p->currency,
                    'status' => $p->status,
                    'paid_with' => $p->paid_with,
                    'created_at' => $p->created_at,
                    'user' => $p->user ? ['name' => $p->user->name, 'email' => $p->user->email] : null,
                    'match' => $p->ticket ? $p->ticket->home_team.' vs '.$p->ticket->away_team : null,
                    'venue' => $p->ticket->venue_name ?? null,
                ];
            })
            ->all();

        return Inertia::render('Partner/TicketSales', [
            'sales' => $sales,
        ]);
    }

    private function format(Ticket $t): array
    {
        return [
            'id' => $t->id,
            'tournament_id' => $t->tournament_id,
            'home_team' => $t->home_team,
            'away_team' => $t->away_team,
            'stage' => $t->stage,
            'kickoff_at' => $t->kickoff_at,
            'venue_name' => $t->venue_name,
            'venue_city' => $t->venue_city,
            'venue_capacity' => $t->venue_capacity,
            'price' => (float) $t->price,
            'currency' => $t->currency,
            'capacity' => $t->capacity,
            'sold' => $t->sold,
            'remaining' => $t->remaining,
            'sold_pct' => $t->sold_pct,
            'is_active' => $t->is_active,
            'hero_image' => $t->hero_image,
        ];
    }
}
