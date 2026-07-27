<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TribePost extends Model
{
    protected $fillable = [
        'tribe_id', 'user_id', 'title', 'content', 'is_pinned', 'view_count',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
    ];

    public function tribe()
    {
        return $this->belongsTo(Tribe::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function replies()
    {
        return $this->hasMany(TribePostReply::class);
    }

    public function getRepliesCountAttribute()
    {
        return $this->replies()->count();
    }
}
