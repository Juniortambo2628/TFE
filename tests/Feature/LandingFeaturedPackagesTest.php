<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Listing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Bookable packages on the landing page (Sprint 70). */
class LandingFeaturedPackagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_public_bookable_trips_are_featured(): void
    {
        $package = Listing::factory()->create(['tournament_id' => 'afcon_2027', 'type' => 'package', 'moderation_status' => 'approved']);
        $tour = Listing::factory()->create(['tournament_id' => 'afcon_2027', 'type' => 'tour', 'moderation_status' => 'approved']);
        Listing::factory()->create(['tournament_id' => 'afcon_2027', 'type' => 'offer', 'moderation_status' => 'approved']);
        Listing::factory()->create(['tournament_id' => 'afcon_2027', 'type' => 'package', 'moderation_status' => 'pending']);
        Listing::factory()->create(['tournament_id' => 'afcon_2027', 'type' => 'package', 'moderation_status' => 'approved', 'is_active' => false]);

        $res = $this->get('/', [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
            'X-Inertia-Partial-Component' => 'Home',
            'X-Inertia-Partial-Data' => 'featuredPackages',
        ]);

        $ids = array_column($res->json('props.featuredPackages'), 'id');
        sort($ids);
        $this->assertSame([$package->id, $tour->id], $ids);
    }

    public function test_the_first_paint_does_not_wait_for_them(): void
    {
        $page = $this->get('/')->viewData('page');

        $this->assertArrayNotHasKey('featuredPackages', $page['props']);
        $this->assertContains('featuredPackages', $page['deferredProps']['default']);
    }
}
