<?php

namespace App\Models;

use App\Support\StadiumLayout;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One numbered block of one tier of one fixture ("Block 207").
 *
 * Owns its `sold`; the tier's totals are derived from its blocks by
 * `TicketTier::syncBlockTotals()`. Where it sits on the map comes from
 * `App\Support\StadiumLayout` by `code`, so nothing here stores an angle.
 */
class TicketBlock extends Model
{
    protected $fillable = [
        'ticket_tier_id', 'code', 'stand', 'capacity', 'sold', 'sort_order',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'sold' => 'integer',
        'sort_order' => 'integer',
    ];

    protected $appends = ['remaining', 'sold_pct', 'is_sold_out', 'stand_name'];

    public function tier(): BelongsTo
    {
        return $this->belongsTo(TicketTier::class, 'ticket_tier_id');
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

    public function getStandNameAttribute(): ?string
    {
        return StadiumLayout::standName($this->stand);
    }
}
