<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentTransaction::with('user');

        // Filter by status
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Filter by method
        if ($request->method) {
            $query->where('method', $request->method);
        }

        $transactions = $query->latest()
            ->paginate(20)
            ->through(function ($txn) {
                return [
                    'id' => $txn->id,
                    'user' => $txn->user?->name ?? 'Unknown',
                    'user_email' => $txn->user?->email,
                    'amount' => $txn->amount,
                    'currency' => $txn->currency,
                    'type' => $txn->type,
                    'method' => $txn->method,
                    'status' => $txn->status,
                    'reference' => $txn->reference,
                    'created_at' => $txn->created_at->format('M d, Y H:i'),
                ];
            });

        $stats = [
            'total_revenue' => PaymentTransaction::where('status', 'completed')->sum('amount'),
            'pending' => PaymentTransaction::where('status', 'pending')->count(),
            'completed' => PaymentTransaction::where('status', 'completed')->count(),
            'failed' => PaymentTransaction::where('status', 'failed')->count(),
        ];

        return Inertia::render('Admin/Payments', [
            'transactions' => $transactions,
            'stats' => $stats,
            'filters' => $request->only(['status', 'method']),
        ]);
    }

    public function updateStatus(Request $request, PaymentTransaction $paymentTransaction)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,completed,failed,cancelled',
        ]);

        $oldStatus = $paymentTransaction->status;
        $paymentTransaction->update(['status' => $validated['status']]);

        // If newly completed, trigger side effects
        if ($validated['status'] === 'completed' && $oldStatus !== 'completed') {
            $paymentTransaction->update(['paid_at' => now()]);

            // Update Booking if linked
            $metadata = $paymentTransaction->metadata;
            if (! empty($metadata['booking_id'])) {
                $booking = Booking::find($metadata['booking_id']);
                if ($booking) {
                    $booking->increment('amount_paid', $paymentTransaction->amount);
                    if ($booking->amount_paid >= $booking->total_amount) {
                        $booking->update(['status' => 'confirmed']);
                    }
                }
            }
        }

        return back()->with('success', 'Transaction status updated');
    }
}
