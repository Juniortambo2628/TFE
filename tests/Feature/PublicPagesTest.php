<?php

namespace Tests\Feature;

use App\Http\Middleware\PublicPageCopy;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The public pages (v2 design, the site since Nov 2026): plain addresses,
 * indexable, with the page copy shared from config/landing_v2.php + CMS.
 */
class PublicPagesTest extends TestCase
{
    use RefreshDatabase;

    private const SECTIONS = [
        'about' => 'Sections/About',
        'features' => 'Sections/Features',
        'services' => 'Sections/Services',
        'news' => 'Sections/News',
        'contact' => 'Sections/Contact',
        'partners.index' => 'PartnersIndex',
        'learn.index' => 'Learn/Index',
        'community.tribes' => 'Community/Tribes',
    ];

    public function test_each_public_page_renders_its_page_and_can_be_indexed(): void
    {
        foreach (self::SECTIONS as $name => $component) {
            $res = $this->get(route($name))->assertOk();
            $page = $res->viewData('page');

            $this->assertSame($component, $page['component'], $name);
            $this->assertNull($res->headers->get('X-Robots-Tag'), "{$name} is indexable");
            $this->assertArrayHasKey('about', $page['props']['v2Pages'], "{$name} gets the page copy");
        }
    }

    public function test_a_partner_hub_renders_and_a_missing_one_is_404(): void
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'airline', 'verification_status' => 'verified']);
        PartnerProfile::create([
            'user_id' => $partner->id,
            'slug' => 'simba-air',
            'display_name' => 'Simba Air',
            'is_public' => true,
            'published_at' => now(),
        ]);

        $props = $this->get(route('partners.hub', 'simba-air'))->assertOk()->viewData('page')['props'];
        $this->assertSame('Simba Air', $props['profile']['display_name']);
        $this->get(route('partners.hub', 'nobody'))->assertNotFound();
    }

    public function test_section_pages_get_the_landing_pieces_they_reuse(): void
    {
        $about = $this->get(route('about'))->viewData('page')['props'];
        $this->assertArrayHasKey('audiences', $about['landing']);
        $this->assertArrayHasKey('facts', $about);

        $services = $this->get(route('services'))->viewData('page')['props'];
        $this->assertArrayHasKey('partners', $services['landing']);
        $this->assertArrayHasKey('partnerTypeLabels', $services);

        $this->assertArrayHasKey('faq', $this->get(route('contact'))->viewData('page')['props']['landing']);
    }

    public function test_the_v2_page_copy_is_editable_per_page_in_the_cms(): void
    {
        $admin = User::factory()->admin()->create();
        $fields = $this->actingAs($admin)->get(route('admin.content'))->viewData('page')['props']['landingFields'];
        $groups = array_unique(array_column($fields, 'group'));

        $this->assertContains('pages.about', $groups);
        $this->assertContains('pages.hub', $groups);
    }

    /** Every public page reads its copy from `v2Pages`; a route left out of
     *  the PublicPageCopy group renders a blank page. */
    public function test_every_public_page_route_shares_the_page_copy(): void
    {
        $public = ['about', 'features', 'services', 'news', 'contact', 'tournaments.show', 'community.tribes',
            'community.tribes.show', 'partners.index', 'partners.hub', 'learn.index', 'learn.show', 'listings.show'];

        foreach ($public as $name) {
            $route = app('router')->getRoutes()->getByName($name);
            $this->assertNotNull($route, $name);
            $this->assertContains(PublicPageCopy::class, $route->gatherMiddleware(), "{$name} shares v2Pages");
        }
    }
}
