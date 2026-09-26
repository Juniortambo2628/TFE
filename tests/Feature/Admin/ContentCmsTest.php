<?php

namespace Tests\Feature\Admin;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The CMS behind the public section pages: hero bands and the content cards
 * beneath them. Both are config-defaults + SiteSetting overrides, and both are
 * edited as uploads rather than typed file paths.
 */
class ContentCmsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_the_content_page_ships_defaults_for_every_editor(): void
    {
        $props = $this->actingAs($this->admin())
            ->get(route('admin.content'))
            ->assertOk()
            ->viewData('page')['props'];

        // Hero defaults drive the placeholder + preview when nothing is saved.
        $this->assertArrayHasKey('about', $props['heroDefaults']);
        $this->assertSame(config('site_pages.about.title'), $props['heroDefaults']['about']['title']);

        // Section cards arrive grouped per page, each field carrying its
        // default alongside the saved override.
        $slugs = collect($props['sectionCards'])->pluck('slug')->all();
        $this->assertSame(['about', 'features', 'services', 'contact'], $slugs);

        $about = collect($props['sectionCards'])->firstWhere('slug', 'about');
        $this->assertCount(count(config('site_sections.about')), $about['cards']);
        $this->assertSame(
            config('site_sections.about.0.image'),
            $about['cards'][0]['fields']['image']['default'],
        );
        $this->assertSame('about_0_image', $about['cards'][0]['fields']['image']['field_key']);
    }

    public function test_an_image_setting_is_saved_as_an_upload_not_a_typed_path(): void
    {
        Storage::fake('public');

        $this->actingAs($this->admin())->post(route('admin.content.settings.update'), [
            'key' => 'page_hero_about_background',
            'type' => 'image',
            'group' => 'page_hero',
            'value' => UploadedFile::fake()->image('hero.jpg', 1920, 800),
        ])->assertRedirect();

        $saved = SiteSetting::get('page_hero_about_background');

        // Stored under /storage, and root-relative so it resolves from any
        // route — a bare `assets/...` would 404 under /admin.
        $this->assertStringStartsWith('/storage/', $saved);
        $this->assertNotEmpty(Storage::disk('public')->allFiles('assets/uploads'));
    }

    public function test_an_svg_upload_is_refused(): void
    {
        Storage::fake('public');

        $this->actingAs($this->admin())->post(route('admin.content.settings.update'), [
            'key' => 'page_hero_about_background',
            'type' => 'image',
            'group' => 'page_hero',
            'value' => UploadedFile::fake()->createWithContent(
                'evil.svg',
                '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            ),
        ])->assertSessionHasErrors('value');

        $this->assertNull(SiteSetting::get('page_hero_about_background'));
    }

    public function test_clearing_an_image_setting_falls_back_to_the_config_default(): void
    {
        SiteSetting::set('page_hero_about_background', '/storage/custom.jpg', 'image', 'page_hero');

        $this->actingAs($this->admin())->post(route('admin.content.settings.update'), [
            'key' => 'page_hero_about_background',
            'type' => 'image',
            'group' => 'page_hero',
            'value' => '',
        ])->assertRedirect();

        $hero = $this->get(route('about'))->viewData('page')['props']['hero'];

        $this->assertSame(config('site_pages.about.background'), $hero['background']);
    }

    public function test_a_section_card_override_reaches_the_public_page(): void
    {
        SiteSetting::set('section_card_about_0_title', 'Curated Match Trips', 'text', 'section_card');
        SiteSetting::set('section_card_about_0_image', '/storage/custom-card.jpg', 'image', 'section_card');

        $cards = $this->get(route('about'))->viewData('page')['props']['cards'];

        $this->assertSame('Curated Match Trips', $cards[0]['title']);
        $this->assertSame('/storage/custom-card.jpg', $cards[0]['image']);

        // Untouched fields still come from config.
        $this->assertSame(config('site_sections.about.0.subtitle'), $cards[0]['subtitle']);
        // And so do the other cards.
        $this->assertSame(config('site_sections.about.1.title'), $cards[1]['title']);
    }

    public function test_every_section_page_ships_its_cards(): void
    {
        foreach (['about' => 'about', 'features' => 'features', 'services' => 'services', 'contact' => 'contact'] as $routeName => $slug) {
            $cards = $this->get(route($routeName))->viewData('page')['props']['cards'];

            $this->assertCount(count(config("site_sections.{$slug}")), $cards, $slug);
            $this->assertNotEmpty($cards[0]['image'], $slug);
        }
    }

    public function test_config_card_images_are_root_relative(): void
    {
        // A bare `assets/...` resolves against the current directory, so it
        // 404s on every nested route. Guard the whole catalogue.
        foreach (config('site_sections') as $slug => $cards) {
            foreach ($cards as $i => $card) {
                $this->assertMatchesRegularExpression(
                    '#^(?:https?://|/)#',
                    $card['image'],
                    "site_sections.{$slug}.{$i}.image must be absolute or root-relative",
                );
            }
        }
    }
}
