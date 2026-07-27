<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fixture extends Model
{
    protected $fillable = [
        'date', 'time', 'home_team', 'away_team', 'group', 'venue', 'stage', 'matchday',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
