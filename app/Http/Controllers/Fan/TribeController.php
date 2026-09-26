<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Tribe;
use App\Models\TribeJoinRequest;
use App\Models\TribePost;
use App\Models\TribePostReply;
use App\Models\User;
use App\Notifications\TribeAlert;
use App\Traits\ResolvesTournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TribeController extends Controller
{
    use ResolvesTournament;

    /**
     * Display a listing of tribes. Tournament filter is the fan-side
     * lens on the multi-tournament pivot: the default is "this
     * tournament + cross-tournament", but the client can request
     * ?scope=this|cross|all to narrow or widen. ?q= searches name +
     * description.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $tournament = $this->activeTournament();
        $tournamentId = $tournament['id'];
        $scope = in_array($request->query('scope'), ['this', 'cross', 'all'], true)
            ? $request->query('scope')
            : 'default';
        $search = trim((string) $request->query('q', ''));

        $query = Tribe::with('creator')->withCount(['members', 'posts']);

        match ($scope) {
            'this' => $query->onlyForTournament($tournamentId),
            'cross' => $query->onlyCrossTournament(),
            'all' => $query, // no scope
            default => $query->forTournament($tournamentId), // "this + cross"
        };

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // One query for every membership + pending request this fan holds,
        // instead of two per tribe inside the map.
        $memberTribeIds = $user->tribeMemberships()->pluck('tribe_id')->all();
        $pendingTribeIds = TribeJoinRequest::where('user_id', $user->id)
            ->pending()
            ->pluck('tribe_id')
            ->all();

        $tribes = $query->orderByDesc('member_count')
            ->get()
            ->map(function ($tribe) use ($memberTribeIds, $pendingTribeIds) {
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
                    'member_count' => $tribe->members_count,
                    'posts_count' => $tribe->posts_count,
                    'is_member' => in_array($tribe->id, $memberTribeIds, true),
                    'has_pending_request' => in_array($tribe->id, $pendingTribeIds, true),
                    // invite_only tribes cannot even be asked to join.
                    'can_request' => $tribe->requiresApproval(),
                    'creator' => [
                        'name' => $tribe->creator->name ?? 'Unknown',
                    ],
                    // Multi-tournament badge data — a null tournament_id
                    // means "open to fans of every tournament".
                    'tournament_id' => $tribe->tournament_id,
                    'tournament_short' => $tCfg['short_name'] ?? $tCfg['name'] ?? null,
                ];
            });

        return Inertia::render('Fan/Tribes', [
            'tribes' => $tribes,
            'stats' => [
                'total_tribes' => $tribes->count(),
                'joined_tribes' => $tribes->where('is_member', true)->count(),
                'public_tribes' => $tribes->where('privacy', 'public')->count(),
            ],
            'activeScope' => $scope === 'default' ? 'this_and_cross' : $scope,
            'search' => $search,
        ]);
    }

    /**
     * Display the specified tribe with its discussions.
     *
     * A tribe the fan may not read renders a locked state rather than
     * redirecting: `back()` sent anyone who followed a direct link to the site
     * root with no explanation of what happened.
     */
    public function show(Tribe $tribe)
    {
        $user = Auth::user();

        if (! $tribe->canBeViewedBy($user)) {
            return Inertia::render('Fan/TribeLocked', [
                'tribe' => [
                    'id' => $tribe->id,
                    'name' => $tribe->name,
                    'description' => $tribe->description,
                    'banner' => $tribe->banner,
                    'privacy' => $tribe->privacy,
                    'member_count' => $tribe->member_count,
                    'can_request' => $tribe->requiresApproval(),
                    'has_pending_request' => $tribe->joinRequests()
                        ->where('user_id', $user->id)
                        ->pending()
                        ->exists(),
                ],
            ]);
        }

        $canManage = $tribe->canBeManagedBy($user);

        $members = $tribe->members()
            ->with('user')
            ->orderByDesc('role')
            ->limit(50)
            ->get()
            ->map(fn ($member) => [
                'id' => $member->user->id,
                'name' => $member->user->name,
                'avatar' => $member->user->avatar,
                'role' => $member->role,
                'is_owner' => $tribe->created_by === $member->user->id,
                'joined_at' => $member->joined_at ? $member->joined_at->diffForHumans() : 'Recently',
            ]);

        $posts = $tribe->posts()
            ->with(['user', 'replies.user'])
            ->withCount('replies')
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($post) => $this->postPayload($post, $user, $canManage, 3));

        // Admins see who is waiting at the door.
        $joinRequests = $canManage
            ? $tribe->joinRequests()->pending()->with('user')->latest()->get()->map(fn ($req) => [
                'id' => $req->id,
                'message' => $req->message,
                'created_at' => $req->created_at->diffForHumans(),
                'user' => [
                    'id' => $req->user->id,
                    'name' => $req->user->name,
                    'avatar' => $req->user->avatar,
                ],
            ])
            : collect();

        return Inertia::render('Fan/TribeDetail', [
            'tribe' => [
                'id' => $tribe->id,
                'name' => $tribe->name,
                'slug' => $tribe->slug,
                'description' => $tribe->description,
                'avatar' => $tribe->avatar,
                'banner' => $tribe->banner,
                'privacy' => $tribe->privacy,
                'member_count' => $tribe->members()->count(),
                'posts_count' => $tribe->posts()->count(),
                'view_count' => (int) $tribe->posts()->sum('view_count'),
                'is_member' => $tribe->hasMember($user),
                'is_admin' => $canManage,
                'is_owner' => $tribe->isOwner($user),
                'creator' => [
                    'id' => $tribe->creator->id ?? null,
                    'name' => $tribe->creator->name ?? 'Unknown',
                ],
                'created_at' => $tribe->created_at->diffForHumans(),
            ],
            'members' => $members,
            'posts' => $posts,
            'joinRequests' => $joinRequests,
        ]);
    }

    /**
     * A single discussion with its full reply thread.
     *
     * Without this the tribe page showed the first three replies and offered no
     * way to read the rest, and view_count was bumped whenever someone
     * *replied* rather than when anyone read.
     */
    public function showPost(Request $request, Tribe $tribe, TribePost $post)
    {
        $user = Auth::user();

        abort_unless($post->tribe_id === $tribe->id, 404);

        if (! $tribe->canBeViewedBy($user)) {
            return redirect()->route('fan.tribes.show', $tribe->id);
        }

        // Count one view per reader per session, so a reload does not inflate it.
        $seen = $request->session()->get('tribe_post_views', []);
        if (! in_array($post->id, $seen, true)) {
            $post->increment('view_count');
            $request->session()->put('tribe_post_views', [...$seen, $post->id]);
            $post->refresh();
        }

        $post->load(['user', 'replies.user'])->loadCount('replies');

        return Inertia::render('Fan/TribePost', [
            'tribe' => [
                'id' => $tribe->id,
                'name' => $tribe->name,
                'banner' => $tribe->banner,
                'privacy' => $tribe->privacy,
                'is_member' => $tribe->hasMember($user),
                'is_admin' => $tribe->canBeManagedBy($user),
            ],
            'post' => $this->postPayload($post, $user, $tribe->canBeManagedBy($user)),
        ]);
    }

    /**
     * Store a newly created tribe.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
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
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'created_by' => Auth::id(),
            'privacy' => $validated['privacy'] ?? 'public',
            'tournament_id' => $tournamentId,
        ]);

        // Add creator as admin member
        $tribe->addMember(Auth::user(), 'admin');

        return redirect()->route('fan.tribes.show', $tribe->id)
            ->with('success', 'Tribe created successfully!');
    }

    /**
     * Join a public tribe, or lodge a request for one that needs approval.
     *
     * Privacy used to be decorative here: this method added the member
     * regardless, so "Private (Approval required)" and "Invite Only" let
     * anyone straight in.
     */
    public function join(Request $request, Tribe $tribe)
    {
        $user = Auth::user();

        if ($tribe->hasMember($user)) {
            return back()->with('info', 'You are already a member of this tribe.');
        }

        if ($tribe->isInviteOnly()) {
            return back()->with('error', 'This tribe is invite only — an admin has to add you.');
        }

        if ($tribe->requiresApproval()) {
            $validated = $request->validate(['message' => 'nullable|string|max:500']);

            $joinRequest = $tribe->joinRequests()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'message' => $validated['message'] ?? null,
                    'status' => TribeJoinRequest::PENDING,
                    'decided_by' => null,
                    'decided_at' => null,
                ],
            );

            $this->notifyAdmins($tribe, [
                'title' => 'New join request',
                'body' => "{$user->name} asked to join {$tribe->name}.",
                'icon' => 'fas fa-user-clock',
                'tribe_id' => $tribe->id,
            ]);

            return back()->with('success', $joinRequest->wasRecentlyCreated
                ? 'Request sent — a tribe admin will review it.'
                : 'Your request has been resubmitted.');
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

        if (! $tribe->hasMember($user)) {
            return back()->with('error', 'You are not a member of this tribe.');
        }

        // Do not let the last admin walk out and leave the tribe unmanageable.
        if ($tribe->isAdmin($user) && ! $tribe->otherAdmins($user)->exists()) {
            return back()->with('error', 'Promote another member to admin before you leave — a tribe cannot be left without one.');
        }

        $tribe->removeMember($user);

        return back()->with('success', 'You have left the tribe.');
    }

    /**
     * Approve a pending join request.
     */
    public function approveRequest(Tribe $tribe, TribeJoinRequest $joinRequest)
    {
        $this->authorizeManage($tribe);
        abort_unless($joinRequest->tribe_id === $tribe->id, 404);

        if (! $joinRequest->isPending()) {
            return back()->with('info', 'That request has already been decided.');
        }

        $joinRequest->update([
            'status' => TribeJoinRequest::APPROVED,
            'decided_by' => Auth::id(),
            'decided_at' => now(),
        ]);

        $tribe->addMember($joinRequest->user);

        $joinRequest->user->notify(new TribeAlert([
            'title' => 'Request approved',
            'body' => "You are now a member of {$tribe->name}.",
            'icon' => 'fas fa-user-check',
            'tribe_id' => $tribe->id,
        ]));

        return back()->with('success', $joinRequest->user->name.' is now a member.');
    }

    /**
     * Reject a pending join request.
     */
    public function rejectRequest(Tribe $tribe, TribeJoinRequest $joinRequest)
    {
        $this->authorizeManage($tribe);
        abort_unless($joinRequest->tribe_id === $tribe->id, 404);

        $joinRequest->update([
            'status' => TribeJoinRequest::REJECTED,
            'decided_by' => Auth::id(),
            'decided_at' => now(),
        ]);

        return back()->with('success', 'Request declined.');
    }

    /**
     * Create a discussion in a tribe.
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

        $tribe->posts()->create([
            'user_id' => $user->id,
            'title' => $validated['title'] ?? null,
            'content' => $validated['content'],
        ]);

        // posts_count is what the tribe cards read; nothing used to update it.
        $tribe->syncCounts();

        return back()->with('success', 'Post created successfully!');
    }

    /**
     * Reply to a discussion.
     */
    public function replyToPost(Request $request, Tribe $tribe, TribePost $post)
    {
        $user = Auth::user();

        abort_unless($post->tribe_id === $tribe->id, 404);

        if (! $tribe->hasMember($user)) {
            return back()->with('error', 'You must be a member to reply.');
        }

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $post->replies()->create([
            'user_id' => $user->id,
            'content' => $validated['content'],
        ]);

        // Tell the thread's author someone answered (but not themselves).
        if ($post->user_id !== $user->id) {
            $post->user->notify(new TribeAlert([
                'title' => 'New reply',
                'body' => "{$user->name} replied in {$tribe->name}.",
                'icon' => 'fas fa-reply',
                'tribe_id' => $tribe->id,
                'action_url' => route('fan.tribes.posts.show', [$tribe->id, $post->id]),
            ]));
        }

        return back()->with('success', 'Reply added!');
    }

    /**
     * Pin or unpin a discussion. The list has always ordered by is_pinned;
     * nothing could set it.
     */
    public function togglePin(Tribe $tribe, TribePost $post)
    {
        $this->authorizeManage($tribe);
        abort_unless($post->tribe_id === $tribe->id, 404);

        $post->update(['is_pinned' => ! $post->is_pinned]);

        return back()->with('success', $post->is_pinned ? 'Discussion pinned.' : 'Discussion unpinned.');
    }

    /**
     * Delete a discussion — its author, or a tribe admin moderating it.
     */
    public function destroyPost(Tribe $tribe, TribePost $post)
    {
        $user = Auth::user();

        abort_unless($post->tribe_id === $tribe->id, 404);

        if ($post->user_id !== $user->id && ! $tribe->canBeManagedBy($user)) {
            return back()->with('error', 'You can only delete your own discussions.');
        }

        $post->replies()->delete();
        $post->delete();
        $tribe->syncCounts();

        return back()->with('success', 'Discussion deleted.');
    }

    /**
     * Delete a reply — its author, or a tribe admin moderating it.
     */
    public function destroyReply(Tribe $tribe, TribePostReply $reply)
    {
        $user = Auth::user();

        abort_unless($reply->post && $reply->post->tribe_id === $tribe->id, 404);

        if ($reply->user_id !== $user->id && ! $tribe->canBeManagedBy($user)) {
            return back()->with('error', 'You can only delete your own replies.');
        }

        $reply->delete();

        return back()->with('success', 'Reply deleted.');
    }

    /**
     * Update the specified tribe.
     */
    public function update(Request $request, Tribe $tribe)
    {
        $this->authorizeManage($tribe);

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:tribes,name,'.$tribe->id,
            'description' => 'nullable|string|max:1000',
            'privacy' => 'in:public,private,invite_only',
            // Explicit mimes, never the `image` rule — that one accepts SVG,
            // and same-origin storage makes an SVG upload a stored-XSS vector.
            'banner' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:4096',
            'avatar' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $attributes = [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'privacy' => $validated['privacy'] ?? $tribe->privacy,
        ];

        // A missing file means "keep what is there" — the old code fell back to
        // whatever string arrived in the field, which let a client set the
        // banner path to anything it liked.
        foreach (['banner', 'avatar'] as $field) {
            if ($request->hasFile($field)) {
                $attributes[$field] = '/storage/'.$request->file($field)->store('tribes', 'public');
            }
        }

        if ($attributes['name'] !== $tribe->name) {
            $attributes['slug'] = Str::slug($attributes['name']);
        }

        $tribe->update($attributes);

        return back()->with('success', 'Tribe updated successfully!');
    }

    /**
     * Delete a tribe. Owner only — an admin who was merely promoted should not
     * be able to destroy someone else's community.
     */
    public function destroy(Tribe $tribe)
    {
        $user = Auth::user();

        if (! $tribe->isOwner($user) && ! $user->is_admin) {
            return back()->with('error', 'Only the tribe owner can delete it.');
        }

        $tribe->posts()->each(function (TribePost $post) {
            $post->replies()->delete();
            $post->delete();
        });
        $tribe->joinRequests()->delete();
        $tribe->members()->delete();
        $tribe->delete();

        return redirect()->route('fan.tribes')->with('success', 'Tribe deleted.');
    }

    /**
     * Toggle member role between member and admin.
     */
    public function toggleRole(Tribe $tribe, User $user)
    {
        $this->authorizeManage($tribe);

        $member = $tribe->members()->where('user_id', $user->id)->first();

        if (! $member) {
            return back()->with('error', 'Member not found.');
        }

        if ($tribe->isOwner($user)) {
            return back()->with('error', 'Cannot change the role of the tribe owner.');
        }

        $newRole = $member->role === 'admin' ? 'member' : 'admin';
        $member->update(['role' => $newRole]);

        return back()->with('success', 'Member role updated to '.$newRole);
    }

    /**
     * Remove a member from the tribe.
     */
    public function removeMember(Tribe $tribe, User $user)
    {
        $this->authorizeManage($tribe);

        if ($tribe->isOwner($user)) {
            return back()->with('error', 'The tribe owner cannot be removed.');
        }

        if (! $tribe->removeMember($user)) {
            return back()->with('error', 'Member not found.');
        }

        return back()->with('success', $user->name.' was removed from the tribe.');
    }

    /**
     * Shape one discussion for the client.
     *
     * @param  int|null  $replyLimit  null renders the whole thread.
     */
    private function postPayload(TribePost $post, User $viewer, bool $canManage, ?int $replyLimit = null): array
    {
        $replies = $replyLimit ? $post->replies->take($replyLimit) : $post->replies;

        return [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'is_pinned' => (bool) $post->is_pinned,
            'view_count' => (int) $post->view_count,
            'replies_count' => (int) ($post->replies_count ?? $post->replies->count()),
            'can_delete' => $canManage || $post->user_id === $viewer->id,
            'created_at' => $post->created_at->diffForHumans(),
            'author' => [
                'id' => $post->user->id ?? null,
                'name' => $post->user->name ?? 'Unknown',
                'avatar' => $post->user->avatar ?? null,
            ],
            'replies' => $replies->map(fn ($reply) => [
                'id' => $reply->id,
                'content' => $reply->content,
                'author' => $reply->user->name ?? 'Unknown',
                'author_id' => $reply->user_id,
                'avatar' => $reply->user->avatar ?? null,
                'can_delete' => $canManage || $reply->user_id === $viewer->id,
                'created_at' => $reply->created_at->diffForHumans(),
            ])->values(),
        ];
    }

    /**
     * Notify everyone who can act on a tribe.
     */
    private function notifyAdmins(Tribe $tribe, array $payload): void
    {
        $tribe->members()
            ->where('role', 'admin')
            ->with('user')
            ->get()
            ->each(fn ($member) => $member->user?->notify(new TribeAlert($payload)));
    }

    /**
     * Guard an admin-only action.
     */
    private function authorizeManage(Tribe $tribe): void
    {
        if (! $tribe->canBeManagedBy(Auth::user())) {
            throw ValidationException::withMessages([
                'tribe' => 'Only tribe admins can do that.',
            ]);
        }
    }
}
