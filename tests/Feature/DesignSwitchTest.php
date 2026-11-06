<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * v2 is the site (Nov 2026, config app.design). The public pages render
 * their V2 pages at the plain addresses and can be indexed, /v2/... redirects
 * there permanently, every account gets the new dashboard, and the v1
 * fallback brings the old pages back with one setting.
 */
class DesignSwitchTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_plain_addresses_serve_v2_and_can_be_indexed(): void
    {
        $this->assertSame('v2', config('app.design'));

        foreach (['/' => 'HomeV2', '/about' => 'V2/Sections/About', '/partners' => 'V2/PartnersIndex', '/learn' => 'V2/Learn/Index', '/tribes' => 'V2/Community/Tribes'] as $path => $component) {
            $response = $this->get($path)->assertOk();
            $this->assertSame($component, $response->viewData('page')['component'], $path);
            $this->assertFalse($response->headers->has('X-Robots-Tag'), "{$path} is indexable");
        }

        $walkthrough = $this->get('/for-fans')->assertOk();
        $this->assertFalse($walkthrough->headers->has('X-Robots-Tag'));
    }

    public function test_preview_addresses_redirect_permanently_and_keep_the_query(): void
    {
        $this->get('/v2')->assertStatus(301)->assertRedirect('/');
        $this->get('/v2/about')->assertStatus(301)->assertRedirect('/about');
        $this->get('/v2/partners/serengeti?type=airline')->assertStatus(301)->assertRedirect('/partners/serengeti?type=airline');
        $this->get('/v2/learn')->assertStatus(301)->assertRedirect('/learn');
    }

    public function test_every_account_gets_the_new_dashboard(): void
    {
        $user = User::factory()->create(['dashboard_v2' => false]);

        $this->actingAs($user)->get('/')->assertInertia(fn ($page) => $page->where('design', 'v2'));
    }

    public function test_the_v1_fallback_restores_the_old_pages(): void
    {
        config(['app.design' => 'v1']);

        $this->assertSame('Home', $this->get('/')->viewData('page')['component']);
        $this->assertSame('Sections/About', $this->get('/about')->viewData('page')['component']);
        $this->get('/v2/about')->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow');
        $this->get('/v2')->assertOk();
    }
}
