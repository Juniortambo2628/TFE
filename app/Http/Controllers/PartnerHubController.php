<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\PartnerController as AdminPartnerController;
use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\User;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * PartnerHubController — Public read-side of a partner's branded hub.
 *
 * URL: /partners/{slug}
 *
 * Sprint 9 MVP: hero + tagline + about + published-listings grid,
 * themed by the profile's theme_accent. No auth required — this is a
 * discovery surface.
 */
class PartnerHubController extends Controller
{
    /**
     * Public /partners directory — searchable + filterable index of
     * every partner with a public profile. Sprint 11: closes the gap
     * between the Sprint 9 branded hub (only reachable by direct URL)
     * and the Sprint 10 publishing flow, so fans can discover the
     * partner offering these listings from the header.
     */
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $type = $request->query('type');
        $tournamentId = $request->query('tournament_id');

        $profiles = PartnerProfile::query()
            ->public()
            ->with('user')
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('display_name', 'like', "%{$q}%")
                        ->orWhere('tagline', 'like', "%{$q}%")
                        ->orWhere('about', 'like', "%{$q}%");
                });
            })
            ->when($type, function ($query) use ($type) {
                $query->whereHas('user', fn ($u) => $u->where('partner_type', $type));
            })
            ->orderByDesc('published_at')
            ->orderBy('display_name')
            ->get()
            ->map(function (PartnerProfile $p) use ($tournamentId) {
                $listings = Listing::query()
                    ->where('publisher_type', User::class)
                    ->where('publisher_id', $p->user_id)
                    ->approved()
                    ->active();
                if ($tournamentId) {
                    $listings->where('tournament_id', $tournamentId);
                }
                $listingsCount = $listings->count();

                return [
                    'slug' => $p->slug,
                    'display_name' => $p->display_name,
                    'tagline' => $p->tagline,
                    'hero_image' => $p->hero_image,
                    'logo_url' => $p->logo_url,
                    'theme_accent' => $p->theme_accent,
                    'partner_type' => $p->user->partner_type,
                    'partner_type_label' => AdminPartnerController::partnerTypes()[$p->user->partner_type] ?? $p->user->partner_type,
                    'verification_status' => $p->user->verification_status,
                    'service_tags' => $p->service_tags ?? [],
                    'listings_count' => $listingsCount,
                    'has_tournament_match' => $tournamentId ? $listingsCount > 0 : null,
                ];
            })
            // When a tournament filter is on, drop profiles whose
            // approved listings don't touch it — a partner selling
            // AFCON packages shouldn't show up in a WC 2026 filter.
            ->filter(fn ($p) => $tournamentId === null || $p['has_tournament_match']);

        return Inertia::render('PartnersIndex', [
            'profiles' => $profiles->values(),
            'partner_types' => AdminPartnerController::partnerTypes(),
            'tournaments' => app(TournamentService::class)->all(),
            'filters' => [
                'q' => $q,
                'type' => $type,
                'tournament_id' => $tournamentId,
            ],
        ]);
    }

    public function show(string $slug)
    {
        $profile = PartnerProfile::public()->bySlug($slug)->with('user')->first();
        if (! $profile) {
            abort(404);
        }

        // Listings this partner has published. Sprint 10: only the ones
        // admin has moderated to `approved` reach the public hub — a
        // partner's draft or pending row stays inside the Publish tab.
        $listings = Listing::query()
            ->where('publisher_type', User::class)
            ->where('publisher_id', $profile->user_id)
            ->approved()
            ->active()
            ->orderByDesc('is_featured')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(function (Listing $l) {
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
                    'capacity' => $l->capacity,
                    'sold_count' => $l->sold_count,
                    'availability_pct' => $l->availability_pct,
                    'is_sold_out' => $l->is_sold_out,
                    'is_featured' => $l->is_featured,
                    'tournament_id' => $l->tournament_id,
                    'tournament_short' => $tCfg['short_name'] ?? $tCfg['name'] ?? null,
                ];
            });

        return Inertia::render('PartnerHub', [
            'profile' => [
                'id' => $profile->id,
                'slug' => $profile->slug,
                'display_name' => $profile->display_name,
                'tagline' => $profile->tagline,
                'about' => $profile->about,
                'hero_image' => $profile->hero_image,
                'logo_url' => $profile->logo_url,
                'theme_accent' => $profile->theme_accent,
                'stats' => $profile->stats ?? [],
                'service_tags' => $profile->service_tags ?? [],
                'contact_email' => $profile->contact_email,
                'contact_phone' => $profile->contact_phone,
                'website_url' => $profile->website_url,
                'partner_type' => $profile->user->partner_type,
                'verification_status' => $profile->user->verification_status,
            ],
            'listings' => $listings,
        ]);
    }
}
