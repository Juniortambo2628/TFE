<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Budget;
use App\Models\FavoriteMatch;
use App\Services\FixtureService;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();
        $editId = $request->query('id');
        $budgetToEdit = null;

        // Resolve active tournament
        $tournamentService = app(TournamentService::class);
        $tournament = $tournamentService->current();
        $tournamentId = $tournament['id'] ?? 'wc_2026';

        if ($editId) {
            $budgetToEdit = Budget::where('user_id', $userId)
                ->where('id', $editId)
                ->first();
        }

        $savedBudgets = Budget::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Get all fixtures from dynamic source
        $fixtureService = app(FixtureService::class);
        $allFixtures = $fixtureService->getFixtures($tournamentId);

        // Resolve favorites against live fixtures list
        $favoriteIds = FavoriteMatch::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)
            ->pluck('fixture_id')
            ->toArray();

        $favoriteFixtures = array_values(array_filter($allFixtures, function ($f) use ($favoriteIds) {
            return in_array($f['id'], $favoriteIds);
        }));

        // Extract unique venues, stages, groups for filtering
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

        return Inertia::render('Fan/BudgetCalculator', [
            'savedBudgets' => $savedBudgets,
            'userFavorites' => $favoriteFixtures,
            'budgetToEdit' => $budgetToEdit,
            'allFixtures' => $allFixtures,
            'venues' => $venues,
            'stages' => $stages,
            'groups' => $groups,
            'teams' => $teams,
        ]);
    }

    public function itineraries()
    {
        $userId = Auth::id();

        $itineraries = Budget::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($budget) {
                return [
                    'id' => $budget->id,
                    'name' => $budget->name,
                    'reference_id' => 'REQ-'.str_pad($budget->id, 6, '0', STR_PAD_LEFT),
                    'created_at' => $budget->created_at->format('M d, Y'),
                    'total_cost' => $budget->total_cost,
                    'partner_cost' => $budget->partner_cost,
                    'status' => $budget->partner_status,
                    'is_active' => $budget->is_active,
                    'match_count' => count($budget->match_ids ?? []),
                    'accommodation' => $budget->accommodation_level,
                    'flight' => $budget->flight_class,
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

        // Create the booking
        Booking::create([
            'user_id' => $budget->user_id,
            'package_name' => $budget->name,
            'package_type' => 'Custom Itinerary',
            'status' => 'pending_payment',
            'total_amount' => $budget->partner_cost > 0 ? $budget->partner_cost : $budget->total_cost,
            'amount_paid' => 0,
            'booking_date' => now(),
            'expires_at' => now()->addHours(48),
            'flight_info' => $budget->flight_class,
            'accommodation' => $budget->accommodation_level,
            'matches' => $budget->match_ids,
        ]);

        Budget::where('user_id', $budget->user_id)
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
        ]);

        $user = Auth::user();

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
                'is_active' => true,
            ]);

            Budget::where('user_id', $user->id)
                ->where('id', '!=', $budget->id)
                ->update(['is_active' => false]);

            return back()->with('success', 'Itinerary updated successfully!');
        }

        Budget::where('user_id', $user->id)
            ->update(['is_active' => false]);

        $budget = Budget::create([
            'user_id' => $user->id,
            'name' => $validated['name'] ?? 'My World Cup Trip',
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
        $budget = Budget::where('user_id', Auth::id())
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
