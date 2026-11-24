<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One taken seat. Empty seats are never stored — see the migration and
 * `App\Support\StadiumLayout::seatGrid()`.
 */
class TicketSeat extends Model
{
    protected $fillable = ['ticket_block_id', 'row', 'number', 'ticket_purchase_id'];

    protected $casts = [
        'row' => 'integer',
        'number' => 'integer',
    ];

    public function block(): BelongsTo
    {
        return $this->belongsTo(TicketBlock::class, 'ticket_block_id');
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(TicketPurchase::class, 'ticket_purchase_id');
    }
}
