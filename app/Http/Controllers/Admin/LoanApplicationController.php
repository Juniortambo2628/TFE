<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoanApplicationController extends Controller
{
    public function index()
    {
        $loans = LoanApplication::with(['user', 'budget'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(function ($loan) {
                return [
                    'id' => $loan->id,
                    'user_name' => $loan->user->name ?? 'Unknown',
                    'budget_name' => $loan->budget->name ?? 'N/A',
                    'amount' => $loan->amount,
                    'status' => $loan->status,
                    'interest_rate' => $loan->interest_rate,
                    'created_at' => $loan->created_at->format('M d, Y'),
                ];
            });

        $stats = [
            'total' => LoanApplication::count(),
            'pending' => LoanApplication::where('status', 'PENDING')->count(),
            'approved' => LoanApplication::where('status', 'APPROVED')->count(),
            'total_amount' => LoanApplication::where('status', 'APPROVED')->sum('amount'),
        ];

        return Inertia::render('Admin/LoanApplications', [
            'loans' => $loans,
            'stats' => $stats,
        ]);
    }

    public function update(Request $request, LoanApplication $loanApplication)
    {
        $validated = $request->validate([
            'status' => 'required|in:APPROVED,REJECTED,PENDING',
            'notes' => 'nullable|string',
        ]);

        $loanApplication->update([
            'status' => $validated['status'],
        ]);

        $loanApplication->user->notify(new \App\Notifications\LoanStatusNotification($loanApplication));

        return back()->with('success', 'Loan application updated successfully');
    }

    public function destroy(LoanApplication $loanApplication)
    {
        $loanApplication->delete();

        return back()->with('success', 'Loan application deleted successfully');
    }
}
