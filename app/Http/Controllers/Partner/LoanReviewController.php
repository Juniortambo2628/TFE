<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Notifications\LoanStatusNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Finance-partner loan review. Sits alongside DashboardController::show
 * (which handles travel-brief budgets) so the Partner/RequestView React
 * page can render either shape without a top-level route branch.
 *
 * Ownership: every action asserts the loan is actually routed to this
 * partner. A finance partner cannot even peek at another partner's
 * pipeline.
 */
class LoanReviewController extends Controller
{
    public function show(Request $request, LoanApplication $loanApplication)
    {
        $this->authorize($request, $loanApplication);
        $loanApplication->load(['user.profile', 'budget']);

        return Inertia::render('Partner/RequestView', [
            'variant' => 'finance',
            'loan' => [
                'id' => $loanApplication->id,
                'reference_id' => 'LOAN-'.str_pad($loanApplication->id, 6, '0', STR_PAD_LEFT),
                'created_at' => $loanApplication->created_at->format('Y-m-d H:i:s'),
                'amount' => (float) $loanApplication->amount,
                'purpose' => $loanApplication->purpose,
                'notes' => $loanApplication->notes,
                'status' => strtolower($loanApplication->status),
                'interest_rate' => $loanApplication->interest_rate,
                'applicant' => [
                    'name' => $loanApplication->user?->name,
                    'email' => $loanApplication->user?->email,
                ],
                'budget' => $loanApplication->budget ? [
                    'id' => $loanApplication->budget->id,
                    'reference_id' => 'REQ-'.str_pad($loanApplication->budget->id, 6, '0', STR_PAD_LEFT),
                    'total_cost' => (float) $loanApplication->budget->total_cost,
                    'nights' => $loanApplication->budget->nights,
                ] : null,
            ],
        ]);
    }

    public function update(Request $request, LoanApplication $loanApplication)
    {
        $this->authorize($request, $loanApplication);

        $validated = $request->validate([
            'status' => 'required|in:APPROVED,REJECTED,DISBURSED',
            'interest_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string|max:2000',
        ]);

        $loanApplication->update($validated);

        // Sprint 17 — notify the fan the decision landed. Loan needs
        // to be refreshed so LoanStatusNotification reads the new status.
        $loanApplication->refresh()->loadMissing('financePartner.partnerProfile');
        $loanApplication->user?->notify(new LoanStatusNotification($loanApplication));

        return back()->with('success', "Loan {$validated['status']} — applicant notified.");
    }

    protected function authorize(Request $request, LoanApplication $loanApplication): void
    {
        $user = $request->user();
        if ($user->partner_type !== 'finance_partner' || $loanApplication->finance_partner_id !== $user->id) {
            abort(403, 'This application is not routed to you.');
        }
    }
}
