<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\PartnerController as AdminPartnerController;
use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Models\PartnerProfile;
use App\Models\User;
use App\Notifications\LoanStatusNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Admin oversight for every loan application on the platform. Sprint 25
 * updated this page for the finance-partner archetype: hydrates the
 * finance partner brand block onto each row, exposes a status filter,
 * and a finance-partner filter chip row so admin can see routing at a
 * glance ("how much did Ecobank underwrite this month?").
 */
class LoanApplicationController extends Controller
{
    public function index(Request $request)
    {
        $filterStatus = $request->query('status');
        $filterPartnerId = $request->query('finance_partner_id');

        $base = LoanApplication::query()
            ->with(['user', 'budget', 'financePartner.partnerProfile'])
            ->when($filterStatus && in_array($filterStatus, ['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED'], true),
                fn ($q) => $q->where('status', $filterStatus))
            ->when($filterPartnerId === 'unrouted',
                fn ($q) => $q->whereNull('finance_partner_id'))
            ->when($filterPartnerId && $filterPartnerId !== 'unrouted',
                fn ($q) => $q->where('finance_partner_id', $filterPartnerId));

        $loans = $base->orderByDesc('created_at')
            ->paginate(15)
            ->through(function (LoanApplication $loan) {
                $profile = $loan->financePartner?->partnerProfile;

                return [
                    'id' => $loan->id,
                    'reference_id' => 'LOAN-'.str_pad($loan->id, 6, '0', STR_PAD_LEFT),
                    'user_name' => $loan->user?->name ?? 'Unknown',
                    'user_email' => $loan->user?->email,
                    'budget_id' => $loan->budget?->id,
                    'budget_reference' => $loan->budget
                        ? 'REQ-'.str_pad($loan->budget->id, 6, '0', STR_PAD_LEFT)
                        : null,
                    'amount' => (float) $loan->amount,
                    'purpose' => $loan->purpose,
                    'status' => $loan->status,
                    'interest_rate' => $loan->interest_rate,
                    'created_at' => $loan->created_at?->format('M d, Y'),
                    'partner' => $profile ? [
                        'id' => $loan->finance_partner_id,
                        'slug' => $profile->slug,
                        'display_name' => $profile->display_name,
                        'logo_url' => $profile->logo_url,
                        'theme_accent' => $profile->theme_accent,
                        'verified' => $loan->financePartner->verification_status === 'verified',
                    ] : null,
                ];
            });

        // Every finance partner with a public profile, for the filter
        // chips + admin "route this" UI.
        $financePartners = PartnerProfile::query()
            ->public()
            ->whereHas('user', fn ($u) => $u
                ->where('is_partner', true)
                ->where('partner_type', 'finance_partner'))
            ->with('user')
            ->orderBy('display_name')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->user_id,
                'display_name' => $p->display_name,
                'slug' => $p->slug,
                'theme_accent' => $p->theme_accent,
            ])
            ->values();

        $stats = [
            'total' => LoanApplication::count(),
            'pending' => LoanApplication::where('status', 'PENDING')->count(),
            'approved' => LoanApplication::where('status', 'APPROVED')->count(),
            'disbursed' => LoanApplication::where('status', 'DISBURSED')->count(),
            'total_amount' => LoanApplication::whereIn('status', ['APPROVED', 'DISBURSED'])->sum('amount'),
            'unrouted' => LoanApplication::whereNull('finance_partner_id')->count(),
        ];

        return Inertia::render('Admin/LoanApplications', [
            'loans' => $loans,
            'stats' => $stats,
            'finance_partners' => $financePartners,
            'partner_types' => AdminPartnerController::partnerTypes(),
            'filters' => [
                'status' => $filterStatus,
                'finance_partner_id' => $filterPartnerId,
            ],
        ]);
    }

    public function update(Request $request, LoanApplication $loanApplication)
    {
        $validated = $request->validate([
            'status' => 'required|in:APPROVED,REJECTED,PENDING,DISBURSED',
            'notes' => 'nullable|string',
            // Sprint 25 — admin can now (re)route an unrouted loan to a
            // finance partner from this page, e.g. an application that
            // came in before any finance partner existed. Nullable so
            // admin can also clear the routing.
            'finance_partner_id' => 'nullable|integer|exists:users,id',
        ]);

        $patch = ['status' => $validated['status']];
        if ($request->has('notes')) {
            $patch['notes'] = $validated['notes'];
        }
        if ($request->has('finance_partner_id')) {
            // Same guard as Fan/LoanApplicationController::store — only
            // accept an actual finance_partner user.
            $target = ! empty($validated['finance_partner_id'])
                ? User::find($validated['finance_partner_id'])
                : null;
            $patch['finance_partner_id'] = ($target && $target->is_partner && $target->partner_type === 'finance_partner')
                ? $target->id
                : null;
        }

        $loanApplication->update($patch);
        $loanApplication->user?->notify(new LoanStatusNotification($loanApplication->fresh()));

        return back()->with('success', 'Loan application updated successfully');
    }

    public function destroy(LoanApplication $loanApplication)
    {
        $loanApplication->delete();

        return back()->with('success', 'Loan application deleted successfully');
    }
}
