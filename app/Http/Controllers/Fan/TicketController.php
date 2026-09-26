<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\PartnerProfile;
use App\Models\Ticket;
use App\Models\TicketPurchase;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $tournamentId = session('active_tournament_id', config('tournaments.default'));

        $tickets = Ticket::query()
            ->active()
            ->forTournament($tournamentId)
            ->orderBy('kickoff_at')
            ->get()
            ->map(fn (Ticket $t) => $this->format($t));

        return Inertia::render('Fan/Tickets/Index', [
            'tickets' => $tickets,
            'purchases' => $this->userPurchases($request->user()->id),
        ]);
    }

    public function store(Request $request, Ticket $ticket)
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:10'],
            'paid_with' => ['nullable', 'string', 'in:card,virtual_card,mpesa'],
        ]);

        abort_if(! $ticket->is_active, 404);

        return DB::transaction(function () use ($request, $ticket, $data) {
            $ticket->refresh();
            if ($ticket->remaining < $data['quantity']) {
                return back()->withErrors(['quantity' => 'Only '.$ticket->remaining.' seats left.']);
            }

            $unit = (float) $ticket->price;
            $total = round($unit * $data['quantity'], 2);

            $purchase = TicketPurchase::create([
                'user_id' => $request->user()->id,
                'ticket_id' => $ticket->id,
                'quantity' => $data['quantity'],
                'unit_price' => $unit,
                'total' => $total,
                'currency' => $ticket->currency,
                'reference' => 'MDA-'.strtoupper(Str::random(8)),
                'status' => 'confirmed',
                'paid_with' => $data['paid_with'] ?? 'card',
            ]);

            $ticket->increment('sold', $data['quantity']);

            return redirect()->route('fan.tickets.purchases')
                ->with('success', 'Ticket booked — reference '.$purchase->reference);
        });
    }

    public function purchases(Request $request)
    {
        return Inertia::render('Fan/Tickets/Purchases', [
            'purchases' => $this->userPurchases($request->user()->id),
        ]);
    }

    private function userPurchases(int $userId): array
    {
        return TicketPurchase::query()
            ->where('user_id', $userId)
            ->with('ticket')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (TicketPurchase $p) {
                return [
                    'id' => $p->id,
                    'reference' => $p->reference,
                    'quantity' => $p->quantity,
                    'unit_price' => (float) $p->unit_price,
                    'total' => (float) $p->total,
                    'currency' => $p->currency,
                    'status' => $p->status,
                    'paid_with' => $p->paid_with,
                    'created_at' => $p->created_at,
                    'ticket' => $p->ticket ? $this->format($p->ticket) : null,
                ];
            })
            ->all();
    }

    private function format(Ticket $t): array
    {
        $partner = PartnerProfile::where('user_id', $t->partner_id)->first();

        return [
            'id' => $t->id,
            'tournament_id' => $t->tournament_id,
            'home_team' => $t->home_team,
            'home_team_code' => $t->home_team_code,
            'away_team' => $t->away_team,
            'away_team_code' => $t->away_team_code,
            'stage' => $t->stage,
            'kickoff_at' => $t->kickoff_at,
            'venue_slug' => $t->venue_slug,
            'venue_name' => $t->venue_name,
            'venue_city' => $t->venue_city,
            'venue_country' => $t->venue_country,
            'venue_capacity' => $t->venue_capacity,
            'price' => (float) $t->price,
            'currency' => $t->currency,
            'capacity' => $t->capacity,
            'sold' => $t->sold,
            'remaining' => $t->remaining,
            'sold_pct' => $t->sold_pct,
            'is_sold_out' => $t->is_sold_out,
            'hero_image' => $t->hero_image,
            'partner' => $partner ? [
                'slug' => $partner->slug,
                'display_name' => $partner->display_name,
                'theme_accent' => $partner->theme_accent,
                'logo_url' => $partner->logo_url,
                'verified' => optional(User::find($t->partner_id))->verification_status === 'verified',
            ] : null,
        ];
    }
}
