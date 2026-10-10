<?php

namespace App\Notifications\Channels;

use App\Models\NotificationContact;
use App\Services\SmsService;
use Illuminate\Notifications\Notification;

/**
 * Delivers a notification's `toSms()` text to the fan's VERIFIED opt-in
 * number (Sprint 66). A fan with no verified number simply gets nothing here;
 * the database channel still carries the alert to the bell.
 */
class SmsChannel
{
    public function __construct(private SmsService $sms) {}

    public function send($notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toSms')) {
            return;
        }

        $contact = NotificationContact::where('user_id', $notifiable->id)->whereNotNull('verified_at')->first();
        if (! $contact) {
            return;
        }

        $this->sms->send($contact->phone, $notification->toSms($notifiable), $contact->channel);
    }
}
