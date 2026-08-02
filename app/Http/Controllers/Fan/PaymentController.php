<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Notifications\PaymentSuccessNotification;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Payment history
        $payments = Payment::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'description' => $payment->description ?? 'Payment',
                    'status' => $payment->status,
                    'method' => $payment->method ?? 'wallet',
                    'reference' => $payment->reference ?? $payment->id,
                    'created_at' => $payment->created_at->format('M d, Y'),
                ];
            });

        // Payment methods
        $paymentMethods = PaymentMethod::where('user_id', $user->id)
            ->get()
            ->map(function ($method) {
                return [
                    'id' => $method->id,
                    'type' => $method->type,
                    'display_name' => $method->display_name,
                    'is_default' => $method->is_default,
                ];
            });

        // Recent transactions
        $transactions = PaymentTransaction::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function ($txn) {
                return [
                    'id' => $txn->id,
                    'amount' => $txn->amount,
                    'currency' => $txn->currency,
                    'type' => $txn->type,
                    'method' => $txn->method,
                    'status' => $txn->status,
                    'reference' => $txn->reference,
                    'description' => $txn->description,
                    'created_at' => $txn->created_at->toIso8601String(),
                ];
            });

        // Stats (single query instead of three separate aggregates)
        $transactionStats = PaymentTransaction::where('user_id', $user->id)
            ->selectRaw('
                SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as total_paid,
                SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as pending,
                COUNT(*) as transactions
            ', ['completed', 'pending'])
            ->first();

        $stats = [
            'total_paid' => $transactionStats->total_paid,
            'pending' => $transactionStats->pending,
            'payment_methods' => $paymentMethods->count(),
            'transactions' => $transactionStats->transactions,
        ];

        return Inertia::render('Fan/Payments', [
            'payments' => $payments,
            'paymentMethods' => $paymentMethods,
            'transactions' => $transactions,
            'stats' => $stats,
        ]);
    }

    public function addPaymentMethod(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:mpesa,card',
            'phone_number' => 'required_if:type,mpesa|nullable|string',
        ]);

        $user = Auth::user();

        // Check if this is the first payment method
        $isFirst = PaymentMethod::where('user_id', $user->id)->count() === 0;

        PaymentMethod::create([
            'user_id' => $user->id,
            'type' => $validated['type'],
            'phone_number' => $validated['phone_number'] ?? null,
            'is_default' => $isFirst,
        ]);

        return back()->with('success', 'Payment method added successfully');
    }

    public function removePaymentMethod($id)
    {
        $method = PaymentMethod::where('user_id', Auth::id())->findOrFail($id);
        $method->delete();

        return back()->with('success', 'Payment method removed');
    }

    public function initiatePayment(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'method' => 'required|in:mpesa,stripe,paystack',
            'description' => 'nullable|string',
            'booking_id' => 'nullable|exists:bookings,id',
        ]);

        $user = Auth::user();
        $reference = PaymentTransaction::generateReference();

        $transaction = PaymentTransaction::create([
            'user_id' => $user->id,
            'amount' => $validated['amount'],
            'currency' => 'KES',
            'type' => 'deposit',
            'method' => $validated['method'] ?? 'paystack',
            'status' => 'pending',
            'reference' => $reference,
            'description' => $validated['description'] ?? 'Wallet top-up',
            'metadata' => ['booking_id' => $validated['booking_id'] ?? null],
        ]);

        // For M-Pesa, would initiate STK push here
        // For Stripe, would create payment intent here
        // For now, just return the pending transaction

        $data = [
            'reference' => $reference,
            'public_key' => config('services.paystack.public_key'),
            'status' => 'success',
            'message' => 'Payment initiated',
        ];

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json($data);
        }

        return back()
            ->with('success', 'Payment initiated. Reference: '.$reference)
            ->with('payment_reference', $reference)
            ->with('paystack_public_key', $data['public_key']);
    }

    public function verifyPayment(Request $request, PaystackService $paystack)
    {
        $validated = $request->validate([
            'reference' => 'required|string',
        ]);

        $result = $paystack->verifyTransaction($validated['reference']);

        if (($result['status'] ?? false) && ($result['data']['status'] ?? '') === 'success') {
            $txn = PaymentTransaction::where('reference', $validated['reference'])->first();

            if ($txn) {
                if ($txn->status !== 'completed') {
                    DB::transaction(function () use ($txn, $result) {
                        $txn->update([
                            'status' => 'completed',
                            'method' => $result['data']['channel'] ?? $txn->method,
                        ]);

                        // Credit Wallet / Create Payment Record
                        Payment::create([
                            'user_id' => $txn->user_id,
                            'amount' => $txn->amount,
                            'status' => 'completed',
                            'payment_method' => $result['data']['channel'] ?? 'paystack',
                            'transaction_id' => $txn->reference,
                            'description' => $txn->description,
                            'paid_at' => now(),
                        ]);

                        // Handle Booking Link
                        $metadata = $txn->metadata; // Already an array due to model casting
                        if (! empty($metadata['booking_id'])) {
                            $booking = Booking::find($metadata['booking_id']);
                            if ($booking) {
                                $booking->increment('amount_paid', $txn->amount);
                                if ($booking->amount_paid >= $booking->total_amount) {
                                    $booking->update(['status' => 'confirmed']);
                                }
                            }
                        }

                        // Send Notification & Email
                        $user = User::find($txn->user_id);
                        $user->notify(new PaymentSuccessNotification($txn));
                    });

                    return back()->with('success', 'Payment successful!');
                }

                return back()->with('info', 'Payment already processed.');
            }

            // Optional: Create transaction if missing (e.g. direct webhook)
            return back()->with('error', 'Transaction reference not found.');
        }

        return back()->with('error', 'Payment verification failed: '.($result['message'] ?? 'Unknown error'));
    }
}
