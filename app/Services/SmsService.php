<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Text messages via Africa's Talking (Sprint 66) — SMS, and WhatsApp where the
 * account has it enabled. With no credentials every message is written to the
 * log instead of sent, so dev and tests need nothing configured.
 */
class SmsService
{
    public function configured(): bool
    {
        return filled(config('services.africastalking.username')) && filled(config('services.africastalking.key'));
    }

    public function send(string $phone, string $message, string $channel = 'sms'): bool
    {
        if (! $this->configured()) {
            Log::info("[sms:{$channel}] to {$phone}: {$message}");

            return true;
        }

        try {
            if ($channel === 'whatsapp' && filled(config('services.africastalking.whatsapp_number'))) {
                Http::withHeaders(['apiKey' => config('services.africastalking.key')])
                    ->acceptJson()->timeout(10)
                    ->post('https://chat.africastalking.com/whatsapp/message/send', [
                        'username' => config('services.africastalking.username'),
                        'waNumber' => config('services.africastalking.whatsapp_number'),
                        'phoneNumber' => $phone,
                        'body' => ['message' => $message],
                    ])->throw();

                return true;
            }

            Http::withHeaders(['apiKey' => config('services.africastalking.key')])
                ->asForm()->acceptJson()->timeout(10)
                ->post('https://api.africastalking.com/version1/messaging', array_filter([
                    'username' => config('services.africastalking.username'),
                    'to' => $phone,
                    'message' => $message,
                    'from' => config('services.africastalking.sender_id'),
                ]))->throw();

            return true;
        } catch (\Throwable $e) {
            Log::warning('SMS send failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Normalise a typed number to E.164. Bare local numbers are read as Kenyan
     * (07…/01… → +2547…/+2541…), the platform's home market; anything else
     * must be typed with its country code.
     */
    public static function normalise(string $raw): ?string
    {
        $digits = preg_replace('/[^\d+]/', '', $raw);
        if (preg_match('/^0([17]\d{8})$/', $digits, $m)) {
            return '+254'.$m[1];
        }
        if (preg_match('/^\+?([1-9]\d{7,14})$/', $digits, $m)) {
            return '+'.$m[1];
        }

        return null;
    }
}
