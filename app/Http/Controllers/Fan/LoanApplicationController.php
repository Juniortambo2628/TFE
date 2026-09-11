<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Models\User;
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
            // Sprint 14 — finance partner routing. Nullable so the
            // "generic" application path still works (admin queue).
            // Must resolve to an actual finance_partner user.
            'finance_partner_id' => 'nullable|exists:users,id',
        ]);

        $user = Auth::user();

        if ($user->loanApplications()->where('status', 'PENDING')->exists()) {
            return back()->withErrors(['amount' => 'You already have a pending loan application.']);
        }

        // Reject bogus finance_partner_id: has to be a partner-type user
        // whose partner_type is finance_partner.
        $financePartnerId = null;
        if (! empty($validated['finance_partner_id'])) {
            $target = User::find($validated['finance_partner_id']);
            if ($target && $target->is_partner && $target->partner_type === 'finance_partner') {
                $financePartnerId = $target->id;
            }
        }

        LoanApplication::create([
            'user_id' => $user->id,
            'budget_id' => $validated['budget_id'] ?? null,
            'finance_partner_id' => $financePartnerId,
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
