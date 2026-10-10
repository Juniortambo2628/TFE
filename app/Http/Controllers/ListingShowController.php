<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Services\PaystackService;
use App\Services\TournamentService;
use Inertia\Inertia;

/**
 * The PUBLIC page for a single listing (Sprint 63).
 *
 * Every listing on a public surface — the partner hub grid, a tournament
 * page's offerings — linked to `fan.packages.show`, which sits inside the
 * `auth` + `verified` fan group. So a visitor browsing a partner's public
 * hub clicked a package and was bounced to the login screen, which is the
 * worst possible moment to ask someone to make an account: before they have
 * seen what is on offer.
 *
 * This is the lightweight counterpart. `Fan\PackageController::show` stays
 * exactly as it is for signed-in fans — it loads the fixture list, a 3D
 * seat map per venue and an itinerary map, which is a lot of work to do for
 * somebody who is still deciding whether to care. This page renders what a
 * stranger needs to decide: what it is, when and where it runs, what it
 * costs, who is behind it, and how to act on it.
 *
 * Deliberately NOT cached and NOT tournament-context-dependent: a public
 * link must render the same thing for everyone who follows it, including
 * someone with no session at all.
 */
class ListingShowController extends Controller
{
    public function show(Listing $listing, TournamentService $tournaments)
    {
        // Only published listings are public, and 404 rather than 403 so the
        // response does not confirm that a draft or rejected id exists —
        // same reasoning as the fan-side gate (Sprint 22).
        abort_if(
            ($listing->moderation_status && $listing->moderation_status !== 'approved') || ! $listing->is_active,
            404,
        );

        $listing->load('publisher.partnerProfile');

        $publisher = $listing->publisherSummary();

        return Inertia::render('Listings/Show', [
            'listing' => [
                'id' => $listing->id,
                'name' => $listing->name,
                'type' => $listing->type,
                'description' => $listing->description,
                'hero_image' => $listing->hero_image,
                'base_price' => $listing->base_price,
                'currency' => $listing->currency,
                // Sprint 60 schedule fields. All nullable — a grant open all
                // season legitimately has none, and the client renders
                // nothing rather than an empty chip.
                'starts_at' => $listing->starts_at?->toIso8601String(),
                'ends_at' => $listing->ends_at?->toIso8601String(),
                'location' => $listing->location,
                'capacity' => $listing->capacity,
                'sold_count' => $listing->sold_count,
                'seats_left' => $listing->seats_left,
                'availability_pct' => $listing->availability_pct,
                'is_sold_out' => $listing->is_sold_out,
                'is_featured' => $listing->is_featured,
                'nights' => $listing->nights,
                'flight_class' => $listing->flight_class,
                'accommodation_level' => $listing->accommodation_level,
                'tournament_id' => $listing->tournament_id,
                'publisher' => $publisher,
            ],
            'tournament' => $this->tournamentSummary($listing->tournament_id, $tournaments),
            'more' => $this->morePublishedBy($listing),
            // Sprint 66 trust line: say "secure online payment" only when it is.
            'onlinePayment' => app(PaystackService::class)->enabled(),
        ]);
    }

    /**
     * Just enough tournament to caption the listing.
     *
     * Read straight from config through the service rather than the session's
     * active tournament: this page is a public link, so it must describe the
     * listing's OWN tournament whoever opens it.
     */
    private function tournamentSummary(?string $id, TournamentService $tournaments): ?array
    {
        // `get()` falls back to the default tournament for an unknown id, so
        // it can never double as an existence check (Sprint 49).
        if (! $id || ! config("tournaments.tournaments.{$id}")) {
            return null;
        }

        $t = $tournaments->get($id);

        return [
            'id' => $t['id'],
            'name' => $t['name'],
            'short_name' => $t['short_name'] ?? null,
            'slug' => $t['slug'] ?? null,
            'status' => $t['status'] ?? null,
            'accent' => $t['accent'] ?? null,
        ];
    }

    /**
     * Three more published listings from the same partner.
     *
     * A visitor who followed a link into one listing has no other way back
     * into that partner's catalogue except the hub link, and a dead end is
     * how a public page wastes the visit it just earned.
     */
    private function morePublishedBy(Listing $listing): array
    {
        if (! $listing->publisher_id) {
            return [];
        }

        return Listing::query()
            ->where('publisher_type', $listing->publisher_type)
            ->where('publisher_id', $listing->publisher_id)
            ->whereKeyNot($listing->id)
            ->approved()
            ->active()
            ->orderByDesc('is_featured')
            ->orderByRaw('starts_at IS NULL, starts_at ASC')
            ->limit(3)
            ->get()
            ->map(fn (Listing $l) => [
                'id' => $l->id,
                'name' => $l->name,
                'type' => $l->type,
                'description' => $l->description,
                'hero_image' => $l->hero_image,
                'base_price' => $l->base_price,
                'currency' => $l->currency,
                'starts_at' => $l->starts_at?->toIso8601String(),
                'ends_at' => $l->ends_at?->toIso8601String(),
                'location' => $l->location,
            ])
            ->all();
    }
}
