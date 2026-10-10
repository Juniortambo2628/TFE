<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Budget;
use App\Models\Listing;
use App\Services\FixtureService;
use App\Services\TournamentService;
use App\Support\VisitorCurrency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * The PUBLIC "Plan my trip" dialog (Sprint 64).
 *
 * Testers asked for planning-to-payment in as few steps as possible. Before
 * this, a visitor had to register, find the Budget Calculator, walk five
 * steps, save, wait for a partner quote, confirm, then pay. Now a visitor
 * gets an estimate in three steps without an account, and the estimate
 * itself is what carries them through sign-in:
 *
 *   data()    — everything the dialog needs, in one request, no auth.
 *   handoff() — stashes the estimate + intent in the session, points
 *               `url.intended` at resume(), and sends a guest to register.
 *   resume()  — runs once signed in: `book` with a package becomes a Budget
 *               plus a pending-payment Booking (the published price IS the
 *               quote, so there is nothing for a partner to approve);
 *               `book` without a package saves the plan; `explore` lands on
 *               the calculator's package step with the estimate beside it.
 *
 * The session survives login (Laravel migrates, not wipes, it on
 * regenerate), and email verification already redirects to `intended`, so
 * the estimate is never re-typed.
 */
class TripPlannerController extends Controller
{
    public const SESSION_KEY = 'planner.trip';

    public function data(Request $request, TournamentService $tournaments, FixtureService $fixtures): JsonResponse
    {
        $requested = (string) $request->query('tournament', '');
        $tournament = $requested !== '' && config("tournaments.tournaments.{$requested}")
            ? $tournaments->get($requested)
            : $tournaments->get(session('active_tournament_id') ?: config('tournaments.default'));

        $id = $tournament['id'];

        $matches = collect($fixtures->getFixtures($id))
            ->map(fn ($f) => [
                'id' => $f['id'] ?? null,
                'date' => $f['date'] ?? null,
                'time' => $f['time'] ?? null,
                'homeTeam' => $f['homeTeam'] ?? null,
                'awayTeam' => $f['awayTeam'] ?? null,
                'venue' => $f['venue'] ?? null,
                'stage' => $f['stage'] ?? null,
            ])
            ->filter(fn ($f) => $f['id'] !== null)
            ->values();

        return response()->json([
            'tournament' => [
                'id' => $id,
                'name' => $tournament['name'] ?? $id,
                'short_name' => $tournament['short_name'] ?? $tournament['name'] ?? $id,
                'hosts' => $tournament['hosts'] ?? [],
            ],
            'pricing' => $tournament['pricing'] ?? [],
            'fixtures' => $matches,
            'packages' => $this->packagesFor($id),
            // Default only — a saved choice in the browser wins (Sprint 66).
            'suggested_currency' => VisitorCurrency::guess($request),
        ]);
    }

    public function handoff(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'intent' => 'required|in:book,explore',
            'tournament_id' => 'required|string|max:64',
            'total_cost' => 'required|numeric|min:0',
            'currency' => 'nullable|string|in:USD,EUR,GBP,KES,ZAR,NGN,XOF',
            'breakdown' => 'required|array',
            'match_ids' => 'present|array',
            'match_count' => 'nullable|integer|min:0|max:64',
            'nights' => 'required|integer|min:1|max:60',
            'group_size' => 'required|integer|min:1|max:200',
            'flight_class' => 'required|string|max:32',
            'flight_origin' => 'nullable|string|max:64',
            'accommodation_level' => 'required|string|max:32',
            'listing_id' => 'nullable|integer',
        ]);

        abort_unless(config("tournaments.tournaments.{$validated['tournament_id']}"), 422);

        return $this->stash($request, $validated);
    }

    /**
     * "Book now" on a public listing page (Sprint 65): one click from a
     * package to its booking, with no planner in between. The package's own
     * trip fields stand in for the estimate.
     */
    public function bookListing(Request $request, Listing $listing): RedirectResponse
    {
        abort_if(
            $listing->moderation_status !== 'approved' || ! $listing->is_active
                || ! in_array($listing->type, ['package', 'tour'], true),
            404,
        );

        $group = (int) $request->validate(['group_size' => 'required|integer|min:1|max:200'])['group_size'];
        $total = $this->packageTotal($listing, ['group_size' => $group]);

        return $this->stash($request, [
            'intent' => 'book',
            'tournament_id' => $listing->tournament_id,
            'total_cost' => $total,
            'currency' => $listing->currency ?: 'USD',
            'breakdown' => ['package' => $total],
            'match_ids' => $listing->included_match_ids ?? [],
            'match_count' => count($listing->included_match_ids ?? []),
            'nights' => $listing->nights ?: 7,
            'group_size' => $group,
            'flight_class' => $listing->flight_class ?: 'economy',
            'flight_origin' => null,
            'accommodation_level' => $listing->accommodation_level ?: '3_star',
            'listing_id' => $listing->id,
        ]);
    }

    private function stash(Request $request, array $trip): RedirectResponse
    {
        $request->session()->put(self::SESSION_KEY, $trip);
        $request->session()->put('url.intended', route('plan-trip.resume'));

        if (Auth::check()) {
            return redirect()->route('plan-trip.resume');
        }

        return redirect()->route('register', ['from' => 'planner']);
    }

    public function resume(Request $request): RedirectResponse
    {
        $user = $request->user();
        $trip = $request->session()->get(self::SESSION_KEY);

        if (! $trip) {
            return redirect()->route('dashboard');
        }

        // Unverified accounts are sent to verify first; keep the trip and the
        // way back so verification lands here again (VerifyEmailController
        // redirects to `intended`).
        if (! $user->hasVerifiedEmail()) {
            $request->session()->put('url.intended', route('plan-trip.resume'));

            return redirect()->route('verification.notice');
        }

        $request->session()->forget(self::SESSION_KEY);

        // Partners and admins do not buy trips; nothing to carry over.
        if ($user->is_admin || $user->is_partner) {
            return redirect()->route('dashboard');
        }

        $request->session()->put('active_tournament_id', $trip['tournament_id']);

        if ($trip['intent'] === 'explore') {
            $request->session()->put('planner.estimate', $trip);

            return redirect()->route('fan.budget-calculator', ['from' => 'planner']);
        }

        $listing = ! empty($trip['listing_id'])
            ? $this->publicListing((int) $trip['listing_id'], $trip['tournament_id'])
            : null;

        if ($listing && $listing->is_sold_out) {
            $request->session()->put('planner.estimate', $trip);

            return redirect()->route('fan.budget-calculator', ['from' => 'planner'])
                ->with('error', 'That package sold out while you were signing in. Pick another one below — your estimate is kept.');
        }

        $booking = DB::transaction(function () use ($user, $trip, $listing) {
            Budget::where('user_id', $user->id)
                ->where('tournament_id', $trip['tournament_id'])
                ->update(['is_active' => false]);

            $budget = Budget::create([
                'user_id' => $user->id,
                'tournament_id' => $trip['tournament_id'],
                'listing_id' => $listing?->id,
                'name' => $listing ? $listing->name : 'My trip plan',
                'total_cost' => $trip['total_cost'],
                'currency' => $trip['currency'] ?? 'USD',
                'match_ids' => $trip['match_ids'] ?? [],
                'accommodation_level' => $trip['accommodation_level'],
                'flight_class' => $trip['flight_class'],
                'breakdown' => $trip['breakdown'],
                'nights' => $trip['nights'],
                'is_active' => ! $listing,
            ]);

            if (! $listing) {
                return null;
            }

            // A published package price is already the partner's quote, so
            // the plan skips the quote round-trip and goes straight to payment.
            $budget->update(['partner_status' => 'confirmed', 'partner_cost' => $this->packageTotal($listing, $trip)]);

            $booking = Booking::create([
                'user_id' => $user->id,
                'tournament_id' => $trip['tournament_id'],
                'listing_id' => $listing->id,
                'package_name' => $listing->name,
                'package_type' => $listing->name,
                'status' => 'pending_payment',
                'total_amount' => $this->packageTotal($listing, $trip),
                'currency' => $listing->currency ?: 'USD',
                'amount_paid' => 0,
                'booking_date' => now(),
                'expires_at' => now()->addHours(48),
                'flight_info' => $listing->flight_class ?? $trip['flight_class'],
                'accommodation' => $listing->accommodation_level ?? $trip['accommodation_level'],
                'matches' => $listing->included_match_ids ?: ($trip['match_ids'] ?? []),
            ]);

            $listing->increment('sold_count');

            return $booking;
        });

        if ($booking) {
            return redirect()->route('fan.bookings.show', $booking)
                ->with('success', 'Your trip is booked and held for 48 hours — complete payment to secure it.');
        }

        // Custom plan: no published price to pay against yet. Saved, and
        // the calculator opens on it with the estimate already worked out.
        $budget = Budget::where('user_id', $user->id)->latest('id')->first();

        return redirect()->route('fan.budget-calculator', ['id' => $budget->id])
            ->with('success', 'Your plan is saved. Pick a partner package to book it, or share it for a quote.');
    }

    /**
     * Approved + active packages/tours for a tournament, with their publisher.
     * The dialog suggests these as the partners who can deliver the trip.
     */
    private function packagesFor(string $tournamentId): array
    {
        return Listing::forTournament($tournamentId)
            ->whereIn('type', ['package', 'tour'])
            ->approved()
            ->active()
            ->with('publisher.partnerProfile')
            ->orderByDesc('is_featured')
            ->orderBy('display_order')
            ->limit(12)
            ->get()
            ->map(fn (Listing $l) => [
                'id' => $l->id,
                'name' => $l->name,
                'description' => $l->description,
                'hero_image' => $l->hero_image,
                'base_price' => (float) $l->base_price,
                'currency' => $l->currency ?: 'USD',
                'nights' => $l->nights,
                'flight_class' => $l->flight_class,
                'accommodation_level' => $l->accommodation_level,
                'included_match_ids' => $l->included_match_ids ?? [],
                'seats_left' => $l->seats_left,
                'is_sold_out' => $l->is_sold_out,
                'publisher' => $l->publisherSummary(),
            ])
            ->values()
            ->all();
    }

    private function publicListing(int $id, string $tournamentId): ?Listing
    {
        return Listing::forTournament($tournamentId)
            ->approved()
            ->active()
            ->whereKey($id)
            ->first();
    }

    /** Package price is per traveller. */
    private function packageTotal(Listing $listing, array $trip): float
    {
        return round((float) $listing->base_price * max(1, (int) ($trip['group_size'] ?? 1)), 2);
    }
}
