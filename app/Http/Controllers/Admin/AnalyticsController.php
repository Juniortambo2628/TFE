<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Budget;
use App\Models\Listing;
use App\Models\LoanApplication;
use App\Models\Post;
use App\Models\Ticket;
use App\Models\TicketPurchase;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Connection analytics — Phase E.
 *
 * TFE tracks reach, not revenue. Every metric here is a signal about
 * "how many fans did we connect to how many partner experiences." The
 * dollars sit on the partner platforms; we don't try to shadow-count them.
 */
class AnalyticsController extends Controller
{
    public function index()
    {
        $signups30d = User::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $referralsByPartner = collect([
            'ticket_purchases' => TicketPurchase::query()
                ->join('tickets', 'ticket_purchases.ticket_id', '=', 'tickets.id')
                ->join('users as partners', 'tickets.partner_id', '=', 'partners.id')
                ->select('partners.name as partner', DB::raw('COUNT(*) as referrals'))
                ->groupBy('partners.name')
                ->orderByDesc('referrals')
                ->get(),
            'loan_referrals' => LoanApplication::query()
                ->join('users as partners', 'loan_applications.finance_partner_id', '=', 'partners.id')
                ->select('partners.name as partner', DB::raw('COUNT(*) as referrals'))
                ->groupBy('partners.name')
                ->orderByDesc('referrals')
                ->get(),
            'budget_referrals' => Budget::query()
                ->select('partner_status as partner', DB::raw('COUNT(*) as referrals'))
                ->whereNotNull('partner_status')
                ->groupBy('partner_status')
                ->orderByDesc('referrals')
                ->get(),
        ]);

        $stats = [
            'total_fans' => User::where('is_admin', false)->where('is_partner', false)->count(),
            'new_fans_30d' => User::where('is_admin', false)->where('is_partner', false)
                ->where('created_at', '>=', now()->subDays(30))->count(),
            'active_partners' => User::where('is_partner', true)->where('verification_status', 'verified')->count(),
            'active_listings' => Listing::where('is_active', true)->where('moderation_status', 'approved')->count(),
            'active_tickets' => Ticket::where('is_active', true)->count(),
            'total_referrals' => TicketPurchase::count() + LoanApplication::count(),
            'community_posts' => Post::whereNull('parent_post_id')->count(),
            'community_bookings' => Booking::count(),
        ];

        return Inertia::render('Admin/Analytics', [
            'signups30d' => $signups30d,
            'referrals' => $referralsByPartner,
            'stats' => $stats,
        ]);
    }
}
