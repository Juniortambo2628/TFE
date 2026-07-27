<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'user_id', 'sender_id', 'subject', 'body', 'is_read', 'share_type', 'share_id', 'tribe_id', 'budget_id', 'sender_type',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tribe()
    {
        return $this->belongsTo(Tribe::class);
    }

    public function budget()
    {
        return $this->belongsTo(Budget::class);
    }

    public function sharedPost()
    {
        return $this->belongsTo(Post::class, 'share_id');
    }

    public function sharedStory()
    {
        return $this->belongsTo(Story::class, 'share_id');
    }
}
