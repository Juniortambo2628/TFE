<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Pay for a booking without leaving TFE (Sprint 65).
 */
class BookingPaymentController extends Controller
{
    public function __construct(private PaystackService $paystack) {}

    public function pay(Booking $booking)
    {
        abort_unless($booking->user_id === Auth::id(), 403);

        $balance = $this->balance($booking);
        if ($booking->status !== 'pending_payment' || $balance <= 0) {
            return back()->with('error', 'This booking has nothing left to pay.');
        }

        if ($booking->expires_at && $booking->expires_at->isPast()) {
            return back()->with('error', 'This booking hold has expired. Rebook it from the package page.');
        }

        $currency = $booking->currency ?: 'USD';
        $reference = 'TFE-'.$booking->id.'-'.Str::upper(Str::random(10));

        if ($this->paystack->demo()) {
            $this->settle($booking, $reference, $balance, $currency, 'demo');

            return redirect()->route('fan.bookings.show', $booking)
                ->with('success', 'Demo payment recorded — your booking is confirmed.');
        }

        if (! $this->paystack->enabled() || ! $this->paystack->supports($currency)) {
            return back()->with('error', 'Online payment is not available for this booking. Use the partner checkout link.');
        }

        Payment::create([
            'user_id' => $booking->user_id,
            'booking_id' => $booking->id,
            'amount' => $balance,
            'currency' => $currency,
            'payment_method' => 'paystack',
            'transaction_id' => $reference,
            'status' => 'pending',
        ]);

        try {
            $url = $this->paystack->initialize(
                Auth::user()->email, $balance, $currency, $reference,
                route('fan.bookings.pay.callback', $booking),
            );
        } catch (\Throwable $e) {
            Log::error('Paystack initialize failed: '.$e->getMessage());

            return back()->with('error', 'We could not reach the payment provider. Please try again.');
        }

        // Paystack's checkout is off-site; Inertia needs a full-page visit.
        return Inertia::location($url);
    }

    public function callback(Request $request, Booking $booking)
    {
        abort_unless($booking->user_id === Auth::id(), 403);

        $reference = (string) $request->query('reference', '');
        $payment = Payment::where('booking_id', $booking->id)
            ->where('transaction_id', $reference)
            ->first();

        if (! $payment) {
            return redirect()->route('fan.bookings.show', $booking)->with('error', 'Unknown payment reference.');
        }

        if ($payment->status === 'completed') {
            return redirect()->route('fan.bookings.show', $booking)->with('success', 'Payment already received.');
        }

        try {
            [$paid, $amount, $currency] = $this->paystack->verify($reference);
        } catch (\Throwable $e) {
            Log::error('Paystack verify failed: '.$e->getMessage());

            return redirect()->route('fan.bookings.show', $booking)
                ->with('error', 'We could not confirm the payment yet. Refresh in a minute.');
        }

        // The amount and currency must match what we asked for, or a tampered
        // checkout could settle a dear booking with a cheap payment.
        if (! $paid || $currency !== strtoupper($payment->currency) || $amount + 0.001 < (float) $payment->amount) {
            $payment->update(['status' => 'failed']);

            return redirect()->route('fan.bookings.show', $booking)->with('error', 'Payment was not completed.');
        }

        $this->settle($booking, $reference, (float) $payment->amount, $payment->currency, 'paystack', $payment);

        return redirect()->route('fan.bookings.show', $booking)->with('success', 'Payment received — your booking is confirmed.');
    }

    private function settle(Booking $booking, string $reference, float $amount, string $currency, string $method, ?Payment $payment = null): void
    {
        DB::transaction(function () use ($booking, $reference, $amount, $currency, $method, $payment) {
            if ($payment) {
                $payment->update(['status' => 'completed', 'paid_at' => now()]);
            } else {
                Payment::create([
                    'user_id' => $booking->user_id,
                    'booking_id' => $booking->id,
                    'amount' => $amount,
                    'currency' => $currency,
                    'payment_method' => $method,
                    'transaction_id' => $reference,
                    'status' => 'completed',
                    'paid_at' => now(),
                ]);
            }

            $paid = (float) $booking->amount_paid + $amount;
            $booking->update([
                'amount_paid' => $paid,
                'status' => $paid + 0.001 >= (float) $booking->total_amount ? 'confirmed' : 'pending_payment',
            ]);
        });
    }

    private function balance(Booking $booking): float
    {
        return round(max(0, (float) $booking->total_amount - (float) $booking->amount_paid), 2);
    }
}
