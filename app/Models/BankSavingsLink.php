<?php

namespace App\Models;

use App\Savings\SavingsProvider;
use Illuminate\Database\Eloquent\Model;

/**
 * The ONLY thing TFE keeps about a fan's bank savings (Sprint 67): which bank,
 * an opaque account reference, the goal it is for, and the consent. Balances
 * and transactions are never stored — see the migration.
 */
class BankSavingsLink extends Model
{
    public const SCOPES = ['balance', 'transactions', 'deposit_instructions', 'payment_on_authorisation'];

    protected $fillable = [
        'user_id', 'savings_goal_id', 'partner_user_id', 'provider',
        'external_ref', 'status', 'consent_scopes', 'consented_at',
    ];

    protected $hidden = ['external_ref'];

    protected $casts = [
        'external_ref' => 'encrypted',
        'consent_scopes' => 'array',
        'consented_at' => 'datetime',
    ];

    public function goal()
    {
        return $this->belongsTo(SavingsGoal::class, 'savings_goal_id');
    }

    public function partner()
    {
        return $this->belongsTo(User::class, 'partner_user_id');
    }

    public function provider(): SavingsProvider
    {
        return self::resolve($this->provider);
    }

    public static function resolve(string $key): SavingsProvider
    {
        $class = config("savings.providers.{$key}");
        abort_unless($class, 404);

        return app($class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && filled($this->external_ref);
    }
}
