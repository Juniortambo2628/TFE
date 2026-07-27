<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'user_id', 'type', 'phone_number', 'card_last_four', 
        'card_brand', 'stripe_payment_method_id', 'is_default'
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    protected $hidden = [
        'stripe_payment_method_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getDisplayNameAttribute()
    {
        if ($this->type === 'mpesa') {
            return 'M-Pesa (' . substr($this->phone_number, -4) . ')';
        }
        return ucfirst($this->card_brand) . ' •••• ' . $this->card_last_four;
    }
}
