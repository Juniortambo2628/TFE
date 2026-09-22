<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Listing;
use App\Models\LoanApplication;
use App\Models\PartnerProfile;
use App\Models\User;
use App\Traits\ResolvesTournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoanApplicationController extends Controller
{
    use ResolvesTournament;

    public function index()
    {
        $user = Auth::user();
        $tournamentId = $this->activeTournamentId();

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
                        // Sprint 30 — the linked budget can be in a currency
                        // other than USD (Sprint 28); ship the code so the
                        // "Attached to REQ-…" line renders in the currency
                        // the fan built it in, not the platform default.
                        'currency' => $l->budget->currency ?? 'USD',
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

        // Sprint 43 — partner-published financing "packages" (Listings of
        // type `offer` whose publisher is a finance_partner user). Filter
        // to approved+active for the fan-facing surface, and scope to the
        // active tournament so the grid tracks what the fan is planning
        // for. Empty list is fine — the section then falls back to the
        // request-financing CTA.
        $offerings = Listing::query()
            ->active()
            ->approved()
            ->forTournament($tournamentId)
            ->whereHasMorph('publisher', [User::class], fn ($q) => $q
                ->where('is_partner', true)
                ->where('partner_type', 'finance_partner'))
            ->with('publisher.partnerProfile')
            ->orderByDesc('is_featured')
            ->orderBy('display_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Listing $l) => [
                'id' => $l->id,
                'name' => $l->name,
                'description' => $l->description,
                'hero_image' => $l->hero_image,
                'base_price' => (float) $l->base_price,
                'currency' => $l->currency,
                'is_sold_out' => $l->is_sold_out,
                'publisher' => $l->publisherSummary(),
            ])
            ->values();

        // Sprint 43 — the wizard needs the fan's completed budgets so
        // "Request financing against your budget" can pre-fill amount,
        // currency and reference. Scope to the active tournament and
        // ship a compact payload.
        $savedBudgets = Budget::query()
            ->where('user_id', $user->id)
            ->where('tournament_id', $tournamentId)
            ->orderByDesc('is_active')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Budget $b) => [
                'id' => $b->id,
                'reference_id' => 'REQ-'.str_pad($b->id, 6, '0', STR_PAD_LEFT),
                'name' => $b->name,
                'total_cost' => (float) $b->total_cost,
                'currency' => $b->currency ?? 'USD',
                'nights' => $b->nights,
                'is_active' => (bool) $b->is_active,
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
            'offerings' => $offerings,
            'savedBudgets' => $savedBudgets,
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
            // Sprint 43 — wizard captures explicit consent to share the
            // fan's contact + budget details with the finance partner.
            // `sometimes|accepted` so the rule only runs when the wizard
            // sends it — the older FinanceThisTrip CTA and existing tests
            // POST without a consent field and must still pass.
            'consent' => 'sometimes|accepted',
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
