<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ContactMessage;
use Inertia\Inertia;
use App\Models\Message;

class MessagesController extends Controller
{
    public function index()
    {
        $contactMessages = ContactMessage::latest()->paginate(20);
        $internalMessages = auth()->user()->receivedMessages()
            ->with('sender')
            ->latest()
            ->paginate(20, ['*'], 'internal_page');
        
        $sentMessages = auth()->user()->sentMessages()
            ->with('recipient')
            ->latest()
            ->paginate(20, ['*'], 'sent_page');

        $notifications = auth()->user()->notifications()->paginate(20, ['*'], 'notifications_page');
        
        $stats = [
            'inbox' => ContactMessage::count() + auth()->user()->receivedMessages()->count(),
            'unread' => ContactMessage::where('is_read', false)->count() + auth()->user()->receivedMessages()->where('is_read', false)->count(),
            'notifications' => auth()->user()->unreadNotifications()->count(),
            'sent' => auth()->user()->sentMessages()->count(),
        ];
        
        return Inertia::render('Admin/Messages', [
            'contactMessages' => $contactMessages,
            'internalMessages' => $internalMessages,
            'sentMessages' => $sentMessages,
            'notifications' => $notifications,
            'stats' => $stats,
        ]);
    }
    
    public function markAsRead(ContactMessage $message)
    {
        $message->update(['is_read' => true]);
        
        return back()->with('success', 'Message marked as read');
    }
    
    public function destroy(ContactMessage $message)
    {
        $message->delete();
        
        return back()->with('success', 'Message deleted');
    }

    public function markInternalAsRead(Message $internalMessage)
    {
        $internalMessage->update(['is_read' => true]);
        return back()->with('success', 'Internal message marked as read');
    }

    public function destroyInternal(Message $internalMessage)
    {
        $internalMessage->delete();
        return back()->with('success', 'Internal message deleted');
    }
}
