<?php

namespace App\Traits;

use App\Models\Follow;
use App\Models\Post;

trait HasSocialStats
{
    /**
     * Get social statistics for a user.
     *
     * @param  int  $userId
     * @return array
     */
    protected function getSocialStats($userId)
    {
        $followersCount = Follow::where('following_id', $userId)->count();
        $followingCount = Follow::where('follower_id', $userId)->count();
        $postsCount = Post::where('user_id', $userId)->whereNull('parent_post_id')->count();
        $likesReceived = Post::where('user_id', $userId)->sum('likes_count');

        return [
            'followers' => $followersCount,
            'following' => $followingCount,
            'posts' => $postsCount,
            'likes_received' => (int) $likesReceived,
        ];
    }

    /**
     * Get followers list for a user.
     *
     * @param  int  $userId
     * @param  int|null  $limit
     * @return \Illuminate\Support\Collection
     */
    protected function getFollowers($userId, $limit = null)
    {
        $query = Follow::where('following_id', $userId)
            ->with(['follower:id,name,avatar']);

        if ($limit) {
            $query->take($limit);
        }

        return $query->get()->pluck('follower');
    }

    /**
     * Get following list for a user.
     *
     * @param  int  $userId
     * @param  int|null  $limit
     * @return \Illuminate\Support\Collection
     */
    protected function getFollowing($userId, $limit = null)
    {
        $query = Follow::where('follower_id', $userId)
            ->with(['following:id,name,avatar']);

        if ($limit) {
            $query->take($limit);
        }

        return $query->get()->pluck('following');
    }
}
