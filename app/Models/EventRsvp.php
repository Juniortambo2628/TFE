<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventRsvp extends Model
{
    protected $fillable = [
        'user_id', 'event_id', 'status', 'reminded_at',
    ];

    protected $casts = ['reminded_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
