<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
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
        \Illuminate\Support\Facades\Cache::forget('news_feed:general:8');
        \Illuminate\Support\Facades\Cache::forget('news_feed:african:8');
        \Illuminate\Support\Facades\Cache::forget('news_feed:european:8');
        \Illuminate\Support\Facades\Cache::forget('news_feed:south_american:8');
        \Illuminate\Support\Facades\Cache::forget('news_feed:transfers:8');
    }
})->everyThirtyMinutes()->name('news:refresh-cache');
