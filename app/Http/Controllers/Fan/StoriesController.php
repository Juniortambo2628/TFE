<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Models\Story;
use App\Models\StoryReply;
use App\Models\StoryView;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class StoriesController extends Controller
{
    /**
     * Get all active stories for the feed
     */
    public function index()
    {
        $user = Auth::user();

        // Get all active (non-expired) stories with user info (eager-loaded to avoid N+1)
        $stories = Story::with(['user', 'views', 'replies.user', 'linkedStories.user'])
            ->withCount('replies')
            ->where('expires_at', '>', Carbon::now())
            ->whereNull('linked_story_id') // Only show top-level stories
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('user_id')
            ->map(function ($userStories) use ($user) {
                $storyUser = $userStories->first()->user;

                return [
                    'user' => [
                        'id' => $storyUser->id,
                        'name' => $storyUser->name,
                        'avatar' => $storyUser->avatar ?? null,
                    ],
                    'stories' => $userStories->map(function ($story) use ($user) {
                        // Use pre-loaded linked stories instead of N+1 query
                        $linkedStories = $story->linkedStories
                            ->filter(fn ($linked) => $linked->expires_at->isFuture())
                            ->map(fn ($linked) => [
                                'id' => $linked->id,
                                'media_url' => $linked->media_url,
                                'media_type' => $linked->media_type,
                                'caption' => $linked->caption,
                                'created_at' => $linked->created_at->diffForHumans(),
                                'user' => [
                                    'id' => $linked->user->id,
                                    'name' => $linked->user->name,
                                    'avatar' => $linked->user->avatar ?? null,
                                ],
                            ])
                            ->values();

                        return [
                            'id' => $story->id,
                            'media_url' => $story->media_url,
                            'media_type' => $story->media_type,
                            'caption' => $story->caption,
                            'created_at' => $story->created_at->diffForHumans(),
                            'expires_at' => $story->expires_at->toIso8601String(),
                            'is_viewed' => $story->isViewedBy($user),
                            'view_count' => $story->viewCount(),
                            'reply_count' => $story->replies_count,
                            'linked_stories' => $linkedStories,
                        ];
                    })->values(),
                    'has_unviewed' => $userStories->contains(function ($story) use ($user) {
                        return ! $story->isViewedBy($user);
                    }),
                ];
            })
            ->values();

        // Get user's own stories
        $myStories = Story::where('user_id', $user->id)
            ->where('expires_at', '>', Carbon::now())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($story) {
                return [
                    'id' => $story->id,
                    'media_url' => $story->media_url,
                    'media_type' => $story->media_type,
                    'caption' => $story->caption,
                    'created_at' => $story->created_at->diffForHumans(),
                    'expires_at' => $story->expires_at->toIso8601String(),
                    'view_count' => $story->viewCount(),
                ];
            });

        // Get active story ads
        $storyAds = Ad::where('ad_type', 'story')
            ->where('is_active', true)
            ->orderBy('display_order')
            ->inRandomOrder()
            ->take(3)
            ->get()
            ->map(function ($ad) {
                return [
                    'id' => $ad->id,
                    'title' => $ad->title,
                    'description' => $ad->description,
                    'image_url' => $ad->image_url,
                    'link_url' => $ad->link_url,
                    'partner_name' => $ad->partner_name,
                ];
            });

        return Inertia::render('Fan/Stories', [
            'stories' => $stories,
            'myStories' => $myStories,
            'storyAds' => $storyAds,
        ]);
    }

    /**
     * Store a new story
     */
    public function store(Request $request)
    {
        $request->validate([
            'media' => 'required|file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,avi|max:51200', // 50MB max
            'caption' => 'nullable|string|max:500',
        ]);

        $file = $request->file('media');
        $mediaType = strpos($file->getMimeType(), 'video') !== false ? 'video' : 'image';
        $fileName = time().'_'.uniqid().'.'.$file->getClientOriginalExtension();
        $filePath = $file->storeAs('stories', $fileName, 'public');
        $mediaUrl = asset('storage/'.$filePath);

        $story = Story::create([
            'user_id' => Auth::id(),
            'media_url' => $mediaUrl,
            'media_type' => $mediaType,
            'caption' => $request->input('caption'),
            'expires_at' => Carbon::now()->addHours(24),
        ]);

        return back()->with('success', 'Story created successfully!');
    }

    /**
     * View a story (mark as viewed)
     */
    public function view(Story $story)
    {
        $user = Auth::user();

        // Don't allow viewing own stories
        if ($story->user_id === $user->id) {
            return response()->json(['message' => 'Cannot view own story'], 400);
        }

        // Check if already viewed
        if (! $story->isViewedBy($user)) {
            StoryView::create([
                'story_id' => $story->id,
                'user_id' => $user->id,
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get story viewers
     */
    public function viewers(Story $story)
    {
        if ($story->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $viewers = $story->views()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($view) {
                return [
                    'id' => $view->user->id,
                    'name' => $view->user->name,
                    'avatar' => $view->user->avatar ?? null,
                    'viewed_at' => $view->created_at->diffForHumans(),
                ];
            });

        return response()->json($viewers);
    }

    /**
     * Delete a story
     */
    public function destroy(Story $story)
    {
        if ($story->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        // Delete media file
        $path = str_replace(asset('storage/'), '', $story->media_url);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $story->delete();

        return back()->with('success', 'Story deleted.');
    }

    /**
     * Reply to a story
     */
    public function reply(Request $request, Story $story)
    {
        $request->validate([
            'content' => 'required|string|max:500',
        ]);

        StoryReply::create([
            'story_id' => $story->id,
            'user_id' => Auth::id(),
            'content' => $request->input('content'),
        ]);

        return back()->with('success', 'Reply added!');
    }

    /**
     * Link a story to another story (create a chain)
     */
    public function link(Request $request, Story $story)
    {
        $request->validate([
            'linked_story_id' => 'required|exists:stories,id',
        ]);

        $linkedStory = Story::findOrFail($request->input('linked_story_id'));

        // Can only link to own stories
        if ($linkedStory->user_id !== Auth::id()) {
            return back()->withErrors(['error' => 'You can only link to your own stories']);
        }

        $story->update(['linked_story_id' => $linkedStory->id]);

        return back()->with('success', 'Stories linked!');
    }

    /**
     * Get story replies
     */
    public function getReplies(Story $story)
    {
        $replies = $story->replies()
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($reply) {
                return [
                    'id' => $reply->id,
                    'content' => $reply->content,
                    'created_at' => $reply->created_at->diffForHumans(),
                    'user' => [
                        'id' => $reply->user->id,
                        'name' => $reply->user->name,
                        'avatar' => $reply->user->avatar ?? null,
                    ],
                ];
            });

        return response()->json($replies);
    }
}
