<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VirtualCardTransaction extends Model
{
    protected $fillable = [
        'virtual_card_id', 'kind', 'amount', 'currency',
        'merchant', 'category', 'reference', 'posted_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'posted_at' => 'datetime',
    ];

    public function card()
    {
        return $this->belongsTo(VirtualCard::class, 'virtual_card_id');
    }
}
