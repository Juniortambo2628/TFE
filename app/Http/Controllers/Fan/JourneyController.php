<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\BankSavingsLink;
use App\Models\Booking;
use App\Models\Budget;
use App\Models\NotificationContact;
use App\Models\Payment;
use App\Models\PaymentSchedule;
use App\Models\TicketPurchase;
use App\Services\FixtureService;
use App\Services\MpesaService;
use App\Services\PaystackService;
use App\Services\WeatherService;
use App\Traits\ResolvesTournament;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
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
            // 'mpesa' (Nov 2026): direct Daraja is configured and the card
            // rail is not — the M-Pesa button still works without Paystack.
            'checkout' => $this->checkoutMode($booking),
            // Sprint 66 — KES amount when M-Pesa can pay this booking, else null.
            'mpesa' => $this->mpesaQuote($booking),
            // Nov 2026 — direct STK configured? The UI collects a phone number
            // first; without it the button falls through to Paystack's hosted
            // mobile_money checkout (which asks for the number itself).
            'mpesaDirect' => app(MpesaService::class)->configured(),
            // The live or recently-failed direct attempt, so the page can show
            // "check your phone" and poll until Safaricom's callback lands.
            'mpesaAttempt' => $this->mpesaAttempt($booking),
            // Prefill for the phone prompt — the number the fan already
            // verified for alerts (Sprint 66), not a new thing to type.
            'mpesaPhone' => NotificationContact::where('user_id', $booking->user_id)
                ->whereNotNull('verified_at')->latest('verified_at')->value('phone'),
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
        $currency = $booking->currency ?: 'USD';
        $mpesa = app(MpesaService::class);
        // "Demo" must not label a real push: when Daraja is configured AND
        // can quote this booking, the direct rail is what the buttons do.
        $directStk = $mpesa->configured() && $mpesa->kesAmount($this->balance($booking), $currency) !== null;

        $paystack = app(PaystackService::class);
        if ($paystack->demo() && ! $directStk) {
            return 'demo';
        }

        if ($paystack->enabled() && $paystack->supports($currency)) {
            return 'paystack';
        }

        // Direct Daraja needs no Paystack at all: the fan can still pay by
        // phone with only these keys configured (Nov 2026).
        if ($directStk) {
            return 'mpesa';
        }

        return null;
    }

    private function mpesaQuote(Booking $booking): ?float
    {
        $balance = max(0, (float) $booking->total_amount - (float) $booking->amount_paid);
        $currency = $booking->currency ?: 'USD';

        // Direct configuration owns its own quote; the hosted Paystack path
        // keeps Sprint 66's rate. Same fallback chain, so one number.
        $mpesa = app(MpesaService::class);
        if ($mpesa->configured()) {
            return $mpesa->kesAmount($balance, $currency);
        }

        $paystack = app(PaystackService::class);
        if (! $paystack->enabled() && ! $paystack->demo()) {
            return null;
        }

        return $paystack->mpesaAmount($balance, $currency);
    }

    /**
     * The booking's live direct-STK attempt — pending (the page shows "check
     * your phone" and polls) or very recently failed (so the fan sees why the
     * buttons came back). Completed attempts are the booking's own status.
     *
     * A pending prompt older than the push itself must already have an answer
     * on Safaricom's side: either their callback was lost, or the fan never
     * acted. After 75 seconds (STK prompts time out at ~60) we ask them
     * directly with stkQuery — throttled to once per attempt per 30s, since
     * the page polls — and apply the result through the same path the
     * callback uses.
     */
    private function mpesaAttempt(Booking $booking): ?array
    {
        $attempt = Payment::where('booking_id', $booking->id)
            ->where('payment_method', 'mpesa')
            ->whereNotNull('gateway_reference')
            ->whereIn('status', ['pending', 'failed'])
            ->where('created_at', '>=', now()->subMinutes(MpesaService::PENDING_TTL_MINUTES))
            ->latest('id')
            ->first();

        if (! $attempt) {
            return null;
        }

        if ($attempt->status === 'pending'
            && $attempt->created_at->lt(now()->subSeconds(75))
            && $attempt->gateway_reference
            && Cache::add('mpesa:query:'.$attempt->id, 1, 30)) {
            $mpesa = app(MpesaService::class);
            $mpesa->applyResult($attempt, $mpesa->stkQuery($attempt->gateway_reference));
            $attempt->refresh();

            if ($attempt->status === 'completed') {
                // The route-bound booking predates this settlement — refresh it
                // so the props don't serialize a stale pending_payment.
                $booking->refresh();

                return null;
            }
        }

        return [
            'id' => $attempt->id,
            'status' => $attempt->status,
            'created_at' => $attempt->created_at->toIso8601String(),
        ];
    }

    private function balance(Booking $booking): float
    {
        return round(max(0, (float) $booking->total_amount - (float) $booking->amount_paid), 2);
    }
}
