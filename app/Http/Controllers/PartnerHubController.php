<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\User;
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
    public function show(string $slug)
    {
        $profile = PartnerProfile::public()->bySlug($slug)->with('user')->first();
        if (! $profile) {
            abort(404);
        }

        // Listings this partner has published — active only on the
        // public hub. Sprint 10 will let partners toggle draft/published
        // per listing; today "active" is the closest proxy.
        $listings = Listing::query()
            ->where('publisher_type', User::class)
            ->where('publisher_id', $profile->user_id)
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
