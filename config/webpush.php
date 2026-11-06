<?php

/*
| Web push (installable website, Nov 2026 — docs/proposals/mobile-app.md).
|
| VAPID keys identify TFE to the browsers' push services. Generate them once
| with `php artisan webpush:vapid` and put the two lines it prints in the
| production .env. With no keys, push is simply off: the opt-in never shows
| and nothing is sent.
|
| `subject` is how a push service contacts us about abuse: a mailto: or an
| https: URL.
*/
return [
    'public_key' => env('WEBPUSH_VAPID_PUBLIC_KEY'),
    'private_key' => env('WEBPUSH_VAPID_PRIVATE_KEY'),
    'subject' => env('WEBPUSH_SUBJECT', 'mailto:info@wctfe.com'),
    // How long a push service may hold a push for a phone that is off.
    'ttl' => (int) env('WEBPUSH_TTL', 86400),
];
