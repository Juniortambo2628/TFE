<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\User;
use App\Services\FixtureService;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Partner-side Publish tab.
 *
 * Partners author listings under their own publisher_type/id. New rows
 * start as `draft`; hitting "Submit for review" flips to `pending` and
 * admin sees it in the approval queue. Approved rows appear on the
 * partner's public hub and in the fan discovery grid.
 */
class ListingController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $listings = Listing::query()
            ->publishedBy(User::class, $user->id)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Listing $l) => $this->transform($l));

        return Inertia::render('Partner/Listings', [
            'listings' => $listings,
            'tournaments' => app(TournamentService::class)->all(),
            'status_counts' => [
                'draft' => $listings->where('moderation_status', 'draft')->count(),
                'pending' => $listings->where('moderation_status', 'pending')->count(),
                'approved' => $listings->where('moderation_status', 'approved')->count(),
                'rejected' => $listings->where('moderation_status', 'rejected')->count(),
            ],
        ]);
    }

    public function fixtures(Request $request)
    {
        $tournamentId = $request->query('tournament_id');
        if (! $tournamentId) {
            return response()->json(['fixtures' => [], 'venues' => []]);
        }
        $fixtures = app(FixtureService::class)->getFixtures($tournamentId);
        $venues = collect($fixtures)->pluck('venue')->filter()->unique()->values()->toArray();

        return response()->json(['fixtures' => $fixtures, 'venues' => $venues]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateRequest($request);
        $user = $request->user();

        if ($request->hasFile('hero_image_file')) {
            $validated['hero_image'] = Storage::url(
                $request->file('hero_image_file')->store('listings', 'public')
            );
        }

        // Partner-authored: publisher is the partner, moderation starts as draft.
        $validated['publisher_type'] = User::class;
        $validated['publisher_id'] = $user->id;
        $validated['created_by'] = $user->id;
        $validated['moderation_status'] = $validated['moderation_status'] ?? 'draft';
        $validated['is_active'] = $validated['is_active'] ?? false;
        $validated['is_featured'] = false; // partners cannot self-feature

        $listing = Listing::create($validated);

        return back()->with('success', "Listing '{$listing->name}' saved as {$listing->moderation_status}.");
    }

    public function update(Request $request, Listing $listing)
    {
        $this->authorizeOwnership($request, $listing);

        $validated = $this->validateRequest($request, $listing);

        if ($request->hasFile('hero_image_file')) {
            $validated['hero_image'] = Storage::url(
                $request->file('hero_image_file')->store('listings', 'public')
            );
        }

        // A rejected listing that the partner edits and resubmits goes
        // back to pending; a draft they toggle "submit for review" on
        // does the same. Approved edits stay approved but re-enter the
        // queue if the partner explicitly resubmits.
        if (($validated['moderation_status'] ?? null) === 'pending') {
            $validated['submitted_at'] = now();
        }

        $validated['is_featured'] = $listing->is_featured; // preserve admin's flag

        $listing->update($validated);

        return back()->with('success', 'Listing updated.');
    }

    public function destroy(Request $request, Listing $listing)
    {
        $this->authorizeOwnership($request, $listing);
        $listing->delete();

        return back()->with('success', 'Listing removed.');
    }

    /**
     * Flip a draft/rejected listing to pending — the "Submit for review"
     * button on the row. Kept as its own endpoint so the row action is a
     * single POST without needing the full edit payload.
     */
    public function submit(Request $request, Listing $listing)
    {
        $this->authorizeOwnership($request, $listing);

        if (! in_array($listing->moderation_status, ['draft', 'rejected'], true)) {
            return back()->with('error', 'Listing is already submitted or approved.');
        }

        $listing->update([
            'moderation_status' => 'pending',
            'submitted_at' => now(),
        ]);

        return back()->with('success', 'Listing submitted for admin review.');
    }

    protected function authorizeOwnership(Request $request, Listing $listing): void
    {
        if ($listing->publisher_type !== User::class || $listing->publisher_id !== $request->user()->id) {
            abort(403, 'This listing does not belong to you.');
        }
    }

    protected function transform(Listing $l): array
    {
        $tCfg = $l->tournament_id ? config("tournaments.tournaments.{$l->tournament_id}") : null;

        return [
            'id' => $l->id,
            'type' => $l->type,
            'name' => $l->name,
            'slug' => $l->slug,
            'description' => $l->description,
            'hero_image' => $l->hero_image,
            'base_price' => $l->base_price,
            'currency' => $l->currency,
            'included_match_ids' => $l->included_match_ids ?? [],
            'included_venues' => $l->included_venues ?? [],
            'nights' => $l->nights,
            'flight_class' => $l->flight_class,
            'accommodation_level' => $l->accommodation_level,
            'capacity' => $l->capacity,
            'sold_count' => $l->sold_count,
            'seats_left' => $l->seats_left,
            'availability_pct' => $l->availability_pct,
            'is_sold_out' => $l->is_sold_out,
            'is_active' => $l->is_active,
            'is_featured' => $l->is_featured,
            'moderation_status' => $l->moderation_status,
            'moderation_notes' => $l->moderation_notes,
            'submitted_at' => $l->submitted_at?->format('M d, Y'),
            'updated_at' => $l->updated_at?->format('M d, Y'),
            'tournament_id' => $l->tournament_id,
            'tournament_name' => $tCfg['short_name'] ?? $tCfg['name'] ?? $l->tournament_id,
        ];
    }

    private function validateRequest(Request $request, ?Listing $listing = null): array
    {
        $tournamentIds = array_keys(config('tournaments.tournaments', []));

        return $request->validate([
            'tournament_id' => 'required|string|in:'.implode(',', $tournamentIds),
            'type' => 'nullable|string|in:package,offer,event,tour',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'hero_image' => 'nullable|string',
            'hero_image_file' => 'nullable|image|max:5120',
            'base_price' => 'required|numeric|min:0',
            'currency' => 'required|string|max:8',
            'included_match_ids' => 'nullable|array',
            'included_match_ids.*' => 'string',
            'included_venues' => 'nullable|array',
            'included_venues.*' => 'string',
            'nights' => 'required|integer|min:1|max:60',
            'flight_class' => 'required|string|in:economy,business,first',
            'accommodation_level' => 'required|string',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
            'moderation_status' => 'nullable|string|in:draft,pending',
            'display_order' => 'nullable|integer|min:0',
        ]);
    }
}
