<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Social and community activity for the bell (Sprint 70): likes, comments,
 * reposts, follows, messages, shares, new announcements and events, event
 * reminders.
 *
 * Replaces four classes nothing ever sent — SocialAlert,
 * CommunicationReceived, JourneyUpdate and FanActivityNotification (which was
 * mail-only, and SMTP is not configured). That is why a fan's bell showed
 * nothing but the seeded welcome message: none of this activity notified
 * anyone. Send it through App\Support\ActivityNotifier, which drops
 * self-notifications and repeats.
 *
 * `type` is what the sidebar badges count by (see ActivityBadges).
 */
class ActivityNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public const TYPES = ['social', 'message', 'announcement', 'event', 'tribe'];

    public function __construct(public array $payload) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** The shape DashboardHeader.jsx renders. */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->payload['title'],
            'body' => $this->payload['body'] ?? '',
            'icon' => $this->payload['icon'] ?? 'fas fa-bell',
            'action_url' => $this->payload['action_url'] ?? null,
            'type' => $this->payload['type'],
            'dedupe' => $this->payload['dedupe'] ?? null,
            'actor_id' => $this->payload['actor_id'] ?? null,
        ];
    }
}
