<?php

namespace Tests\Feature\Fan;

use App\Models\Tribe;
use App\Models\TribeJoinRequest;
use App\Models\TribePost;
use App\Models\TribePostReply;
use App\Models\User;
use App\Notifications\TribeAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * End-to-end coverage for tribes: privacy, the join-request flow, discussion
 * moderation and the denormalised counters.
 */
class TribeTest extends TestCase
{
    use RefreshDatabase;

    private function tribe(array $attributes = [], ?User $owner = null): Tribe
    {
        $owner ??= User::factory()->create();

        $tribe = Tribe::create(array_merge([
            'name' => 'Test Tribe '.uniqid(),
            'description' => 'A tribe for tests.',
            'created_by' => $owner->id,
            'privacy' => 'public',
            'tournament_id' => null,
        ], $attributes));

        $tribe->addMember($owner, 'admin');

        return $tribe->fresh();
    }

    // ── Listing ──────────────────────────────────────────────────────────

    public function test_index_lists_tribes_with_membership_flags(): void
    {
        $fan = User::factory()->create();
        $tribe = $this->tribe();

        $props = $this->actingAs($fan)->get(route('fan.tribes'))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertCount(1, $props['tribes']);
        $this->assertFalse($props['tribes'][0]['is_member']);
        $this->assertSame($tribe->id, $props['tribes'][0]['id']);
    }

    public function test_index_can_search_by_name(): void
    {
        $fan = User::factory()->create();
        $this->tribe(['name' => 'Kenya Ultras']);
        $this->tribe(['name' => 'Nigeria Green Eagles']);

        $props = $this->actingAs($fan)->get(route('fan.tribes', ['q' => 'Kenya']))
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertCount(1, $props['tribes']);
        $this->assertSame('Kenya Ultras', $props['tribes'][0]['name']);
    }

    // ── Creating ─────────────────────────────────────────────────────────

    public function test_creating_a_tribe_makes_the_creator_an_admin_member(): void
    {
        $fan = User::factory()->create();

        $this->actingAs($fan)->post(route('fan.tribes.store'), [
            'name' => 'Harambee Faithful',
            'description' => 'Kenya away days.',
            'privacy' => 'public',
        ])->assertRedirect();

        $tribe = Tribe::where('name', 'Harambee Faithful')->firstOrFail();

        $this->assertTrue($tribe->isAdmin($fan));
        $this->assertTrue($tribe->isOwner($fan));
        $this->assertSame(1, $tribe->member_count);
        $this->assertSame('harambee-faithful', $tribe->slug);
    }

    // ── Privacy ──────────────────────────────────────────────────────────

    public function test_a_public_tribe_can_be_joined_immediately(): void
    {
        $fan = User::factory()->create();
        $tribe = $this->tribe(['privacy' => 'public']);

        $this->actingAs($fan)->post(route('fan.tribes.join', $tribe->id));

        $this->assertTrue($tribe->fresh()->hasMember($fan));
        $this->assertSame(2, $tribe->fresh()->member_count);
    }

    public function test_a_private_tribe_cannot_be_joined_directly(): void
    {
        Notification::fake();

        $fan = User::factory()->create();
        $tribe = $this->tribe(['privacy' => 'private']);

        $this->actingAs($fan)->post(route('fan.tribes.join', $tribe->id), [
            'message' => 'Big fan, please let me in.',
        ]);

        // A request, not a membership.
        $this->assertFalse($tribe->fresh()->hasMember($fan));
        $this->assertDatabaseHas('tribe_join_requests', [
            'tribe_id' => $tribe->id,
            'user_id' => $fan->id,
            'status' => TribeJoinRequest::PENDING,
            'message' => 'Big fan, please let me in.',
        ]);

        Notification::assertSentTo($tribe->creator, TribeAlert::class);
    }

    public function test_an_invite_only_tribe_refuses_both_joins_and_requests(): void
    {
        $fan = User::factory()->create();
        $tribe = $this->tribe(['privacy' => 'invite_only']);

        $this->actingAs($fan)->post(route('fan.tribes.join', $tribe->id));

        $this->assertFalse($tribe->fresh()->hasMember($fan));
        $this->assertDatabaseCount('tribe_join_requests', 0);
    }

    public function test_a_private_tribe_shows_the_locked_page_to_a_non_member(): void
    {
        $fan = User::factory()->create();
        $tribe = $this->tribe(['privacy' => 'private']);

        $page = $this->actingAs($fan)->get(route('fan.tribes.show', $tribe->id))
            ->assertOk()
            ->viewData('page');

        $this->assertSame('Fan/TribeLocked', $page['component']);
    }

    public function test_a_public_tribe_is_readable_by_a_non_member(): void
    {
        $fan = User::factory()->create();
        $tribe = $this->tribe(['privacy' => 'public']);

        $page = $this->actingAs($fan)->get(route('fan.tribes.show', $tribe->id))
            ->assertOk()
            ->viewData('page');

        $this->assertSame('Fan/TribeDetail', $page['component']);
        $this->assertFalse($page['props']['tribe']['is_member']);
    }

    // ── Join requests ────────────────────────────────────────────────────

    public function test_an_admin_can_approve_a_join_request(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $fan = User::factory()->create();
        $tribe = $this->tribe(['privacy' => 'private'], $owner);

        $this->actingAs($fan)->post(route('fan.tribes.join', $tribe->id));
        $request = TribeJoinRequest::firstOrFail();

        $this->actingAs($owner)
            ->post(route('fan.tribes.requests.approve', [$tribe->id, $request->id]));

        $this->assertTrue($tribe->fresh()->hasMember($fan));
        $this->assertSame(TribeJoinRequest::APPROVED, $request->fresh()->status);
        Notification::assertSentTo($fan, TribeAlert::class);
    }

    public function test_an_admin_can_reject_a_join_request(): void
    {
        $owner = User::factory()->create();
        $fan = User::factory()->create();
        $tribe = $this->tribe(['privacy' => 'private'], $owner);

        $this->actingAs($fan)->post(route('fan.tribes.join', $tribe->id));
        $request = TribeJoinRequest::firstOrFail();

        $this->actingAs($owner)
            ->post(route('fan.tribes.requests.reject', [$tribe->id, $request->id]));

        $this->assertFalse($tribe->fresh()->hasMember($fan));
        $this->assertSame(TribeJoinRequest::REJECTED, $request->fresh()->status);
    }

    public function test_a_plain_member_cannot_decide_join_requests(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $applicant = User::factory()->create();
        $tribe = $this->tribe(['privacy' => 'private'], $owner);
        $tribe->addMember($member);

        $this->actingAs($applicant)->post(route('fan.tribes.join', $tribe->id));
        $request = TribeJoinRequest::firstOrFail();

        $this->actingAs($member)
            ->post(route('fan.tribes.requests.approve', [$tribe->id, $request->id]))
            ->assertSessionHasErrors('tribe');

        $this->assertFalse($tribe->fresh()->hasMember($applicant));
    }

    // ── Membership housekeeping ──────────────────────────────────────────

    public function test_joining_twice_does_not_inflate_the_member_count(): void
    {
        $fan = User::factory()->create();
        $tribe = $this->tribe();

        $this->actingAs($fan)->post(route('fan.tribes.join', $tribe->id));
        $this->actingAs($fan)->post(route('fan.tribes.join', $tribe->id));

        $this->assertSame(2, $tribe->fresh()->member_count);
        $this->assertSame(2, $tribe->members()->count());
    }

    public function test_the_last_admin_cannot_leave(): void
    {
        $owner = User::factory()->create();
        $tribe = $this->tribe([], $owner);

        $this->actingAs($owner)->post(route('fan.tribes.leave', $tribe->id));

        $this->assertTrue($tribe->fresh()->hasMember($owner));
    }

    public function test_an_admin_can_leave_once_another_admin_exists(): void
    {
        $owner = User::factory()->create();
        $second = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $tribe->addMember($second, 'admin');

        $this->actingAs($owner)->post(route('fan.tribes.leave', $tribe->id));

        $this->assertFalse($tribe->fresh()->hasMember($owner));
    }

    public function test_an_admin_can_promote_and_remove_a_member(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $tribe->addMember($member);

        $this->actingAs($owner)->post(route('fan.tribes.members.toggle-role', [$tribe->id, $member->id]));
        $this->assertTrue($tribe->fresh()->isAdmin($member));

        $this->actingAs($owner)->delete(route('fan.tribes.members.remove', [$tribe->id, $member->id]));
        $this->assertFalse($tribe->fresh()->hasMember($member));
        $this->assertSame(1, $tribe->fresh()->member_count);
    }

    public function test_the_owner_cannot_be_removed_or_demoted(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $tribe->addMember($admin, 'admin');

        $this->actingAs($admin)->post(route('fan.tribes.members.toggle-role', [$tribe->id, $owner->id]));
        $this->assertTrue($tribe->fresh()->isAdmin($owner));

        $this->actingAs($admin)->delete(route('fan.tribes.members.remove', [$tribe->id, $owner->id]));
        $this->assertTrue($tribe->fresh()->hasMember($owner));
    }

    // ── Discussions ──────────────────────────────────────────────────────

    public function test_a_member_can_post_and_the_posts_count_follows(): void
    {
        $owner = User::factory()->create();
        $tribe = $this->tribe([], $owner);

        $this->actingAs($owner)->post(route('fan.tribes.posts.store', $tribe->id), [
            'title' => 'Travel plans',
            'content' => 'Who is driving to Nairobi?',
        ]);

        $this->assertSame(1, $tribe->fresh()->posts_count);
        $this->assertDatabaseHas('tribe_posts', ['tribe_id' => $tribe->id, 'title' => 'Travel plans']);
    }

    public function test_a_non_member_cannot_post(): void
    {
        $outsider = User::factory()->create();
        $tribe = $this->tribe();

        $this->actingAs($outsider)->post(route('fan.tribes.posts.store', $tribe->id), [
            'content' => 'Let me in',
        ]);

        $this->assertDatabaseCount('tribe_posts', 0);
    }

    public function test_replying_notifies_the_thread_author_but_not_the_replier(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $member = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $tribe->addMember($member);

        $post = TribePost::create([
            'tribe_id' => $tribe->id,
            'user_id' => $owner->id,
            'content' => 'Kick off is at 4pm.',
        ]);

        $this->actingAs($member)->post(route('fan.tribes.posts.reply', [$tribe->id, $post->id]), [
            'content' => 'See you there.',
        ]);

        $this->assertDatabaseCount('tribe_post_replies', 1);
        Notification::assertSentTo($owner, TribeAlert::class);
        Notification::assertNotSentTo($member, TribeAlert::class);
    }

    public function test_replying_no_longer_inflates_the_view_count(): void
    {
        $owner = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $post = TribePost::create([
            'tribe_id' => $tribe->id,
            'user_id' => $owner->id,
            'content' => 'Hello',
        ]);

        $this->actingAs($owner)->post(route('fan.tribes.posts.reply', [$tribe->id, $post->id]), [
            'content' => 'Replying to myself',
        ]);

        $this->assertSame(0, (int) $post->fresh()->view_count);
    }

    public function test_opening_a_thread_counts_one_view_per_session(): void
    {
        $owner = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $post = TribePost::create([
            'tribe_id' => $tribe->id,
            'user_id' => $owner->id,
            'content' => 'Hello',
        ]);

        $this->actingAs($owner)->get(route('fan.tribes.posts.show', [$tribe->id, $post->id]))->assertOk();
        $this->assertSame(1, (int) $post->fresh()->view_count);

        // A reload in the same session must not count again.
        $this->actingAs($owner)->get(route('fan.tribes.posts.show', [$tribe->id, $post->id]))->assertOk();
        $this->assertSame(1, (int) $post->fresh()->view_count);
    }

    public function test_an_admin_can_pin_and_unpin_a_discussion(): void
    {
        $owner = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $post = TribePost::create([
            'tribe_id' => $tribe->id,
            'user_id' => $owner->id,
            'content' => 'Read me first',
        ]);

        $this->actingAs($owner)->post(route('fan.tribes.posts.pin', [$tribe->id, $post->id]));
        $this->assertTrue((bool) $post->fresh()->is_pinned);

        $this->actingAs($owner)->post(route('fan.tribes.posts.pin', [$tribe->id, $post->id]));
        $this->assertFalse((bool) $post->fresh()->is_pinned);
    }

    public function test_an_author_can_delete_their_own_discussion_but_not_someone_elses(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $tribe->addMember($member);

        $ownersPost = TribePost::create(['tribe_id' => $tribe->id, 'user_id' => $owner->id, 'content' => 'Mine']);
        $membersPost = TribePost::create(['tribe_id' => $tribe->id, 'user_id' => $member->id, 'content' => 'Theirs']);
        $tribe->syncCounts();

        // A plain member may not delete the owner's thread.
        $this->actingAs($member)->delete(route('fan.tribes.posts.destroy', [$tribe->id, $ownersPost->id]));
        $this->assertDatabaseHas('tribe_posts', ['id' => $ownersPost->id]);

        // But may delete their own.
        $this->actingAs($member)->delete(route('fan.tribes.posts.destroy', [$tribe->id, $membersPost->id]));
        $this->assertDatabaseMissing('tribe_posts', ['id' => $membersPost->id]);
        $this->assertSame(1, $tribe->fresh()->posts_count);
    }

    public function test_a_tribe_admin_can_moderate_any_reply(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $tribe->addMember($member);

        $post = TribePost::create(['tribe_id' => $tribe->id, 'user_id' => $owner->id, 'content' => 'Thread']);
        $reply = TribePostReply::create(['tribe_post_id' => $post->id, 'user_id' => $member->id, 'content' => 'Spam']);

        $this->actingAs($owner)->delete(route('fan.tribes.replies.destroy', [$tribe->id, $reply->id]));

        $this->assertDatabaseMissing('tribe_post_replies', ['id' => $reply->id]);
    }

    // ── Settings + deletion ──────────────────────────────────────────────

    public function test_an_admin_can_update_the_tribe(): void
    {
        $owner = User::factory()->create();
        $tribe = $this->tribe([], $owner);

        $this->actingAs($owner)->put(route('fan.tribes.update', $tribe->id), [
            'name' => 'Renamed Tribe',
            'description' => 'Fresh copy.',
            'privacy' => 'private',
        ]);

        $tribe->refresh();
        $this->assertSame('Renamed Tribe', $tribe->name);
        $this->assertSame('renamed-tribe', $tribe->slug);
        $this->assertSame('private', $tribe->privacy);
    }

    public function test_a_non_admin_cannot_update_the_tribe(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $tribe->addMember($member);

        $this->actingAs($member)->put(route('fan.tribes.update', $tribe->id), [
            'name' => 'Hijacked',
            'privacy' => 'public',
        ])->assertSessionHasErrors('tribe');

        $this->assertNotSame('Hijacked', $tribe->fresh()->name);
    }

    public function test_an_svg_banner_upload_is_refused(): void
    {
        $owner = User::factory()->create();
        $tribe = $this->tribe([], $owner);

        $svg = UploadedFile::fake()->createWithContent(
            'evil.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        );

        $this->actingAs($owner)->put(route('fan.tribes.update', $tribe->id), [
            'name' => $tribe->name,
            'privacy' => $tribe->privacy,
            'banner' => $svg,
        ])->assertSessionHasErrors('banner');
    }

    public function test_only_the_owner_can_delete_the_tribe(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $tribe = $this->tribe([], $owner);
        $tribe->addMember($admin, 'admin');

        // A promoted admin is not the owner.
        $this->actingAs($admin)->delete(route('fan.tribes.destroy', $tribe->id));
        $this->assertDatabaseHas('tribes', ['id' => $tribe->id]);

        $this->actingAs($owner)->delete(route('fan.tribes.destroy', $tribe->id))
            ->assertRedirect(route('fan.tribes'));
        $this->assertDatabaseMissing('tribes', ['id' => $tribe->id]);
        $this->assertDatabaseMissing('tribe_members', ['tribe_id' => $tribe->id]);
    }
}
