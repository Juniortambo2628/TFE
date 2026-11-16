<?php

/*
| OKJT kit settings TFE overrides (docs/proposals/okjt-kit-migration.md,
| phase 0). Only top-level keys set here replace the kit's own
| (vendor/okjt/laravel-kit/config/okjt.php); everything else is the kit's.
*/

return [

    'security_headers' => [
        'enabled' => true,
        'headers' => [
            'X-Frame-Options' => 'SAMEORIGIN',
            'X-XSS-Protection' => '1; mode=block',
            'X-Content-Type-Options' => 'nosniff',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains',
        ],
        'csp' => [
            'default-src' => ["'self'"],
            'script-src' => ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://fonts.googleapis.com'],
            'style-src' => ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            'font-src' => ["'self'", 'https://fonts.gstatic.com'],
            'img-src' => ["'self'", 'data:', 'https:', 'blob:'],
            'connect-src' => ["'self'", 'https:', 'wss:'],
        ],
        // TFE's own sources: the Figtree font comes from Bunny Fonts.
        'csp_extra' => [
            'style-src' => ['https://fonts.bunny.net'],
            'font-src' => ['https://fonts.bunny.net'],
        ],
        // Reported, not enforced, until browsers have shown what else the
        // pages load (maps, video embeds, payment pages).
        'csp_report_only' => true,
    ],

];
