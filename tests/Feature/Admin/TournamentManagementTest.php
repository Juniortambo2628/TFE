<?php

namespace Tests\Feature\Admin;

use App\Models\SiteSetting;
use App\Models\User;
use App\Services\TournamentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Admin → Tournaments: the one place tournament configuration lives.
 *
 * Before this, the featured pick, the Wikipedia refresh, taglines, accents,
 * trophies and hero backgrounds were a tab of Site Settings; venue imagery was
 * a tab of Content Management; and the organiser card watermark
 * (`tournament_card_bg_{id}`) had no admin surface at all despite
 * TournamentService reading it.
 */
class TournamentManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function firstTournamentId(): string
    {
        return array_key_first(config('tournaments.tournaments'));
    }

    public function test_the_index_lists_every_configured_tournament(): void
    {
        $props = $this->actingAs($this->admin())
            ->get(route('admin.tournaments.index'))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertCount(count(config('tournaments.tournaments')), $props['tournaments']);
        $this->assertArrayHasKey('override_count', $props['tournaments'][0]);
    }

    public function test_the_index_counts_overrides_per_tournament(): void
    {
        $id = $this->firstTournamentId();
        SiteSetting::set("tournament_tagline_{$id}", 'Custom tagline', 'text', 'tournament');
        SiteSetting::set("tournament_card_bg_{$id}", '/storage/card.png', 'image', 'tournament');

        $props = $this->actingAs($this->admin())
            ->get(route('admin.tournaments.index'))
            ->viewData('page')['props'];

        $row = collect($props['tournaments'])->firstWhere('id', $id);
        $this->assertSame(2, $row['override_count']);
    }

    public function test_the_edit_page_reports_each_field_with_its_default(): void
    {
        $id = $this->firstTournamentId();

        $props = $this->actingAs($this->admin())
            ->get(route('admin.tournaments.edit', $id))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame($id, $props['tournament']['id']);

        // Every editable field, including the organiser card watermark that
        // previously had no UI at all.
        foreach (['tagline', 'accent', 'trophy_image', 'hero_image', 'organizer_card_bg'] as $field) {
            $this->assertArrayHasKey($field, $props['fields'], $field);
            $this->assertArrayHasKey('default', $props['fields'][$field], $field);
        }

        $this->assertSame("tournament_card_bg_{$id}", $props['fields']['organizer_card_bg']['setting_key']);
    }

    public function test_an_unknown_tournament_404s(): void
    {
        $this->actingAs($this->admin())
            ->get(route('admin.tournaments.edit', 'not_a_tournament'))
            ->assertNotFound();
    }

    public function test_saving_text_fields_writes_the_override_keys_the_service_reads(): void
    {
        $id = $this->firstTournamentId();

        $this->actingAs($this->admin())->post(route('admin.tournaments.update', $id), [
            'tagline' => 'One continent, one cup.',
            'accent' => '#00ff88',
        ])->assertRedirect();

        $this->assertSame('One continent, one cup.', SiteSetting::get("tournament_tagline_{$id}"));
        $this->assertSame('#00ff88', SiteSetting::get("tournament_accent_{$id}"));

        // And the assembled payload picks them up (cache was invalidated).
        $payload = app(TournamentService::class)->get($id);
        $this->assertSame('One continent, one cup.', $payload['tagline']);
        $this->assertSame('#00ff88', $payload['color_accent']);
    }

    public function test_uploading_the_organiser_card_watermark_is_stored_and_served(): void
    {
        Storage::fake('public');
        $id = $this->firstTournamentId();

        $this->actingAs($this->admin())->post(route('admin.tournaments.update', $id), [
            'organizer_card_bg' => UploadedFile::fake()->image('caf.png', 1200, 800),
        ])->assertRedirect();

        $saved = SiteSetting::get("tournament_card_bg_{$id}");
        $this->assertStringStartsWith('/storage/tournaments/', $saved);

        $this->assertSame($saved, app(TournamentService::class)->get($id)['organizer_card_bg']);
    }

    public function test_an_svg_upload_is_refused(): void
    {
        Storage::fake('public');
        $id = $this->firstTournamentId();

        $this->actingAs($this->admin())->post(route('admin.tournaments.update', $id), [
            'trophy_image' => UploadedFile::fake()->createWithContent(
                'evil.svg',
                '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            ),
        ])->assertSessionHasErrors('trophy_image');

        $this->assertNull(SiteSetting::get("tournament_trophy_{$id}"));
    }

    public function test_clearing_an_image_restores_the_config_default(): void
    {
        $id = $this->firstTournamentId();
        SiteSetting::set("tournament_trophy_{$id}", '/storage/custom.png', 'image', 'tournament');

        $this->actingAs($this->admin())->post(route('admin.tournaments.update', $id), [
            'clear_trophy_image' => true,
        ])->assertRedirect();

        $this->assertSame('', SiteSetting::get("tournament_trophy_{$id}"));
        $this->assertSame(
            config("tournaments.tournaments.{$id}.trophy_image"),
            app(TournamentService::class)->get($id)['trophy_image'],
        );
    }

    public function test_featuring_a_tournament_sets_the_site_wide_default(): void
    {
        $id = array_key_last(config('tournaments.tournaments'));

        $this->actingAs($this->admin())
            ->post(route('admin.tournaments.feature'), ['tournament' => $id])
            ->assertRedirect();

        $this->assertSame($id, SiteSetting::get('active_tournament'));
    }

    public function test_featuring_an_unknown_tournament_404s(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.tournaments.feature'), ['tournament' => 'nope'])
            ->assertNotFound();

        $this->assertNull(SiteSetting::get('active_tournament'));
    }

    public function test_a_non_admin_cannot_reach_tournament_management(): void
    {
        $fan = User::factory()->create(['is_admin' => false]);

        $this->actingAs($fan)->get(route('admin.tournaments.index'))->assertForbidden();
        $this->actingAs($fan)
            ->post(route('admin.tournaments.update', $this->firstTournamentId()), ['tagline' => 'nope'])
            ->assertForbidden();
    }

    public function test_config_tournament_images_are_root_relative(): void
    {
        // Same guard as the section cards: a bare `assets/...` path resolves
        // against the current directory and 404s on any nested route, which is
        // exactly how the hero backdrops came to 404 under /admin.
        foreach (config('tournaments.tournaments') as $id => $cfg) {
            foreach (['hero_image', 'trophy_image', 'organizer_card_bg'] as $field) {
                if (empty($cfg[$field])) {
                    continue;
                }
                $this->assertMatchesRegularExpression(
                    '#^(?:https?://|/)#',
                    $cfg[$field],
                    "tournaments.{$id}.{$field} must be absolute or root-relative",
                );
            }
        }
    }
}
