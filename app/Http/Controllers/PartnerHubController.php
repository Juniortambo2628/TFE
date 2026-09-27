<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\PartnerController as AdminPartnerController;
use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\Ticket;
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
            // A dated run sorts by when it happens; an undated one (a grant
            // open all season) has no place on that axis, so it sorts after
            // rather than to the front, which is where NULL would land.
            ->orderByRaw('starts_at IS NULL, starts_at ASC')
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
                    'starts_at' => $l->starts_at?->toIso8601String(),
                    'ends_at' => $l->ends_at?->toIso8601String(),
                    'location' => $l->location,
                    'availability_pct' => $l->availability_pct,
                    'is_sold_out' => $l->is_sold_out,
                    'is_featured' => $l->is_featured,
                    'tournament_id' => $l->tournament_id,
                    'tournament_short' => $tCfg['short_name'] ?? $tCfg['name'] ?? null,
                ];
            });

        $tickets = [];
        if ($profile->user->partner_type === 'ticketing_partner') {
            $tickets = Ticket::query()
                ->active()
                ->where('partner_id', $profile->user_id)
                ->orderBy('kickoff_at')
                ->get()
                ->map(fn (Ticket $t) => [
                    'id' => $t->id,
                    'home_team' => $t->home_team,
                    'home_team_code' => $t->home_team_code,
                    'away_team' => $t->away_team,
                    'away_team_code' => $t->away_team_code,
                    'stage' => $t->stage,
                    'kickoff_at' => $t->kickoff_at,
                    'venue_name' => $t->venue_name,
                    'venue_city' => $t->venue_city,
                    'venue_country' => $t->venue_country,
                    'price' => (float) $t->price,
                    'currency' => $t->currency,
                    'remaining' => $t->remaining,
                    'sold_pct' => $t->sold_pct,
                    'hero_image' => $t->hero_image,
                ])
                ->all();
        }

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
                // The hub used to re-derive this client-side by title-casing
                // the key, which produced "School Community". The directory
                // already read the real label from partnerTypes(); one source
                // is enough.
                'partner_type_label' => AdminPartnerController::partnerTypes()[$profile->user->partner_type] ?? $profile->user->partner_type,
                'verification_status' => $profile->user->verification_status,
            ],
            'listings' => $listings,
            'tickets' => $tickets,
            'features' => $this->featuresFor($profile),
            'steps' => self::stepsFor($profile->user->partner_type),
            'pillars' => self::pillarsFor($profile->user->partner_type),
        ]);
    }

    /**
     * The three "how we support you" pillars, per archetype.
     *
     * Same problem the steps had, and the same fix. Every hub rendered
     * Publish / Convert / Measure with travel-agent copy — "Package
     * experiences fans actually want — matches, stays, transfers" was shown
     * to a betting sponsor and would have been shown to a school, neither of
     * which packages a trip.
     *
     * Unmapped types keep the Publish / Convert / Measure set, which is
     * accurate for the partners whose dashboard genuinely has those tabs.
     */
    public static function pillarsFor(?string $partnerType): array
    {
        $sets = [
            'school_community' => [
                ['icon' => 'fa-school', 'title' => 'Programs', 'body' => 'Publish leagues, festivals, clinics and grants in one place, so every school and club in the region can find them.'],
                ['icon' => 'fa-user-graduate', 'title' => 'Pathways', 'body' => 'Coaching courses and development programmes that build skills, character and confidence — not just results.'],
                ['icon' => 'fa-chart-line', 'title' => 'Outcomes', 'body' => 'Track participation and progress over time, so the impact on young people is measured rather than assumed.'],
            ],
            'finance_partner' => [
                ['icon' => 'fa-file-invoice-dollar', 'title' => 'Offer', 'body' => 'Publish financing products against real, costed trips rather than an abstract credit line.'],
                ['icon' => 'fa-user-check', 'title' => 'Underwrite', 'body' => 'Applications arrive with the itinerary and its total attached, so a decision needs no chasing.'],
                ['icon' => 'fa-chart-line', 'title' => 'Measure', 'body' => 'Track approvals, decline reasons and disbursed value per tournament.'],
            ],
            'ticketing_partner' => [
                ['icon' => 'fa-ticket-alt', 'title' => 'List', 'body' => 'Put fixtures on sale with real tiered inventory — VIP through Upper, each with its own price and capacity.'],
                ['icon' => 'fa-couch', 'title' => 'Sell', 'body' => 'Fans pick their tier on a 3D map of the actual ground, so they know what they are buying.'],
                ['icon' => 'fa-chart-line', 'title' => 'Measure', 'body' => 'Seats sold, orders and sell-through per fixture, measured against each ground\'s own capacity.'],
            ],
            'sponsor' => [
                ['icon' => 'fa-bullhorn', 'title' => 'Activate', 'body' => 'Put your campaign in front of fans at the moment they are planning a trip, not after it.'],
                ['icon' => 'fa-users', 'title' => 'Engage', 'body' => 'Predictions, rewards and tribe activity give fans a reason to come back between matches.'],
                ['icon' => 'fa-chart-line', 'title' => 'Measure', 'body' => 'Reach and engagement per activation, per tournament.'],
            ],
        ];

        return $sets[$partnerType] ?? [
            ['icon' => 'fa-tags', 'title' => 'Publish', 'body' => 'Package experiences fans actually want — matches, stays, transfers — and put them in front of every buyer on the platform.'],
            ['icon' => 'fa-handshake', 'title' => 'Convert', 'body' => 'Fans submit briefs against your listings. You quote, they book. No cold pipeline to chase.'],
            ['icon' => 'fa-chart-line', 'title' => 'Measure', 'body' => 'Track sell-through, turnaround and revenue per listing. Iterate on what wins.'],
        ];
    }

    /**
     * The fan-to-delivery pipeline as this partner archetype actually runs
     * it, for the hub's docked StepFlow bar.
     *
     * Lives here rather than in the client because it is partner-specific
     * copy, exactly like featuresFor() above — and because a hardcoded
     * array in the page component is what this replaced: every partner,
     * from an airline to a betting sponsor, was told the fan would receive
     * a "Trip delivered".
     *
     * Types with no entry fall back to the travel pipeline, which is the
     * shape club / federation / destination / event_organiser partners all
     * follow. Step counts other than four are fine — the primitive numbers
     * and separates whatever it is given.
     */
    public static function stepsFor(?string $partnerType): array
    {
        $flows = [
            'finance_partner' => ['Trip costed', 'Finance request', 'Credit decision', 'Funds released'],
            'ticketing_partner' => ['Match listed', 'Seat + tier picked', 'Secure payment', 'Ticket issued'],
            'airline' => ['Route published', 'Fan picks flight', 'Fare confirmed', 'Booking issued'],
            'hotel_provider' => ['Rooms listed', 'Dates chosen', 'Rate confirmed', 'Stay booked'],
            'sponsor' => ['Campaign live', 'Fan engages', 'Reward credited'],
            // Five steps, and the only archetype whose journey is the
            // institution's rather than the fan's — a school registers once
            // and then keeps coming back to it season after season.
            'school_community' => ['Register', 'Discover', 'Join & participate', 'Develop & learn', 'Compete & grow'],
        ];

        $steps = $flows[$partnerType] ?? ['Fan brief', 'Your quote', 'Payment', 'Trip delivered'];

        return array_map(fn (string $title) => ['title' => $title], $steps);
    }

    /**
     * Partner-specific rich features that render alongside their listings.
     * Currently: Ecobank Fan Finance gets the multicurrency virtual card
     * activation CTA. Extend the switch as new partner-native surfaces come
     * online (an airline seat picker, a betting live-odds widget, …).
     */
    private function featuresFor(PartnerProfile $profile): array
    {
        $out = [];
        if ($profile->slug === 'ecobank-fan-finance') {
            $out[] = [
                'kind' => 'virtual_card',
                'title' => 'Multicurrency virtual card',
                'body' => 'Activate a virtual card that spends anywhere in seven currencies. No FX markup, instant issuance, and you freeze it any time from your dashboard.',
                'cta_label' => 'Activate on your dashboard',
                'cta_route' => 'fan.virtual-card',
                'icon' => 'fas fa-credit-card',
                'perks' => ['7-currency wallet', 'Instant issuance', 'No FX markup', 'Freeze / unfreeze anytime'],
            ];
        }

        return $out;
    }
}
