<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentSchedule extends Model
{
    use HasFactory;

    // Explicit table name if needed, but defaults to payment_schedules
    protected $table = 'payment_schedules';

    protected $fillable = [
        'user_id',
        'booking_id',
        'title',
        'description',
        'payment_number',
        'amount',
        'due_date',
        'status',
        'paid_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
