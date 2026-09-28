<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\User;
use Database\Seeders\DemoCredentials;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 63 — a listing is readable without an account.
 *
 * Every public surface linked to `fan.packages.show`, which sits behind the
 * fan auth gate, so a visitor browsing a partner's public hub was bounced to
 * the login screen the moment they clicked a package — before they had seen
 * what was on offer.
 */
class PublicListingPageTest extends TestCase
{
    use RefreshDatabase;

    private function publishedListing(array $attributes = []): Listing
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'travel_agent']);

        // Slug is unique — derive it from the user so the helper can be
        // called more than once in a test.
        PartnerProfile::create([
            'user_id' => $partner->id,
            'slug' => 'serengeti-sports-travel-'.$partner->id,
            'display_name' => 'Serengeti Sports Travel',
            'is_public' => true,
        ]);

        return Listing::factory()->create(array_merge([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'approved',
            'is_active' => true,
        ], $attributes));
    }

    public function test_a_guest_can_read_a_published_listing(): void
    {
        $listing = $this->publishedListing(['name' => 'AFCON Group Stage Weekend']);

        $response = $this->get(route('listings.show', $listing->id));

        $response->assertStatus(200);
        $props = $response->viewData('page')['props'];

        $this->assertSame('AFCON Group Stage Weekend', $props['listing']['name']);
        // The partner is named, so a stranger knows who is behind it.
        $this->assertSame('Serengeti Sports Travel', $props['listing']['publisher']['display_name']);
    }

    public function test_the_page_never_redirects_a_guest_to_login(): void
    {
        // The whole point. A 302 to /login here is the bug this closes.
        $listing = $this->publishedListing();

        $this->get(route('listings.show', $listing->id))->assertStatus(200);
        $this->assertGuest();
    }

    public function test_unpublished_listings_are_404_not_403(): void
    {
        // 404 rather than 403 so the response does not confirm the id exists
        // (Sprint 22).
        foreach ([
            ['moderation_status' => 'draft', 'is_active' => true],
            ['moderation_status' => 'rejected', 'is_active' => true],
            ['moderation_status' => 'approved', 'is_active' => false],
        ] as $state) {
            $listing = $this->publishedListing($state);

            $this->get(route('listings.show', $listing->id))->assertStatus(404);
        }
    }

    public function test_it_carries_the_listings_own_tournament_not_the_session_one(): void
    {
        // A public link must describe the same thing for everyone who opens
        // it, whatever tournament happens to be in their session.
        $listing = $this->publishedListing(['tournament_id' => 'afcon_2027']);

        $props = $this->withSession(['active_tournament_id' => 'euro_2024'])
            ->get(route('listings.show', $listing->id))
            ->viewData('page')['props'];

        $this->assertSame('afcon_2027', $props['tournament']['id']);
    }

    public function test_an_unknown_tournament_id_yields_null_rather_than_the_default(): void
    {
        // TournamentService::get() falls back to the default tournament for an
        // unknown id, so it can never double as an existence check (Sprint 49).
        $listing = $this->publishedListing(['tournament_id' => 'not_a_tournament']);

        $props = $this->get(route('listings.show', $listing->id))->viewData('page')['props'];

        $this->assertNull($props['tournament']);
    }

    public function test_more_from_the_partner_shows_only_their_published_listings(): void
    {
        $listing = $this->publishedListing(['name' => 'The one being viewed']);

        Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $listing->publisher_id,
            'name' => 'Another published one',
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);
        Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $listing->publisher_id,
            'name' => 'A draft nobody should see',
            'moderation_status' => 'draft',
            'is_active' => true,
        ]);
        // A different partner's listing must not appear under "more from".
        $other = $this->publishedListing(['name' => "Someone else's"]);

        $more = $this->get(route('listings.show', $listing->id))
            ->viewData('page')['props']['more'];

        $names = collect($more)->pluck('name')->all();

        $this->assertSame(['Another published one'], $names);
        $this->assertNotContains('A draft nobody should see', $names);
        $this->assertNotContains("Someone else's", $names);
        $this->assertNotSame($other->publisher_id, $listing->publisher_id);
    }

    public function test_the_seeded_demo_password_follows_config(): void
    {
        // The deploy seeds automatically now, so `password` on a reachable
        // site would be a known credential — including for admin@tfe.com.
        $this->assertSame('password', DemoCredentials::password());
        $this->assertTrue(DemoCredentials::isDefault());

        config(['app.demo_account_password' => 'a-real-one']);

        $this->assertSame('a-real-one', DemoCredentials::password());
        $this->assertFalse(DemoCredentials::isDefault());

        // An empty string is not a password — fall back rather than seed
        // accounts nobody can sign into.
        config(['app.demo_account_password' => '']);
        $this->assertSame('password', DemoCredentials::password());
    }
}
