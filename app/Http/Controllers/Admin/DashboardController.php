<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Payment;
use App\Models\Event;
use App\Models\Tribe;
use App\Models\Post;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // Overview stats
        $stats = [
            'total_users' => User::count(),
            'new_users_today' => User::whereDate('created_at', today())->count(),
            'total_revenue' => PaymentTransaction::where('status', 'completed')->sum('amount'),
            'pending_payments' => PaymentTransaction::where('status', 'pending')->count(),
            'total_events' => Event::count(),
            'active_tribes' => Tribe::count(),
            'total_posts' => Post::count(),
            'event_categories' => [
                'Match Day' => Event::where('type', 'Match Day')->count(),
                'Watch Party' => Event::where('type', 'Watch Party')->count(),
                'Tournament' => Event::where('type', 'Tournament')->count(),
                'Community' => Event::where('type', 'Community')->count(),
            ]
        ];

        // Recent users
        $recentUsers = User::latest()
            ->limit(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at->diffForHumans(),
                ];
            });

        // Recent transactions
        $recentTransactions = PaymentTransaction::with('user')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($txn) {
                return [
                    'id' => $txn->id,
                    'user' => $txn->user?->name ?? 'Unknown',
                    'amount' => $txn->amount,
                    'status' => $txn->status,
                    'method' => $txn->method,
                    'created_at' => $txn->created_at->diffForHumans(),
                ];
            });

        // Revenue growth – monthly completed transaction totals for past 6 months
        $revenueGrowth = collect(range(5, 0))->map(function ($monthsAgo) {
            $date = now()->subMonths($monthsAgo);
            $current = PaymentTransaction::where('status', 'completed')
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->sum('amount');
            $previousYear = now()->subMonths($monthsAgo + 12);
            $previous = PaymentTransaction::where('status', 'completed')
                ->whereYear('created_at', $previousYear->year)
                ->whereMonth('created_at', $previousYear->month)
                ->sum('amount');
            return [
                'Month' => $date->format('M'),
                'Revenue' => (float) $current,
                'Previous' => (float) $previous,
            ];
        })->values();

        // User registrations by role
        $usersByRole = [
            ['Tier' => 'Fans', 'Users' => User::where('is_admin', false)->where('is_partner', false)->count()],
            ['Tier' => 'Partners', 'Users' => User::where('is_partner', true)->count()],
            ['Tier' => 'Staff', 'Users' => User::where('is_admin', true)->count()],
        ];

        // User growth (last 7 days)
        $userGrowth = User::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'recentTransactions' => $recentTransactions,
            'userGrowth' => $userGrowth,
            'revenueGrowth' => $revenueGrowth,
            'usersByRole' => $usersByRole,
        ]);
    }
}
