<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CommunicationController extends Controller
{
    /**
     * Display messages grouped by budget reference
     */
    public function index()
    {
        $user = Auth::user();

        // Only this partner's own queue. This listed EVERY budget on the
        // platform — every fan's thread, readable by any partner — until
        // Sprint 70; same leak Sprint 56 closed on the dashboard.
        $budgets = Budget::inPartnerQueue($user->id)
            ->whereNotNull('partner_status')
            ->with(['user:id,name,email'])
            ->orderByDesc('updated_at')
            ->get();

        // Get messages grouped by budget
        $threads = $budgets->map(function ($budget) {
            // Get messages for this budget
            $messages = Message::where('budget_id', $budget->id)
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($msg) {
                    return [
                        'id' => $msg->id,
                        'body' => $msg->body,
                        'sender_type' => $msg->sender_type, // 'partner' or 'fan'
                        'is_read' => $msg->is_read,
                        'created_at' => $msg->created_at->diffForHumans(),
                        'created_at_full' => $msg->created_at->format('M d, Y H:i'),
                    ];
                });

            return [
                'budget_id' => $budget->id,
                'reference_id' => $budget->reference_id,
                'status' => $budget->partner_status,
                'total_cost' => $budget->partner_cost ?? $budget->total_cost,
                'match_count' => $budget->match_count,
                'messages' => $messages,
                'unread_count' => $messages->where('sender_type', 'fan')->where('is_read', false)->count(),
                'last_message_at' => $messages->last()?->created_at ?? $budget->updated_at->diffForHumans(),
            ];
        })->filter(function ($thread) {
            // Only show threads with messages or pending requests
            return $thread['messages']->count() > 0 || $thread['status'] === 'pending';
        })->values();

        // Stats
        $stats = [
            'total_threads' => $threads->count(),
            'unread_messages' => $threads->sum('unread_count'),
            'pending_requests' => $budgets->where('partner_status', 'pending')->count(),
        ];

        return Inertia::render('Partner/Communication', [
            'threads' => $threads,
            'stats' => $stats,
        ]);
    }

    /**
     * Send a message to a fan about a budget request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'budget_id' => 'required|exists:budgets,id',
            'body' => 'required|string|max:2000',
        ]);

        $budget = Budget::inPartnerQueue($request->user()->id)->findOrFail($validated['budget_id']);

        // Create the message
        $message = Message::create([
            'user_id' => $budget->user_id, // Fan receives the message
            'sender_id' => Auth::id(),
            'budget_id' => $budget->id,
            'sender_type' => 'partner',
            'subject' => 'RE: '.$budget->reference_id,
            'body' => $validated['body'],
            'is_read' => false,
        ]);

        return back()->with('success', 'Message sent successfully!');
    }

    /**
     * Mark messages as read for a budget thread
     */
    public function markAsRead(Request $request, $budgetId)
    {
        $budget = Budget::inPartnerQueue($request->user()->id)->findOrFail($budgetId);

        Message::where('budget_id', $budget->id)
            ->where('sender_type', 'fan')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return back()->with('success', 'Messages marked as read');
    }
}
