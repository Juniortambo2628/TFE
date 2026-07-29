<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fixture extends Model
{
    protected $fillable = [
        'date', 'time', 'home_team', 'away_team', 'group', 'venue', 'stage', 'matchday',
        'home_score', 'away_score', 'status',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
