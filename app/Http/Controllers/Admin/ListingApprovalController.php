<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\User;
use App\Notifications\ListingModerationNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Admin listing safety surface — reports & takedowns.
 *
 * Sprint 42 gave partners self-publish; there is no "pending queue" any
 * more. This controller now lists every live partner-authored listing and
 * lets admin take one down for policy violations (mandatory notes), or
 * re-publish something that was previously taken down. Bulk approve is
 * gone; bulk takedown stays for coordinated actions.
 */
class ListingApprovalController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'live');
        $statusColumn = match ($status) {
            'taken_down' => 'rejected',
            'live' => 'approved',
            default => $status,
        };

        $listings = Listing::query()
            ->where('publisher_type', User::class)
            ->where('moderation_status', $statusColumn)
            ->when($status === 'live', fn ($q) => $q->where('is_active', true))
            ->with('publisher')
            ->orderByDesc('updated_at')
            ->get()
            ->map(function (Listing $l) {
                $tCfg = $l->tournament_id ? config("tournaments.tournaments.{$l->tournament_id}") : null;
                $publisher = $l->publisher;

                return [
                    'id' => $l->id,
                    'name' => $l->name,
                    'type' => $l->type,
                    'description' => $l->description,
                    'base_price' => $l->base_price,
                    'currency' => $l->currency,
                    'hero_image' => $l->hero_image,
                    'moderation_status' => $l->moderation_status,
                    'moderation_notes' => $l->moderation_notes,
                    'is_active' => (bool) $l->is_active,
                    'updated_at' => $l->updated_at?->format('M d, Y H:i'),
                    'tournament_id' => $l->tournament_id,
                    'tournament_name' => $tCfg['short_name'] ?? $tCfg['name'] ?? $l->tournament_id,
                    'publisher_id' => $l->publisher_id,
                    'publisher_name' => $publisher?->name,
                    'publisher_email' => $publisher?->email,
                    'publisher_verified' => $publisher?->verification_status === 'verified',
                ];
            });

        return Inertia::render('Admin/ListingApprovals', [
            'listings' => $listings,
            'filter_status' => $status,
            'counts' => [
                'live' => Listing::where('publisher_type', User::class)
                    ->where('moderation_status', 'approved')->where('is_active', true)->count(),
                'taken_down' => Listing::where('publisher_type', User::class)
                    ->where('moderation_status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Restore a previously taken-down listing (or re-publish a partner
     * that came back into compliance).
     */
    public function approve(Request $request, Listing $listing)
    {
        $listing->update([
            'moderation_status' => 'approved',
            'moderation_notes' => $request->input('notes'),
            'is_active' => true,
        ]);

        $listing->publisher?->notify(new ListingModerationNotification($listing, 'approved'));

        return back()->with('success', "'{$listing->name}' restored — live again.");
    }

    /**
     * Take a live listing down. Notes are required — the partner needs
     * to know exactly what to change.
     */
    public function reject(Request $request, Listing $listing)
    {
        $validated = $request->validate([
            'notes' => 'required|string|max:2000',
        ]);

        $listing->update([
            'moderation_status' => 'rejected',
            'moderation_notes' => $validated['notes'],
            'is_active' => false,
        ]);

        $listing->publisher?->notify(new ListingModerationNotification($listing, 'rejected'));

        return back()->with('success', "'{$listing->name}' taken down. Partner notified.");
    }

    /**
     * Bulk takedown — one round of feedback across a themed set of
     * violations (spam wave, banned merchant type, etc).
     */
    public function bulkReject(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:200',
            'ids.*' => 'integer',
            'notes' => 'required|string|max:2000',
        ]);

        $listings = Listing::query()
            ->whereIn('id', $validated['ids'])
            ->where('publisher_type', User::class)
            ->where('moderation_status', 'approved')
            ->with('publisher')
            ->get();

        DB::transaction(function () use ($listings, $validated) {
            foreach ($listings as $listing) {
                $listing->update([
                    'moderation_status' => 'rejected',
                    'moderation_notes' => $validated['notes'],
                    'is_active' => false,
                ]);
                $listing->publisher?->notify(new ListingModerationNotification($listing, 'rejected'));
            }
        });

        $updated = $listings->count();
        $requested = count($validated['ids']);
        $skipped = $requested - $updated;
        $msg = "Took down {$updated} listing".($updated === 1 ? '' : 's').'.';
        if ($skipped > 0) {
            $msg .= " ({$skipped} skipped — no longer live)";
        }

        return back()->with('success', $msg);
    }
}
