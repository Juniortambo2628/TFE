<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'package_name',
        'package_type',
        'status',
        'total_amount',
        'amount_paid',
        'booking_date',
        'flight_info',
        'accommodation',
        'matches',
        'expires_at'
    ];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'booking_date' => 'date',
        'matches' => 'json',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
