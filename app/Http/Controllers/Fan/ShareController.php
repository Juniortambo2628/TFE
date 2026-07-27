<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Post;
use App\Models\Story;
use App\Models\Tribe;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ShareController extends Controller
{
    /**
     * Get users and tribes for sharing
     */
    public function getShareOptions()
    {
        $user = Auth::user();
        
        // Get all users (for individual messaging)
        $users = User::where('id', '!=', $user->id)
            ->select('id', 'name', 'avatar')
            ->orderBy('name')
            ->get();
        
        // Get public tribes
        $publicTribes = Tribe::where('privacy', 'public')
            ->select('id', 'name', 'avatar', 'privacy')
            ->orderBy('name')
            ->get();
        
        // Get tribes user is a member of
        $memberTribes = Tribe::whereHas('members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->select('id', 'name', 'avatar', 'privacy')
            ->orderBy('name')
            ->get();
        
        return response()->json([
            'users' => $users,
            'publicTribes' => $publicTribes,
            'memberTribes' => $memberTribes,
        ]);
    }

    /**
     * Share a post or story
     */
    public function share(Request $request)
    {
        $request->validate([
            'share_type' => 'required|in:post,story',
            'share_id' => 'required|integer',
            'recipients' => 'required|array|min:1',
            'recipients.*.type' => 'required|in:user,tribe',
            'recipients.*.id' => 'required|integer',
            'message' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        $shareType = $request->input('share_type');
        $shareId = $request->input('share_id');
        $messageText = $request->input('message', 'Check this out!');

        // Verify the post/story exists
        if ($shareType === 'post') {
            $shareable = Post::findOrFail($shareId);
            $shareUrl = route('fan.feed.post.show', $shareId);
            $shareContent = substr($shareable->content, 0, 100);
        } else {
            $shareable = Story::findOrFail($shareId);
            if ($shareable->user_id !== $user->id && $shareable->isExpired()) {
                return response()->json(['error' => 'Story has expired'], 400);
            }
            $shareUrl = route('fan.stories') . '?story=' . $shareId;
            $shareContent = $shareable->caption ?? 'Story';
        }

        $messages = [];
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($request->input('recipients') as $recipient) {
                if ($recipient['type'] === 'user') {
                    // Share to individual user
                    $recipientUser = User::findOrFail($recipient['id']);
                    
                    if ($recipientUser->id === $user->id) {
                        continue; // Skip self
                    }

                    $messages[] = Message::create([
                        'user_id' => $recipientUser->id,
                        'sender_id' => $user->id,
                        'subject' => "Shared {$shareType} from {$user->name}",
                        'body' => $messageText . "\n\n" . $shareContent . "\n\nView: " . $shareUrl,
                        'share_type' => $shareType,
                        'share_id' => $shareId,
                        'is_read' => false,
                    ]);
                } else {
                    // Share to tribe
                    $tribe = Tribe::findOrFail($recipient['id']);
                    
                    // Check permissions
                    if ($tribe->privacy === 'private' && !$tribe->hasMember($user)) {
                        $errors[] = "You don't have permission to share to {$tribe->name}";
                        continue;
                    }

                    // Create message for each tribe member
                    $tribeMembers = $tribe->members()->where('user_id', '!=', $user->id)->get();
                    
                    foreach ($tribeMembers as $member) {
                        $messages[] = Message::create([
                            'user_id' => $member->user_id,
                            'sender_id' => $user->id,
                            'subject' => "Shared {$shareType} in {$tribe->name}",
                            'body' => $messageText . "\n\n" . $shareContent . "\n\nView: " . $shareUrl,
                            'share_type' => $shareType,
                            'share_id' => $shareId,
                            'tribe_id' => $tribe->id,
                            'is_read' => false,
                        ]);
                    }
                }
            }

            DB::commit();

            return back()->with('shareResponse', [
                'success' => true,
                'message' => 'Shared successfully!',
                'messages_sent' => count($messages),
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['share' => 'Failed to share: ' . $e->getMessage()]);
        }
    }
}
