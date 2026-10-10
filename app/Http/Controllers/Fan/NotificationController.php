<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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
}
