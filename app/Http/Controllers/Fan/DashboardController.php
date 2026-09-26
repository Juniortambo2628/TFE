<?php

namespace App\Http\Controllers\Fan;

use App\Helpers\DashboardHelper;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Budget;
use App\Models\LoanApplication;
use App\Models\PaymentSchedule;
use App\Models\Tribe;
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

        // Amount-paid is what partners tell us on bookings; TFE holds no payment records.
        $totalPaid = (float) Booking::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)->sum('amount_paid');
        $totalDue = (float) PaymentSchedule::where('user_id', $userId)
            ->where('status', 'pending')->sum('amount');
        $completedPaymentsCount = Booking::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)->where('amount_paid', '>', 0)->count();
        $installmentsCount = PaymentSchedule::where('user_id', $userId)->count();

        // Joined-tribes count reflects what the fan can see on the Tribes
        // page for the current tournament — memberships in tribes that
        // are scoped to this tournament OR open to all tournaments.
        $joinedTribesCount = TribeMember::where('user_id', $userId)
            ->whereIn('tribe_id',
                Tribe::forTournament($tournamentId)->pluck('id')
            )->count();

        $stats = [
            'bookings' => $totalBookings,
            'paid' => $totalPaid,
            'due' => $totalDue,
            'payments_count' => $completedPaymentsCount,
            'installments_count' => $installmentsCount,
            'joined_tribes_count' => $joinedTribesCount,
        ];

        // Payment history lives with the fan's partners; TFE surfaces booking
        // activity only. `recentPayments` is kept as an empty collection so
        // downstream Inertia props don't need to be reshuffled.
        $recentPayments = collect();

        // Fetch recent bookings for this tournament
        $recentBookings = Booking::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Prepare Activity Feed
        $activities = collect([]);
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

        // Sprint 16 — surface the fan's most recent in-flight loan on
        // the dashboard so their financing status is one glance away.
        // In-flight means anything except REJECTED. Older completed
        // (DISBURSED) rows stay visible so the fan sees the money
        // landed until they dismiss it by starting a new application.
        $activeLoan = null;
        $latestLoan = LoanApplication::query()
            ->where('user_id', $userId)
            ->whereIn('status', ['PENDING', 'APPROVED', 'DISBURSED'])
            ->with('financePartner.partnerProfile')
            ->orderByDesc('created_at')
            ->first();
        if ($latestLoan) {
            $profile = $latestLoan->financePartner?->partnerProfile;
            $activeLoan = [
                'id' => $latestLoan->id,
                'reference_id' => 'LOAN-'.str_pad($latestLoan->id, 6, '0', STR_PAD_LEFT),
                'amount' => (float) $latestLoan->amount,
                'status' => $latestLoan->status,
                'interest_rate' => $latestLoan->interest_rate,
                'purpose' => $latestLoan->purpose,
                'created_at' => $latestLoan->created_at?->toIso8601String(),
                'partner' => $profile ? [
                    'slug' => $profile->slug,
                    'display_name' => $profile->display_name,
                    'logo_url' => $profile->logo_url,
                    'theme_accent' => $profile->theme_accent,
                    'verified' => $latestLoan->financePartner->verification_status === 'verified',
                ] : null,
            ];
        }

        return Inertia::render('Fan/Dashboard', [
            'activeBudget' => $activeBudget,
            'activeLoan' => $activeLoan,
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
