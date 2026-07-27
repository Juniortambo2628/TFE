<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ad extends Model
{
    protected $fillable = [
        'title',
        'description',
        'image_url',
        'link_url',
        'ad_type',
        'partner_name',
        'is_active',
        'display_order',
        'impressions',
        'clicks',
    ];

    protected $appends = ['image_display_url'];

    public function getImageDisplayUrlAttribute()
    {
        return $this->image_url ? asset('storage/'.$this->image_url) : asset('assets/img/logo/TFE-logo.png');
    }

    protected $casts = [
        'is_active' => 'boolean',
        'impressions' => 'integer',
        'clicks' => 'integer',
        'display_order' => 'integer',
    ];

    public function incrementImpression(): void
    {
        $this->increment('impressions');
    }

    public function incrementClick(): void
    {
        $this->increment('clicks');
    }
}
