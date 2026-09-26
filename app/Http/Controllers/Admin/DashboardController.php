<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\Post;
use App\Models\Tribe;
use App\Models\User;
use Illuminate\Support\Facades\DB;
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
        $stats = [
            'total_users' => User::count(),
            'new_users_today' => User::whereDate('created_at', today())->count(),
            'total_partners' => User::where('is_partner', true)->count(),
            'verified_partners' => User::where('is_partner', true)->where('verification_status', 'verified')->count(),
            'total_listings' => Listing::where('is_active', true)->where('moderation_status', 'approved')->count(),
            'total_events' => Event::count(),
            'active_tribes' => Tribe::count(),
            'total_posts' => Post::count(),
        ];

        $recentUsers = User::latest()
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

        $userGrowth = User::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'recentPartners' => $recentPartners,
            'userGrowth' => $userGrowth,
            'usersByRole' => $usersByRole,
        ]);
    }
}
