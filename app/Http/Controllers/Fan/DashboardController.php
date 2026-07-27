<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        \Illuminate\Support\Facades\Log::info('Fan Dashboard Accessed', ['user_id' => $user->id, 'is_partner' => $user->is_partner]);

        if ($user->is_partner) {
            return redirect()->route('partner.dashboard');
        }

        $userId = $user->id;

        // Fetch Summary Data (use DB-level aggregation to avoid loading all records)
        $activeBudget = \App\Models\Budget::where('user_id', $userId)->where('is_active', true)->first();
        $totalBookings = \App\Models\Booking::where('user_id', $userId)->count();

        $totalPaid = \App\Models\PaymentTransaction::where('user_id', $userId)
            ->where('status', 'completed')->sum('amount');
        $totalDue = \App\Models\PaymentSchedule::where('user_id', $userId)
            ->where('status', 'pending')->sum('amount');
        $completedPaymentsCount = \App\Models\PaymentTransaction::where('user_id', $userId)
            ->where('status', 'completed')->count();
        $installmentsCount = \App\Models\PaymentSchedule::where('user_id', $userId)->count();

        $stats = [
            'bookings' => $totalBookings,
            'paid' => $totalPaid,
            'due' => $totalDue,
            'payments_count' => $completedPaymentsCount,
            'installments_count' => $installmentsCount,
            'joined_tribes_count' => \App\Models\TribeMember::where('user_id', $userId)->count(),
        ];

        // Fetch recent successful transactions (only the needed records)
        $recentPayments = \App\Models\PaymentTransaction::where('user_id', $userId)
            ->where('status', 'completed')
            ->orderByDesc('created_at')
            ->take(5)
            ->get();

        // Fetch recent bookings
        $recentBookings = \App\Models\Booking::where('user_id', $userId)->orderBy('created_at', 'desc')->take(5)->get();

        // Prepare Activity Feed
        $activities = collect([]);
        foreach ($recentPayments as $payment) {
            $activities->push([
                'id' => 'pay_'.$payment->id,
                'type' => 'payment',
                'title' => 'Payment Completed',
                'description' => 'Payment via '.strtoupper($payment->method ?? 'Paystack'),
                'date' => $payment->created_at->format('M d, Y'),
                'amount' => $payment->amount,
                'timestamp' => $payment->created_at->timestamp,
            ]);
        }
        foreach ($recentBookings as $booking) {
            $activities->push([
                'id' => 'book_'.$booking->id,
                'type' => 'booking',
                'title' => 'Booking Confirmed',
                'description' => ($booking->package_type ?? ucfirst($booking->service_type) ?? 'Travel').' Booking',
                'date' => $booking->created_at->format('M d, Y'),
                'amount' => $booking->total_amount ?? $booking->cost ?? 0,
                'timestamp' => $booking->created_at->timestamp,
            ]);
        }
        $activities = $activities->sortByDesc('timestamp')->values()->take(5);

        return Inertia::render('Fan/Dashboard', [
            'activeBudget' => $activeBudget,
            'stats' => $stats,
            'recentPayments' => $recentPayments,
            'recentBookings' => $recentBookings,
            'activities' => $activities,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }
}
