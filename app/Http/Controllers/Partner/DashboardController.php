<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Listing;
use App\Models\LoanApplication;
use App\Models\TicketPurchase;
use App\Models\User;
use App\Notifications\BudgetResponseNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Sprint 14 — finance partners see a loan-shaped Convert queue,
        // not a travel-brief-shaped one. Everything else about the
        // partner surface stays the same.
        if ($request->user()->partner_type === 'finance_partner') {
            return $this->indexFinance($request);
        }

        // Sprint 56 — a ticketing partner sells seats; they have no travel
        // briefs at all, so the travel dashboard showed them five tiles that
        // are structurally zero and a queue that can never fill. (Until this
        // sprint it showed them every OTHER partner's briefs instead, which
        // is worse.) Their own numbers already exist behind
        // Partner\TicketController — this puts them on the front page.
        if ($request->user()->partner_type === 'ticketing_partner') {
            return $this->indexTicketing($request);
        }

        $scoped = $this->baseQuery($request);

        $stats = [
            'pending' => (clone $scoped)->where('partner_status', 'pending')->count(),
            'approved' => (clone $scoped)->where('partner_status', 'approved')->count(),
            'modified' => (clone $scoped)->where('partner_status', 'modified')->count(),
            'rejected' => (clone $scoped)->where('partner_status', 'rejected')->count(),
            'total_revenue' => (clone $scoped)->where('partner_status', 'approved')->sum('partner_cost') ?: 0,
        ];

        $requests = $this->getRequestsData($request);

        return Inertia::render('Partner/Dashboard', [
            'requests' => $requests,
            'stats' => $stats,
            'hasListings' => $this->hasListings($request->user()->id),
        ]);
    }

    /**
     * Finance-partner variant of the dashboard: shows loan applications
     * routed to this partner, not travel-briefs. Same page component,
     * different props — see Partner/Dashboard.jsx.
     */
    protected function indexFinance(Request $request)
    {
        $partnerId = $request->user()->id;
        $base = LoanApplication::query()->forPartner($partnerId);

        $stats = [
            'pending' => (clone $base)->where('status', 'PENDING')->count(),
            'approved' => (clone $base)->where('status', 'APPROVED')->count(),
            'modified' => 0, // shape-parity with travel partner stats
            'rejected' => (clone $base)->where('status', 'REJECTED')->count(),
            'total_revenue' => (clone $base)->where('status', 'APPROVED')->sum('amount') ?: 0,
        ];

        $requests = $this->loanRequestsData($partnerId);

        return Inertia::render('Partner/Dashboard', [
            'requests' => $requests,
            'stats' => $stats,
            'variant' => 'finance',
        ]);
    }

    /**
     * Ticketing-partner variant: seats and orders instead of briefs and
     * quotes. Same page component, different props — see
     * Partner/Dashboard.jsx.
     */
    protected function indexTicketing(Request $request)
    {
        $partnerId = $request->user()->id;

        // The same figures the Tickets page shows, from the same place, so
        // the two cannot drift.
        $stats = TicketController::statsFor($partnerId) + ['total_revenue' => 0];
        $stats['total_revenue'] = $stats['revenue'];

        $sales = TicketPurchase::query()
            ->whereHas('ticket', fn ($q) => $q->where('partner_id', $partnerId))
            ->with('ticket')
            ->orderByDesc('created_at')
            ->take(8)
            ->get();

        $requests = $sales->map(function (TicketPurchase $p) {
            return [
                'id' => $p->id,
                'reference_id' => $p->reference,
                'created_at' => $p->created_at->format('Y-m-d H:i'),
                'total_cost' => (float) $p->total,
                'partner_cost' => (float) $p->total,
                'status' => strtolower($p->status ?? 'paid'),
                'match_label' => $p->ticket
                    ? $p->ticket->home_team.' vs '.$p->ticket->away_team
                    : 'Match ticket',
                'quantity' => $p->quantity,
            ];
        })->values();

        return Inertia::render('Partner/Dashboard', [
            'requests' => $requests,
            'stats' => $stats,
            'variant' => 'ticketing',
            'hasListings' => $stats['listings'] > 0,
        ]);
    }

    protected function loanRequestsData(int $partnerId): Collection
    {
        return LoanApplication::query()
            ->forPartner($partnerId)
            ->with(['user.profile', 'budget'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (LoanApplication $l) {
                return [
                    'id' => $l->id,
                    'reference_id' => 'LOAN-'.str_pad($l->id, 6, '0', STR_PAD_LEFT),
                    'created_at' => $l->created_at->format('Y-m-d H:i'),
                    'total_cost' => (float) $l->amount,
                    'partner_cost' => (float) $l->amount,
                    'status' => strtolower($l->status),
                    'accommodation_level' => $l->purpose ?: 'General financing',
                    'flight_class' => null,
                    'nights' => null,
                    'match_count' => 0,
                    'matches' => [],
                    'applicant_name' => $l->user?->name,
                    'purpose' => $l->purpose,
                    'interest_rate' => $l->interest_rate,
                ];
            });
    }

    public function show(Request $request, Budget $budget)
    {
        $this->authorizeBudget($request, $budget);

        return Inertia::render('Partner/RequestView', [
            'budget' => [
                'id' => $budget->id,
                'reference_id' => 'REQ-'.str_pad($budget->id, 6, '0', STR_PAD_LEFT),
                'created_at' => $budget->created_at->format('Y-m-d H:i:s'),
                'original_cost' => $budget->total_cost,
                'original_breakdown' => $budget->breakdown,
                'accommodation_level' => $budget->accommodation_level,
                'flight_class' => $budget->flight_class,
                'nights' => $budget->nights,
                'match_ids' => $budget->match_ids,
                'partner_status' => $budget->partner_status,
                'partner_cost' => $budget->partner_cost,
                'partner_breakdown' => $budget->partner_breakdown,
                'partner_notes' => $budget->partner_notes,
                'school_group' => $budget->schoolDeclaration?->toPartnerPayload(),
            ],
        ]);
    }

    public function update(Request $request, Budget $budget)
    {
        $this->authorizeBudget($request, $budget);

        $validated = $request->validate([
            'partner_cost' => 'required|numeric',
            'partner_breakdown' => 'required',
            'partner_notes' => 'nullable|string',
            'status' => 'required|in:approved,modified,rejected',
            'document' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120',
        ]);

        $breakdown = $validated['partner_breakdown'];
        if (is_string($breakdown)) {
            $breakdown = json_decode($breakdown, true);
        }

        $updateData = [
            'partner_cost' => $validated['partner_cost'],
            'partner_breakdown' => $breakdown,
            'partner_notes' => $validated['partner_notes'],
            'partner_status' => $validated['status'],
        ];

        if ($request->hasFile('document')) {
            $file = $request->file('document');
            $filename = time().'_'.$file->getClientOriginalName();
            $path = $file->storeAs('documents/partner', $filename, 'public');
            $updateData['partner_document'] = $path;
        }

        $budget->update($updateData);

        // Sprint 17 — notify the fan a partner responded to their brief.
        $budget->refresh()->user?->notify(new BudgetResponseNotification($budget));

        return back()->with('success', 'Request updated successfully.');
    }

    public function requests(Request $request)
    {
        if ($request->user()->partner_type === 'finance_partner') {
            return Inertia::render('Partner/Requests', [
                'requests' => $this->loanRequestsData($request->user()->id),
                'variant' => 'finance',
            ]);
        }

        $data = $this->getRequestsData($request);

        return Inertia::render('Partner/Requests', [
            'requests' => $data,
            'hasListings' => $this->hasListings($request->user()->id),
        ]);
    }

    /**
     * Scope helper — a partner's queue is the briefs whose fan picked one of
     * THEIR listings. Nothing else.
     *
     * Sprint 10 added a fallback: a partner with no published listings saw
     * every active budget on the platform, so nothing went dark "mid
     * transition". Six sprints later that transition is over and the
     * fallback had become a leak — the seeded ticketing partner publishes no
     * listings, so signing in as one showed every fan's travel brief, with
     * platform-wide totals on the dashboard tiles presented as that
     * partner's own numbers, and every brief openable and editable through
     * show()/update(). A partner with no listings now has an empty queue,
     * which is the truth, and the page says how to fill it.
     */
    private function baseQuery(Request $request)
    {
        return $this->scopeForPartner($request->user()->id);
    }

    private function scopeForPartner(int $partnerId)
    {
        $listingIds = Listing::query()
            ->publishedBy(User::class, $partnerId)
            ->pluck('id');

        return Budget::query()
            ->where('is_active', true)
            ->whereIn('listing_id', $listingIds);
    }

    /**
     * A partner may only open a brief that is in their own queue.
     *
     * There was no check at all here: route-model binding took any budget id
     * and show()/update() served it, so any signed-in partner could read a
     * competitor's brief — fan itinerary, costs, notes — and overwrite its
     * quote, which then notified the fan. Mirrors
     * LoanReviewController's ownership guard.
     */
    private function authorizeBudget(Request $request, Budget $budget): void
    {
        $owned = $this->scopeForPartner($request->user()->id)
            ->whereKey($budget->getKey())
            ->exists();

        if (! $owned) {
            abort(403, 'This request is not in your queue.');
        }
    }

    /** Does this partner have anything published for fans to pick? */
    private function hasListings(int $partnerId): bool
    {
        return Listing::query()->publishedBy(User::class, $partnerId)->exists();
    }

    private function getRequestsData(Request $request)
    {
        return $this->baseQuery($request)
            ->with('user.profile', 'schoolDeclaration')
            ->whereIn('partner_status', ['pending', 'modified', 'approved', 'rejected'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($budget) {
                return [
                    'id' => $budget->id,
                    'reference_id' => $budget->reference_id,
                    'created_at' => $budget->created_at->format('Y-m-d H:i'),
                    'total_cost' => $budget->total_cost,
                    'status' => $budget->partner_status,
                    'accommodation_level' => $budget->accommodation_level,
                    'flight_class' => $budget->flight_class,
                    'nights' => $budget->nights,
                    'match_count' => count($budget->match_ids ?? []),
                    'partner_cost' => $budget->partner_cost,
                    'matches' => $budget->match_ids,
                    // A school group carries its declaration to the queue,
                    // so `involves_minors` is visible BEFORE the partner
                    // opens the brief. Knowing minors travel and not saying
                    // so is TFE's failure, not the school's.
                    'school_group' => $budget->schoolDeclaration?->toPartnerPayload(),
                ];
            });
    }
}
