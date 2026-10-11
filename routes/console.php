<?php

use App\Models\Booking;
use App\Models\EventRsvp;
use App\Notifications\BookingHoldExpiringNotification;
use App\Support\ActivityNotifier;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Refresh tournament data from Wikipedia every night at 3am UTC
Schedule::command('tournaments:refresh')
    ->dailyAt('03:00')
    ->withoutOverlapping()
    ->onOneServer();

// Refresh news for all tournaments every 30 minutes
Schedule::call(function () {
    foreach (config('tournaments.tournaments', []) as $id => $config) {
        Cache::forget('news_feed:general:8');
        Cache::forget('news_feed:african:8');
        Cache::forget('news_feed:european:8');
        Cache::forget('news_feed:south_american:8');
        Cache::forget('news_feed:transfers:8');
    }
})->everyThirtyMinutes()->name('news:refresh-cache');

// Sprint 66 — remind fans once before an unpaid booking hold lapses (bell +
// opt-in text). The hold is 48h; this fires when 12h or less remain.
Artisan::command('bookings:remind-expiring', function () {
    $sent = 0;
    Booking::where('status', 'pending_payment')
        ->whereNull('hold_reminded_at')
        ->whereBetween('expires_at', [now(), now()->addHours(12)])
        ->with('user')
        ->each(function ($booking) use (&$sent) {
            $booking->user?->notify(new BookingHoldExpiringNotification($booking));
            $booking->forceFill(['hold_reminded_at' => now()])->save();
            $sent++;
        });
    $this->info("Reminded {$sent} booking(s).");
})->purpose('Remind fans whose booking hold ends within 12 hours');

Schedule::command('bookings:remind-expiring')->hourly()->withoutOverlapping()->onOneServer();

// Sprint 70 — remind fans the day before an event they said they're
// attending. Once per RSVP (event_rsvps.reminded_at).
Artisan::command('events:remind', function () {
    $sent = 0;
    EventRsvp::with(['event', 'user'])
        ->where('status', 'attending')
        ->whereNull('reminded_at')
        ->whereHas('event', fn ($q) => $q->whereDate('date', now()->addDay()->toDateString()))
        ->chunkById(200, function ($rsvps) use (&$sent) {
            foreach ($rsvps as $rsvp) {
                ActivityNotifier::notify($rsvp->user, [
                    'type' => 'event',
                    'title' => "Tomorrow: {$rsvp->event->title}",
                    'body' => $rsvp->event->location ?: 'You said you are going.',
                    'icon' => 'fas fa-calendar-check',
                    'action_url' => route('fan.events'),
                ]);
                $rsvp->update(['reminded_at' => now()]);
                $sent++;
            }
        });
    $this->info("Sent {$sent} event reminder(s).");
})->purpose('Remind attending fans the day before an event');

Schedule::command('events:remind')->dailyAt('08:05')->withoutOverlapping()->onOneServer();
