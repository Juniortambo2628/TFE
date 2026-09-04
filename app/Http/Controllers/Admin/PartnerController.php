<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Admin partner directory — Sprint 9.
 *
 * Lists every partner-type user with verification badge, listings
 * count, and public-hub link. Admin can verify/unverify, feature/
 * unfeature the hub, and edit the branded profile (accent, tagline,
 * about, logo, hero, stats).
 */
class PartnerController extends Controller
{
    public function index(Request $request)
    {
        $partners = User::query()
            ->where('is_partner', true)
            ->orderBy('name')
            ->get()
            ->map(function (User $u) {
                $profile = $u->partnerProfile;
                $listingsCount = Listing::query()
                    ->where('publisher_type', User::class)
                    ->where('publisher_id', $u->id)
                    ->count();

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'partner_type' => $u->partner_type,
                    'verification_status' => $u->verification_status ?? 'unverified',
                    'services_offered' => $u->services_offered ?? [],
                    'listings_count' => $listingsCount,
                    'has_profile' => (bool) $profile,
                    'profile_slug' => $profile?->slug,
                    'profile_is_public' => (bool) $profile?->is_public,
                    'profile_display_name' => $profile?->display_name,
                    'created_at' => $u->created_at?->format('M d, Y'),
                ];
            });

        return Inertia::render('Admin/Partners', [
            'partners' => $partners,
            'partner_types' => self::partnerTypes(),
        ]);
    }

    public function edit(User $user)
    {
        abort_unless($user->is_partner, 404);

        // Auto-provision a draft profile so the admin form always has
        // something to write into.
        $profile = PartnerProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => $user->company_name ?: $user->name,
                'is_public' => false,
            ],
        );

        return Inertia::render('Admin/PartnerEdit', [
            'partner' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'partner_type' => $user->partner_type,
                'verification_status' => $user->verification_status ?? 'unverified',
                'services_offered' => $user->services_offered ?? [],
            ],
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
                'is_public' => (bool) $profile->is_public,
                'public_url' => $profile->slug ? route('partners.hub', $profile->slug) : null,
            ],
            'partner_types' => self::partnerTypes(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($user->is_partner, 404);

        $validated = $request->validate([
            'partner_type' => 'nullable|string|in:'.implode(',', array_keys(self::partnerTypes())),
            'verification_status' => 'nullable|in:unverified,pending,verified',
            'services_offered' => 'nullable|array',
            // Profile fields
            'display_name' => 'nullable|string|max:255',
            'tagline' => 'nullable|string|max:500',
            'about' => 'nullable|string',
            'hero_image' => 'nullable|string',
            'logo_url' => 'nullable|string',
            'theme_accent' => 'nullable|string|max:12',
            'stats' => 'nullable|array',
            'service_tags' => 'nullable|array',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string|max:64',
            'website_url' => 'nullable|url',
            'is_public' => 'nullable|boolean',
        ]);

        // User-level fields
        $user->fill(array_filter([
            'partner_type' => $validated['partner_type'] ?? null,
            'verification_status' => $validated['verification_status'] ?? null,
            'services_offered' => $validated['services_offered'] ?? null,
        ], fn ($v) => $v !== null))->save();

        // Profile-level fields
        $profile = PartnerProfile::firstOrNew(['user_id' => $user->id]);
        $wasPublic = (bool) $profile->is_public;
        $profile->fill(array_filter([
            'display_name' => $validated['display_name'] ?? null,
            'tagline' => $validated['tagline'] ?? null,
            'about' => $validated['about'] ?? null,
            'hero_image' => $validated['hero_image'] ?? null,
            'logo_url' => $validated['logo_url'] ?? null,
            'theme_accent' => $validated['theme_accent'] ?? null,
            'stats' => $validated['stats'] ?? null,
            'service_tags' => $validated['service_tags'] ?? null,
            'contact_email' => $validated['contact_email'] ?? null,
            'contact_phone' => $validated['contact_phone'] ?? null,
            'website_url' => $validated['website_url'] ?? null,
        ], fn ($v) => $v !== null));

        if ($request->has('is_public')) {
            $profile->is_public = (bool) $validated['is_public'];
            if ($profile->is_public && ! $wasPublic) {
                $profile->published_at = now();
            }
        }

        $profile->save();

        return back()->with('success', 'Partner updated successfully');
    }

    /**
     * Central partner-type catalogue.  Kept here so the admin form
     * and the profile edit page pull from one source; extend it as
     * new stakeholder archetypes come online (per ASE deck).
     */
    public static function partnerTypes(): array
    {
        return [
            'travel_agent' => 'Travel Agent',
            'finance_partner' => 'Finance Partner',
            'airline' => 'Airline',
            'hotel_provider' => 'Hotel / Hospitality',
            'destination' => 'Destination',
            'club' => 'Club',
            'federation' => 'Federation',
            'event_organiser' => 'Event Organiser',
            'sponsor' => 'Sponsor',
        ];
    }
}
