<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One seating tier of one fixture's ticket inventory.
 *
 * The four keys mirror the 3D bowl's rings exactly (`StadiumBowlService`), so
 * a tier's occupancy shades the ring it actually corresponds to. Add a key
 * here and the bowl has no ring for it.
 */
class TicketTier extends Model
{
    public const KEYS = ['vip', 'premium', 'standard', 'upper'];

    /**
     * Default split of a fixture's seats across the four tiers, plus the
     * price multiplier applied to the fixture's base (Standard) price.
     *
     * `share` is NOT arbitrary: it is the proportion of the bowl's seating
     * AREA each ring covers, derived from the tier radii in
     * `resources/js/lib/stadiumBowl.js` (area goes as outerR^2 - innerR^2).
     * Keeping the two in step means a tier that looks like half the bowl
     * holds roughly half the seats — the map reads as the inventory rather
     * than merely sitting next to it.
     *
     * @var array<string, array{name:string, share:float, multiplier:float, sort:int}>
     */
    public const BLUEPRINT = [
        'vip' => ['name' => 'VIP', 'share' => 0.0650, 'multiplier' => 4.0, 'sort' => 0],
        'premium' => ['name' => 'Premium', 'share' => 0.1518, 'multiplier' => 2.0, 'sort' => 1],
        'standard' => ['name' => 'Standard', 'share' => 0.3035, 'multiplier' => 1.0, 'sort' => 2],
        'upper' => ['name' => 'Upper', 'share' => 0.4797, 'multiplier' => 0.6, 'sort' => 3],
    ];

    protected $fillable = [
        'ticket_id', 'key', 'name', 'price', 'capacity', 'sold', 'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'capacity' => 'integer',
        'sold' => 'integer',
        'sort_order' => 'integer',
    ];

    protected $appends = ['remaining', 'sold_pct', 'is_sold_out'];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(TicketPurchase::class);
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
     * Build the four default tier rows for a fixture from its total capacity
     * and base (Standard) price.
     *
     * Rounding is absorbed by the largest tier so the shares always add back
     * up to exactly `$capacity` — otherwise the parent total drifts from the
     * sum of its tiers and the sell-through bar disagrees with the bowl.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function blueprintFor(int $capacity, float $basePrice): array
    {
        $rows = [];
        $allocated = 0;

        foreach (self::BLUEPRINT as $key => $spec) {
            $seats = (int) floor($capacity * $spec['share']);
            $allocated += $seats;

            $rows[] = [
                'key' => $key,
                'name' => $spec['name'],
                'price' => round($basePrice * $spec['multiplier'], 2),
                'capacity' => $seats,
                'sold' => 0,
                'sort_order' => $spec['sort'],
            ];
        }

        // Hand the remainder to the biggest tier (Upper).
        $remainder = $capacity - $allocated;

        if ($remainder !== 0 && $rows !== []) {
            $largest = array_key_last($rows);
            $rows[$largest]['capacity'] = max(0, $rows[$largest]['capacity'] + $remainder);
        }

        return $rows;
    }
}
