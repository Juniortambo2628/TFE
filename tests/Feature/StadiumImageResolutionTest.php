<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use App\Models\User;
use App\Services\StadiumImageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Stadium imagery: local catalogue resolution, admin overrides, and the
 * upload validation on the settings endpoint they arrive through.
 *
 * The name-matching fixtures here intentionally mirror
 * tests/JS/stadiumImages.test.mjs — the PHP and JS resolvers are two
 * implementations of one contract and must not drift.
 */
class StadiumImageResolutionTest extends TestCase
{
    use RefreshDatabase;

    protected StadiumImageService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(StadiumImageService::class);
        $this->service->clearCache();
    }

    public function test_normalize_strips_case_punctuation_and_generic_nouns(): void
    {
        $this->assertSame('benjamin mkapa', StadiumImageService::normalize('Benjamin Mkapa Stadium'));
        $this->assertSame('akii bua olympic', StadiumImageService::normalize('Akii-Bua Olympic Stadium'));
        $this->assertSame('amaan', StadiumImageService::normalize('  AMAAN   STADIUM  '));
        $this->assertSame('', StadiumImageService::normalize(null));
    }

    public function test_matches_accepts_exact_and_multi_word_containment(): void
    {
        $this->assertTrue(StadiumImageService::matches('benjamin mkapa', 'benjamin mkapa'));
        $this->assertTrue(StadiumImageService::matches('benjamin mkapa dar es salaam', 'benjamin mkapa'));
    }

    public function test_matches_refuses_a_single_token_overlap(): void
    {
        // Zanzibar Fumba and Amaan are different grounds in the same city.
        // A one-word overlap must not resolve one to the other's photo.
        $this->assertFalse(StadiumImageService::matches('zanzibar fumba', 'zanzibar'));
    }

    /**
     * These are the venue name strings the live Wikipedia parse actually
     * emits for AFCON 2027 — not invented ones. Each must land on its own
     * stadium's image.
     */
    public function test_real_wikipedia_venue_names_resolve_to_the_right_image(): void
    {
        $expected = [
            'Moi International Stadium' => 'moi-kasarani_hero.webp',
            'Nyayo National Stadium' => 'nyayo-national_hero.webp',
            'Talanta Sports Stadium' => 'talanta-sports-city_hero.webp',
            // Talanta was renamed Raila Odinga International Stadium in 2025;
            // Wikipedia returns either name depending on when you ask.
            'Raila Odinga International Stadium' => 'talanta-sports-city_hero.webp',
            'Kipchoge Keino Stadium' => 'kipchoge-keino_hero.webp',
            'Samia Suluhu Hassan Stadium' => 'samia-suluhu-hassan_hero.webp',
            'Benjamin Mkapa Stadium' => 'benjamin-mkapa_hero.webp',
            'Mandela National Stadium' => 'mandela-national_hero.webp',
            'Dodoma Stadium' => 'dodoma_hero.webp',
            'Amaan Stadium' => 'amaan_hero.webp',
        ];

        foreach ($expected as $venue => $file) {
            $this->assertSame(
                '/stadiums/AFCON/'.$file,
                $this->service->resolve($venue, 'afcon_2027'),
                "[$venue] resolved to the wrong stadium image"
            );
        }
    }

    public function test_an_unmapped_venue_resolves_to_null_rather_than_a_wrong_image(): void
    {
        // Real AFCON grounds we have no photography for yet.
        $this->assertNull($this->service->resolve('Nakivubo Stadium', 'afcon_2027'));
        $this->assertNull($this->service->resolve('Chamazi Stadium', 'afcon_2027'));
        // Same city as Amaan, different ground — must NOT borrow Amaan's photo.
        $this->assertNull($this->service->resolve('Zanzibar Fumba Stadium', 'afcon_2027'));
    }

    public function test_every_catalogued_image_file_exists_on_disk(): void
    {
        foreach ($this->service->all('afcon_2027') as $entry) {
            $this->assertFileExists(
                public_path($entry['image']),
                "Catalogued image missing: {$entry['slug']}. It must be committed under public/ — public/storage is gitignored and never deploys."
            );
        }
    }

    public function test_a_tournament_without_a_catalogue_degrades_quietly(): void
    {
        $this->assertSame([], $this->service->all('wc_2026'));
        $this->assertNull($this->service->resolve('MetLife Stadium', 'wc_2026'));

        // applyToVenues must pass rows through untouched, not blank them.
        $venues = [['name' => 'MetLife Stadium', 'thumbnail' => 'https://example.test/x.jpg']];
        $this->assertSame($venues, $this->service->applyToVenues($venues, 'wc_2026'));
    }

    public function test_apply_to_venues_overlays_local_image_and_backfills_coordinates(): void
    {
        $venues = [[
            'name' => 'Benjamin Mkapa Stadium',
            'thumbnail' => 'https://upload.wikimedia.org/remote.jpg',
            'lat' => null,
            'lng' => null,
        ]];

        $out = $this->service->applyToVenues($venues, 'afcon_2027');

        $this->assertSame('/stadiums/AFCON/benjamin-mkapa_hero.webp', $out[0]['image']);
        $this->assertSame('/stadiums/AFCON/benjamin-mkapa_hero.webp', $out[0]['thumbnail']);
        $this->assertSame('local', $out[0]['image_source']);
        $this->assertIsFloat($out[0]['lat']);
        $this->assertIsFloat($out[0]['lng']);
    }

    public function test_apply_to_venues_strips_remote_thumbnails_from_unmatched_venues(): void
    {
        // The point of the swap is that a catalogued tournament stops loading
        // remote images at all. An unmatched row must not quietly keep its
        // Wikipedia thumbnail -- that is the slow, unreliable dependency we
        // are removing. Wikipedia's venue parser also emits bare city names
        // ("Nairobi") as venue rows, which would otherwise show a cityscape.
        $venues = [
            ['name' => 'Nairobi', 'thumbnail' => 'https://upload.wikimedia.org/city.jpg'],
            ['name' => 'Nakivubo Stadium', 'image' => 'https://upload.wikimedia.org/ground.jpg'],
        ];

        $out = $this->service->applyToVenues($venues, 'afcon_2027');

        $this->assertNull($out[0]['thumbnail']);
        $this->assertNull($out[0]['image']);
        $this->assertNull($out[1]['thumbnail']);
        $this->assertNull($out[1]['image']);
    }

    public function test_apply_to_venues_keeps_wikipedia_coordinates_when_it_has_them(): void
    {
        // A parsed infobox coordinate is more precise than our approximation,
        // so it must win.
        $venues = [['name' => 'Amaan Stadium', 'lat' => -6.1, 'lng' => 39.2]];

        $out = $this->service->applyToVenues($venues, 'afcon_2027');

        $this->assertSame(-6.1, $out[0]['lat']);
        $this->assertSame(39.2, $out[0]['lng']);
    }

    public function test_an_admin_override_wins_over_the_committed_default(): void
    {
        SiteSetting::set(
            StadiumImageService::SETTING_PREFIX.'amaan',
            '/storage/assets/uploads/custom-amaan.webp',
            'image',
            'stadiums'
        );
        $this->service->clearCache('afcon_2027');

        $this->assertSame(
            '/storage/assets/uploads/custom-amaan.webp',
            $this->service->resolve('Amaan Stadium', 'afcon_2027')
        );

        $entry = collect($this->service->all('afcon_2027'))->firstWhere('slug', 'amaan');
        $this->assertTrue($entry['is_overridden']);
        // The committed default stays available so a reset can restore it.
        $this->assertSame('/stadiums/AFCON/amaan_hero.webp', $entry['default_url']);
    }

    public function test_admin_can_reset_a_stadium_image_back_to_the_default(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        SiteSetting::set(
            StadiumImageService::SETTING_PREFIX.'amaan',
            '/storage/assets/uploads/custom-amaan.webp',
            'image',
            'stadiums'
        );

        $this->actingAs($admin)
            ->post(route('admin.content.stadium-images.reset'), [
                'slug' => 'amaan',
                'tournament_id' => 'afcon_2027',
            ])
            ->assertRedirect();

        $this->assertDatabaseMissing('site_settings', [
            'key' => StadiumImageService::SETTING_PREFIX.'amaan',
        ]);

        $this->service->clearCache('afcon_2027');
        $this->assertSame(
            '/stadiums/AFCON/amaan_hero.webp',
            $this->service->resolve('Amaan Stadium', 'afcon_2027')
        );
    }

    public function test_settings_upload_rejects_svg(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['is_admin' => true]);

        // Laravel's `image` rule admits SVG; a same-origin /storage URL then
        // makes it a stored-XSS vector. The endpoint must refuse it.
        $svg = UploadedFile::fake()->createWithContent(
            'evil.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        );

        $this->actingAs($admin)
            ->post(route('admin.content.settings.update'), [
                'key' => StadiumImageService::SETTING_PREFIX.'amaan',
                'value' => $svg,
                'type' => 'image',
                'group' => 'stadiums',
            ])
            ->assertSessionHasErrors('value');

        $this->assertDatabaseMissing('site_settings', [
            'key' => StadiumImageService::SETTING_PREFIX.'amaan',
        ]);
    }

    public function test_catalogue_drives_the_venue_list_not_wikipedia(): void
    {
        // The core of the inversion: every catalogued ground becomes a venue
        // row, in config order, whether or not Wikipedia mentions it.
        $venues = $this->service->catalogueVenues('afcon_2027');

        $this->assertCount(12, $venues, 'All 12 AFCON grounds should be present.');

        $names = array_column($venues, 'name');
        $this->assertContains('Talanta Sports City Stadium', $names);
        $this->assertContains('Amaan Stadium', $names);

        // Config order is the presentation order the hero slider inherits.
        $this->assertSame('Talanta Sports City Stadium', $venues[0]['name']);
    }

    public function test_every_catalogue_venue_has_an_image_by_construction(): void
    {
        // The whole point of sourcing venues from config: a slide can no
        // longer exist without artwork behind it.
        foreach ($this->service->catalogueVenues('afcon_2027') as $venue) {
            $this->assertNotEmpty($venue['image'], "{$venue['name']} has no image.");
            $this->assertSame('local', $venue['image_source']);
            $this->assertNotEmpty($venue['wikipedia_title'], "{$venue['name']} has no article title.");
        }
    }

    public function test_catalogue_venues_carry_country_for_the_map_highlight(): void
    {
        $byName = collect($this->service->catalogueVenues('afcon_2027'))
            ->keyBy('name');

        $this->assertSame('ke', $byName['Nyayo National Stadium']['country_code']);
        $this->assertSame('Kenya', $byName['Nyayo National Stadium']['country']);
        $this->assertSame('ug', $byName['Mandela National Stadium']['country_code']);
        $this->assertSame('tz', $byName['Amaan Stadium']['country_code']);

        // Every row needs one, or that slide silently highlights nothing.
        foreach ($this->service->catalogueVenues('afcon_2027') as $venue) {
            $this->assertNotEmpty($venue['country_code'], "{$venue['name']} has no country_code.");
            $this->assertContains(
                $venue['country_code'],
                config('tournaments.tournaments.afcon_2027.host_flag_codes'),
                "{$venue['name']} names a country that is not a host."
            );
        }
    }

    public function test_has_catalogue_gates_the_inversion(): void
    {
        // Only catalogued tournaments take the new path; everything else keeps
        // the original Wikipedia-led behaviour.
        $this->assertTrue($this->service->hasCatalogue('afcon_2027'));
        $this->assertFalse($this->service->hasCatalogue('wc_2026'));
        $this->assertSame([], $this->service->catalogueVenues('wc_2026'));
    }

    public function test_an_admin_override_reaches_the_catalogue_venue_rows(): void
    {
        // The admin editor has to keep working against the new venue source,
        // not just against the old resolve() path.
        SiteSetting::set(
            StadiumImageService::SETTING_PREFIX.'dodoma',
            '/storage/assets/uploads/custom-dodoma.webp',
            'image',
            'stadiums'
        );
        $this->service->clearCache('afcon_2027');

        $dodoma = collect($this->service->catalogueVenues('afcon_2027'))
            ->firstWhere('slug', 'dodoma');

        $this->assertSame('/storage/assets/uploads/custom-dodoma.webp', $dodoma['image']);
        $this->assertTrue($dodoma['is_overridden']);
    }

    public function test_settings_endpoint_still_saves_plain_text_settings(): void
    {
        // The mimes rule is applied only on the file branch — a text setting
        // must still save, or the Page Heroes editor breaks.
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->post(route('admin.content.settings.update'), [
                'key' => 'page_hero_about_title',
                'value' => 'About The Football Experience',
                'type' => 'text',
                'group' => 'page_hero',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('site_settings', [
            'key' => 'page_hero_about_title',
            'value' => 'About The Football Experience',
        ]);
    }
}
