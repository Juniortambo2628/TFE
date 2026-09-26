<?php

namespace Tests\Feature;

use App\Models\PartnerProfile;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Sprint 53 — the account surfaces (profile + security) across all three
 * roles.
 *
 * Two regressions these lock down:
 *
 *  - The fan avatar. It used to accept ONLY `avatar_url`, because the picture
 *    came from Ready Player Me's hosted creator at `demo.readyplayer.me`.
 *    That host stopped resolving, so "Change Avatar" opened a browser DNS
 *    error and a fan had no way to set one at all. It is a normal upload now.
 *  - One security page for every role. The fan, partner and admin pages now
 *    render the same component against the same SecurityService, so a route
 *    that exists for one role exists for all of them.
 */
class AccountSurfacesTest extends TestCase
{
    use RefreshDatabase;

    // ── Fan avatar ──────────────────────────────────────────────────────

    public function test_a_fan_can_upload_an_avatar_image(): void
    {
        Storage::fake('public');
        $fan = User::factory()->create();

        $this->actingAs($fan)
            ->post(route('fan.profile.avatar.update'), [
                'avatar' => UploadedFile::fake()->image('me.jpg', 600, 600),
            ])
            ->assertRedirect();

        $profile = Profile::where('user_id', $fan->id)->first();

        $this->assertNotNull($profile);
        $this->assertNotNull($profile->avatar_path);
        $this->assertStringStartsWith('/storage/', $profile->avatar_path);
        // Recorded in the media library, like every other upload (Sprint 50).
        $this->assertDatabaseCount('media_assets', 1);
    }

    public function test_the_avatar_uploader_refuses_svg(): void
    {
        Storage::fake('public');
        $fan = User::factory()->create();

        $this->actingAs($fan)
            ->post(route('fan.profile.avatar.update'), [
                'avatar' => UploadedFile::fake()->create('payload.svg', 8, 'image/svg+xml'),
            ])
            ->assertSessionHasErrors('avatar');

        $this->assertDatabaseCount('media_assets', 0);
    }

    public function test_an_existing_avatar_url_can_still_be_submitted(): void
    {
        $fan = User::factory()->create();

        $this->actingAs($fan)
            ->post(route('fan.profile.avatar.update'), ['avatar_url' => '/storage/avatars/existing.webp'])
            ->assertRedirect();

        $this->assertSame(
            '/storage/avatars/existing.webp',
            Profile::where('user_id', $fan->id)->first()->avatar_path
        );
    }

    public function test_submitting_nothing_clears_the_avatar(): void
    {
        $fan = User::factory()->create();
        Profile::create(['user_id' => $fan->id, 'avatar_path' => '/storage/avatars/old.webp', 'settings' => []]);

        $this->actingAs($fan)
            ->post(route('fan.profile.avatar.update'), [])
            ->assertRedirect();

        $this->assertNull(Profile::where('user_id', $fan->id)->first()->avatar_path);
    }

    // ── One security surface, three roles ───────────────────────────────

    public function test_every_role_gets_the_same_security_surface(): void
    {
        $cases = [
            ['Fan/Security', User::factory()->create(), 'fan.security'],
            ['Partner/Security', User::factory()->partner()->create(['partner_type' => 'travel_agent']), 'partner.security'],
            ['Admin/Security', User::factory()->create(['is_admin' => true]), 'admin.security'],
        ];

        foreach ($cases as [$component, $user, $routeName]) {
            $page = $this->actingAs($user)->get(route($routeName))->viewData('page');

            $this->assertSame($component, $page['component']);

            // The same payload shape, because it is the same SecurityService
            // and the same React component behind all three.
            foreach (['security_settings', 'loginHistory', 'passkeys', 'stats'] as $key) {
                $this->assertArrayHasKey($key, $page['props'], "{$component} is missing `{$key}`.");
            }
        }
    }

    public function test_the_security_routes_every_role_page_references_exist(): void
    {
        // The partner page used to be wired to `partner.security.2fa.enable`,
        // `partner.passkeys.store` and friends — names that were never
        // registered, so each button threw the moment it was clicked. The
        // shared component names its routes per role; all of them must exist.
        foreach (['fan', 'partner', 'admin'] as $role) {
            foreach (['security.password', 'security.two-factor', 'security.two-factor.confirm', 'security.notifications'] as $name) {
                $this->assertTrue(
                    Route::has("{$role}.{$name}"),
                    "Route {$role}.{$name} is referenced by the shared security page but not registered."
                );
            }
        }
    }

    public function test_a_partner_can_toggle_login_notifications(): void
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'finance_partner']);

        $this->actingAs($partner)
            ->post(route('partner.security.notifications'), ['login_notifications' => false])
            ->assertRedirect();

        $this->assertDatabaseHas('user_security_settings', [
            'user_id' => $partner->id,
            'login_notifications' => false,
        ]);
    }

    // ── Partner profile ─────────────────────────────────────────────────

    public function test_a_partner_profile_image_upload_goes_through_the_media_library(): void
    {
        Storage::fake('public');
        $partner = User::factory()->partner()->create(['partner_type' => 'travel_agent']);
        PartnerProfile::create(['user_id' => $partner->id, 'slug' => 'test-partner', 'display_name' => 'Test Partner']);

        $this->actingAs($partner)
            ->post(route('partner.profile.update'), [
                'name' => 'Test Partner',
                'display_name' => 'Test Partner',
                'hero_image_file' => UploadedFile::fake()->image('hero.jpg', 1200, 600),
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('media_assets', 1);
        $this->assertStringStartsWith(
            '/storage/',
            PartnerProfile::where('user_id', $partner->id)->first()->hero_image
        );
    }

    public function test_the_partner_profile_page_renders(): void
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'airline']);
        PartnerProfile::create(['user_id' => $partner->id, 'slug' => 'test-air', 'display_name' => 'Test Air']);

        $page = $this->actingAs($partner)->get(route('partner.profile'))->viewData('page');

        $this->assertSame('Partner/Profile', $page['component']);
        $this->assertArrayHasKey('branding', $page['props']['profile']);
    }
}
