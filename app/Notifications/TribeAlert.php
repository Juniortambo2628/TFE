<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TribeAlert extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public $alertData;

    public function __construct($alertData)
    {
        $this->alertData = $alertData;
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
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->line('The introduction to the notification.')
            ->action('Notification Action', url('/'))
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Tribe Alert',
            'message' => $this->alertData['message'] ?? 'New activity in your tribe.',
            'action_url' => route('fan.tribes'),
            'type' => 'tribe',
            'tribe_id' => $this->alertData['tribe_id'] ?? null,
        ];
    }
}
