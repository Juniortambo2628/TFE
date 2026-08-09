<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FavoriteMatch extends Model
{
    protected $fillable = [
        'user_id', 'fixture_id', 'tournament_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Optional relationship to Fixture model (works for DB-sourced fixtures only).
     * For external fixtures, resolve via FixtureService instead.
     */
    public function fixture()
    {
        return $this->belongsTo(Fixture::class);
    }
}
