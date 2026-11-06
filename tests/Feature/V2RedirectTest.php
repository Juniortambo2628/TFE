<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * One design since Nov 2026: the plain public addresses serve it and can be
 * indexed, and the comparison-period /v2 addresses redirect there
 * permanently, query kept, so links shared during the comparison still work.
 */
class V2RedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_plain_addresses_serve_the_pages_and_can_be_indexed(): void
    {
        foreach (['/' => 'Home', '/about' => 'Sections/About', '/partners' => 'PartnersIndex', '/learn' => 'Learn/Index', '/tribes' => 'Community/Tribes', '/for-fans' => 'Walkthrough'] as $path => $component) {
            $response = $this->get($path)->assertOk();
            $this->assertSame($component, $response->viewData('page')['component'], $path);
            $this->assertFalse($response->headers->has('X-Robots-Tag'), "{$path} is indexable");
        }
    }

    public function test_v2_addresses_redirect_permanently_and_keep_the_query(): void
    {
        $this->get('/v2')->assertStatus(301)->assertRedirect('/');
        $this->get('/v2/about')->assertStatus(301)->assertRedirect('/about');
        $this->get('/v2/partners/serengeti?type=airline')->assertStatus(301)->assertRedirect('/partners/serengeti?type=airline');
        $this->get('/v2/learn/some-guide')->assertStatus(301)->assertRedirect('/learn/some-guide');
    }
}
