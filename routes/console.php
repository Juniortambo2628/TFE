<?php

use App\Models\Booking;
use App\Notifications\BookingHoldExpiringNotification;
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
