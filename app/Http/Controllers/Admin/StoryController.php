<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Story;
use Inertia\Inertia;

class StoryController extends Controller
{
    public function index()
    {
        $stories = Story::with('user')
            ->withCount(['views', 'replies'])
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(fn ($story) => [
                'id' => $story->id,
                'user_name' => $story->user->name ?? 'Unknown',
                'media_type' => $story->media_type,
                // Stored as an absolute URL by Fan\StoriesController::store — pass through as-is.
                'media_url' => $story->media_url,
                'caption' => $story->caption,
                'views_count' => $story->views_count,
                'replies_count' => $story->replies_count,
                'expires_at' => $story->expires_at->format('M d, Y H:i'),
                'is_expired' => $story->isExpired(),
                'created_at' => $story->created_at->format('M d, Y'),
            ]);

        return Inertia::render('Admin/Stories', [
            'stories' => $stories,
        ]);
    }

    public function destroy(Story $story)
    {
        $story->delete();

        return back()->with('success', 'Story deleted successfully');
    }
}
