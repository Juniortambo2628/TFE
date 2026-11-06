<?php

namespace Tests\Feature;

use App\Models\Fixture;
use App\Models\PartnerProfile;
use App\Models\SiteSetting;
use App\Models\User;
use App\Support\LandingContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The landing page (/) and the audience walkthroughs (/for-fans,
 * /for-partners, /for-schools) — UX review, 2 Nov 2026, Track C.
 */
class LandingV2Test extends TestCase
{
    use RefreshDatabase;

    private function publicPartner(string $type, string $verification = 'verified'): User
    {
        $user = User::factory()->partner()->create([
            'partner_type' => $type,
            'verification_status' => $verification,
        ]);
        PartnerProfile::create([
            'user_id' => $user->id,
            'display_name' => $user->name,
            'is_public' => true,
            'published_at' => now(),
        ]);

        return $user;
    }

    public function test_the_landing_page_renders_its_copy_and_can_be_indexed(): void
    {
        $res = $this->get(route('index'))->assertOk();

        $this->assertNull($res->headers->get('X-Robots-Tag'));
        $page = $res->viewData('page');
        $this->assertSame('Home', $page['component']);
        $this->assertSame(config('landing_v2.hero.title'), $page['props']['content']['hero']['title']);
        // Walkthrough copy has its own pages; v2 does not ship it.
        $this->assertArrayNotHasKey('walkthroughs', $page['props']['content']);
    }

    public function test_facts_are_counted_not_typed_and_a_zero_is_left_out(): void
    {
        $tournament = config('tournaments.default');
        foreach (['Kenya', 'Uganda'] as $i => $home) {
            Fixture::create([
                'tournament_id' => $tournament,
                'date' => '2027-01-1'.($i + 5),
                'time' => '19:00',
                'home_team' => $home,
                'away_team' => 'Tanzania',
                'venue' => 'Raila Odinga International Stadium',
                'stage' => 'Group Stage',
            ]);
        }
        $this->publicPartner('travel_agent');
        $this->publicPartner('airline', 'pending'); // public but not verified: not counted
        Fixture::create([
            'tournament_id' => 'some_other_cup',
            'date' => '2027-02-01',
            'time' => '19:00',
            'home_team' => 'A',
            'away_team' => 'B',
            'venue' => 'X',
            'stage' => 'Final',
        ]);

        $facts = $this->get(route('index'))->viewData('page')['props']['facts'];

        $this->assertSame(2, $facts['matches'], 'Only the active tournament\'s matches.');
        $this->assertSame(1, $facts['partners'], 'Only verified, public partners.');
    }

    public function test_with_no_matches_the_matches_fact_is_dropped(): void
    {
        Fixture::query()->delete();

        $facts = $this->get(route('index'))->viewData('page')['props']['facts'];

        $this->assertArrayNotHasKey('matches', $facts);
    }

    public function test_partner_chips_count_public_partners_per_type(): void
    {
        $this->publicPartner('travel_agent');
        $this->publicPartner('travel_agent', 'pending');
        $hidden = User::factory()->partner()->create(['partner_type' => 'airline']);
        PartnerProfile::create(['user_id' => $hidden->id, 'display_name' => 'Hidden', 'is_public' => false]);

        $props = $this->get(route('index'))->viewData('page')['props'];

        // The directory lists unverified public partners too, so the chip
        // that links to it counts the same rows.
        $this->assertSame(2, $props['partnerCounts']['travel_agent']);
        $this->assertArrayNotHasKey('airline', $props['partnerCounts']);
        $this->assertSame('Travel Agent', $props['partnerTypeLabels']['travel_agent']);
    }

    public function test_an_admin_override_changes_the_wording_but_never_the_wiring(): void
    {
        SiteSetting::set('landing_v2_hero.title', 'Your trip, sorted.', 'text', 'landing_v2');
        SiteSetting::set('landing_v2_faq.items.0.a', 'Edited answer.', 'text', 'landing_v2');
        SiteSetting::set('landing_v2_explorer.areas.0.desktop', '/evil.png', 'text', 'landing_v2');
        SiteSetting::set('landing_v2_explorer.areas.0.action', 'link://evil.example', 'text', 'landing_v2');
        SiteSetting::set('landing_v2_closing.title', '   ', 'text', 'landing_v2'); // blank = default

        $content = $this->get(route('index'))->viewData('page')['props']['content'];

        $this->assertSame('Your trip, sorted.', $content['hero']['title']);
        $this->assertSame('Edited answer.', $content['faq']['items'][0]['a']);
        $this->assertSame(config('landing_v2.explorer.areas.0.desktop'), $content['explorer']['areas'][0]['desktop']);
        $this->assertSame(config('landing_v2.explorer.areas.0.action'), $content['explorer']['areas'][0]['action']);
        $this->assertSame(config('landing_v2.closing.title'), $content['closing']['title']);
    }

    public function test_each_audience_has_a_walkthrough_and_no_other_does(): void
    {
        foreach (['fans', 'partners', 'schools'] as $audience) {
            $res = $this->get(route('walkthrough', $audience))->assertOk();
            $page = $res->viewData('page');

            $this->assertSame('Walkthrough', $page['component']);
            $this->assertSame(config("landing_v2.walkthroughs.{$audience}.headline"), $page['props']['page']['headline']);
            $this->assertNotEmpty($page['props']['page']['chapters']);
            $this->assertNull($res->headers->get('X-Robots-Tag'));
        }

        $this->get('/for-nobody')->assertNotFound();
    }

    public function test_every_image_the_pages_show_is_committed_and_root_relative(): void
    {
        $paths = [];
        foreach (config('landing_v2.audiences') as $a) {
            $paths[] = $a['image'];
        }
        foreach (config('landing_v2.explorer.areas') as $area) {
            $paths[] = $area['desktop'];
            $paths[] = $area['phone'];
        }
        foreach (config('landing_v2.walkthroughs') as $w) {
            $paths[] = $w['background'];
            foreach ($w['chapters'] as $c) {
                $paths[] = $c['image'];
                if ($c['phone']) {
                    $paths[] = $c['phone'];
                }
            }
        }

        foreach (array_unique($paths) as $path) {
            $this->assertStringStartsWith('/', $path, "{$path} must be root-relative (Sprint 49).");
            $this->assertFileExists(public_path(ltrim($path, '/')), "{$path} is not committed.");
        }
    }

    public function test_the_admin_editor_lists_every_text_field_and_no_wiring(): void
    {
        $admin = User::factory()->admin()->create();

        $fields = $this->actingAs($admin)->get(route('admin.content'))->viewData('page')['props']['landingFields'];
        $keys = array_column($fields, 'key');

        $this->assertContains('landing_v2_hero.title', $keys);
        $this->assertContains('landing_v2_walkthroughs.schools.cta.label', $keys);
        foreach ($keys as $key) {
            $last = last(explode('.', $key));
            $this->assertNotContains($last, LandingContent::STRUCTURAL, "{$key} is wiring, not wording.");
        }
    }
}
