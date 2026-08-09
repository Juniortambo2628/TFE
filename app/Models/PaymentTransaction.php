<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    protected $fillable = [
        'user_id', 'booking_id', 'amount', 'currency', 'type', 'method', 'status',
        'reference', 'mpesa_receipt', 'stripe_payment_intent',
        'description', 'metadata', 'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'paid_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public static function generateReference()
    {
        return 'TXN-'.strtoupper(uniqid()).'-'.time();
    }
}
