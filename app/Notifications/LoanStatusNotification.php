<?php

namespace App\Notifications;

use App\Models\LoanApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoanStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public LoanApplication $loan,
    ) {}

    public function via(object $notifiable): array
    {
        // Database only — the mail channel isn't configured in this
        // environment yet; adding it back only fires SMTP errors in the
        // approval flow. In-app dropdown is the source of truth for now.
        return ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $status = strtolower($this->loan->status);
        $amount = number_format($this->loan->amount);

        // Kept for future re-enable of the mail channel — via() is
        // database-only today. Currency matches the fan surfaces (USD).
        return (new MailMessage)
            ->subject('Loan Application '.ucfirst($status))
            ->line("Your loan application for USD {$amount} has been {$status}.")
            ->action('View Application', route('fan.loan-applications'));
    }

    public function toArray(object $notifiable): array
    {
        $status = strtolower($this->loan->status);
        $amount = 'USD '.number_format($this->loan->amount);
        $partner = $this->loan->financePartner?->partnerProfile?->display_name;

        $iconByStatus = [
            'approved' => 'fas fa-check-circle',
            'disbursed' => 'fas fa-hand-holding-usd',
            'rejected' => 'fas fa-times-circle',
        ];

        return [
            // Shape read by the shared header dropdown: title + body + icon.
            'title' => 'Loan '.ucfirst($status),
            'body' => $partner
                ? "{$partner} {$status} your application for {$amount}."
                : "Your loan application for {$amount} was {$status}.",
            'icon' => $iconByStatus[$status] ?? 'fas fa-file-invoice-dollar',
            'action_url' => route('fan.loan-applications'),
            'type' => 'loan_status_update',
            'loan_id' => $this->loan->id,
            'status' => $this->loan->status,
            'amount' => $this->loan->amount,
        ];
    }
}
