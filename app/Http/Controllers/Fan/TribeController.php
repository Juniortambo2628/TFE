<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Tribe;
use App\Models\TribePost;
use App\Models\TribePostReply;
use App\Traits\ResolvesTournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TribeController extends Controller
{
    use ResolvesTournament;

    /**
     * Display a listing of tribes. Tournament filter is the fan-side
     * lens on the multi-tournament pivot: the default is "this
     * tournament + cross-tournament", but the client can request
     * ?scope=this|cross|all to narrow or widen.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $tournament = $this->activeTournament();
        $tournamentId = $tournament['id'];
        $scope = in_array($request->query('scope'), ['this', 'cross', 'all'], true)
            ? $request->query('scope')
            : 'default';

        $query = Tribe::with('creator')->withCount('members');

        match ($scope) {
            'this' => $query->onlyForTournament($tournamentId),
            'cross' => $query->onlyCrossTournament(),
            'all' => $query, // no scope
            default => $query->forTournament($tournamentId), // "this + cross"
        };

        $tribes = $query->orderByDesc('member_count')
            ->get()
            ->map(function ($tribe) use ($user) {
                $tCfg = $tribe->tournament_id
                    ? config("tournaments.tournaments.{$tribe->tournament_id}")
                    : null;

                return [
                    'id' => $tribe->id,
                    'name' => $tribe->name,
                    'slug' => $tribe->slug,
                    'description' => $tribe->description,
                    'avatar' => $tribe->avatar,
                    'banner' => $tribe->banner,
                    'privacy' => $tribe->privacy,
                    'member_count' => $tribe->member_count ?? $tribe->members_count,
                    'posts_count' => $tribe->posts_count,
                    'is_member' => $tribe->hasMember($user),
                    'creator' => [
                        'name' => $tribe->creator->name,
                    ],
                    // Multi-tournament badge data — a null tournament_id
                    // means "open to fans of every tournament".
                    'tournament_id' => $tribe->tournament_id,
                    'tournament_short' => $tCfg['short_name'] ?? $tCfg['name'] ?? null,
                ];
            });

        $stats = [
            'total_tribes' => $tribes->count(),
            'joined_tribes' => $tribes->where('is_member', true)->count(),
            'public_tribes' => $tribes->where('privacy', 'public')->count(),
        ];

        return Inertia::render('Fan/Tribes', [
            'tribes' => $tribes,
            'stats' => $stats,
            'activeScope' => $scope === 'default' ? 'this_and_cross' : $scope,
        ]);
    }

    /**
     * Display the specified tribe with posts.
     */
    public function show(Tribe $tribe)
    {
        $user = Auth::user();

        // Check if user can view this tribe
        if ($tribe->privacy !== 'public' && ! $tribe->hasMember($user)) {
            return back()->with('error', 'This is a private tribe. Join to view content.');
        }

        // Get tribe with details
        $tribeData = [
            'id' => $tribe->id,
            'name' => $tribe->name,
            'slug' => $tribe->slug,
            'description' => $tribe->description,
            'avatar' => $tribe->avatar,
            'banner' => $tribe->banner,
            'privacy' => $tribe->privacy,
            'member_count' => $tribe->members()->count(),
            'is_member' => $tribe->hasMember($user),
            'is_admin' => $tribe->isAdmin($user),
            'creator' => [
                'id' => $tribe->creator->id,
                'name' => $tribe->creator->name,
            ],
            'created_at' => $tribe->created_at->diffForHumans(),
        ];

        // Get members
        $members = $tribe->members()
            ->with('user')
            ->orderByDesc('role')
            ->limit(20)
            ->get()
            ->map(function ($member) {
                return [
                    'id' => $member->user->id,
                    'name' => $member->user->name,
                    'role' => $member->role,
                    'joined_at' => $member->joined_at ? $member->joined_at->diffForHumans() : 'Recently',
                ];
            });

        // Get posts (discussions)
        $posts = TribePost::where('tribe_id', $tribe->id)
            ->with(['user', 'replies.user'])
            ->withCount('replies')
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'is_pinned' => $post->is_pinned,
                    'view_count' => $post->view_count,
                    'replies_count' => $post->replies_count,
                    'author' => [
                        'id' => $post->user->id,
                        'name' => $post->user->name,
                    ],
                    'replies' => $post->replies->take(3)->map(function ($reply) {
                        return [
                            'id' => $reply->id,
                            'content' => $reply->content,
                            'author' => $reply->user->name,
                            'created_at' => $reply->created_at->diffForHumans(),
                        ];
                    }),
                    'created_at' => $post->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('Fan/TribeDetail', [
            'tribe' => $tribeData,
            'members' => $members,
            'posts' => $posts,
        ]);
    }

    /**
     * Store a newly created tribe in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:tribes',
            'description' => 'nullable|string|max:1000',
            'privacy' => 'in:public,private,invite_only',
            'cross_tournament' => 'nullable|boolean',
        ]);

        // Default: this tribe belongs to whichever tournament the creator
        // is currently viewing. Passing cross_tournament=true opts out
        // and makes it visible to fans of every tournament.
        $tournamentId = $request->boolean('cross_tournament')
            ? null
            : $this->activeTournamentId();

        $tribe = Tribe::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'created_by' => Auth::id(),
            'privacy' => $request->privacy ?? 'public',
            'tournament_id' => $tournamentId,
        ]);

        // Add creator as admin member
        $tribe->addMember(Auth::user(), 'admin');

        return back()->with('success', 'Tribe created successfully!');
    }

    /**
     * Join a tribe.
     */
    public function join(Tribe $tribe)
    {
        $user = Auth::user();

        if ($tribe->hasMember($user)) {
            return back()->with('info', 'You are already a member of this tribe.');
        }

        $tribe->addMember($user);

        return back()->with('success', 'You have joined the tribe!');
    }

    /**
     * Leave a tribe.
     */
    public function leave(Tribe $tribe)
    {
        $user = Auth::user();

        if ($tribe->removeMember($user)) {
            return back()->with('success', 'You have left the tribe.');
        }

        return back()->with('error', 'You are not a member of this tribe.');
    }

    /**
     * Create a post in a tribe.
     */
    public function createPost(Request $request, Tribe $tribe)
    {
        $user = Auth::user();

        if (! $tribe->hasMember($user)) {
            return back()->with('error', 'You must be a member to post.');
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'required|string|max:5000',
        ]);

        TribePost::create([
            'tribe_id' => $tribe->id,
            'user_id' => $user->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
        ]);

        return back()->with('success', 'Post created successfully!');
    }

    /**
     * Reply to a post.
     */
    public function replyToPost(Request $request, Tribe $tribe, TribePost $post)
    {
        $user = Auth::user();

        if (! $tribe->hasMember($user)) {
            return back()->with('error', 'You must be a member to reply.');
        }

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        TribePostReply::create([
            'tribe_post_id' => $post->id,
            'user_id' => $user->id,
            'content' => $validated['content'],
        ]);

        // Increment view count
        $post->increment('view_count');

        return back()->with('success', 'Reply added!');
    }

    /**
     * Update the specified tribe.
     */
    public function update(Request $request, Tribe $tribe)
    {
        if (! $tribe->isAdmin(Auth::user())) {
            return back()->with('error', 'Unauthorized. Only admins can edit the tribe.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:tribes,name,'.$tribe->id,
            'description' => 'nullable|string|max:1000',
            'privacy' => 'in:public,private,invite_only',
            'banner' => 'nullable',
        ]);

        // Handle banner — could be a file upload or a URL string
        if ($request->hasFile('banner')) {
            $request->validate(['banner' => 'image|max:2048']);
            $path = $request->file('banner')->store('tribes', 'public');
            $validated['banner'] = '/storage/'.$path;
        } elseif ($request->filled('banner')) {
            $validated['banner'] = $request->input('banner');
        } else {
            unset($validated['banner']); // Keep existing banner
        }

        $tribe->update($validated);

        if ($request->name !== $tribe->getOriginal('name')) {
            $tribe->update(['slug' => Str::slug($request->name)]);
        }

        return back()->with('success', 'Tribe updated successfully!');
    }

    /**
     * Toggle member role between member and admin.
     */
    public function toggleRole(Tribe $tribe, $userId)
    {
        if (! $tribe->isAdmin(Auth::user())) {
            return back()->with('error', 'Unauthorized.');
        }

        $member = $tribe->members()->where('user_id', $userId)->first();

        if ($member) {
            // Cannot demote owner
            if ($tribe->created_by == $userId) {
                return back()->with('error', 'Cannot change role of the tribe owner.');
            }

            $newRole = $member->role === 'admin' ? 'member' : 'admin';
            $member->update(['role' => $newRole]);

            return back()->with('success', 'Member role updated to '.$newRole);
        }

        return back()->with('error', 'Member not found.');
    }
}
