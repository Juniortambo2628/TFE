<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use App\Notifications\BookingPaidNotification;
use Illuminate\Support\Facades\DB;

/**
 * The ONE way a booking flips to paid (extracted Nov 2026 so the Paystack
 * callback, demo settlement and the Daraja STK callback cannot drift):
 * record the payment, advance amount_paid, set the booking's status from the
 * arithmetic (partial → still pending, full → confirmed), then notify.
 *
 * Amount is in the BOOKING's currency — `settles_amount` on the gateway row
 * already separates what was charged from what it cleared (Sprint 66).
 */
class BookingSettlement
{
    public function settle(Booking $booking, string $reference, float $amount, string $currency, string $method, ?Payment $payment = null): void
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

        $booking->user?->notify(new BookingPaidNotification($booking->fresh(), $amount, $currency));
    }
}
