<?php

namespace App\Notifications;

use App\Mail\PaymentReceipt;
use App\Models\PaymentTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Notification;

// Added this line

// Added this line

class PaymentSuccessNotification extends Notification
{
    use Queueable;

    public $transaction;

    /**
     * Create a new notification instance.
     */
    public function __construct(PaymentTransaction $transaction)
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
        return (new PaymentReceipt($this->transaction))
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
            'message' => 'You have successfully added KES '.number_format($this->transaction->amount).' to your wallet.',
            'action_url' => route('fan.wallet'),
            'type' => 'payment_success',
            'amount' => $this->transaction->amount,
            'reference' => $this->transaction->reference,
        ];
    }
}
