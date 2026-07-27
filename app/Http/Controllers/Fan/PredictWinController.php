<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Prediction;
use App\Models\Prize;
use App\Models\WorldCupMatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PredictWinController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get upcoming matches open for predictions
        $upcomingMatches = WorldCupMatch::openForPrediction()
            ->orderBy('date')
            ->get()
            ->map(function ($match) {
                return [
                    'id' => $match->id,
                    'home_team' => $match->home_team,
                    'away_team' => $match->away_team,
                    'date' => $match->date->format('Y-m-d'),
                    'stage' => $match->stage,
                    'venue' => $match->venue,
                    'status' => $match->status,
                    'prediction_deadline' => $match->prediction_deadline,
                ];
            });

        // Calculate user stats from predictions (DB-level aggregation instead of fetching all)
        $predictionStats = Prediction::where('user_id', $user->id)
            ->selectRaw('COUNT(*) as total_predictions, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_predictions, SUM(points_earned) as total_points')
            ->first();

        $totalPredictions = $predictionStats->total_predictions;
        $correctPredictions = $predictionStats->correct_predictions;
        $totalPoints = $predictionStats->total_points ?? 0;

        // Calculate rank
        $rank = $this->getUserRank($user->id, $totalPoints);

        $userStats = [
            'total_predictions' => $totalPredictions,
            'correct_predictions' => $correctPredictions,
            'points' => $totalPoints,
            'rank' => $rank,
            'accuracy' => $totalPredictions > 0 ? round(($correctPredictions / $totalPredictions) * 100) : 0,
        ];

        // Get leaderboard - top 10 users by points
        $leaderboard = $this->getLeaderboard();

        // Get active prizes
        $prizes = Prize::active()->orderBy('position')->get()->map(function ($prize) {
            return [
                'position' => $prize->position,
                'prize' => $prize->name,
                'value' => $prize->formatted_value,
            ];
        });

        return Inertia::render('Fan/PredictWin', [
            'upcomingMatches' => $upcomingMatches,
            'userStats' => $userStats,
            'leaderboard' => $leaderboard,
            'prizes' => $prizes,
        ]);
    }

    public function predict(Request $request)
    {
        $validated = $request->validate([
            'match_id' => 'required|exists:world_cup_matches,id',
            'home_score' => 'required|integer|min:0|max:20',
            'away_score' => 'required|integer|min:0|max:20',
        ]);

        $user = Auth::user();
        $match = WorldCupMatch::findOrFail($validated['match_id']);

        // Check if match is open for predictions
        if (! $match->is_prediction_open) {
            return back()->withErrors(['match' => 'This match is no longer open for predictions.']);
        }

        // Check if user already predicted this match
        $existingPrediction = Prediction::where('user_id', $user->id)
            ->where('match_id', $match->id)
            ->first();

        if ($existingPrediction) {
            // Update existing prediction
            $existingPrediction->update([
                'home_score' => $validated['home_score'],
                'away_score' => $validated['away_score'],
            ]);

            return back()->with('success', 'Prediction updated successfully!');
        }

        // Create new prediction
        Prediction::create([
            'user_id' => $user->id,
            'match_id' => $match->id,
            'home_score' => $validated['home_score'],
            'away_score' => $validated['away_score'],
        ]);

        return back()->with('success', 'Prediction submitted successfully!');
    }

    private function getUserRank($userId, $userPoints)
    {
        if ($userPoints === 0) {
            return '-';
        }

        $rank = DB::table('predictions')
            ->select('user_id', DB::raw('SUM(points_earned) as total_points'))
            ->groupBy('user_id')
            ->having('total_points', '>', $userPoints)
            ->count() + 1;

        return $rank;
    }

    private function getLeaderboard()
    {
        $leaders = DB::table('predictions')
            ->join('users', 'predictions.user_id', '=', 'users.id')
            ->select(
                'users.id',
                'users.name',
                DB::raw('SUM(predictions.points_earned) as total_points'),
                DB::raw('SUM(CASE WHEN predictions.is_correct = 1 THEN 1 ELSE 0 END) as correct_count')
            )
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_points')
            ->limit(10)
            ->get();

        $leaderboard = [];
        $rank = 1;
        foreach ($leaders as $leader) {
            $leaderboard[] = [
                'rank' => $rank++,
                'name' => $this->abbreviateName($leader->name),
                'points' => (int) $leader->total_points,
                'correct' => (int) $leader->correct_count,
            ];
        }

        // If no data, provide placeholder
        if (empty($leaderboard)) {
            $leaderboard = [
                ['rank' => 1, 'name' => 'Be the first!', 'points' => 0, 'correct' => 0],
            ];
        }

        return $leaderboard;
    }

    private function abbreviateName($name)
    {
        $parts = explode(' ', $name);
        if (count($parts) >= 2) {
            return $parts[0].' '.substr($parts[1], 0, 1).'.';
        }

        return $name;
    }
}
