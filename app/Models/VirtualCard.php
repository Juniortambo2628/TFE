<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VirtualCard extends Model
{
    protected $fillable = [
        'user_id', 'partner_id', 'holder_name',
        'pan', 'last4', 'expiry', 'cvv', 'network',
        'status', 'balances',
    ];

    protected $casts = [
        'balances' => 'array',
    ];

    protected $hidden = ['pan', 'cvv'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function partner()
    {
        return $this->belongsTo(User::class, 'partner_id');
    }

    public function transactions()
    {
        return $this->hasMany(VirtualCardTransaction::class)->orderByDesc('posted_at');
    }

    public function maskedPan(): string
    {
        return trim(chunk_split('************'.$this->last4, 4, ' '));
    }
}
