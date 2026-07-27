<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoginAlertNotification extends Notification
{
    protected $loginData;

    public function __construct(array $loginData)
    {
        $this->loginData = $loginData;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $ip = $this->loginData['ip_address'] ?? 'Unknown';
        $device = $this->loginData['device'] ?? 'Unknown Device';
        $location = $this->loginData['location'] ?? 'Unknown Location';
        $time = $this->loginData['time'] ?? now()->format('M d, Y \a\t h:i A');

        return (new MailMessage)
            ->subject('New Login Alert – The Football Experience')
            ->greeting("Hello {$notifiable->name},")
            ->line('A new login was detected on your account.')
            ->line("**Device:** {$device}")
            ->line("**IP Address:** {$ip}")
            ->line("**Location:** {$location}")
            ->line("**Time:** {$time}")
            ->line('If this was you, no action is needed.')
            ->action('Review Security Settings', url('/fan/security'))
            ->line('If this wasn\'t you, please change your password immediately and enable two-factor authentication.')
            ->salutation('Stay safe, The Football Experience Team');
    }
}
