<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Message;
use App\Models\Post;
use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CommunicationController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // User messages with shared content
        $messages = Message::where('user_id', $user->id)
            ->with(['sender', 'sharedStory.user', 'sharedPost.user'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($msg) {
                $messageData = [
                    'id' => $msg->id,
                    'subject' => $msg->subject ?? 'No Subject',
                    'content' => $msg->body ?? '',
                    'sender' => $msg->sender ? $msg->sender->name : 'System',
                    'is_read' => $msg->is_read ?? false,
                    'created_at' => $msg->created_at->diffForHumans(),
                    'share_type' => $msg->share_type,
                    'share_id' => $msg->share_id,
                ];

                // If it's a shared story, include story data
                if ($msg->share_type === 'story' && $msg->sharedStory) {
                    $story = $msg->sharedStory;
                    $messageData['shared_story'] = [
                        'id' => $story->id,
                        'media_url' => $story->media_url,
                        'media_type' => $story->media_type,
                        'caption' => $story->caption,
                        'user' => [
                            'id' => $story->user_id,
                            'name' => $story->user->name ?? 'Unknown',
                            'avatar' => $story->user->avatar ?? null,
                        ],
                    ];
                }

                // If it's a shared post, include post data
                if ($msg->share_type === 'post' && $msg->sharedPost) {
                    $post = $msg->sharedPost;
                    $messageData['shared_post'] = [
                        'id' => $post->id,
                        'content' => $post->content,
                        'image_url' => $post->image_url,
                        'user' => [
                            'id' => $post->user_id,
                            'name' => $post->user->name ?? 'Unknown',
                            'avatar' => $post->user->avatar ?? null,
                        ],
                    ];
                }

                return $messageData;
            });

        // Active announcements
        $announcements = Announcement::active()
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($ann) {
                return [
                    'id' => $ann->id,
                    'title' => $ann->title,
                    'content' => $ann->content,
                    'type' => $ann->type,
                    'created_at' => $ann->created_at->diffForHumans(),
                ];
            });

        // Stats (single query instead of two separate COUNTs)
        $messageStats = Message::where('user_id', $user->id)
            ->selectRaw('COUNT(*) as total_messages, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_messages')
            ->first();

        $stats = [
            'total_messages' => $messageStats->total_messages,
            'unread_messages' => $messageStats->unread_messages,
            'announcements' => $announcements->count(),
        ];

        return Inertia::render('Fan/Communication', [
            'messages' => $messages,
            'announcements' => $announcements,
            'stats' => $stats,
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $message = Message::where('user_id', Auth::id())->findOrFail($id);
        $message->update(['is_read' => true]);

        return back()->with('success', 'Message marked as read');
    }

    public function deleteMessage($id)
    {
        $message = Message::where('user_id', Auth::id())->findOrFail($id);
        $message->delete();

        return back()->with('success', 'Message deleted');
    }
}
