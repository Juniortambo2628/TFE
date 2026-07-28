<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function markNotificationsRead()
    {
        Auth::user()->unreadNotifications->markAsRead();

        return back();
    }

    public function markMessagesRead()
    {
        Auth::user()->receivedMessages()->where('is_read', false)->update(['is_read' => true]);

        return back();
    }
}
