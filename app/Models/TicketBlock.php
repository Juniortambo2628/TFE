<?php

namespace App\Models;

use App\Exceptions\SeatsUnavailable;
use App\Support\SeatAllocator;
use App\Support\StadiumLayout;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\QueryException;

/**
 * One numbered block of one tier of one fixture ("Block 207").
 *
 * Its `sold` is the count of its taken seats (`ticket_seats`), kept by
 * `syncSeatTotals()`; the tier's totals are derived from its blocks by
 * `TicketTier::syncBlockTotals()`. Seats are only ever taken through
 * `assignSeats()`, which the purchase flow and the seeders share. Where it sits on the map comes from
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

    public function seats(): HasMany
    {
        return $this->hasMany(TicketSeat::class);
    }

    /**
     * This block's seat grid. Needs the tier's position (its number leads the
     * row count), so the tier is loaded if it is not already.
     *
     * @return array{rows:int, per_row:int, last_row:int}
     */
    public function grid(): array
    {
        return StadiumLayout::seatGrid((int) $this->capacity, $this->tier->number());
    }

    /** @return array<string, bool> "row:number" => true for every taken seat */
    public function takenMap(): array
    {
        return $this->seats()->get(['row', 'number'])
            ->mapWithKeys(fn (TicketSeat $s) => ["{$s->row}:{$s->number}" => true])
            ->all();
    }

    /** `sold` is the count of taken seats. */
    public function syncSeatTotals(): void
    {
        $this->forceFill(['sold' => $this->seats()->count()])->save();
    }

    /**
     * Give seat rows to sales that have none — the backfill for blocks that
     * were selling before seats existed. Idempotent: does nothing once every
     * sale has a seat.
     *
     * TFE purchases in this block are seated first, each together where the
     * block allows. The rest were sold elsewhere and TFE was never told
     * where: they are spread by `SeatAllocator::scatter`, the same way every
     * time, so `sold` keeps its exact value.
     */
    public function seatAllSales(): void
    {
        $seated = $this->seats()->count();

        if ($seated >= $this->sold) {
            return;
        }

        $grid = $this->grid();
        $taken = $this->takenMap();
        $rows = [];

        $purchases = TicketPurchase::query()
            ->where('ticket_block_id', $this->id)
            ->whereDoesntHave('seats')
            ->orderBy('id')
            ->get();

        foreach ($purchases as $purchase) {
            $pick = SeatAllocator::together($grid, $taken, $purchase->quantity)
                ?? SeatAllocator::nearest($grid, $taken, $purchase->quantity)
                ?? [];

            foreach ($pick as [$row, $n]) {
                $taken["{$row}:{$n}"] = true;
                $rows[] = $this->seatRow($row, $n, $purchase->id);
            }
        }

        $elsewhere = (int) $this->sold - $seated - count($rows);

        foreach (SeatAllocator::scatter($grid, $taken, $elsewhere, $this->scatterSeed()) as [$row, $n]) {
            $rows[] = $this->seatRow($row, $n, null);
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            TicketSeat::insert($chunk);
        }

        $this->syncSeatTotals();
    }

    /**
     * Take `$quantity` seats for `$purchase` (null = sold elsewhere): exactly
     * `$chosen` ([[row, number], ...]) when the fan picked them, otherwise
     * the best seats together, falling back to the best seats apart. Updates
     * `sold`; the caller re-derives the tier and fixture totals.
     *
     * @return array<int, array{0:int, 1:int}> the seats taken
     *
     * @throws SeatsUnavailable with a message fit for the fan
     */
    public function assignSeats(?TicketPurchase $purchase, int $quantity, ?array $chosen = null): array
    {
        // Older sales first, so a new order can never be given their seats.
        $this->seatAllSales();

        $grid = $this->grid();
        $taken = $this->takenMap();

        if ($chosen !== null) {
            if (count($chosen) !== $quantity) {
                throw new SeatsUnavailable('Pick '.$quantity.' seat'.($quantity === 1 ? '' : 's').' to match your quantity.');
            }

            foreach ($chosen as [$row, $n]) {
                if ($n < 1 || $n > StadiumLayout::seatsInRow($grid, $row)) {
                    throw new SeatsUnavailable("Row {$row}, seat {$n} is not in block {$this->code}.");
                }

                if (isset($taken["{$row}:{$n}"])) {
                    throw new SeatsUnavailable("Row {$row}, seat {$n} in block {$this->code} has already gone.");
                }
            }

            $pick = $chosen;
        } else {
            $pick = SeatAllocator::together($grid, $taken, $quantity)
                ?? SeatAllocator::nearest($grid, $taken, $quantity);

            if ($pick === null) {
                throw new SeatsUnavailable('Block '.$this->code.' has '.$this->remaining.' seats left.');
            }
        }

        try {
            TicketSeat::insert(array_map(fn ($s) => $this->seatRow($s[0], $s[1], $purchase?->id), $pick));
        } catch (QueryException $e) {
            // The unique index caught a race: someone took one of these seats
            // between our read and this write.
            throw new SeatsUnavailable('One of those seats was just taken. Please pick again.');
        }

        $this->syncSeatTotals();

        return $pick;
    }

    private function seatRow(int $row, int $number, ?int $purchaseId): array
    {
        $now = now();

        return [
            'ticket_block_id' => $this->id,
            'row' => $row,
            'number' => $number,
            'ticket_purchase_id' => $purchaseId,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    /** Seed for the "sold elsewhere" scatter: stable per block of a fixture. */
    private function scatterSeed(): string
    {
        return $this->ticket_tier_id.'-'.$this->code;
    }
}
