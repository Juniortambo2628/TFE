<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Web push opt-in, opt-out, and what a push shows (Nov 2026).
 *
 * JSON endpoints called from the browser's own PushManager flow and from the
 * service worker, so they answer JSON, not Inertia.
 */
class PushSubscriptionController extends Controller
{
    public function store(Request $request, WebPushService $push): JsonResponse
    {
        abort_unless($push->enabled(), 404);

        $data = $request->validate([
            'endpoint' => ['required', 'string', 'max:2000', 'url:https'],
            'keys.p256dh' => ['nullable', 'string', 'max:255'],
            'keys.auth' => ['nullable', 'string', 'max:255'],
        ]);

        // One endpoint is one device. If someone else signed in on this
        // browser before, it moves to whoever is signed in now.
        PushSubscription::updateOrCreate(
            ['endpoint_hash' => PushSubscription::hashFor($data['endpoint'])],
            [
                'user_id' => $request->user()->id,
                'endpoint' => $data['endpoint'],
                'p256dh' => $data['keys']['p256dh'] ?? null,
                'auth' => $data['keys']['auth'] ?? null,
                'user_agent' => Str::limit((string) $request->userAgent(), 250, ''),
            ],
        );

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['endpoint' => ['required', 'string', 'max:2000']]);

        PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint_hash', PushSubscription::hashFor($data['endpoint']))
            ->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * What the service worker shows when a push arrives: the newest unread
     * notification, in the same shape the bell reads. `url` goes through
     * `notifications.open`, which marks it read and follows its action_url.
     */
    public function latest(Request $request): JsonResponse
    {
        $n = $request->user()->unreadNotifications()->latest()->first();
        if (! $n) {
            return response()->json(['notification' => null])->header('Cache-Control', 'no-store');
        }
        $data = $n->data ?? [];

        return response()->json(['notification' => [
            'id' => $n->id,
            'title' => Str::limit((string) ($data['title'] ?? 'The Football Experience'), 80),
            'body' => Str::limit((string) ($data['body'] ?? $data['message'] ?? ''), 160),
            'url' => ! empty($data['action_url']) ? route('notifications.open', $n->id, false) : '/',
            'unread' => $request->user()->unreadNotifications()->count(),
        ]])->header('Cache-Control', 'no-store');
    }
}
