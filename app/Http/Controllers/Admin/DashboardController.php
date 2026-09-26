<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\Post;
use App\Models\Tribe;
use App\Models\User;
use Inertia\Inertia;

/**
 * Admin dashboard — connection metrics, not money.
 *
 * TFE doesn't process payments; every transaction runs on the partner's rails.
 * The admin dashboard therefore tracks REACH (fans + partners on the platform,
 * listings on offer, event turnout) rather than revenue.
 */
class DashboardController extends Controller
{
    public function index()
    {
        // `total_users` counts EVERY account — fans, partners and staff. The
        // tile that read it was labelled "Registered fans", so it disagreed
        // with the Fans bar in the chart directly beneath it (8 against 2).
        // Fans are their own count now (Sprint 56).
        $fans = User::where('is_admin', false)->where('is_partner', false);

        $stats = [
            'total_fans' => (clone $fans)->count(),
            'new_fans_today' => (clone $fans)->whereDate('created_at', today())->count(),
            'total_users' => User::count(),
            'total_partners' => User::where('is_partner', true)->count(),
            'verified_partners' => User::where('is_partner', true)->where('verification_status', 'verified')->count(),
            'total_listings' => Listing::where('is_active', true)->where('moderation_status', 'approved')->count(),
            // `tribes` has no active/status column, so this is every tribe —
            // the tile says so rather than claiming "active".
            'total_tribes' => Tribe::count(),
            'total_posts' => Post::count(),
        ];

        // Fans only. This listed every new account, so the four demo
        // partners filled it and then appeared AGAIN in "New partners" right
        // beside it — the same five rows twice (Sprint 56).
        $recentUsers = (clone $fans)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at->diffForHumans(),
            ]);

        $recentPartners = PartnerProfile::with('user')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->display_name,
                'slug' => $p->slug,
                'partner_type' => $p->user->partner_type,
                'verified' => $p->user->verification_status === 'verified',
                'created_at' => $p->created_at?->diffForHumans(),
            ]);

        $usersByRole = [
            ['Tier' => 'Fans', 'Users' => User::where('is_admin', false)->where('is_partner', false)->count()],
            ['Tier' => 'Partners', 'Users' => User::where('is_partner', true)->count()],
            ['Tier' => 'Staff', 'Users' => User::where('is_admin', true)->count()],
        ];

        // Registrations for the last 7 days, zero-filled. The grouped query
        // only returns days that HAD a signup, so a chart drawn straight
        // from it silently closes the gaps and reads as if every day had
        // traffic. (It was also computed and passed to a page that never
        // rendered it — dead work on every dashboard load until Sprint 56.)
        // Fans, to match the "Registered fans" tile — counting partner and
        // staff accounts in a reach chart would make the two disagree the
        // way the tile and the role chart used to.
        $counts = (clone $fans)
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('date')
            ->pluck('count', 'date');

        $userGrowth = collect(range(6, 0))->map(function (int $daysAgo) use ($counts) {
            $day = now()->subDays($daysAgo);

            return [
                'date' => $day->format('D j M'),
                'Signups' => (int) ($counts[$day->format('Y-m-d')] ?? 0),
            ];
        })->values();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'recentPartners' => $recentPartners,
            'userGrowth' => $userGrowth,
            'usersByRole' => $usersByRole,
        ]);
    }
}
