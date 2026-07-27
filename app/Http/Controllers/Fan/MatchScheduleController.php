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

        // Get all fixtures
        $fixtures = Fixture::orderBy('date')
            ->orderBy('time')
            ->get()
            ->map(function ($fixture) use ($favoriteIds) {
                return [
                    'id' => $fixture->id,
                    'home_team' => $fixture->home_team,
                    'away_team' => $fixture->away_team,
                    'date' => $fixture->date->format('Y-m-d'),
                    'date_formatted' => $fixture->date->format('M d, Y'),
                    'time' => $fixture->time ?? '00:00',
                    'venue' => $fixture->venue,
                    'stage' => $fixture->stage,
                    'group' => $fixture->group,
                    'home_score' => $fixture->home_score,
                    'away_score' => $fixture->away_score,
                    'status' => $fixture->status ?? 'scheduled',
                    'is_favorite' => in_array($fixture->id, $favoriteIds),
                ];
            });

        // Group by date
        $fixturesByDate = $fixtures->groupBy('date');

        // Get unique groups, stages, and teams for filtering
        $groups = Fixture::distinct()->pluck('group')->filter()->values();
        $stages = Fixture::distinct()->pluck('stage')->filter()->values();
        $teams = Fixture::distinct()
            ->pluck('home_team')
            ->merge(Fixture::distinct()->pluck('away_team'))
            ->unique()
            ->sort()
            ->values();

        // Stats
        $stats = [
            'total_matches' => Fixture::count(),
            'favorites' => count($favoriteIds),
            'completed' => Fixture::where('status', 'completed')->count(),
            'upcoming' => Fixture::where('status', 'scheduled')->count(),
        ];

        return Inertia::render('Fan/MatchSchedule', [
            'fixtures' => $fixturesByDate,
            'allFixtures' => $fixtures,
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
