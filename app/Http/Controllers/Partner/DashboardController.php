<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'pending' => Budget::where('is_active', true)->where('partner_status', 'pending')->count(),
            'approved' => Budget::where('is_active', true)->where('partner_status', 'approved')->count(),
            'modified' => Budget::where('is_active', true)->where('partner_status', 'modified')->count(),
            'rejected' => Budget::where('is_active', true)->where('partner_status', 'rejected')->count(),
            'total_revenue' => Budget::where('is_active', true)->where('partner_status', 'approved')->sum('partner_cost') ?: 0,
        ];

        $requests = $this->getRequestsData();

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

    public function requests()
    {
        $data = $this->getRequestsData();

        return Inertia::render('Partner/Requests', [
            'requests' => $data,
        ]);
    }

    private function getRequestsData()
    {
        return Budget::with('user.profile')
            ->where('is_active', true)
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
