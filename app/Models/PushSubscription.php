<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One browser / installed app that has web push on (see the migration). */
class PushSubscription extends Model
{
    protected $fillable = ['user_id', 'endpoint', 'endpoint_hash', 'p256dh', 'auth', 'user_agent', 'last_pushed_at'];

    protected $hidden = ['endpoint', 'p256dh', 'auth'];

    protected $casts = ['last_pushed_at' => 'datetime'];

    public static function hashFor(string $endpoint): string
    {
        return hash('sha256', $endpoint);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
