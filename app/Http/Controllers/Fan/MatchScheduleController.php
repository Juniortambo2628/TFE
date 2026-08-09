<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\FavoriteMatch;
use App\Models\Fixture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MatchScheduleController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Get user's favorite match IDs
        $favoriteIds = FavoriteMatch::where('user_id', $user->id)
            ->pluck('fixture_id')
            ->toArray();

        // Get all fixtures in standardized format
        $allFixtures = Fixture::orderBy('date')
            ->orderBy('time')
            ->get()
            ->map(fn ($f) => DashboardController::formatFixture($f))
            ->toArray();

        // Extract unique groups, stages from fixtures
        $groups = collect($allFixtures)->pluck('group')->filter()->unique()->values()->toArray();
        $stages = collect($allFixtures)->pluck('stage')->filter()->unique()->values()->toArray();
        $teams = collect($allFixtures)
            ->pluck('homeTeam')
            ->merge(collect($allFixtures)->pluck('awayTeam'))
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        // Stats
        $stats = [
            'total_matches' => count($allFixtures),
            'favorites' => count($favoriteIds),
            'completed' => collect($allFixtures)->where('status', 'completed')->count(),
            'upcoming' => collect($allFixtures)->where('status', 'scheduled')->count(),
        ];

        return Inertia::render('Fan/MatchSchedule', [
            'allFixtures' => $allFixtures,
            'groups' => $groups,
            'stages' => $stages,
            'teams' => $teams,
            'stats' => $stats,
            'userFavorites' => $favoriteIds,
        ]);
    }

    public function toggleFavorite($fixtureId)
    {
        $user = Auth::user();

        $existing = FavoriteMatch::where('user_id', $user->id)
            ->where('fixture_id', $fixtureId)
            ->first();

        if ($existing) {
            $existing->delete();

            return back()->with('success', 'Match removed from favorites');
        }

        FavoriteMatch::create([
            'user_id' => $user->id,
            'fixture_id' => $fixtureId,
        ]);

        return back()->with('success', 'Match added to favorites');
    }
}
