<?php

namespace App\Models;

use App\Support\StadiumLayout;
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

    /** Numbered blocks, in order round the ground. */
    public function blocks(): HasMany
    {
        return $this->hasMany(TicketBlock::class)->orderBy('sort_order');
    }

    /** 1-based position of this tier in the bowl, which leads block codes. */
    public function number(): int
    {
        $i = array_search($this->key, self::KEYS, true);

        return $i === false ? (int) $this->sort_order + 1 : $i + 1;
    }

    /**
     * Split this tier into its blocks. Idempotent: a tier that has blocks is
     * left alone.
     *
     * Seats go by each block's share of the footprint's area (a boxier
     * ground, `$cornerRatio` < 1, puts more in its corners). Seats ALREADY
     * sold are spread across the blocks in proportion to their size, so a
     * tier that had sales before blocks existed keeps exactly its total —
     * the bowl must not lose occupancy to a data migration.
     */
    public function seedDefaultBlocks(?float $cornerRatio = null): void
    {
        if ($this->blocks()->exists()) {
            return;
        }

        $layout = StadiumLayout::blocks($this->number());
        $capacity = (int) $this->capacity;
        $seats = StadiumLayout::apportion($capacity, StadiumLayout::shares($cornerRatio));
        $sold = StadiumLayout::apportion(min((int) $this->sold, $capacity), $seats);

        foreach ($layout as $i => $block) {
            $this->blocks()->create([
                'code' => $block['code'],
                'stand' => $block['stand'],
                'capacity' => $seats[$i],
                'sold' => min($seats[$i], $sold[$i]),
                'sort_order' => $i,
            ]);
        }

        $this->syncBlockTotals();
    }

    /**
     * Recompute `capacity` and `sold` from the blocks — the same rule as
     * `Ticket::syncTierTotals()` one level up. A tier without blocks keeps
     * what it has, so a legacy fixture stays purchasable.
     */
    public function syncBlockTotals(): void
    {
        $blocks = $this->blocks()->get();

        if ($blocks->isEmpty()) {
            return;
        }

        $this->forceFill([
            'capacity' => (int) $blocks->sum('capacity'),
            'sold' => (int) $blocks->sum('sold'),
        ])->save();
    }

    /**
     * "Best available" for an order that did not pick a block: the block
     * with the most seats left, provided the whole order fits in it — a
     * party of four bought together should sit together, so an order is
     * never split across blocks. Ties go to the earlier block.
     */
    public function bestBlockFor(int $quantity): ?TicketBlock
    {
        return $this->blocks()
            // reorder(): blocks() already sorts by position, and a second
            // ORDER BY only breaks ties within the first — that returned the
            // first block with room, not the roomiest.
            ->reorder()
            // `sold + n <= capacity`, not `capacity - sold >= n`: both are
            // UNSIGNED on MySQL, where a negative difference is an error.
            ->whereRaw('sold + ? <= capacity', [$quantity])
            ->orderByRaw('capacity - sold DESC')
            ->orderBy('sort_order')
            ->first();
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
