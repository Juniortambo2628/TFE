<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * PartnerProfile — the publishable "branded hub" content owned by a
 * partner. 1:1 with User. Public /partners/{slug} routes render from
 * this model; the admin partner directory edits it.
 */
class PartnerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'slug',
        'display_name',
        'tagline',
        'about',
        'hero_image',
        'logo_url',
        'theme_accent',
        'stats',
        'service_tags',
        'contact_email',
        'contact_phone',
        'website_url',
        'is_public',
        'published_at',
    ];

    protected $casts = [
        'stats' => 'array',
        'service_tags' => 'array',
        'is_public' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function (PartnerProfile $p) {
            if (empty($p->slug)) {
                $p->slug = Str::slug($p->display_name ?: 'partner').'-'.Str::random(5);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeBySlug($query, string $slug)
    {
        return $query->where('slug', $slug);
    }

    /**
     * Convenience — every listing this partner has published.
     */
    public function listings()
    {
        return Listing::query()
            ->where('publisher_type', User::class)
            ->where('publisher_id', $this->user_id);
    }
}
