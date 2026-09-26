<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A fan's request to join a tribe that is not open to all.
 */
class TribeJoinRequest extends Model
{
    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const REJECTED = 'rejected';

    protected $fillable = [
        'tribe_id',
        'user_id',
        'message',
        'status',
        'decided_by',
        'decided_at',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
    ];

    public function tribe(): BelongsTo
    {
        return $this->belongsTo(Tribe::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', self::PENDING);
    }

    public function isPending(): bool
    {
        return $this->status === self::PENDING;
    }
}
