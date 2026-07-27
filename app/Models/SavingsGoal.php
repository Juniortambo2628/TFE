<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavingsGoal extends Model
{
    use HasFactory;

    // Explicit table name
    protected $table = 'savings_goals';

    protected $fillable = [
        'user_id',
        'budget_id',
        'target_amount',
        'current_amount',
        'status', // ACTIVE, COMPLETED
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'current_amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
