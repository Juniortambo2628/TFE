<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Opt-in in-app checkout (Sprint 65). Empty = partner checkout links only.
    'paystack' => [
        'public' => env('PAYSTACK_PUBLIC_KEY'),
        'secret' => env('PAYSTACK_SECRET_KEY'),
        // KES charged per USD when a USD booking is paid by M-Pesa. Empty =
        // M-Pesa only for bookings already in KES.
        'kes_per_usd' => env('PAYSTACK_KES_PER_USD'),
    ],

    // Safaricom Daraja. Staged (Nov 2026) for a direct M-Pesa integration —
    // nothing reads these yet: M-Pesa checkout currently runs through
    // Paystack's mobile_money channel (see 'paystack' above).
    'mpesa' => [
        'env' => env('MPESA_ENV', 'sandbox'),
        'shortcode' => env('MPESA_SHORTCODE'),
        'consumer_key' => env('MPESA_CONSUMER_KEY'),
        'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
        'passkey' => env('MPESA_PASSKEY'),
        // KES charged per USD for a direct STK push. Blank falls back to the
        // Paystack rate below so one number stays the truth (Sprint 66 rule).
        'kes_per_usd' => env('MPESA_KES_PER_USD'),
    ],

    // Opt-in SMS / WhatsApp alerts (Sprint 66). Empty = messages are logged only.
    'africastalking' => [
        'username' => env('AT_USERNAME'),
        'key' => env('AT_API_KEY'),
        'sender_id' => env('AT_SENDER_ID'),
        'whatsapp_number' => env('AT_WHATSAPP_NUMBER'),
    ],

    'newsapi' => [
        'key' => env('NEWSAPI_KEY'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('APP_URL').'/auth/google/callback',
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
