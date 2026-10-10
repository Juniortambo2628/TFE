<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sprint 66 — payment received for a booking (bell + opt-in text).
 * Not queued: it is sent inside the payment callback, and a fan who just paid
 * should see the bell change on the page that callback lands on.
 */
class BookingPaidNotification extends Notification
{
    use Queueable;

    public function __construct(public Booking $booking, public float $amount, public string $currency) {}

    public function via(object $notifiable): array
    {
        return ['database', SmsChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        $paidUp = $this->booking->status === 'confirmed';

        return [
            'title' => $paidUp ? 'Booking confirmed' : 'Payment received',
            'body' => number_format($this->amount, 2).' '.$this->currency.' received for '.$this->booking->package_name.'.'
                .($paidUp ? ' Your partner will arrange the rest.' : ''),
            'icon' => 'fas fa-check-circle',
            'action_url' => route('fan.bookings.show', $this->booking),
            'type' => 'booking_paid',
            'booking_id' => $this->booking->id,
        ];
    }

    public function toSms(object $notifiable): string
    {
        return 'TFE: we received '.number_format($this->amount, 2).' '.$this->currency
            .' for '.$this->booking->package_name.'. Details: '.route('fan.bookings.show', $this->booking);
    }
}
