<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanApplication extends Model
{
    use HasFactory;

    protected $table = 'loan_applications';

    protected $fillable = [
        'user_id',
        'budget_id',
        'amount',
        'status', // PENDING, APPROVED, REJECTED
        'interest_rate',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'interest_rate' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
