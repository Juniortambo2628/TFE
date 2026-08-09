<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FavoriteMatch extends Model
{
    protected $fillable = [
        'user_id', 'fixture_id', 'tournament_id', 'external_id', 'source',
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

    /**
     * Scope to find by external fixture ID.
     */
    public function scopeByExternalId($query, $externalId, $tournamentId)
    {
        return $query->where('external_id', $externalId)
            ->where('tournament_id', $tournamentId);
    }
}
