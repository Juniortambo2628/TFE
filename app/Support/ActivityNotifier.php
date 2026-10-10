<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\ActivityNotification;
use Illuminate\Support\Facades\Notification;

/**
 * The one way activity reaches the bell (Sprint 70).
 *
 *  - never notify someone about their own action;
 *  - `dedupe` collapses repeats: like → unlike → like is one notification
 *    while the first is still unread, not three;
 *  - fan-out (announcements, events) goes through Notification::send in
 *    chunks, so 10,000 fans is 10,000 queued rows, not one huge query.
 */
class ActivityNotifier
{
    public static function notify(?User $recipient, array $payload, ?User $actor = null): void
    {
        if (! $recipient || ($actor && $actor->id === $recipient->id)) {
            return;
        }

        $payload['actor_id'] = $actor?->id;

        if (! empty($payload['dedupe'])) {
            $exists = $recipient->unreadNotifications()
                ->where('type', ActivityNotification::class)
                ->where('data->dedupe', $payload['dedupe'])
                ->exists();

            if ($exists) {
                return;
            }
        }

        $recipient->notify(new ActivityNotification($payload));
    }

    /** Every fan account (not partners, admins or institutions). */
    public static function broadcastToFans(array $payload): void
    {
        User::query()
            ->where('is_partner', false)
            ->where('is_admin', false)
            ->where(fn ($q) => $q->whereNull('account_type')->orWhere('account_type', 'individual'))
            ->chunkById(500, fn ($fans) => Notification::send($fans, new ActivityNotification($payload)));
    }
}
