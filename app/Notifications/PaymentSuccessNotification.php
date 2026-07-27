<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Mail\Mailable; // Added this line
use App\Models\PaymentTransaction; // Added this line

class PaymentSuccessNotification extends Notification
{
    use Queueable;

    public $transaction;

    /**
     * Create a new notification instance.
     */
    public function __construct(\App\Models\PaymentTransaction $transaction)
    {
        $this->transaction = $transaction;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): Mailable
    {
        return (new \App\Mail\PaymentReceipt($this->transaction))
            ->to($notifiable->email);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Payment Successful',
            'message' => 'You have successfully added KES ' . number_format($this->transaction->amount) . ' to your wallet.',
            'action_url' => route('fan.wallet'),
            'type' => 'payment_success',
            'amount' => $this->transaction->amount,
            'reference' => $this->transaction->reference,
        ];
    }
}
