<?php

namespace App\Notifications\Channels;

use App\Models\User;
use App\Services\WebPushService;
use Illuminate\Notifications\Notification;

/**
 * Wakes the notifiable's devices after the notification is stored (Nov 2026).
 * List it AFTER 'database' in via(): the push carries nothing, and the
 * service worker shows the newest stored notification (WebPushService).
 */
class WebPushChannel
{
    public function __construct(private WebPushService $push) {}

    public function send($notifiable, Notification $notification): void
    {
        if ($notifiable instanceof User) {
            $this->push->wake($notifiable);
        }
    }
}
