<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Admin\PartnerController as AdminPartnerController;
use App\Http\Controllers\Controller;
use App\Models\PartnerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Display the partner profile page — account details plus the branding
     * that drives the partner's public card (/partners) and hub
     * (/partners/{slug}), so a partner can self-serve their appearance.
     */
    public function index()
    {
        $user = Auth::user();
        $branding = $user->partnerProfile;

        $profile = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'company_name' => $user->company_name ?? '',
            'created_at' => $user->created_at->format('M d, Y'),
            'avatar' => $user->profile?->avatar_path ?? $user->avatar ?? asset('assets/img/avatars/default-avatar.png'),
            'cover_image' => $user->cover_image,
            'partner_type' => $user->partner_type,
            'partner_type_label' => AdminPartnerController::partnerTypes()[$user->partner_type] ?? 'Partner',
            // Public-hub branding (PartnerProfile) — the partner card + hub.
            'branding' => [
                'slug' => $branding?->slug,
                'display_name' => $branding?->display_name ?? $user->company_name ?? $user->name,
                'tagline' => $branding?->tagline ?? '',
                'about' => $branding?->about ?? '',
                'theme_accent' => $branding?->theme_accent ?? '#dc2626',
                'logo_url' => $branding?->logo_url ?? '',
                'hero_image' => $branding?->hero_image ?? '',
                'service_tags' => $branding?->service_tags ?? [],
                'website_url' => $branding?->website_url ?? '',
                'contact_email' => $branding?->contact_email ?? '',
                'contact_phone' => $branding?->contact_phone ?? '',
                'is_public' => (bool) ($branding?->is_public ?? false),
                'hub_url' => $branding?->slug ? route('partners.hub', $branding->slug) : null,
            ],
        ];

        return Inertia::render('Partner/Profile', [
            'profile' => $profile,
        ]);
    }

    /**
     * Update the partner profile — account details + public-hub branding,
     * with image uploads (avatar / logo / hero / cover) restricted to raster
     * formats (no SVG — stored-XSS vector on same-origin storage).
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            // Account
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'avatar' => 'nullable|string|max:255',
            'avatar_file' => 'nullable|mimes:jpg,jpeg,png,webp|max:5120',
            'cover_image' => 'nullable|string',
            'cover_image_file' => 'nullable|mimes:jpg,jpeg,png,webp|max:5120',
            // Branding (public card + hub)
            'display_name' => 'nullable|string|max:255',
            'tagline' => 'nullable|string|max:500',
            'about' => 'nullable|string|max:5000',
            'theme_accent' => 'nullable|string|max:12',
            'website_url' => 'nullable|url|max:255',
            'contact_email' => 'nullable|email|max:190',
            'contact_phone' => 'nullable|string|max:40',
            'service_tags' => 'nullable|array',
            'service_tags.*' => 'string|max:40',
            'is_public' => 'nullable|boolean',
            'logo_url' => 'nullable|string',
            'logo_file' => 'nullable|mimes:jpg,jpeg,png,webp|max:5120',
            'hero_image' => 'nullable|string',
            'hero_image_file' => 'nullable|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        // ── Account fields ──────────────────────────────────────────────
        $user->fill([
            'name' => $validated['name'],
            'company_name' => $validated['company_name'] ?? $user->company_name,
        ]);

        $user->avatar = $this->resolveImage($request, 'avatar_file', 'avatar', $user->avatar);
        $user->cover_image = $this->resolveImage($request, 'cover_image_file', 'cover_image', $user->cover_image);
        $user->save();

        // ── Branding (PartnerProfile) ───────────────────────────────────
        $branding = PartnerProfile::firstOrNew(['user_id' => $user->id]);

        if (! $branding->slug) {
            $base = Str::slug($validated['display_name'] ?? $user->company_name ?? $user->name);
            $branding->slug = $this->uniqueSlug($base ?: 'partner-'.$user->id);
        }

        $branding->fill([
            'display_name' => $validated['display_name'] ?? $branding->display_name ?? $user->name,
            'tagline' => $validated['tagline'] ?? $branding->tagline,
            'about' => $validated['about'] ?? $branding->about,
            'theme_accent' => $validated['theme_accent'] ?? $branding->theme_accent,
            'website_url' => $validated['website_url'] ?? $branding->website_url,
            'contact_email' => $validated['contact_email'] ?? $branding->contact_email,
            'contact_phone' => $validated['contact_phone'] ?? $branding->contact_phone,
            'service_tags' => $validated['service_tags'] ?? $branding->service_tags,
            'is_public' => $request->boolean('is_public'),
            'logo_url' => $this->resolveImage($request, 'logo_file', 'logo_url', $branding->logo_url),
            'hero_image' => $this->resolveImage($request, 'hero_image_file', 'hero_image', $branding->hero_image),
        ]);

        if ($branding->is_public && ! $branding->published_at) {
            $branding->published_at = now();
        }

        $branding->save();

        return back()->with('success', 'Profile updated successfully!');
    }

    /**
     * Return a stored file URL when a new upload is present, else the posted
     * string value, else the existing value — one helper for every image.
     */
    private function resolveImage(Request $request, string $fileKey, string $stringKey, ?string $current): ?string
    {
        if ($request->hasFile($fileKey)) {
            return Storage::url($request->file($fileKey)->store('partners', 'public'));
        }

        return $request->filled($stringKey) ? $request->input($stringKey) : $current;
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base;
        $i = 1;
        while (PartnerProfile::where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$i);
        }

        return $slug;
    }
}
