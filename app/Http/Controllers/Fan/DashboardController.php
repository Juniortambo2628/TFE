<?php

namespace App\Http\Controllers\Fan;

use App\Helpers\DashboardHelper;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Budget;
use App\Models\PaymentSchedule;
use App\Models\PaymentTransaction;
use App\Models\TribeMember;
use App\Services\FixtureService;
use App\Traits\ResolvesTournament;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    use ResolvesTournament;

    public function index()
    {
        $user = auth()->user();

        Log::info('Fan Dashboard Accessed', ['user_id' => $user->id, 'is_partner' => $user->is_partner]);

        if ($user->is_admin || $user->is_partner) {
            return DashboardHelper::redirectByRole();
        }

        $userId = $user->id;

        // Resolve active tournament (shared trait — never falls back to wc_2026)
        $tournament = $this->activeTournament();
        $tournamentId = $tournament['id'];
        $isConcluded = $this->isTournamentConcluded($tournament);
        $nextActive = $this->tournamentService()->nextActive();

        // Fetch Summary Data — scoped to the active tournament so multi-tournament
        // planners don't see mixed totals or the wrong active budget.
        $activeBudget = Budget::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)
            ->where('is_active', true)
            ->first();
        $totalBookings = Booking::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)
            ->count();

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

        // Fetch recent bookings for this tournament
        $recentBookings = Booking::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

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
            $fixtureService = app(FixtureService::class);
            $allFixtures = $fixtureService->getFixtures($tournamentId);
            $suggestedMatches = array_values(array_filter($allFixtures, function ($f) use ($teamSupport) {
                $stage = strtolower($f['stage'] ?? '');
                $home = strtolower($f['homeTeam'] ?? '');
                $away = strtolower($f['awayTeam'] ?? '');

                return str_contains($stage, 'group')
                    && ($home === strtolower($teamSupport) || $away === strtolower($teamSupport));
            }));
        }

        return Inertia::render('Fan/Dashboard', [
            'activeBudget' => $activeBudget,
            'stats' => $stats,
            'recentPayments' => $recentPayments,
            'recentBookings' => $recentBookings,
            'activities' => $activities,
            'suggestedMatches' => $isConcluded ? [] : $suggestedMatches,
            'isConcluded' => $isConcluded,
            'nextActiveTournament' => $nextActive ? ['id' => $nextActive['id'], 'name' => $nextActive['name'], 'slug' => $nextActive['slug']] : null,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }
}
