<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Sprint 66 — a held booking is about to lapse unpaid (bell + opt-in text).
 * Sent once per booking by `bookings:remind-expiring`.
 */
class BookingHoldExpiringNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    public function via(object $notifiable): array
    {
        return ['database', SmsChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Your booking hold ends soon',
            'body' => $this->booking->package_name.' is held until '.$this->booking->expires_at?->format('D j M, H:i').'. Pay to keep your place.',
            'icon' => 'fas fa-hourglass-end',
            'action_url' => route('fan.bookings.show', $this->booking),
            'type' => 'booking_hold_expiring',
            'booking_id' => $this->booking->id,
        ];
    }

    public function toSms(object $notifiable): string
    {
        return 'TFE: your hold on '.$this->booking->package_name.' ends '.$this->booking->expires_at?->format('D j M H:i')
            .'. Pay to keep your place: '.route('fan.bookings.show', $this->booking);
    }
}
