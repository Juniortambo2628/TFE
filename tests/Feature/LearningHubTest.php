<?php

namespace Tests\Feature;

use App\Models\LearningResource;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 60 — the public Learning Hub at /learn.
 */
class LearningHubTest extends TestCase
{
    use RefreshDatabase;

    private function resource(array $attrs = []): LearningResource
    {
        return LearningResource::create(array_merge([
            'title' => 'Planning your first session',
            'summary' => 'A four-part structure.',
            'category' => 'coaching',
            'audience' => 'coach',
            'level' => 'intro',
            'is_published' => true,
        ], $attrs));
    }

    public function test_index_lists_published_resources_only(): void
    {
        $this->resource(['title' => 'Published one']);
        $this->resource(['title' => 'Draft one', 'is_published' => false]);

        $response = $this->get(route('learn.index'));
        $response->assertStatus(200);

        $titles = array_column($response->viewData('page')['props']['resources'], 'title');

        $this->assertContains('Published one', $titles);
        $this->assertNotContains('Draft one', $titles);
    }

    public function test_filters_narrow_by_category_and_audience(): void
    {
        $this->resource(['title' => 'Coaching one', 'category' => 'coaching', 'audience' => 'coach']);
        $this->resource(['title' => 'Safeguarding one', 'category' => 'safeguarding', 'audience' => 'administrator']);
        $this->resource(['title' => 'For parents', 'category' => 'coaching', 'audience' => 'parent']);

        $byCategory = $this->get(route('learn.index', ['category' => 'safeguarding']));
        $this->assertSame(
            ['Safeguarding one'],
            array_column($byCategory->viewData('page')['props']['resources'], 'title'),
        );

        $byAudience = $this->get(route('learn.index', ['audience' => 'parent']));
        $this->assertSame(
            ['For parents'],
            array_column($byAudience->viewData('page')['props']['resources'], 'title'),
        );
    }

    public function test_an_unknown_filter_shows_everything_rather_than_nothing(): void
    {
        // An empty grid reads as "we have no resources", which is a different
        // and wrong claim from "that filter does not exist".
        $this->resource();

        $response = $this->get(route('learn.index', ['category' => 'not-a-category']));

        $this->assertCount(1, $response->viewData('page')['props']['resources']);
    }

    public function test_show_renders_a_published_resource_and_404s_otherwise(): void
    {
        $this->resource(['title' => 'Readable', 'slug' => 'readable']);
        $this->resource(['title' => 'Hidden', 'slug' => 'hidden', 'is_published' => false]);

        $this->get(route('learn.show', 'readable'))->assertStatus(200);
        // A draft must 404, not render — `published()` is the gate on both
        // the index and the detail page.
        $this->get(route('learn.show', 'hidden'))->assertStatus(404);
        $this->get(route('learn.show', 'no-such-thing'))->assertStatus(404);
    }

    public function test_related_are_same_category_and_exclude_the_resource_itself(): void
    {
        $this->resource(['title' => 'Main', 'slug' => 'main', 'category' => 'coaching']);
        $this->resource(['title' => 'Sibling', 'slug' => 'sibling', 'category' => 'coaching']);
        $this->resource(['title' => 'Elsewhere', 'slug' => 'elsewhere', 'category' => 'officiating']);

        $props = $this->get(route('learn.show', 'main'))->viewData('page')['props'];
        $titles = array_column($props['related'], 'title');

        $this->assertSame(['Sibling'], $titles);
    }

    public function test_slug_is_derived_from_the_title_but_never_clobbers_one_set(): void
    {
        $this->assertSame('planning-your-first-session', $this->resource()->slug);
        $this->assertSame('chosen', $this->resource(['title' => 'Other', 'slug' => 'chosen'])->slug);
    }

    public function test_publisher_summary_matches_the_listing_shape(): void
    {
        // PoweredByBadge renders both, so the two must not drift.
        $partner = User::factory()->partner()->create(['partner_type' => 'school_community']);
        PartnerProfile::create([
            'user_id' => $partner->id,
            'slug' => 'schools-body',
            'display_name' => 'Schools Body',
            'theme_accent' => '#15803d',
            'is_public' => true,
        ]);

        $resource = $this->resource([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
        ]);

        $this->assertSame(
            ['slug', 'display_name', 'logo_url', 'theme_accent', 'verified'],
            array_keys($resource->publisherSummary()),
        );
    }

    public function test_an_admin_authored_resource_has_no_publisher_block(): void
    {
        $this->assertNull($this->resource()->publisherSummary());
    }

    public function test_config_page_hero_backgrounds_are_root_relative(): void
    {
        // Sprint 49 rooted config/tournaments.php and config/site_sections.php
        // and guarded both; config/site_pages.php was missed, and all five of
        // its backgrounds were bare. A relative path 404s on a nested route.
        foreach (config('site_pages') as $slug => $page) {
            if (! isset($page['background'])) {
                continue;
            }

            $this->assertStringStartsWith(
                '/',
                $page['background'],
                "site_pages.{$slug}.background must be root-relative",
            );
        }
    }
}
