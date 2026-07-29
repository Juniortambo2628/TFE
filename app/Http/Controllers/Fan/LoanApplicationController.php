<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoanApplicationController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $loans = LoanApplication::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Fan/LoanApplications', [
            'loans' => $loans,
            'auth' => ['user' => $user],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1000',
            'purpose' => 'required|string|max:500',
            'budget_id' => 'nullable|exists:budgets,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();

        if ($user->loanApplications()->where('status', 'PENDING')->exists()) {
            return back()->withErrors(['amount' => 'You already have a pending loan application.']);
        }

        LoanApplication::create([
            'user_id' => $user->id,
            'budget_id' => $validated['budget_id'] ?? null,
            'amount' => $validated['amount'],
            'purpose' => $validated['purpose'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'PENDING',
        ]);

        return back()->with('success', 'Loan application submitted successfully!');
    }

    public function destroy(LoanApplication $loanApplication)
    {
        if ($loanApplication->user_id !== Auth::id()) {
            abort(403);
        }

        if ($loanApplication->status !== 'PENDING') {
            return back()->withErrors(['error' => 'Only pending applications can be withdrawn.']);
        }

        $loanApplication->delete();

        return back()->with('success', 'Loan application withdrawn.');
    }
}
