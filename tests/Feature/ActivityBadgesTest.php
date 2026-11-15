<?php

namespace Tests\Feature;

use App\Models\Message;
use App\Models\User;
use App\Notifications\ActivityNotification;
use App\Support\ActivityBadges;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Sidebar / top-nav badges for new activity (Sprint 70). */
class ActivityBadgesTest extends TestCase
{
    use RefreshDatabase;

    private function ping(User $u, string $type, int $times = 1): void
    {
        for ($i = 0; $i < $times; $i++) {
            $u->notify(new ActivityNotification(['type' => $type, 'title' => 't']));
        }
    }

    public function test_unread_activity_is_counted_per_section(): void
    {
        $fan = User::factory()->create();
        $this->ping($fan, 'social', 2);
        $this->ping($fan, 'event');
        Message::create(['user_id' => $fan->id, 'subject' => 's', 'body' => 'b', 'is_read' => false]);

        // Unread messages are NOT in here: they are shared on their own as
        // unreadMessagesCount, which the client adds to the Messages row and
        // the envelope (lib/activityCounts). Counting them here as well made
        // one unread message read "2" (Nov 2026).
        $this->assertSame(
            ['fan.feed' => 2, 'fan.events' => 1],
            ActivityBadges::for($fan),
        );
    }

    public function test_an_unread_message_is_counted_once(): void
    {
        $fan = User::factory()->create();
        Message::create(['user_id' => $fan->id, 'subject' => 's', 'body' => 'b', 'is_read' => false]);

        $auth = $this->actingAs($fan)->get(route('fan.dashboard'))->viewData('page')['props']['auth'];
        $this->assertSame(1, $auth['unreadMessagesCount']);
        $this->assertArrayNotHasKey('fan.communication', $auth['activityBadges']);
    }

    public function test_opening_the_bell_marks_its_notifications_read(): void
    {
        $fan = User::factory()->create();
        $this->ping($fan, 'booking_hold_expiring');
        $this->ping($fan, 'social');

        $this->actingAs($fan)->postJson(route('notifications.seen'))->assertNoContent();

        $this->assertSame(0, $fan->unreadNotifications()->count());
    }

    public function test_opening_the_envelope_reads_messages_and_announcements_only(): void
    {
        $fan = User::factory()->create();
        Message::create(['user_id' => $fan->id, 'subject' => 's', 'body' => 'b', 'is_read' => false]);
        $this->ping($fan, 'announcement');
        $this->ping($fan, 'social');

        $this->actingAs($fan)->postJson(route('messages.seen'))->assertNoContent();

        $this->assertSame(0, $fan->receivedMessages()->where('is_read', false)->count());
        // The announcement was on the Messages page; the like was not.
        $this->assertSame(['fan.feed' => 1], ActivityBadges::for($fan));
    }

    public function test_marking_seen_needs_a_signed_in_user(): void
    {
        $this->postJson(route('notifications.seen'))->assertUnauthorized();
        $this->postJson(route('messages.seen'))->assertUnauthorized();
    }

    public function test_badges_are_shared_with_every_page(): void
    {
        $fan = User::factory()->create();
        $this->ping($fan, 'event');

        $props = $this->actingAs($fan)->get(route('fan.dashboard'))->viewData('page')['props'];
        $this->assertSame(['fan.events' => 1], $props['auth']['activityBadges']);
    }

    public function test_opening_a_section_clears_its_badge_and_only_its_badge(): void
    {
        $fan = User::factory()->create();
        $this->ping($fan, 'social');
        $this->ping($fan, 'event');

        $props = $this->actingAs($fan)->get(route('fan.events'))->viewData('page')['props'];

        $this->assertSame(['fan.feed' => 1], $props['auth']['activityBadges']);
    }
}
