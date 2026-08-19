<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Traits\Uploadable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    use Uploadable;

    public function index()
    {
        $events = Event::withCount('rsvps')
            ->orderByDesc('date')
            ->paginate(15)
            ->through(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'date' => $event->date->format('Y-m-d'), // Use Y-m-d for date input compatibility
                    'date_formatted' => $event->date->format('M d, Y'),
                    'location' => $event->location,
                    'type' => $event->type,
                    'image_url' => $event->image_url,
                    'rsvps_count' => $event->rsvps_count ?? 0,
                ];
            });

        $stats = [
            'total' => Event::count(),
            'upcoming' => Event::where('date', '>=', now())->count(),
            'past' => Event::where('date', '<', now())->count(),
            'attendees' => \DB::table('event_rsvps')->count(),
        ];

        return Inertia::render('Admin/Events', [
            'events' => $events,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:100',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $this->uploadFile($request->file('image'), 'events');
        }

        Event::create($validated);

        return back()->with('success', 'Event created successfully');
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:100',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $this->uploadFile($request->file('image'), 'events', $event->image);
        }

        $event->update($validated);

        return back()->with('success', 'Event updated');
    }

    public function destroy(Event $event)
    {
        $this->deleteFile($event->image);
        $event->delete();

        return back()->with('success', 'Event deleted');
    }
}
