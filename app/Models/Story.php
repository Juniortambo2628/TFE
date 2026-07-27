<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Story extends Model
{
    protected $fillable = [
        'user_id',
        'linked_story_id',
        'media_url',
        'media_type',
        'caption',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($story) {
            if (!$story->expires_at) {
                $story->expires_at = Carbon::now()->addHours(24);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function views(): HasMany
    {
        return $this->hasMany(StoryView::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(StoryReply::class)->orderBy('created_at', 'asc');
    }

    public function linkedStory(): BelongsTo
    {
        return $this->belongsTo(Story::class, 'linked_story_id');
    }

    public function linkedStories(): HasMany
    {
        return $this->hasMany(Story::class, 'linked_story_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isViewedBy(User $user): bool
    {
        return $this->views()->where('user_id', $user->id)->exists();
    }

    public function viewCount(): int
    {
        return $this->views()->count();
    }
}
