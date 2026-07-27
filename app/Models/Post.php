<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'parent_post_id',
        'content',
        'visibility',
        'image_url',
    ];

    protected $casts = [
        'likes_count' => 'integer',
        'comment_count' => 'integer',
        'share_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(PostLike::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(PostComment::class)->orderBy('created_at', 'asc');
    }

    public function parentPost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'parent_post_id');
    }

    public function threadReplies(): HasMany
    {
        return $this->hasMany(Post::class, 'parent_post_id')->orderBy('created_at', 'asc');
    }

    public function hashtags(): BelongsToMany
    {
        return $this->belongsToMany(Hashtag::class, 'post_hashtags');
    }

    /**
     * Check if a user has liked this post
     */
    public function isLikedBy(User $user): bool
    {
        return $this->likes()->where('user_id', $user->id)->exists();
    }

    /**
     * Toggle like for a user
     */
    public function toggleLike(User $user): bool
    {
        $existingLike = $this->likes()->where('user_id', $user->id)->first();

        if ($existingLike) {
            $existingLike->delete();
            $this->decrement('likes_count');

            return false; // unliked
        } else {
            $this->likes()->create(['user_id' => $user->id]);
            $this->increment('likes_count');

            return true; // liked
        }
    }

    /**
     * Repost (create a new post referencing the original)
     */
    public function repost(User $user): Post
    {
        $repost = self::create([
            'user_id' => $user->id,
            'content' => "Reposted: {$this->content}",
            'visibility' => $this->visibility,
        ]);

        $this->increment('share_count');

        return $repost;
    }

    /**
     * Increment share count (for external sharing)
     */
    public function incrementShare(): void
    {
        $this->increment('share_count');
    }
}
