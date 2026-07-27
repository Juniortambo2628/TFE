<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\PaymentTransaction;
use App\Models\EventRsvp;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ActivityController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $userId = $user->id;

        // Fetch Bookings
        $bookings = Booking::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => 'booking_' . $booking->id,
                    'type' => 'booking',
                    'title' => 'New Booking: ' . $booking->package_name,
                    'description' => 'Status: ' . ucfirst($booking->status),
                    'amount' => $booking->total_amount,
                    'date' => $booking->created_at->format('M d, Y'),
                    'raw_date' => $booking->created_at,
                    'icon' => 'fa-ticket-alt'
                ];
            });

        // Fetch Payments
        $payments = PaymentTransaction::where('user_id', $userId)
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => 'payment_' . $payment->id,
                    'type' => 'payment',
                    'title' => $payment->description ?: 'Payment Successful',
                    'description' => 'Reference: ' . $payment->reference,
                    'amount' => $payment->amount,
                    'date' => $payment->created_at->format('M d, Y'),
                    'raw_date' => $payment->created_at,
                    'icon' => 'fa-credit-card'
                ];
            });

        // Fetch Event RSVPs
        $rsvps = EventRsvp::with('event')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($rsvp) {
                return [
                    'id' => 'rsvp_' . $rsvp->id,
                    'type' => 'rsvp',
                    'title' => 'Registered for ' . ($rsvp->event->title ?? 'Event'),
                    'description' => 'Status: ' . ucfirst($rsvp->status),
                    'amount' => 0,
                    'date' => $rsvp->created_at->format('M d, Y'),
                    'raw_date' => $rsvp->created_at,
                    'icon' => 'fa-calendar-check'
                ];
            });

        // Combine and Sort
        $activities = $bookings->concat($payments)->concat($rsvps)
            ->sortByDesc('raw_date')
            ->values();

        return Inertia::render('Fan/Activities', [
            'activities' => $activities
        ]);
    }
}
