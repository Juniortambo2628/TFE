<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Support\ActivityBadges;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function markNotificationsRead()
    {
        Auth::user()->unreadNotifications->markAsRead();

        return back();
    }

    /**
     * Open one notification: mark it read and go where it points (Sprint 70).
     * Rows in the bell were not links at all, so every action_url went
     * unused. Any role's bell uses this, so it sits outside the fan group.
     *
     * Only an app URL is followed — a stored action_url pointing off-site
     * must not turn this into an open redirect.
     */
    public function open(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->whereKey($id)->firstOrFail();
        $notification->markAsRead();

        $target = (string) ($notification->data['action_url'] ?? '');
        $host = parse_url($target, PHP_URL_HOST);

        if ($target === '' || ($host !== null && $host !== $request->getHost())) {
            return back();
        }

        return redirect()->to($target);
    }

    public function markMessagesRead()
    {
        Auth::user()->receivedMessages()->where('is_read', false)->update(['is_read' => true]);

        return back();
    }

    /**
     * The bell's dropdown was opened: everything in it has been seen, so its
     * count goes. Before this a notification only cleared when its own row
     * was tapped, and one with no link never cleared at all (Nov 2026).
     */
    public function seen(Request $request): Response
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->noContent();
    }

    /**
     * The envelope's dropdown was opened: the person's own messages and the
     * announcements counted with them are seen. An admin's contact-form
     * inbox is not touched: those are enquiries to answer, read one by one.
     */
    public function messagesSeen(Request $request): Response
    {
        $user = $request->user();
        $user->receivedMessages()->where('is_read', false)->update(['is_read' => true]);
        ActivityBadges::clearFor($user, 'fan.communication');

        return response()->noContent();
    }
}
