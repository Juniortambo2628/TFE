<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRsvp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get upcoming events with user's RSVP status (eager-loaded to avoid N+1)
        $userRsvpMap = EventRsvp::where('user_id', $user->id)
            ->pluck('status', 'event_id');

        $events = Event::where('date', '>=', now())
            ->withCount(['rsvps as attendees_count' => function ($q) {
                $q->where('status', 'attending');
            }])
            ->orderBy('date')
            ->get()
            ->map(function ($event) use ($userRsvpMap) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'date' => $event->date->format('M d, Y'),
                    'location' => $event->location,
                    'type' => $event->type,
                    'attendees' => $event->attendees_count,
                    'user_rsvp' => $userRsvpMap->get($event->id),
                ];
            });

        // Past events
        $pastEvents = Event::where('date', '<', now())
            ->orderByDesc('date')
            ->limit(5)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'date' => $event->date->format('M d, Y'),
                    'location' => $event->location,
                ];
            });

        // User's RSVPs
        $userRsvps = EventRsvp::where('user_id', $user->id)
            ->pluck('event_id');

        $stats = [
            'upcoming' => Event::where('date', '>=', now())->count(),
            'attending' => EventRsvp::where('user_id', $user->id)->where('status', 'attending')->count(),
            'past' => Event::where('date', '<', now())->count(),
        ];

        return Inertia::render('Fan/Events', [
            'events' => $events,
            'pastEvents' => $pastEvents,
            'userRsvps' => $userRsvps,
            'stats' => $stats,
        ]);
    }

    public function rsvp(Request $request, $eventId)
    {
        $validated = $request->validate([
            'status' => 'required|in:attending,maybe,not_attending',
        ]);

        $user = Auth::user();
        $event = Event::findOrFail($eventId);

        EventRsvp::updateOrCreate(
            ['user_id' => $user->id, 'event_id' => $event->id],
            ['status' => $validated['status']]
        );

        $message = match ($validated['status']) {
            'attending' => 'You are attending this event!',
            'maybe' => 'RSVP updated to maybe',
            'not_attending' => 'RSVP cancelled',
        };

        return back()->with('success', $message);
    }

    public function cancelRsvp($eventId)
    {
        EventRsvp::where('user_id', Auth::id())
            ->where('event_id', $eventId)
            ->delete();

        return back()->with('success', 'RSVP cancelled');
    }
}
