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
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(fn ($story) => [
                'id' => $story->id,
                'user_name' => $story->user->name ?? 'Unknown',
                'media_type' => $story->media_type,
                'caption' => $story->caption,
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
