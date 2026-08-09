<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\FavoriteMatch;
use App\Services\FixtureService;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MatchScheduleController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Resolve active tournament
        $tournamentService = app(TournamentService::class);
        $tournament = $tournamentService->current();
        $tournamentId = $tournament['id'] ?? 'wc_2026';

        // Get user's favorite external IDs (scoped to this tournament)
        $favoriteExternalIds = FavoriteMatch::where('user_id', $user->id)
            ->where('tournament_id', $tournamentId)
            ->whereNotNull('external_id')
            ->pluck('external_id')
            ->toArray();

        // Get all fixtures from dynamic source
        $fixtureService = app(FixtureService::class);
        $allFixtures = $fixtureService->getFixtures($tournamentId);

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
            'favorites' => count($favoriteExternalIds),
            'completed' => collect($allFixtures)->where('status', 'completed')->count(),
            'upcoming' => collect($allFixtures)->where('status', 'scheduled')->count(),
        ];

        return Inertia::render('Fan/MatchSchedule', [
            'allFixtures' => $allFixtures,
            'groups' => $groups,
            'stages' => $stages,
            'teams' => $teams,
            'stats' => $stats,
            'userFavorites' => $favoriteExternalIds,
        ]);
    }

    public function toggleFavorite($fixtureId)
    {
        $user = Auth::user();

        // Resolve active tournament for scoping
        $tournamentService = app(TournamentService::class);
        $tournament = $tournamentService->current();
        $tournamentId = $tournament['id'] ?? 'wc_2026';

        // Determine source from fixture ID prefix
        $source = match (true) {
            str_starts_with($fixtureId, 'ts_') => 'thestatsapi',
            str_starts_with($fixtureId, 'of_') => 'openfootball',
            str_starts_with($fixtureId, 'wiki_') => 'wikipedia',
            default => 'db',
        };

        $existing = FavoriteMatch::where('user_id', $user->id)
            ->where('external_id', $fixtureId)
            ->where('tournament_id', $tournamentId)
            ->first();

        if ($existing) {
            $existing->delete();

            return back()->with('success', 'Match removed from favorites');
        }

        FavoriteMatch::create([
            'user_id' => $user->id,
            'external_id' => $fixtureId,
            'source' => $source,
            'tournament_id' => $tournamentId,
        ]);

        return back()->with('success', 'Match added to favorites');
    }
}
