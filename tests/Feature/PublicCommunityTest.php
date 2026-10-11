<?php

namespace Tests\Feature;

use App\Http\Controllers\CommunityController;
use App\Models\Post;
use App\Models\Tribe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The public face of the community (Sprint 70). */
class PublicCommunityTest extends TestCase
{
    use RefreshDatabase;

    private function tribe(string $privacy, string $name): Tribe
    {
        return Tribe::create([
            'name' => $name, 'description' => "About {$name}", 'privacy' => $privacy,
            'created_by' => User::factory()->create()->id, 'tournament_id' => 'afcon_2027',
        ]);
    }

    public function test_only_public_top_level_posts_are_previewed(): void
    {
        $fan = User::factory()->create();
        $public = Post::create(['user_id' => $fan->id, 'content' => 'everyone', 'visibility' => 'public']);
        Post::create(['user_id' => $fan->id, 'content' => 'friends only', 'visibility' => 'friends']);
        Post::create(['user_id' => $fan->id, 'content' => 'a reply', 'visibility' => 'public', 'parent_post_id' => $public->id]);

        $ids = array_column(CommunityController::preview('afcon_2027')['posts'], 'id');

        $this->assertSame([$public->id], $ids);
    }

    public function test_invite_only_tribes_are_never_listed_or_shown(): void
    {
        $this->tribe('public', 'Open Crew');
        $this->tribe('private', 'Request Crew');
        $secret = $this->tribe('invite_only', 'Secret Crew');

        $names = array_column($this->get(route('community.tribes'))->viewData('page')['props']['tribes'], 'name');
        sort($names);
        $this->assertSame(['Open Crew', 'Request Crew'], $names);

        $this->get(route('community.tribes.show', $secret->slug))->assertNotFound();
    }

    public function test_a_tribe_page_shows_no_posts_or_members_to_a_visitor(): void
    {
        $tribe = $this->tribe('public', 'Open Crew');

        $props = $this->get(route('community.tribes.show', $tribe->slug))->assertOk()->viewData('page')['props'];

        $this->assertSame('Open Crew', $props['tribe']['name']);
        $this->assertArrayNotHasKey('posts', $props['tribe']);
        $this->assertArrayNotHasKey('members', $props['tribe']);
    }

    public function test_joining_signs_up_then_lands_on_the_tribe(): void
    {
        $tribe = $this->tribe('private', 'Request Crew');

        $this->get(route('community.tribes.join', $tribe->slug))
            ->assertRedirect(route('register'))
            ->assertSessionHas('url.intended', route('fan.tribes.show', $tribe));
    }

    public function test_a_signed_in_fan_goes_straight_to_the_real_tribe_page(): void
    {
        $tribe = $this->tribe('public', 'Open Crew');

        $this->actingAs(User::factory()->create())
            ->get(route('community.tribes.show', $tribe->slug))
            ->assertRedirect(route('fan.tribes.show', $tribe));
    }
}
