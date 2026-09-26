<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $fillable = [
        'tournament_id', 'partner_id',
        'home_team', 'home_team_code', 'away_team', 'away_team_code',
        'venue_slug', 'venue_name', 'venue_city', 'venue_country', 'venue_capacity',
        'stage', 'kickoff_at',
        'price', 'currency', 'capacity', 'sold', 'hero_image', 'is_active',
    ];

    protected $casts = [
        'kickoff_at' => 'datetime',
        'price' => 'decimal:2',
        'capacity' => 'integer',
        'sold' => 'integer',
        'venue_capacity' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = ['remaining', 'sold_pct', 'is_sold_out'];

    public function partner()
    {
        return $this->belongsTo(User::class, 'partner_id');
    }

    public function purchases()
    {
        return $this->hasMany(TicketPurchase::class);
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }

    public function scopeForTournament($q, string $id)
    {
        return $q->where('tournament_id', $id);
    }

    public function getRemainingAttribute(): int
    {
        return max(0, ($this->capacity ?? 0) - ($this->sold ?? 0));
    }

    public function getSoldPctAttribute(): int
    {
        if (! $this->capacity) {
            return 0;
        }

        return (int) round(($this->sold / $this->capacity) * 100);
    }

    public function getIsSoldOutAttribute(): bool
    {
        return $this->remaining <= 0;
    }
}
