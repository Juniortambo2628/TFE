<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Message;
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

    public function seed()
    {
        $user = Auth::user();
        $user->notify(new \App\Notifications\FanActivityNotification(
            'Welcome to Fan Dashboard',
            'Your account has been successfully set up. Explore your new dashboard!',
            route('fan.dashboard'),
            'success'
        ));

        $user->notify(new \App\Notifications\FanActivityNotification(
            'New Feature: Tribes',
            'Join a tribe and connect with fans from your country.',
            route('fan.tribes'),
            'info'
        ));

        // Create a test message
        Message::create([
            'user_id' => $user->id,
            'sender_id' => $user->id, // Self message for test or null
            'subject' => 'Welcome Message',
            'body' => 'Welcome to the platform. Check out your messages here.',
            'is_read' => false,
        ]);

        return redirect()->route('fan.dashboard')->with('success', 'Test notifications seeded!');
    }
}
