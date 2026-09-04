<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
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
        ]);
    }

    public function show(Budget $budget)
    {
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
            ],
        ]);
    }

    public function update(Request $request, Budget $budget)
    {
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

        return back()->with('success', 'Request updated successfully.');
    }

    public function requests(Request $request)
    {
        $data = $this->getRequestsData($request);

        return Inertia::render('Partner/Requests', [
            'requests' => $data,
        ]);
    }

    /**
     * Scope helper — Sprint 10 pivot. If the partner has published one
     * or more listings, only budgets whose fan picked one of those
     * listings show up in their queue. If not (legacy partners with no
     * published inventory yet), fall through to the historical global
     * queue so nothing goes dark mid-transition.
     */
    private function baseQuery(Request $request)
    {
        $partnerId = $request->user()->id;
        $listingIds = Listing::query()
            ->publishedBy(User::class, $partnerId)
            ->pluck('id');

        $q = Budget::query()->where('is_active', true);

        if ($listingIds->isNotEmpty()) {
            $q->whereIn('listing_id', $listingIds);
        }

        return $q;
    }

    private function getRequestsData(Request $request)
    {
        return $this->baseQuery($request)
            ->with('user.profile')
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
                ];
            });
    }
}
