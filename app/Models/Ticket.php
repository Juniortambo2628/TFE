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

    /**
     * Seating tiers, innermost ring first — the order the 3D bowl draws them.
     */
    public function tiers()
    {
        return $this->hasMany(TicketTier::class)->orderBy('sort_order');
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

    /**
     * Create this fixture's four default tiers from its own capacity + price.
     *
     * Idempotent, so it is safe from a seeder or a backfill. Does nothing if
     * tiers already exist — a partner's own pricing must never be clobbered.
     */
    public function seedDefaultTiers(): void
    {
        if ($this->tiers()->exists()) {
            return;
        }

        foreach (TicketTier::blueprintFor((int) $this->capacity, (float) $this->price) as $row) {
            $this->tiers()->create($row);
        }

        $this->syncTierTotals();
    }

    /**
     * Recompute `capacity` and `sold` from the tier rows.
     *
     * These two columns are denormalized totals: the ticket cards, the
     * sell-through bar and `Partner\TicketController::statsFor` all read them
     * directly. They are owned here and NOWHERE else — never `increment('sold')`
     * by hand, or the parent drifts from the sum of its tiers and the bowl
     * stops agreeing with the progress bar above it. (Same rule, and the same
     * bug, as `Tribe::syncCounts()`.)
     *
     * A fixture with no tiers keeps whatever totals it has, so an untiered
     * legacy row is left exactly as it was rather than being zeroed.
     */
    public function syncTierTotals(): void
    {
        $tiers = $this->tiers()->get();

        if ($tiers->isEmpty()) {
            return;
        }

        $this->forceFill([
            'capacity' => (int) $tiers->sum('capacity'),
            'sold' => (int) $tiers->sum('sold'),
        ])->save();
    }
}
