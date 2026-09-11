<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Sprint 22 — regression tests for the two findings from the
 * security review after Sprint 21:
 *  - Vuln 1: SVG upload was allowed on partner-authored listings.
 *  - Vuln 2: Fan/PackageController::show didn't filter by
 *    moderation_status + is_active.
 */
class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    // ── Vuln 1: uploads ──

    public function test_partner_cannot_upload_svg_as_hero_image(): void
    {
        Storage::fake('public');
        $partner = User::factory()->partner()->create();

        $svg = UploadedFile::fake()->createWithContent(
            'evil.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        );

        $this->actingAs($partner)
            ->post(route('partner.listings.store'), [
                'tournament_id' => 'afcon_2027',
                'name' => 'Weekend',
                'base_price' => 1000,
                'currency' => 'USD',
                'nights' => 3,
                'flight_class' => 'economy',
                'accommodation_level' => '3_star',
                'hero_image_file' => $svg,
            ])
            ->assertSessionHasErrors('hero_image_file');
    }

    public function test_partner_can_still_upload_png_as_hero_image(): void
    {
        Storage::fake('public');
        $partner = User::factory()->partner()->create();

        $png = UploadedFile::fake()->image('ok.png', 800, 600);

        $this->actingAs($partner)
            ->post(route('partner.listings.store'), [
                'tournament_id' => 'afcon_2027',
                'name' => 'Weekend',
                'base_price' => 1000,
                'currency' => 'USD',
                'nights' => 3,
                'flight_class' => 'economy',
                'accommodation_level' => '3_star',
                'hero_image_file' => $png,
            ])
            ->assertSessionHasNoErrors();
    }

    public function test_admin_cannot_upload_svg_as_hero_image(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();

        $svg = UploadedFile::fake()->createWithContent(
            'evil.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        );

        $this->actingAs($admin)
            ->post(route('admin.packages.store'), [
                'tournament_id' => 'afcon_2027',
                'name' => 'Weekend',
                'base_price' => 1000,
                'currency' => 'USD',
                'nights' => 3,
                'flight_class' => 'economy',
                'accommodation_level' => '3_star',
                'is_active' => true,
                'is_featured' => false,
                'hero_image_file' => $svg,
            ])
            ->assertSessionHasErrors('hero_image_file');
    }

    // ── Vuln 2: fan cannot view unapproved / inactive listings ──

    public function test_fan_cannot_view_draft_partner_listing(): void
    {
        $fan = User::factory()->create(['is_partner' => false, 'is_admin' => false]);
        $partner = User::factory()->partner()->create();
        $draft = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'draft',
            'is_active' => false,
        ]);

        $this->actingAs($fan)
            ->get(route('fan.packages.show', $draft->id))
            ->assertNotFound();
    }

    public function test_fan_cannot_view_rejected_partner_listing(): void
    {
        $fan = User::factory()->create(['is_partner' => false, 'is_admin' => false]);
        $partner = User::factory()->partner()->create();
        $rejected = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'rejected',
            'is_active' => false,
        ]);

        $this->actingAs($fan)
            ->get(route('fan.packages.show', $rejected->id))
            ->assertNotFound();
    }

    public function test_fan_cannot_view_inactive_listing_even_if_approved(): void
    {
        $fan = User::factory()->create(['is_partner' => false, 'is_admin' => false]);
        $partner = User::factory()->partner()->create();
        $shelved = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'approved',
            'is_active' => false,
        ]);

        $this->actingAs($fan)
            ->get(route('fan.packages.show', $shelved->id))
            ->assertNotFound();
    }

    public function test_fan_can_view_approved_active_listing(): void
    {
        $fan = User::factory()->create(['is_partner' => false, 'is_admin' => false]);
        $partner = User::factory()->partner()->create();
        $public = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'tournament_id' => 'afcon_2027',
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);

        $this->actingAs($fan)
            ->get(route('fan.packages.show', $public->id))
            ->assertStatus(200);
    }
}
