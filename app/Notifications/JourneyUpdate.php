<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class JourneyUpdate extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public $updateData;

    public function __construct($updateData)
    {
        $this->updateData = $updateData;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Journey Update',
            'message' => $this->updateData['message'] ?? 'There is an update on your upcoming journey.',
            'action_url' => route('fan.journey'),
            'type' => 'journey',
            'booking_id' => $this->updateData['booking_id'] ?? null,
        ];
    }
}
