<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\BankSavingsLink;
use App\Models\Booking;
use App\Models\Budget;
use App\Models\PaymentSchedule;
use App\Models\TicketPurchase;
use App\Services\FixtureService;
use App\Services\PaystackService;
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

        // Booking-derived totals; TFE never holds payment records — the
        // partner's platform does. Amount-paid figures are what the
        // partner has told us via booking updates.
        $totalPaid = (float) $bookings->sum('amount_paid');
        $paymentsCount = $bookings->filter(fn ($b) => $b->amount_paid > 0)->count();
        $recentPayments = collect();

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
            // Sprint 65 — 'paystack' | 'demo' | null (partner link only).
            'checkout' => $this->checkoutMode($booking),
            // Sprint 66 — KES amount when M-Pesa can pay this booking, else null.
            'mpesa' => $this->mpesaQuote($booking),
            // Sprint 67 — bank savings accounts that could pay this booking.
            // Labels only; the balance is checked by the bank when it pays.
            'savingsLinks' => BankSavingsLink::with('goal')
                ->where('user_id', $booking->user_id)->where('status', 'active')->get()
                ->map(fn ($l) => ['id' => $l->id, 'bank' => $l->provider()->label(), 'goal' => $l->goal?->name])
                ->values(),
            // Sprint 66 — facts for the whole-trip timeline (lib/tripTimeline).
            'timeline' => [
                'tickets_bought' => (int) TicketPurchase::where('user_id', $booking->user_id)
                    ->where('status', 'paid')
                    ->whereHas('ticket', fn ($q) => $q->where('tournament_id', $booking->tournament_id))
                    ->sum('quantity'),
                'first_match_at' => collect($matches)->pluck('date')->filter()->sort()->first(),
            ],
        ]);
    }

    private function checkoutMode(Booking $booking): ?string
    {
        $paystack = app(PaystackService::class);
        if ($paystack->demo()) {
            return 'demo';
        }

        return $paystack->enabled() && $paystack->supports($booking->currency ?: 'USD') ? 'paystack' : null;
    }

    private function mpesaQuote(Booking $booking): ?float
    {
        $paystack = app(PaystackService::class);
        if (! $paystack->enabled() && ! $paystack->demo()) {
            return null;
        }
        $balance = max(0, (float) $booking->total_amount - (float) $booking->amount_paid);

        return $paystack->mpesaAmount($balance, $booking->currency ?: 'USD');
    }
}
