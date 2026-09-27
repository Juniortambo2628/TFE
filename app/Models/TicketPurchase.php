<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketPurchase extends Model
{
    protected $fillable = [
        'user_id', 'ticket_id', 'ticket_tier_id', 'tier_name', 'quantity',
        'unit_price', 'total', 'currency',
        'reference', 'status', 'paid_with',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * The tier bought. Null for purchases predating tiered inventory, and for
     * one whose tier was later removed — `tier_name` is the snapshot that
     * keeps the receipt readable in both cases.
     */
    public function tier()
    {
        return $this->belongsTo(TicketTier::class, 'ticket_tier_id');
    }
}
