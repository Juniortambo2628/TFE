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

        $this->assertSame(
            ['fan.feed' => 2, 'fan.events' => 1, 'fan.communication' => 1],
            ActivityBadges::for($fan),
        );
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
