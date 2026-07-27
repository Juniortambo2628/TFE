<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $table = 'contact_submissions';

    protected $fillable = [
        'user_id', 'name', 'email', 'subject', 'message', 'is_read',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
