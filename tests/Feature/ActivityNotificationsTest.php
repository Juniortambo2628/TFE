<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\Message;
use App\Models\Post;
use App\Models\User;
use App\Notifications\ActivityNotification;
use Database\Seeders\WorldCupSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 70: the bell showed nothing but a seeded welcome message because no
 * social or community action notified anyone, and every deploy re-seeded
 * that welcome.
 */
class ActivityNotificationsTest extends TestCase
{
    use RefreshDatabase;

    private function activityFor(User $user)
    {
        return $user->fresh()->notifications()->where('type', ActivityNotification::class)->get();
    }

    public function test_liking_a_post_notifies_its_author_once(): void
    {
        $author = User::factory()->create();
        $fan = User::factory()->create(['name' => 'Amina']);
        $post = Post::create(['user_id' => $author->id, 'content' => 'Kasarani tonight!']);

        $this->actingAs($fan)->post(route('fan.feed.like', $post));
        $this->actingAs($fan)->post(route('fan.feed.like', $post)); // unlike
        $this->actingAs($fan)->post(route('fan.feed.like', $post)); // like again

        $sent = $this->activityFor($author);
        $this->assertCount(1, $sent, 'like → unlike → like is one unread notification');
        $this->assertSame('Amina liked your post', $sent->first()->data['title']);
        $this->assertSame('social', $sent->first()->data['type']);
    }

    public function test_your_own_actions_never_notify_you(): void
    {
        $author = User::factory()->create();
        $post = Post::create(['user_id' => $author->id, 'content' => 'mine']);

        $this->actingAs($author)->post(route('fan.feed.like', $post));
        $this->actingAs($author)->post(route('fan.feed.comment', $post), ['content' => 'me again']);

        $this->assertCount(0, $this->activityFor($author));
    }

    public function test_comments_and_follows_notify(): void
    {
        $author = User::factory()->create();
        $fan = User::factory()->create();
        $post = Post::create(['user_id' => $author->id, 'content' => 'hello']);

        $this->actingAs($fan)->post(route('fan.feed.comment', $post), ['content' => 'great']);
        $this->actingAs($fan)->post(route('fan.follow.toggle', $author));

        $titles = $this->activityFor($author)->pluck('data.title')->all();
        $this->assertContains("{$fan->name} commented on your post", $titles);
        $this->assertContains("{$fan->name} started following you", $titles);
    }

    public function test_a_new_upcoming_event_reaches_fans_but_not_partners_or_admins(): void
    {
        $admin = User::factory()->admin()->create();
        $fan = User::factory()->create();
        $partner = User::factory()->partner()->create();

        $this->actingAs($admin)->post(route('admin.events.store'), [
            'title' => 'Watch party', 'date' => now()->addWeek()->toDateString(), 'location' => 'Nairobi',
        ])->assertSessionHasNoErrors();

        $this->assertSame('New event: Watch party', $this->activityFor($fan)->first()->data['title']);
        $this->assertCount(0, $this->activityFor($partner));
        $this->assertCount(0, $this->activityFor($admin));
    }

    public function test_attending_fans_are_reminded_once_the_day_before(): void
    {
        $fan = User::factory()->create();
        $event = Event::create(['title' => 'Fan fest', 'date' => now()->addDay()->toDateString()]);
        EventRsvp::create(['user_id' => $fan->id, 'event_id' => $event->id, 'status' => 'attending']);

        $this->artisan('events:remind')->assertSuccessful();
        $this->artisan('events:remind')->assertSuccessful();

        $sent = $this->activityFor($fan);
        $this->assertCount(1, $sent);
        $this->assertSame('Tomorrow: Fan fest', $sent->first()->data['title']);
    }

    public function test_opening_a_notification_marks_it_read_and_follows_its_link(): void
    {
        $fan = User::factory()->create();
        $fan->notify(new ActivityNotification(['type' => 'social', 'title' => 'x', 'action_url' => route('fan.feed')]));
        $n = $fan->notifications()->first();

        $this->actingAs($fan)->get(route('notifications.open', $n->id))->assertRedirect(route('fan.feed'));
        $this->assertNotNull($n->fresh()->read_at);
    }

    public function test_an_off_site_action_url_is_not_followed(): void
    {
        $fan = User::factory()->create();
        $fan->notify(new ActivityNotification(['type' => 'social', 'title' => 'x', 'action_url' => 'https://evil.example/phish']));
        $n = $fan->notifications()->first();

        $res = $this->actingAs($fan)->from(route('fan.feed'))->get(route('notifications.open', $n->id));
        $res->assertRedirect(route('fan.feed'));
    }

    public function test_you_cannot_open_someone_elses_notification(): void
    {
        $owner = User::factory()->create();
        $owner->notify(new ActivityNotification(['type' => 'social', 'title' => 'x']));

        $this->actingAs(User::factory()->create())
            ->get(route('notifications.open', $owner->notifications()->first()->id))
            ->assertNotFound();
    }

    public function test_re_seeding_does_not_repeat_the_welcome_message(): void
    {
        User::factory()->create();
        $this->seed(WorldCupSeeder::class);
        $this->seed(WorldCupSeeder::class);

        $this->assertSame(1, Message::where('subject', 'Welcome to TFE!')->count());
    }
}
