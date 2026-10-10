<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A fan's opt-in number for SMS / WhatsApp alerts (Sprint 66). Separate from
 * `users` on purpose — see the migration.
 */
class NotificationContact extends Model
{
    protected $fillable = [
        'user_id', 'phone', 'channel', 'consented_at', 'verified_at',
        'otp_hash', 'otp_expires_at', 'otp_attempts',
    ];

    protected $hidden = ['otp_hash'];

    protected $casts = [
        'consented_at' => 'datetime',
        'verified_at' => 'datetime',
        'otp_expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    /** "+254712345678" → "+254 •••• 678", for showing the number back. */
    public function masked(): string
    {
        return substr($this->phone, 0, 4).' •••• '.substr($this->phone, -3);
    }
}
