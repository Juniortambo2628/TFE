<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Budget;
use App\Models\PaymentSchedule;
use App\Models\PaymentTransaction;
use App\Services\FixtureService;
use App\Services\WeatherService;
use App\Traits\ResolvesTournament;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class JourneyController extends Controller
{
    use ResolvesTournament;

    public function index()
    {
        $user = Auth::user();
        $userId = $user->id;
        $tournamentId = $this->activeTournamentId();

        // Fetch Data — bookings and active budget are scoped to the active
        // tournament so switching tournaments switches the whole journey view.
        $bookings = Booking::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)
            ->orderBy('created_at', 'desc')
            ->get();
        $paymentSchedules = PaymentSchedule::where('user_id', $userId)->orderBy('due_date', 'asc')->get();
        $activeBudget = Budget::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)
            ->where('is_active', true)
            ->first();

        // Calculate Totals using PaymentTransaction as source of truth
        $totalPaid = PaymentTransaction::where('user_id', $userId)
            ->where('status', 'completed')
            ->sum('amount');

        $paymentsCount = PaymentTransaction::where('user_id', $userId)
            ->where('status', 'completed')
            ->count();

        $recentPayments = PaymentTransaction::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function ($txn) {
                return [
                    'id' => $txn->id,
                    'amount' => $txn->amount,
                    'description' => $txn->description ?? 'Payment',
                    'status' => $txn->status,
                    'method' => $txn->method,
                    'reference' => $txn->reference,
                    'created_at' => $txn->created_at->format('M d, Y'),
                ];
            });

        // Total Due = Pending Installments + Balances on bookings without schedules
        $scheduledPending = $paymentSchedules->where('status', 'pending')->sum('amount');

        // Use indexed collection for O(n) lookup instead of O(n*m) contains()
        $scheduledBookingIds = $paymentSchedules->pluck('booking_id')->filter()->flip();
        $unscheduledBookingBalance = $bookings->filter(function ($booking) use ($scheduledBookingIds) {
            return ! $scheduledBookingIds->has($booking->id);
        })->sum(function ($booking) {
            return max(0, $booking->total_amount - $booking->amount_paid);
        });

        $totalDue = $scheduledPending + $unscheduledBookingBalance;

        // Prepare data for view
        $paymentData = [
            'totalBookings' => $bookings->count(),
            'totalPaid' => (float) $totalPaid,
            'totalDue' => (float) $totalDue,
            'paymentsCount' => $paymentsCount,
            'bookings' => $bookings,
            'paymentSchedules' => $paymentSchedules,
            'payments' => $recentPayments,
        ];

        // Mock active budget if null, just to be safe during migration/testing, or return null.
        // Code handles null.

        // Weather forecast for the active tournament's first host city —
        // deferred so the Journey page renders before the Open-Meteo hop
        // completes (cached for 3h once fetched).
        $tournament = $this->activeTournament();
        $hosts = $tournament['hosts'] ?? [];
        $startDate = $tournament['start_date'] ?? null;
        $endDate = $tournament['end_date'] ?? null;
        $weather = null;
        if (! empty($hosts)) {
            $weather = Inertia::defer(function () use ($hosts, $startDate, $endDate) {
                return app(WeatherService::class)->forecast(
                    (string) $hosts[0],
                    $startDate,
                    $endDate,
                );
            });
        }

        return Inertia::render('Fan/Journey', [
            'paymentData' => $paymentData,
            'activeBudget' => $activeBudget,
            'weather' => $weather,
        ]);
    }

    public function show(Booking $booking)
    {
        if ($booking->user_id !== Auth::id()) {
            abort(403);
        }

        $matches = [];
        if (! empty($booking->matches)) {
            // Prefer the booking's own tournament (may differ from the
            // currently-active one if the user switched context after booking).
            $tournamentId = $booking->tournament_id ?: $this->activeTournamentId();
            $fixtureService = app(FixtureService::class);
            $allFixtures = $fixtureService->getFixtures($tournamentId);
            $matches = array_values(array_filter($allFixtures, function ($f) use ($booking) {
                return in_array($f['id'], $booking->matches);
            }));
        }

        return Inertia::render('Fan/BookingDetails', [
            'booking' => $booking,
            'matches' => $matches,
        ]);
    }
}
