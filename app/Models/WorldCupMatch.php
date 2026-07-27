<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorldCupMatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'home_team',
        'away_team',
        'date',
        'time',
        'stage',
        'venue',
        'group_name',
        'home_score',
        'away_score',
        'status',
        'prediction_deadline',
    ];

    protected $casts = [
        'date' => 'date',
        'prediction_deadline' => 'datetime',
    ];

    protected $appends = ['is_prediction_open'];

    public function predictions()
    {
        return $this->hasMany(Prediction::class, 'match_id');
    }

    public function getIsPredictionOpenAttribute()
    {
        return $this->status === 'open' &&
               ($this->prediction_deadline === null || $this->prediction_deadline->isFuture());
    }

    public function scopeUpcoming($query)
    {
        return $query->whereIn('status', ['upcoming', 'open'])->orderBy('date');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeOpenForPrediction($query)
    {
        return $query->where('status', 'open')
            ->where(function ($q) {
                $q->whereNull('prediction_deadline')
                    ->orWhere('prediction_deadline', '>', now());
            });
    }
}
