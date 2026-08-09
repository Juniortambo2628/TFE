<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Budget;
use App\Models\Fixture;
use App\Models\PaymentSchedule;
use App\Models\PaymentTransaction;
use App\Models\TribeMember;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        Log::info('Fan Dashboard Accessed', ['user_id' => $user->id, 'is_partner' => $user->is_partner]);

        if ($user->is_partner) {
            return redirect()->route('partner.dashboard');
        }

        $userId = $user->id;

        // Fetch Summary Data (use DB-level aggregation to avoid loading all records)
        $activeBudget = Budget::where('user_id', $userId)->where('is_active', true)->first();
        $totalBookings = Booking::where('user_id', $userId)->count();

        $totalPaid = PaymentTransaction::where('user_id', $userId)
            ->where('status', 'completed')->sum('amount');
        $totalDue = PaymentSchedule::where('user_id', $userId)
            ->where('status', 'pending')->sum('amount');
        $completedPaymentsCount = PaymentTransaction::where('user_id', $userId)
            ->where('status', 'completed')->count();
        $installmentsCount = PaymentSchedule::where('user_id', $userId)->count();

        $stats = [
            'bookings' => $totalBookings,
            'paid' => $totalPaid,
            'due' => $totalDue,
            'payments_count' => $completedPaymentsCount,
            'installments_count' => $installmentsCount,
            'joined_tribes_count' => TribeMember::where('user_id', $userId)->count(),
        ];

        // Fetch recent successful transactions (only the needed records)
        $recentPayments = PaymentTransaction::where('user_id', $userId)
            ->where('status', 'completed')
            ->orderByDesc('created_at')
            ->take(5)
            ->get();

        // Fetch recent bookings
        $recentBookings = Booking::where('user_id', $userId)->orderBy('created_at', 'desc')->take(5)->get();

        // Prepare Activity Feed
        $activities = collect([]);
        foreach ($recentPayments as $payment) {
            $activities->push([
                'id' => 'pay_'.$payment->id,
                'type' => 'payment',
                'title' => 'Payment Completed',
                'description' => 'Payment via '.strtoupper($payment->method ?? 'Paystack'),
                'date' => $payment->created_at->format('M d, Y'),
                'amount' => $payment->amount,
                'timestamp' => $payment->created_at->timestamp,
            ]);
        }
        foreach ($recentBookings as $booking) {
            $activities->push([
                'id' => 'book_'.$booking->id,
                'type' => 'booking',
                'title' => 'Booking Confirmed',
                'description' => ($booking->package_type ?? 'Travel').' Booking',
                'date' => $booking->created_at->format('M d, Y'),
                'amount' => $booking->total_amount ?? 0,
                'timestamp' => $booking->created_at->timestamp,
            ]);
        }
        $activities = $activities->sortByDesc('timestamp')->values()->take(5);

        // Fetch suggested matches based on user's supported team
        $teamSupport = $user->team_support;
        $suggestedMatches = [];
        if ($teamSupport) {
            $suggestedMatches = Fixture::where('stage', 'Group Stage')
                ->where(function ($query) use ($teamSupport) {
                    $query->whereRaw('LOWER(home_team) = ?', [strtolower($teamSupport)])
                        ->orWhereRaw('LOWER(away_team) = ?', [strtolower($teamSupport)]);
                })
                ->orderBy('date')
                ->orderBy('time')
                ->get()
                ->map(fn ($f) => self::formatFixture($f))
                ->toArray();
        }

        return Inertia::render('Fan/Dashboard', [
            'activeBudget' => $activeBudget,
            'stats' => $stats,
            'recentPayments' => $recentPayments,
            'recentBookings' => $recentBookings,
            'activities' => $activities,
            'suggestedMatches' => $suggestedMatches,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Format a Fixture model into the standardized frontend match format.
     */
    public static function formatFixture(Fixture $f): array
    {
        return [
            'id' => $f->id,
            'date' => $f->date->format('Y-m-d'),
            'time' => $f->time ?? '00:00',
            'homeTeam' => $f->home_team,
            'awayTeam' => $f->away_team,
            'group' => $f->group,
            'venue' => $f->venue,
            'stage' => $f->stage,
            'matchday' => $f->matchday,
            'homeScore' => $f->home_score,
            'awayScore' => $f->away_score,
            'status' => $f->status ?? 'scheduled',
        ];
    }
}
