<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index()
    {
        $bookings = Booking::with('user')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(function ($booking) {
                return [
                    'id' => $booking->id,
                    'user_name' => $booking->user->name ?? 'Unknown',
                    'package_name' => $booking->package_name,
                    'package_type' => $booking->package_type,
                    'status' => $booking->status,
                    'total_amount' => $booking->total_amount,
                    'amount_paid' => $booking->amount_paid,
                    'booking_date' => $booking->booking_date ? $booking->booking_date->format('M d, Y') : null,
                    'created_at' => $booking->created_at->format('M d, Y'),
                ];
            });

        $stats = [
            'total' => Booking::count(),
            'pending' => Booking::where('status', 'pending')->count(),
            'confirmed' => Booking::where('status', 'confirmed')->count(),
            'total_revenue' => Booking::sum('amount_paid'),
        ];

        return Inertia::render('Admin/Bookings', [
            'bookings' => $bookings,
            'stats' => $stats,
        ]);
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,confirmed,cancelled,completed',
        ]);

        $booking->update($validated);

        return back()->with('success', 'Booking status updated successfully');
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();

        return back()->with('success', 'Booking deleted successfully');
    }

    public function show(Booking $booking)
    {
        $booking->load('user', 'paymentSchedules');

        return Inertia::render('Admin/BookingDetail', [
            'booking' => [
                'id' => $booking->id,
                'user_name' => $booking->user->name ?? 'Unknown',
                'package_name' => $booking->package_name,
                'package_type' => $booking->package_type,
                'status' => $booking->status,
                'total_amount' => $booking->total_amount,
                'amount_paid' => $booking->amount_paid,
                'booking_date' => $booking->booking_date?->format('M d, Y'),
                'created_at' => $booking->created_at->format('M d, Y'),
                'payment_schedules' => $booking->paymentSchedules->map(fn($s) => [
                    'id' => $s->id,
                    'amount' => $s->amount,
                    'due_date' => $s->due_date->format('M d, Y'),
                    'status' => $s->status,
                ]),
            ],
        ]);
    }
}
