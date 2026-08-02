<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class FollowController extends Controller
{
    /**
     * Toggle follow/unfollow a user
     */
    public function toggle(User $user)
    {
        $currentUser = Auth::user();

        if ($currentUser->id === $user->id) {
            return back()->with('error', 'You cannot follow yourself.');
        }

        $existing = Follow::where('follower_id', $currentUser->id)
            ->where('following_id', $user->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $isFollowing = false;
        } else {
            Follow::create([
                'follower_id' => $currentUser->id,
                'following_id' => $user->id,
            ]);
            $isFollowing = true;
        }

        return back()->with('success', $isFollowing ? 'You are now following this user.' : 'You unfollowed this user.');
    }

    /**
     * Get user profile data for preview
     */
    public function preview(User $user)
    {
        $currentUser = Auth::user();

        $followersCount = Follow::where('following_id', $user->id)->count();
        $followingCount = Follow::where('follower_id', $user->id)->count();
        $postsCount = Post::where('user_id', $user->id)->count();

        $isFollowing = Follow::where('follower_id', $currentUser->id)
            ->where('following_id', $user->id)
            ->exists();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar ?? asset('assets/img/avatars/default-avatar.png'),
            'country' => $user->country ?? 'Not set',
            'team_support' => $user->team_support ?? 'Not set',
            'followers' => $followersCount,
            'following' => $followingCount,
            'posts' => $postsCount,
            'is_following' => $isFollowing,
            'is_self' => $currentUser->id === $user->id,
        ]);
    }
}
