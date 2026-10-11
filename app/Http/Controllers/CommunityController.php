<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Tribe;
use App\Traits\ResolvesTournament;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The PUBLIC face of the community (Sprint 70): a preview of public feed
 * posts and tribes for the landing page, a tribe directory at /tribes and a
 * page per tribe at /tribes/{slug}.
 *
 * What a visitor without an account may see:
 *  - posts the author marked `public`, top-level only (no replies);
 *  - a tribe's name, description, banner, privacy and counts — NEVER its
 *    posts or its member list, which stay behind sign-in as before, and
 *    which a private tribe keeps behind membership too;
 *  - no invite-only tribe at all: a visitor cannot join one, so listing it
 *    would advertise something nobody may ask for.
 *
 * Joining goes through sign-in and lands on the tribe's own fan page, where
 * the existing privacy rules (join / request / locked) take over unchanged.
 */
class CommunityController extends Controller
{
    use ResolvesTournament;

    public const PUBLIC_PRIVACY = ['public', 'private'];

    /** Landing-page preview: latest public posts + the busiest tribes. */
    public static function preview(?string $tournamentId): array
    {
        return [
            'posts' => self::publicPosts(6),
            'tribes' => self::directoryQuery($tournamentId)->limit(4)->get()->map(fn ($t) => self::tribeCard($t))->all(),
        ];
    }

    public function index(Request $request): Response
    {
        $tournamentId = $this->activeTournament()['id'];

        return Inertia::render('Community/Tribes', [
            'hero' => HomeController::pageHero('tribes'),
            'tribes' => self::directoryQuery($tournamentId)->limit(48)->get()->map(fn ($t) => self::tribeCard($t))->all(),
            'posts' => self::publicPosts(8),
        ]);
    }

    public function show(Request $request, string $slug): Response|RedirectResponse
    {
        $tribe = Tribe::where('slug', $slug)->whereIn('privacy', self::PUBLIC_PRIVACY)->firstOrFail();

        // Signed in: the fan page is the real one (posts, members, join).
        if ($request->user()) {
            return redirect()->route('fan.tribes.show', $tribe);
        }

        return Inertia::render('Community/TribeShow', [
            'tribe' => self::tribeCard($tribe) + [
                'description' => (string) $tribe->description,
                'created_at' => $tribe->created_at?->toDateString(),
            ],
        ]);
    }

    /** "Join" from a public page: sign in, then the tribe's fan page. */
    public function join(Request $request, string $slug): RedirectResponse
    {
        $tribe = Tribe::where('slug', $slug)->whereIn('privacy', self::PUBLIC_PRIVACY)->firstOrFail();
        $target = route('fan.tribes.show', $tribe);

        if ($request->user()) {
            return redirect()->to($target);
        }

        $request->session()->put('url.intended', $target);

        return redirect()->route('register');
    }

    private static function directoryQuery(?string $tournamentId)
    {
        return Tribe::query()
            ->whereIn('privacy', self::PUBLIC_PRIVACY)
            ->when($tournamentId, fn ($q) => $q->forTournament($tournamentId))
            ->orderByDesc('member_count')
            ->orderByDesc('posts_count');
    }

    private static function tribeCard(Tribe $t): array
    {
        return [
            'slug' => $t->slug,
            'name' => $t->name,
            'excerpt' => Str::limit((string) $t->description, 140),
            'avatar' => $t->avatar,
            'banner' => $t->banner,
            'privacy' => $t->privacy,
            'member_count' => (int) $t->member_count,
            'posts_count' => (int) $t->posts_count,
        ];
    }

    private static function publicPosts(int $limit): array
    {
        return Post::query()
            ->where('visibility', 'public')
            ->whereNull('parent_post_id')
            ->with('user:id,name,avatar,team_support')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (Post $p) => [
                'id' => $p->id,
                'excerpt' => Str::limit((string) $p->content, 220),
                'image' => $p->image_url,
                'likes' => (int) $p->likes_count,
                'comments' => (int) $p->comment_count,
                'created_at' => $p->created_at?->toIso8601String(),
                // Name + avatar only — the author chose "public".
                'author' => $p->user ? [
                    'name' => $p->user->name,
                    'avatar' => $p->user->avatar,
                    'team' => $p->user->team_support,
                ] : null,
            ])
            ->all();
    }
}
