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
        'finance_partner_id',
        'amount',
        'purpose',
        'status',
        'notes',
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

    public function budget()
    {
        return $this->belongsTo(Budget::class);
    }

    /**
     * The finance partner routed to service this application. Nullable
     * for legacy rows and admin-owned applications with no routing.
     */
    public function financePartner()
    {
        return $this->belongsTo(User::class, 'finance_partner_id');
    }

    public function scopeForPartner($query, int $partnerId)
    {
        return $query->where('finance_partner_id', $partnerId);
    }
}
