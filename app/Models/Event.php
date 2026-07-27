<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'title',
        'description',
        'date',
        'location',
        'type',
        'image',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        return $this->image ? asset('storage/' . $this->image) : asset('assets/img/logo/TFE-logo.png');
    }

    public function rsvps()
    {
        return $this->hasMany(EventRsvp::class);
    }
}
