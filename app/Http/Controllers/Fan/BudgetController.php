<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Budget;
use App\Models\FavoriteMatch;
use App\Models\Listing;
use App\Services\FixtureService;
use App\Traits\ResolvesTournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BudgetController extends Controller
{
    use ResolvesTournament;

    public function index(Request $request)
    {
        $userId = Auth::id();
        $editId = $request->query('id');
        $budgetToEdit = null;

        $tournament = $this->activeTournament();
        $tournamentId = $tournament['id'];
        $isConcluded = $this->isTournamentConcluded($tournament);

        if ($editId) {
            $budgetToEdit = Budget::where('user_id', $userId)
                ->where('id', $editId)
                ->first();
        }

        // Show budgets for the active tournament only — parallel plans for
        // other tournaments are surfaced in Itineraries.
        $savedBudgets = Budget::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Fixture-derived props (~100 matches + venue/stage/team/country maps)
        // are deferred: Inertia sends the page skeleton immediately and
        // fetches this bundle in a background partial reload. First paint
        // no longer waits on FixtureService (which hits Wikipedia on
        // cold cache).
        $pricing = $tournament['pricing'] ?? [];
        $fixtureBundle = function () use ($tournamentId, $userId, $pricing) {
            $fixtureService = app(FixtureService::class);
            $allFixtures = $fixtureService->getFixtures($tournamentId);

            $favoriteExternalIds = FavoriteMatch::where('user_id', $userId)
                ->where('tournament_id', $tournamentId)
                ->whereNotNull('external_id')
                ->pluck('external_id')
                ->toArray();

            $favoriteFixtures = array_values(array_filter($allFixtures, function ($f) use ($favoriteExternalIds) {
                return in_array($f['id'], $favoriteExternalIds);
            }));

            $venues = collect($allFixtures)->pluck('venue')->filter()->unique()->values()->toArray();
            $stages = collect($allFixtures)->pluck('stage')->filter()->unique()->values()->toArray();
            $groups = collect($allFixtures)->pluck('group')->filter()->unique()->values()->toArray();
            $teams = collect($allFixtures)
                ->pluck('homeTeam')
                ->merge(collect($allFixtures)->pluck('awayTeam'))
                ->filter()
                ->unique()
                ->sort()
                ->values()
                ->toArray();

            $venueCountries = [];
            foreach ($pricing['venue_tiers'] ?? [] as $venue => $data) {
                if (! empty($data['country'])) {
                    $venueCountries[$venue] = $data['country'];
                }
            }

            return [
                'allFixtures' => $allFixtures,
                'userFavorites' => $favoriteFixtures,
                'venues' => $venues,
                'stages' => $stages,
                'groups' => $groups,
                'teams' => $teams,
                'venueCountries' => $venueCountries,
            ];
        };

        // Packages the fan can pick as a starting point — Listing rows
        // of type 'package', active + this tournament only, sorted by
        // featured then display_order.
        $packages = Listing::forTournament($tournamentId)
            ->ofType('package')
            ->active()
            ->orderByDesc('is_featured')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(function (Listing $p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'description' => $p->description,
                    'hero_image' => $p->hero_image,
                    'base_price' => $p->base_price,
                    'currency' => $p->currency,
                    'included_match_ids' => $p->included_match_ids ?? [],
                    'included_venues' => $p->included_venues ?? [],
                    'nights' => $p->nights,
                    'flight_class' => $p->flight_class,
                    'accommodation_level' => $p->accommodation_level,
                    'capacity' => $p->capacity,
                    'sold_count' => $p->sold_count,
                    'seats_left' => $p->seats_left,
                    'availability_pct' => $p->availability_pct,
                    'is_sold_out' => $p->is_sold_out,
                    'is_featured' => $p->is_featured,
                ];
            });

        return Inertia::render('Fan/BudgetCalculator', [
            'savedBudgets' => $savedBudgets,
            'budgetToEdit' => $budgetToEdit,
            'isConcluded' => $isConcluded,
            'tournamentId' => $tournamentId,
            'tournamentPricing' => $pricing,
            'packages' => $packages,
            // Defer the heavy fixture bundle — page renders immediately,
            // Inertia fetches this in a background partial reload.
            'fixtureBundle' => Inertia::defer($fixtureBundle),
        ]);
    }

    public function itineraries()
    {
        $userId = Auth::id();

        // Itineraries lists every plan across every tournament the user has
        // touched — helpful for the multi-tournament planner.
        $itineraries = Budget::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($budget) {
                $tournamentConfig = $budget->tournament_id
                    ? config("tournaments.tournaments.{$budget->tournament_id}")
                    : null;

                return [
                    'id' => $budget->id,
                    'name' => $budget->name,
                    'reference_id' => $budget->reference_id,
                    'created_at' => $budget->created_at->format('M d, Y'),
                    'total_cost' => $budget->total_cost,
                    'partner_cost' => $budget->partner_cost,
                    'status' => $budget->partner_status,
                    'is_active' => $budget->is_active,
                    'match_count' => count($budget->match_ids ?? []),
                    'accommodation' => $budget->accommodation_level,
                    'flight' => $budget->flight_class,
                    'tournament_id' => $budget->tournament_id,
                    'tournament_name' => $tournamentConfig['short_name'] ?? $tournamentConfig['name'] ?? null,
                ];
            });

        return Inertia::render('Fan/Itineraries', [
            'itineraries' => $itineraries,
        ]);
    }

    public function confirm(Request $request, Budget $budget)
    {
        if ($budget->user_id !== Auth::id()) {
            abort(403);
        }

        if (! in_array($budget->partner_status, ['approved', 'modified'])) {
            return back()->with('error', 'Only approved or modified budgets can be confirmed.');
        }

        // Package-backed budgets: refuse to confirm if the listing sold out
        // between when the fan built the plan and when they confirmed it,
        // and bump sold_count on success so capacity signals stay accurate.
        $listing = $budget->listing_id ? Listing::find($budget->listing_id) : null;
        if ($listing && $listing->is_sold_out) {
            return back()->with('error', 'Sorry — this package sold out while you were reviewing. Rebuild your itinerary as a custom plan or pick another package.');
        }

        // Create the booking scoped to the same tournament + listing as the budget.
        Booking::create([
            'user_id' => $budget->user_id,
            'tournament_id' => $budget->tournament_id,
            'listing_id' => $budget->listing_id,
            'package_name' => $budget->name,
            'package_type' => $listing ? $listing->name : 'Custom Itinerary',
            'status' => 'pending_payment',
            'total_amount' => $budget->partner_cost > 0 ? $budget->partner_cost : $budget->total_cost,
            'amount_paid' => 0,
            'booking_date' => now(),
            'expires_at' => now()->addHours(48),
            'flight_info' => $budget->flight_class,
            'accommodation' => $budget->accommodation_level,
            'matches' => $budget->match_ids,
        ]);

        if ($listing) {
            // Atomic increment — safe under concurrent confirmations.
            $listing->increment('sold_count');
        }

        Budget::where('user_id', $budget->user_id)
            ->where('tournament_id', $budget->tournament_id)
            ->update(['is_active' => false]);

        $budget->update([
            'partner_status' => 'confirmed',
            'is_active' => false,
        ]);

        return redirect()->route('fan.journey')->with('success', 'Itinerary confirmed! Your booking is now pending payment.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|exists:budgets,id',
            'name' => 'nullable|string|max:255',
            'total_cost' => 'required|numeric',
            'match_ids' => 'required|array',
            'accommodation_level' => 'required|string',
            'flight_class' => 'required|string',
            'breakdown' => 'required|array',
            'nights' => 'nullable|integer',
            'tournament_id' => 'nullable|string',
            // Optional — set when the fan started from a prepacked listing.
            // The budget carries the FK so we know its origin even if the
            // fan later customizes ticket count or class. Accepts either
            // `listing_id` (new) or `package_id` (legacy fan payload).
            'listing_id' => 'nullable|exists:listings,id',
            'package_id' => 'nullable|exists:listings,id',
        ]);

        $user = Auth::user();
        $tournamentId = $validated['tournament_id'] ?? $this->activeTournamentId();
        $listingId = $validated['listing_id'] ?? $validated['package_id'] ?? null;

        if (isset($validated['id'])) {
            $budget = Budget::where('user_id', $user->id)->findOrFail($validated['id']);
            $budget->update([
                'name' => $validated['name'] ?? $budget->name,
                'total_cost' => $validated['total_cost'],
                'match_ids' => $validated['match_ids'],
                'accommodation_level' => $validated['accommodation_level'],
                'flight_class' => $validated['flight_class'],
                'breakdown' => $validated['breakdown'],
                'nights' => $validated['nights'] ?? $budget->nights,
                'tournament_id' => $tournamentId,
                'listing_id' => $listingId ?? $budget->listing_id,
                'is_active' => true,
            ]);

            // Deactivate only budgets for this tournament — the user may still
            // have an active plan for another tournament they're also planning.
            Budget::where('user_id', $user->id)
                ->where('tournament_id', $tournamentId)
                ->where('id', '!=', $budget->id)
                ->update(['is_active' => false]);

            return back()->with('success', 'Itinerary updated successfully!');
        }

        Budget::where('user_id', $user->id)
            ->where('tournament_id', $tournamentId)
            ->update(['is_active' => false]);

        $budget = Budget::create([
            'user_id' => $user->id,
            'tournament_id' => $tournamentId,
            'listing_id' => $listingId,
            'name' => $validated['name'] ?? 'My Tournament Trip',
            'total_cost' => $validated['total_cost'],
            'match_ids' => $validated['match_ids'],
            'accommodation_level' => $validated['accommodation_level'],
            'flight_class' => $validated['flight_class'],
            'breakdown' => $validated['breakdown'],
            'nights' => $validated['nights'] ?? 7,
            'is_active' => true,
        ]);

        return back()->with('success', 'Itinerary saved successfully!');
    }

    public function getActive()
    {
        // Active budget is scoped to the currently active tournament so
        // the Fan Dashboard always reflects the tournament in view.
        $budget = Budget::where('user_id', Auth::id())
            ->where('tournament_id', $this->activeTournamentId())
            ->where('is_active', true)
            ->first();

        return response()->json(['success' => true, 'data' => $budget]);
    }

    public function destroy(Budget $budget)
    {
        if ($budget->user_id !== Auth::id()) {
            abort(403);
        }

        $budget->delete();

        return back()->with('success', 'Itinerary deleted.');
    }
}
