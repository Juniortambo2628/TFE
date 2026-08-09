<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Models\SavingsGoal;
use App\Models\PaymentTransaction;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $userId = $user->id;

        // Fetch Savings (Escrow)
        $savingsGoals = SavingsGoal::where('user_id', $userId)->get();
        $totalSavings = $savingsGoals->sum('current_amount');
        $totalTarget = $savingsGoals->sum('target_amount');

        // Fetch Loan Applications
        $loans = LoanApplication::where('user_id', $userId)->get();
        $approvedLoans = $loans->where('status', 'APPROVED')->sum('amount');

        // Fetch Transactions from PaymentTransaction (source of truth)
        $transactions = PaymentTransaction::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'type' => strtolower($tx->type),
                    'amount' => $tx->amount,
                    'description' => ucfirst($tx->type).' - '.($tx->status === 'pending' ? '(Pending)' : 'Completed'),
                    'date' => $tx->created_at->format('Y-m-d'),
                ];
            });

        $walletData = [
            'balance' => $totalSavings,
            'savings' => $totalSavings,
            'goalTarget' => $totalTarget > 0 ? $totalTarget : 500000,
            'loanBalance' => $approvedLoans,
            'transactions' => $transactions,
        ];

        return Inertia::render('Fan/Wallet', [
            'walletData' => $walletData,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }
}
