<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\BankSavingsLink;
use App\Models\Booking;
use App\Models\Listing;
use App\Models\Payment;
use App\Models\SavingsGoal;
use App\Notifications\BookingPaidNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Saving for a trip with a bank partner (Sprint 67, prototype).
 *
 * TFE is the front door and the context; the bank holds the money, runs KYC,
 * keeps the ledger and pays partners. TFE stores a link + consent and nothing
 * financial: every balance and transaction shown here was fetched from the
 * bank on this request, behind a fresh password check, and is not kept.
 */
class BankSavingsController extends Controller
{
    /** Consent, then off to the bank's own onboarding. */
    public function connect(Request $request, SavingsGoal $savingsGoal)
    {
        abort_unless($savingsGoal->user_id === Auth::id(), 403);
        $request->validate(['consent' => 'accepted']);

        $providerKey = config('savings.default');
        $provider = BankSavingsLink::resolve($providerKey);
        $state = Str::random(40);

        $link = BankSavingsLink::updateOrCreate(
            ['user_id' => Auth::id(), 'savings_goal_id' => $savingsGoal->id],
            [
                'provider' => $providerKey,
                'status' => 'pending',
                'external_ref' => null,
                'consent_scopes' => BankSavingsLink::SCOPES,
                'consented_at' => now(),
            ],
        );

        $request->session()->put("savings.onboarding.{$state}", $link->id);

        // Only what the consent screen listed: a name to prefill. The bank
        // collects and verifies identity itself.
        return Inertia::location($provider->onboardingUrl($state, route('fan.bank-savings.callback'), [
            'name' => Auth::user()->name,
            'email' => Auth::user()->email,
        ]));
    }

    public function callback(Request $request)
    {
        $state = (string) $request->query('state', '');
        $linkId = $request->session()->pull("savings.onboarding.{$state}");
        $link = $linkId ? BankSavingsLink::where('user_id', Auth::id())->find($linkId) : null;

        if (! $link) {
            return redirect()->route('fan.savings-goals')->with('error', 'That bank sign-up link has expired. Start again.');
        }

        $ref = $link->provider()->completeOnboarding($request->query(), $state);
        if (! $ref) {
            return redirect()->route('fan.savings-goals')->with('error', 'The bank did not confirm an account. Nothing was opened.');
        }

        $link->update(['external_ref' => $ref, 'status' => 'active']);

        return redirect()->route('fan.bank-savings.show', $link)
            ->with('success', 'Your trip savings account is open at '.$link->provider()->label().'.');
    }

    /** Live from the bank, never stored. Behind `savings.reauth`. */
    public function show(BankSavingsLink $link)
    {
        $this->authorizeLink($link);
        $provider = $link->provider();

        try {
            $balances = $provider->balances($link->external_ref);
            $transactions = $provider->transactions($link->external_ref);
            $available = true;
        } catch (\Throwable $e) {
            // The exception TYPE only: a bank's error message can carry figures
            // or references TFE has no business keeping in its logs (Sprint 68).
            Log::warning('Savings provider unavailable', ['provider' => $link->provider, 'exception' => $e::class]);
            [$balances, $transactions, $available] = [['balances' => [], 'as_of' => null], [], false];
        }

        $goal = $link->goal;

        return Inertia::render('Fan/BankSavings', [
            'link' => ['id' => $link->id, 'bank' => $provider->label(), 'consent_scopes' => $link->consent_scopes, 'consented_at' => $link->consented_at?->toIso8601String()],
            'goal' => $goal ? [
                'name' => $goal->name,
                'target_amount' => (float) $goal->target_amount,
                'currency' => $goal->currency ?: 'USD',
                'target_date' => $goal->target_date?->toDateString(),
            ] : null,
            'available' => $available,
            'balances' => $balances['balances'],
            'asOf' => $balances['as_of'],
            'transactions' => $transactions,
            'currencies' => $provider->currencies(),
        ]);
    }

    public function deposit(Request $request, BankSavingsLink $link)
    {
        $this->authorizeLink($link);
        $provider = $link->provider();

        $data = $request->validate([
            'amount' => 'required|numeric|min:1|max:10000000',
            'currency' => 'required|in:'.implode(',', $provider->currencies()),
        ]);

        $instruction = $provider->depositInstruction(
            $link->external_ref, (float) $data['amount'], $data['currency'], route('fan.bank-savings.show', $link),
        );

        // The money goes fan → bank. TFE only hands the fan to the bank's flow.
        return ($instruction['type'] ?? null) === 'redirect'
            ? Inertia::location($instruction['url'])
            : back()->with('success', $instruction['message']);
    }

    /** Revoke consent: TFE forgets the link. The account stays the fan's, at the bank. */
    public function disconnect(BankSavingsLink $link)
    {
        $this->authorizeLink($link, requireActive: false);
        $bank = $link->provider()->label();
        $link->delete();

        return redirect()->route('fan.savings-goals')
            ->with('success', "Disconnected. Your account at {$bank} is still yours — manage it with the bank directly.");
    }

    /**
     * The fan authorises their bank to pay the travel partner for a booking.
     * The bank moves the money; TFE records only that the booking was paid
     * and the bank's payment reference.
     */
    public function payBooking(Request $request, Booking $booking)
    {
        abort_unless($booking->user_id === Auth::id(), 403);

        $data = $request->validate(['link_id' => 'required|integer', 'authorise' => 'accepted']);
        $link = BankSavingsLink::where('user_id', Auth::id())->findOrFail($data['link_id']);
        $this->authorizeLink($link);

        $due = round(max(0, (float) $booking->total_amount - (float) $booking->amount_paid), 2);
        $currency = $booking->currency ?: 'USD';
        if ($booking->status !== 'pending_payment' || $due <= 0) {
            return back()->with('error', 'This booking has nothing left to pay.');
        }

        $listing = $booking->listing_id ? Listing::with('publisher.partnerProfile')->find($booking->listing_id) : null;
        $payee = [
            'name' => $listing?->publisherSummary()['display_name'] ?? 'TFE travel partner',
            'reference' => 'BOOKING-'.str_pad((string) $booking->id, 6, '0', STR_PAD_LEFT),
        ];

        $result = $link->provider()->payPartner($link->external_ref, $due, $currency, $payee);

        if (($result['status'] ?? null) !== 'completed') {
            return back()->with('error', $result['message'] ?? 'Your bank did not complete the payment.');
        }

        DB::transaction(function () use ($booking, $due, $currency, $result) {
            Payment::create([
                'user_id' => $booking->user_id,
                'booking_id' => $booking->id,
                'amount' => $due,
                'currency' => $currency,
                'payment_method' => 'bank_savings',
                'transaction_id' => $result['reference'],
                'status' => 'completed',
                'paid_at' => now(),
            ]);
            $booking->update(['amount_paid' => (float) $booking->amount_paid + $due, 'status' => 'confirmed']);
        });

        Auth::user()->notify(new BookingPaidNotification($booking->fresh(), $due, $currency));

        return redirect()->route('fan.bookings.show', $booking)->with('success', $result['message'].' Your booking is confirmed.');
    }

    private function authorizeLink(BankSavingsLink $link, bool $requireActive = true): void
    {
        abort_unless($link->user_id === Auth::id(), 403);
        if ($requireActive) {
            abort_unless($link->isActive(), 409, 'This savings account is not open yet.');
        }
    }
}
