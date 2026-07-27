<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnouncementsController extends Controller
{
    public function index()
    {
        $announcements = Announcement::latest()->paginate(15);

        return Inertia::render('Admin/Announcements', [
            'announcements' => $announcements,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string|in:info,success,warning,danger',
            'is_active' => 'boolean',
        ]);

        Announcement::create($validated);

        return back()->with('success', 'Announcement posted successfully');
    }

    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string|in:info,success,warning,danger',
            'is_active' => 'boolean',
        ]);

        $announcement->update($validated);

        return back()->with('success', 'Announcement updated');
    }

    public function toggle(Announcement $announcement)
    {
        $announcement->update(['is_active' => ! $announcement->is_active]);

        return back()->with('success', 'Announcement status updated');
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();

        return back()->with('success', 'Announcement deleted');
    }
}
