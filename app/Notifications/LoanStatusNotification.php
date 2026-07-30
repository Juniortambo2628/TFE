<?php

namespace App\Notifications;

use App\Models\LoanApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LoanStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public LoanApplication $loan,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): \Illuminate\Notifications\Messages\MailMessage
    {
        $status = strtolower($this->loan->status);
        $amount = number_format($this->loan->amount);

        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('Loan Application '.ucfirst($status))
            ->line("Your loan application for KES {$amount} has been {$status}.")
            ->action('View Application', route('fan.wallet'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Loan Application '.ucfirst($this->loan->status),
            'message' => 'Your loan application for KES '.number_format($this->loan->amount).' has been '.strtolower($this->loan->status).'.',
            'action_url' => route('fan.wallet'),
            'type' => 'loan_status_update',
            'loan_id' => $this->loan->id,
            'status' => $this->loan->status,
            'amount' => $this->loan->amount,
        ];
    }
}
