<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A hospitality box of one fixture, sold whole at one price. See the
 * migration for why it is not part of the tiers.
 */
class TicketBox extends Model
{
    protected $fillable = [
        'ticket_id', 'code', 'name', 'seats', 'price', 'booked_at', 'ticket_purchase_id', 'sort_order',
    ];

    protected $casts = [
        'seats' => 'integer',
        'price' => 'decimal:2',
        'booked_at' => 'datetime',
        'sort_order' => 'integer',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(TicketPurchase::class, 'ticket_purchase_id');
    }

    public function isBooked(): bool
    {
        return $this->booked_at !== null;
    }
}
