<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TribePostReply extends Model
{
    protected $fillable = [
        'tribe_post_id', 'user_id', 'content'
    ];

    public function post()
    {
        return $this->belongsTo(TribePost::class, 'tribe_post_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
