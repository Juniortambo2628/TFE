<?php

namespace Tests\Feature;

use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The /v2 twins of the public pages (UX review, Nov 2026): same controller
 * action, same data, the V2/ page, kept out of search results.
 */
class V2PublicPagesTest extends TestCase
{
    use RefreshDatabase;

    /** Written for the comparison period: v1 at the plain addresses, v2 under /v2. That is the v1 fallback now (config app.design); DesignSwitchTest covers v2 as the default. */
    protected function setUp(): void
    {
        parent::setUp();
        config(['app.design' => 'v1']);
    }

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

    public function test_each_v2_page_renders_its_twin_and_stays_out_of_search(): void
    {
        foreach (self::SECTIONS as $name => $component) {
            $res = $this->get(route("v2.{$name}"))->assertOk();
            $page = $res->viewData('page');

            $this->assertSame("V2/{$component}", $page['component'], $name);
            $this->assertStringContainsString('noindex', (string) $res->headers->get('X-Robots-Tag'), $name);
            $this->assertArrayHasKey('about', $page['props']['v2Pages'], "{$name} gets the v2 page copy");
        }
    }

    public function test_the_v1_pages_are_unchanged(): void
    {
        foreach (self::SECTIONS as $name => $component) {
            $res = $this->get(route($name))->assertOk();

            $this->assertSame($component, $res->viewData('page')['component'], $name);
            $this->assertNull($res->headers->get('X-Robots-Tag'), "{$name} is still indexable");
            $this->assertArrayNotHasKey('v2Pages', $res->viewData('page')['props']);
        }
    }

    public function test_both_versions_show_the_same_data(): void
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'airline', 'verification_status' => 'verified']);
        PartnerProfile::create([
            'user_id' => $partner->id,
            'slug' => 'simba-air',
            'display_name' => 'Simba Air',
            'is_public' => true,
            'published_at' => now(),
        ]);

        $v1 = $this->get(route('partners.hub', 'simba-air'))->viewData('page')['props'];
        $v2 = $this->get(route('v2.partners.hub', 'simba-air'))->assertOk()->viewData('page')['props'];

        $this->assertSame($v1['profile'], $v2['profile']);
        $this->assertSame($v1['steps'], $v2['steps']);
        $this->get(route('v2.partners.hub', 'nobody'))->assertNotFound();
    }

    public function test_v2_section_pages_get_the_landing_pieces_they_reuse(): void
    {
        $about = $this->get(route('v2.about'))->viewData('page')['props'];
        $this->assertArrayHasKey('audiences', $about['landing']);
        $this->assertArrayHasKey('facts', $about);

        $services = $this->get(route('v2.services'))->viewData('page')['props'];
        $this->assertArrayHasKey('partners', $services['landing']);
        $this->assertArrayHasKey('partnerTypeLabels', $services);

        $this->assertArrayHasKey('faq', $this->get(route('v2.contact'))->viewData('page')['props']['landing']);
        // The v1 page does not pay for any of it.
        $this->assertArrayNotHasKey('landing', $this->get(route('about'))->viewData('page')['props']);
    }

    public function test_the_v2_page_copy_is_editable_per_page_in_the_cms(): void
    {
        $admin = User::factory()->admin()->create();
        $fields = $this->actingAs($admin)->get(route('admin.content'))->viewData('page')['props']['landingFields'];
        $groups = array_unique(array_column($fields, 'group'));

        $this->assertContains('pages.about', $groups);
        $this->assertContains('pages.hub', $groups);
    }
}
