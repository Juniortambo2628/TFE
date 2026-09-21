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
 * Partners author listings under their own publisher_type/id. There is no
 * admin review step — a saved listing goes live immediately (approved), and
 * the partner controls whether it's visible to fans via the `is_active`
 * (Published / Hidden) toggle.
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
            'partner_type' => $user->partner_type,
            'status_counts' => [
                'total' => $listings->count(),
                'published' => $listings->where('is_active', true)->count(),
                'hidden' => $listings->where('is_active', false)->count(),
                'sold_out' => $listings->where('is_sold_out', true)->count(),
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

        // Partner-authored: publisher is the partner. No review step — the
        // listing is approved on save and goes live unless the partner chose
        // to keep it hidden (is_active=false).
        $validated['publisher_type'] = User::class;
        $validated['publisher_id'] = $user->id;
        $validated['created_by'] = $user->id;
        $validated['moderation_status'] = 'approved';
        $validated['submitted_at'] = now();
        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['is_featured'] = false; // partners cannot self-feature

        $listing = Listing::create($validated);

        $state = $listing->is_active ? 'published' : 'saved as hidden';

        return back()->with('success', "Listing '{$listing->name}' {$state}.");
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

        // No review step: a partner's edits stay live (approved). Visibility
        // is the partner's own is_active toggle.
        $validated['moderation_status'] = 'approved';
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
     * Flip a listing between Published (is_active=true) and Hidden. Single
     * POST from the row action — no review step involved.
     */
    public function toggle(Request $request, Listing $listing)
    {
        $this->authorizeOwnership($request, $listing);

        $listing->update([
            'is_active' => ! $listing->is_active,
            'moderation_status' => 'approved',
        ]);

        return back()->with('success', $listing->is_active ? 'Listing published.' : 'Listing hidden.');
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
            'type' => 'required|string|in:package,offer,event,tour',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'hero_image' => 'nullable|string',
            // Sprint 22 — restrict to raster formats. Laravel's `image`
            // rule accepts SVG, which allows stored XSS via <script>
            // when the file URL is opened directly (same-origin storage).
            'hero_image_file' => 'nullable|mimes:jpg,jpeg,png,webp|max:5120',
            'base_price' => 'required|numeric|min:0',
            'currency' => 'required|string|max:8',
            'included_match_ids' => 'nullable|array',
            'included_match_ids.*' => 'string',
            'included_venues' => 'nullable|array',
            'included_venues.*' => 'string',
            // Package/tour-only trip fields — optional for offer/event so a
            // finance/airline/betting listing isn't forced to fill them.
            'nights' => 'nullable|required_if:type,package,tour|integer|min:1|max:60',
            'flight_class' => 'nullable|required_if:type,package|string|in:economy,business,first',
            'accommodation_level' => 'nullable|required_if:type,package|string',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
            'display_order' => 'nullable|integer|min:0',
        ]);
    }
}
