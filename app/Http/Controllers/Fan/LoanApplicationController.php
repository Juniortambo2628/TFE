<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoanApplicationController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Hydrate each loan with its finance-partner brand block + budget
        // summary so the fan's "My financing" view can show who
        // underwrote what, and link back to that partner's hub.
        $loans = LoanApplication::query()
            ->where('user_id', $user->id)
            ->with(['financePartner.partnerProfile', 'budget'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (LoanApplication $l) {
                $partner = $l->financePartner;
                $profile = $partner?->partnerProfile;

                return [
                    'id' => $l->id,
                    'reference_id' => 'LOAN-'.str_pad($l->id, 6, '0', STR_PAD_LEFT),
                    'amount' => (float) $l->amount,
                    'purpose' => $l->purpose,
                    'notes' => $l->notes,
                    'status' => $l->status,
                    'interest_rate' => $l->interest_rate,
                    'created_at' => $l->created_at?->toIso8601String(),
                    'updated_at' => $l->updated_at?->toIso8601String(),
                    'partner' => $profile ? [
                        'slug' => $profile->slug,
                        'display_name' => $profile->display_name,
                        'logo_url' => $profile->logo_url,
                        'theme_accent' => $profile->theme_accent,
                        'verified' => $partner->verification_status === 'verified',
                    ] : null,
                    'budget' => $l->budget ? [
                        'id' => $l->budget->id,
                        'reference_id' => 'REQ-'.str_pad($l->budget->id, 6, '0', STR_PAD_LEFT),
                        'total_cost' => (float) $l->budget->total_cost,
                        'nights' => $l->budget->nights,
                    ] : null,
                ];
            });

        // Public finance partners the fan can direct-apply to when
        // they don't have a budget-attached path — mirrors the
        // BudgetCalculator payload shape.
        $financePartners = PartnerProfile::query()
            ->public()
            ->whereHas('user', fn ($u) => $u
                ->where('is_partner', true)
                ->where('partner_type', 'finance_partner'))
            ->with('user')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->user_id,
                'slug' => $p->slug,
                'display_name' => $p->display_name,
                'tagline' => $p->tagline,
                'logo_url' => $p->logo_url,
                'theme_accent' => $p->theme_accent,
                'verified' => $p->user->verification_status === 'verified',
            ])
            ->values();

        // Roll-up tiles for the hero row.
        $stats = [
            'total' => $loans->count(),
            'pending' => $loans->where('status', 'PENDING')->count(),
            'approved_amount' => $loans->whereIn('status', ['APPROVED', 'DISBURSED'])->sum('amount'),
            'disbursed_amount' => $loans->where('status', 'DISBURSED')->sum('amount'),
        ];

        return Inertia::render('Fan/LoanApplications', [
            'loans' => $loans,
            'financePartners' => $financePartners,
            'stats' => $stats,
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
