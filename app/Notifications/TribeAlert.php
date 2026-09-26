<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Tribe activity — a join request lodged, a request decided, a reply posted.
 *
 * Database channel only: SMTP is not configured on this platform and adding a
 * `mail` channel makes the sending request 500. Queued like the other
 * fan-out notifications so a busy tribe does not block the request that
 * triggered it.
 */
class TribeAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public array $alertData) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * The shape DashboardHeader.jsx renders: title, body, icon, action_url,
     * type. The old payload used a `message` key the bell never read, so every
     * tribe notification rendered with an empty body.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $tribeId = $this->alertData['tribe_id'] ?? null;

        return [
            'title' => $this->alertData['title'] ?? 'Tribe update',
            'body' => $this->alertData['body'] ?? 'New activity in your tribe.',
            'icon' => $this->alertData['icon'] ?? 'fas fa-users',
            'action_url' => $this->alertData['action_url']
                ?? ($tribeId ? route('fan.tribes.show', $tribeId) : route('fan.tribes')),
            'type' => 'tribe',
            'tribe_id' => $tribeId,
        ];
    }
}
