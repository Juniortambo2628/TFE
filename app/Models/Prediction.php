<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'match_id',
        'home_score',
        'away_score',
        'points_earned',
        'is_correct',
        'is_exact',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'is_exact' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function match()
    {
        return $this->belongsTo(WorldCupMatch::class, 'match_id');
    }

    /**
     * Calculate points based on actual match result.
     * - Exact score: 10 points
     * - Correct result (win/draw/loss): 5 points
     * - Wrong: 0 points
     */
    public function calculatePoints($actualHome, $actualAway)
    {
        // Exact score match
        if ($this->home_score === $actualHome && $this->away_score === $actualAway) {
            $this->is_exact = true;
            $this->is_correct = true;
            $this->points_earned = 10;
            return 10;
        }

        // Correct result (home win, away win, or draw)
        $predictedResult = $this->home_score <=> $this->away_score;
        $actualResult = $actualHome <=> $actualAway;

        if ($predictedResult === $actualResult) {
            $this->is_correct = true;
            $this->points_earned = 5;
            return 5;
        }

        $this->is_correct = false;
        $this->points_earned = 0;
        return 0;
    }
}
