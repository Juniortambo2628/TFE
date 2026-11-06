<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use App\Support\WebPush\Vapid;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Wakes a person's devices (Nov 2026). Each push is EMPTY — a signed nudge
 * with no payload. The service worker answers it by fetching the person's
 * newest notification from TFE over their own session (`push.latest`) and
 * showing that.
 *
 * Why no payload: a payload must be encrypted per device (RFC 8291), and
 * even encrypted it passes through Google's, Apple's and Mozilla's push
 * services. Empty pushes need only the VAPID signature, keep what a fan is
 * told on TFE's own servers, and make a revoked session show nothing.
 */
class WebPushService
{
    public function enabled(): bool
    {
        return filled(config('webpush.public_key')) && filled(config('webpush.private_key'));
    }

    /** Push to every device of `$user`. Returns how many accepted it. */
    public function wake(User $user): int
    {
        if (! $this->enabled()) {
            return 0;
        }

        $sent = 0;
        foreach (PushSubscription::where('user_id', $user->id)->get() as $sub) {
            $sent += $this->send($sub) ? 1 : 0;
        }

        return $sent;
    }

    public function send(PushSubscription $sub): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => Vapid::authorization(
                    $sub->endpoint,
                    config('webpush.public_key'),
                    config('webpush.private_key'),
                    config('webpush.subject'),
                ),
                'TTL' => (string) config('webpush.ttl', 86400),
                'Urgency' => 'normal',
            ])->timeout(10)->withBody('', 'application/octet-stream')->post($sub->endpoint);
        } catch (Throwable $e) {
            // A push is a courtesy on top of the bell; never fail the request.
            Log::warning('Web push failed', ['subscription' => $sub->id, 'error' => $e::class]);

            return false;
        }

        // Gone or unknown: the person removed TFE or turned alerts off in the
        // browser. The subscription will never work again.
        if (in_array($response->status(), [404, 410], true)) {
            $sub->delete();

            return false;
        }

        if ($response->successful()) {
            $sub->forceFill(['last_pushed_at' => now()])->save();

            return true;
        }

        Log::warning('Web push refused', ['subscription' => $sub->id, 'status' => $response->status()]);

        return false;
    }
}
