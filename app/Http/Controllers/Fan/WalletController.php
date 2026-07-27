<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $userId = $user->id;

        // Fetch Savings (Escrow)
        $savingsGoals = \App\Models\SavingsGoal::where('user_id', $userId)->get();
        $totalSavings = $savingsGoals->sum('current_amount');
        $totalTarget = $savingsGoals->sum('target_amount');

        // Fetch Loan Applications
        $loans = \App\Models\LoanApplication::where('user_id', $userId)->get();
        $approvedLoans = $loans->where('status', 'APPROVED')->sum('amount');

        // Fetch Transactions
        $transactions = \App\Models\Transaction::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'type' => strtolower($tx->type), // deposit, withdrawal
                    'amount' => $tx->amount,
                    'description' => $tx->type.' - '.($tx->status === 'PENDING' ? '(Pending)' : 'Completed'),
                    'date' => $tx->created_at->format('Y-m-d'),
                ];
            });

        $walletData = [
            'balance' => $totalSavings, // Balance usually equals savings in this context
            'savings' => $totalSavings,
            'goalTarget' => $totalTarget > 0 ? $totalTarget : 500000, // Default target if none
            'loanBalance' => $approvedLoans,
            'transactions' => $transactions,
        ];

        return Inertia::render('Fan/Wallet', [
            'walletData' => $walletData,
            'auth' => [
                'user' => $user, // Pass minimal user if needed, but 'auth' prop usually handled globally
            ],
        ]);
    }
}
