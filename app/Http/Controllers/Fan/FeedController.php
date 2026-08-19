<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Models\Hashtag;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use App\Traits\HasSocialStats;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FeedController extends Controller
{
    use HasSocialStats;

    /**
     * Display the social feed
     */
    public function index()
    {
        $user = Auth::user();
        $userId = $user->id;

        // Get posts with user info, ordered by latest (exclude thread replies from main feed)
        // Eager-load likes to avoid N+1 on is_liked check
        $posts = Post::with(['user', 'comments.user', 'parentPost', 'threadReplies.user', 'likes'])
            ->whereNull('parent_post_id') // Only show top-level posts in main feed
            ->orderByDesc('created_at')
            ->take(20)
            ->get()
            ->map(function ($post) use ($userId) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'visibility' => $post->visibility,
                    'image_url' => $post->image_url,
                    'like_count' => $post->likes_count ?? 0,
                    'comment_count' => $post->comment_count ?? $post->comments->count(),
                    'share_count' => $post->share_count ?? 0,
                    'thread_reply_count' => $post->threadReplies->count(),
                    'is_liked' => $post->likes->contains('user_id', $userId),
                    'created_at' => $post->created_at->diffForHumans(),
                    'user' => [
                        'id' => $post->user->id,
                        'name' => $post->user->name,
                        'avatar' => $post->user->avatar ?? null,
                    ],
                    'thread_replies' => $post->threadReplies->take(2)->map(fn ($reply) => [
                        'id' => $reply->id,
                        'content' => $reply->content,
                        'image_url' => $reply->image_url,
                        'created_at' => $reply->created_at->diffForHumans(),
                        'user' => [
                            'id' => $reply->user->id,
                            'name' => $reply->user->name,
                            'avatar' => $reply->user->avatar ?? null,
                        ],
                    ]),
                    'comments' => $post->comments->take(3)->map(fn ($c) => [
                        'id' => $c->id,
                        'content' => $c->content,
                        'created_at' => $c->created_at->diffForHumans(),
                        'user' => [
                            'id' => $c->user->id,
                            'name' => $c->user->name,
                        ],
                    ]),
                ];
            });

        // Get social stats
        $stats = $this->getSocialStats($userId);

        // Get trending hashtags
        $trendingHashtags = Hashtag::orderByDesc('post_count')
            ->take(10)
            ->get()
            ->map(fn ($h) => ['id' => $h->id, 'name' => $h->name, 'count' => $h->post_count]);

        // Get active feed ads (show 1 ad per 5 posts)
        $feedAds = Ad::where('ad_type', 'feed')
            ->where('is_active', true)
            ->orderBy('display_order')
            ->inRandomOrder()
            ->take(ceil($posts->count() / 5)) // 1 ad per 5 posts, max
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

        // Get suggested users (not following)
        $suggestedUsers = User::where('id', '!=', $userId)
            ->whereDoesntHave('followers', function ($query) use ($userId) {
                $query->where('follower_id', $userId);
            })
            ->where('is_admin', false)
            ->where('is_partner', false)
            ->inRandomOrder()
            ->take(5)
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'avatar' => $u->avatar,
                ];
            });

        return Inertia::render('Fan/Feed', [
            'posts' => $posts,
            'stats' => $stats,
            'trendingHashtags' => $trendingHashtags,
            'feedAds' => $feedAds,
            'suggestedUsers' => $suggestedUsers,
        ]);
    }

    /**
     * Create a new post
     */
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'nullable|string|max:1000',
            'visibility' => 'in:public,friends,tribe',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:10240', // 10MB max
            'parent_post_id' => 'nullable|exists:posts,id',
        ]);

        // Require either content or image
        $content = $request->input('content');
        if (empty($content) && ! $request->hasFile('image')) {
            return back()->withErrors(['content' => 'Post must have either text content or an image.']);
        }

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = time().'_'.uniqid().'.'.$image->getClientOriginalExtension();
            $imagePath = $image->storeAs('posts', $imageName, 'public');
            $imageUrl = asset('storage/'.$imagePath);
        }

        $post = Post::create([
            'user_id' => Auth::id(),
            'parent_post_id' => $request->input('parent_post_id'),
            'content' => $content ?? '',
            'visibility' => $request->input('visibility', 'public'),
            'image_url' => $imageUrl,
        ]);

        // Extract and attach hashtags
        if ($content) {
            preg_match_all('/#(\w+)/', $content, $matches);
            if (! empty($matches[1])) {
                $hashtagNames = array_unique($matches[1]);
                foreach ($hashtagNames as $hashtagName) {
                    $hashtag = Hashtag::firstOrCreate(
                        ['name' => strtolower($hashtagName)],
                        ['post_count' => 0]
                    );

                    // Attach hashtag to post if not already attached
                    if (! $post->hashtags()->where('hashtag_id', $hashtag->id)->exists()) {
                        $post->hashtags()->attach($hashtag->id);
                        $hashtag->increment('post_count');
                    }
                }
            }
        }

        // If this is a thread reply, increment parent's comment count
        if ($request->parent_post_id) {
            Post::find($request->parent_post_id)->increment('comment_count');
        }

        return back()->with('success', 'Post created successfully!');
    }

    /**
     * Toggle like on a post
     */
    public function like(Post $post)
    {
        $user = Auth::user();
        $liked = $post->toggleLike($user);

        return back()->with('success', $liked ? 'Post liked!' : 'Post unliked.');
    }

    /**
     * Add a comment to a post
     */
    public function comment(Request $request, Post $post)
    {
        $request->validate([
            'content' => 'required|string|max:500',
        ]);

        PostComment::create([
            'post_id' => $post->id,
            'user_id' => Auth::id(),
            'content' => $request->input('content'),
        ]);

        $post->increment('comment_count');

        return back()->with('success', 'Comment added!');
    }

    /**
     * Repost a post
     */
    public function repost(Post $post)
    {
        $repost = $post->repost(Auth::user());

        return back()->with('success', 'Post reposted!');
    }

    /**
     * Share a post (increment share count)
     */
    public function share(Post $post)
    {
        $post->incrementShare();

        return back()->with('success', 'Post shared!');
    }

    /**
     * Show single post with all comments and likers
     */
    public function show(Post $post)
    {
        $user = Auth::user();
        $userId = $user->id;

        // Get all comments with users
        $comments = $post->comments()->with('user')->orderBy('created_at', 'asc')->get()->map(function ($comment) {
            return [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at' => $comment->created_at->diffForHumans(),
                'user' => [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                    'avatar' => $comment->user->avatar ?? null,
                ],
            ];
        });

        // Get all likers
        $likers = $post->likes()->with('user')->get()->map(function ($like) {
            return [
                'id' => $like->user->id,
                'name' => $like->user->name,
                'avatar' => $like->user->avatar ?? null,
            ];
        });

        // Get thread replies
        $threadReplies = $post->threadReplies()->with('user')->orderBy('created_at', 'asc')->get()->map(function ($reply) {
            return [
                'id' => $reply->id,
                'content' => $reply->content,
                'image_url' => $reply->image_url,
                'created_at' => $reply->created_at->diffForHumans(),
                'user' => [
                    'id' => $reply->user->id,
                    'name' => $reply->user->name,
                    'avatar' => $reply->user->avatar ?? null,
                ],
            ];
        });

        // Get post data
        $postData = [
            'id' => $post->id,
            'content' => $post->content,
            'visibility' => $post->visibility,
            'image_url' => $post->image_url,
            'like_count' => $post->likes_count ?? $post->likes()->count() ?? 0,
            'comment_count' => $post->comment_count ?? $post->comments->count(),
            'share_count' => $post->share_count ?? 0,
            'thread_reply_count' => $post->threadReplies()->count(),
            'is_liked' => $post->likes()->where('user_id', $userId)->exists(),
            'created_at' => $post->created_at->diffForHumans(),
            'user' => [
                'id' => $post->user->id,
                'name' => $post->user->name,
                'avatar' => $post->user->avatar ?? null,
            ],
        ];

        return Inertia::render('Fan/PostDetail', [
            'post' => $postData,
            'comments' => $comments,
            'likers' => $likers,
            'threadReplies' => $threadReplies,
        ]);
    }

    /**
     * Delete a post (owner only)
     */
    public function destroy(Post $post)
    {
        if ($post->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $post->delete();

        return back()->with('success', 'Post deleted.');
    }
}
