<?php

namespace App\Http\Controllers\Institution;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * The group dashboard (Sprint 62).
 *
 * An institution's concerns are not a fan's. A fan asks "what is my trip
 * costing"; a school asks "how many of my trips have a declaration on them,
 * how many young people am I accountable for, and which requests are sitting
 * with a partner". So this is its own surface rather than a fan dashboard
 * with a panel bolted on.
 *
 * The number that matters most is `undeclared` — a plan already with a
 * partner and no declaration behind it. That is the window the whole
 * declaration model exists to close, and it is the first thing on the page.
 */
class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $trips = Budget::where('user_id', $user->id)
            ->with('schoolDeclaration')
            ->orderByDesc('created_at')
            ->get();

        $declared = $trips->filter(fn ($t) => $t->schoolDeclaration !== null);

        return Inertia::render('Institution/Dashboard', [
            'institution' => $user->institutionPayload(),
            'trips' => $trips->map(fn ($trip) => $this->tripPayload($trip))->values(),
            'stats' => [
                'trips' => $trips->count(),
                'declared' => $declared->count(),
                // Counted, not derived from a percentage — it is the
                // actionable one and it must be a plain integer on the tile.
                'undeclared' => $trips->count() - $declared->count(),
                'minors' => (int) $declared->sum(fn ($t) => $t->schoolDeclaration->travellers_minors),
                'adults' => (int) $declared->sum(fn ($t) => $t->schoolDeclaration->travellers_adults),
                'trips_with_minors' => $declared->filter(fn ($t) => $t->schoolDeclaration->involvesMinors())->count(),
                'awaiting_partner' => $trips->where('partner_status', 'pending')->count(),
            ],
        ]);
    }

    private function tripPayload(Budget $trip): array
    {
        return [
            'id' => $trip->id,
            'name' => $trip->name,
            'reference_id' => $trip->reference_id,
            'created_at' => $trip->created_at->format('M d, Y'),
            'total_cost' => $trip->total_cost,
            'currency' => $trip->currency ?? 'USD',
            'status' => $trip->partner_status,
            'is_active' => $trip->is_active,
            'tournament_id' => $trip->tournament_id,
            'school_group' => $trip->schoolDeclaration?->toPayload(),
        ];
    }
}
