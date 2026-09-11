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
 * Admin approval queue for partner-authored listings — Sprint 10.
 *
 * Sits alongside the existing admin/packages page (which manages
 * admin-authored inventory). Only listings whose publisher is a User
 * (i.e. a partner) reach this queue; admin-authored listings are
 * auto-approved and never surface here.
 */
class ListingApprovalController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'pending');

        $listings = Listing::query()
            ->where('publisher_type', User::class)
            ->when(in_array($status, ['pending', 'approved', 'rejected', 'draft'], true),
                fn ($q) => $q->where('moderation_status', $status))
            ->with('publisher')
            ->orderByDesc('submitted_at')
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
                    'nights' => $l->nights,
                    'flight_class' => $l->flight_class,
                    'accommodation_level' => $l->accommodation_level,
                    'capacity' => $l->capacity,
                    'included_venues' => $l->included_venues ?? [],
                    'included_match_ids' => $l->included_match_ids ?? [],
                    'hero_image' => $l->hero_image,
                    'moderation_status' => $l->moderation_status,
                    'moderation_notes' => $l->moderation_notes,
                    'submitted_at' => $l->submitted_at?->format('M d, Y H:i'),
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
                'pending' => Listing::where('publisher_type', User::class)->where('moderation_status', 'pending')->count(),
                'approved' => Listing::where('publisher_type', User::class)->where('moderation_status', 'approved')->count(),
                'rejected' => Listing::where('publisher_type', User::class)->where('moderation_status', 'rejected')->count(),
                'draft' => Listing::where('publisher_type', User::class)->where('moderation_status', 'draft')->count(),
            ],
        ]);
    }

    public function approve(Request $request, Listing $listing)
    {
        $listing->update([
            'moderation_status' => 'approved',
            'moderation_notes' => $request->input('notes'),
            'is_active' => true,
        ]);

        // Sprint 17 — notify the publisher partner.
        $listing->publisher?->notify(new ListingModerationNotification($listing, 'approved'));

        return back()->with('success', "'{$listing->name}' approved and now live.");
    }

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

        return back()->with('success', "'{$listing->name}' returned to partner with feedback.");
    }

    /**
     * Sprint 19 — bulk approve. Accepts an array of listing IDs and
     * approves each one, firing a ListingModerationNotification per
     * publisher so no partner is silently updated. Ignores IDs that
     * aren't partner-authored + pending — a race between two admins
     * shouldn't produce a 500.
     */
    public function bulkApprove(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:200',
            'ids.*' => 'integer',
        ]);

        // Eager-load publisher so the notify() loop below doesn't fire
        // an N+1 SELECT per row (Sprint 19 review finding).
        $listings = Listing::query()
            ->whereIn('id', $validated['ids'])
            ->where('publisher_type', User::class)
            ->whereIn('moderation_status', ['pending', 'draft', 'rejected'])
            ->with('publisher')
            ->get();

        // All-or-nothing at the DB level so a mid-loop failure doesn't
        // leave half the batch flipped + half the partners notified.
        // Notifications live in the same connection, so a rollback
        // wipes their inserts too.
        DB::transaction(function () use ($listings) {
            foreach ($listings as $listing) {
                $listing->update([
                    'moderation_status' => 'approved',
                    // Clear stale rejection feedback so the partner
                    // doesn't keep seeing "Add venues photo" attached
                    // to a newly-approved listing.
                    'moderation_notes' => null,
                    'is_active' => true,
                ]);
                $listing->publisher?->notify(new ListingModerationNotification($listing, 'approved'));
            }
        });

        return back()->with('success', $this->bulkFlash('Approved', $listings->count(), count($validated['ids'])));
    }

    /**
     * Sprint 19 — bulk reject. Notes are required and applied to every
     * listing in the batch (one round of feedback covers a themed set
     * of returns; per-listing notes are still done via the single
     * reject endpoint).
     */
    public function bulkReject(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:200',
            'ids.*' => 'integer',
            'notes' => 'required|string|max:2000',
        ]);

        // Include 'rejected' so admin can update prior feedback on
        // rows that are already returned — otherwise typing new notes
        // silently no-ops (Sprint 19 review finding).
        $listings = Listing::query()
            ->whereIn('id', $validated['ids'])
            ->where('publisher_type', User::class)
            ->whereIn('moderation_status', ['pending', 'draft', 'approved', 'rejected'])
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

        return back()->with('success', $this->bulkFlash('Returned', $listings->count(), count($validated['ids']), 'with feedback'));
    }

    /**
     * Format the bulk-action flash so the admin sees when some IDs
     * were skipped (e.g. another admin already acted, or a status
     * changed between selection and submit). Silent skips were a
     * Sprint 19 review finding.
     */
    protected function bulkFlash(string $verb, int $updated, int $requested, string $suffix = ''): string
    {
        $noun = 'listing'.($updated === 1 ? '' : 's');
        $msg = trim("{$verb} {$updated} {$noun} {$suffix}");
        if ($updated < $requested) {
            $skipped = $requested - $updated;
            $msg .= " ({$skipped} skipped — status changed since selection)";
        }

        return $msg.'.';
    }
}
