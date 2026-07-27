<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tribe;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TribeController extends Controller
{
    public function index()
    {
        $tribes = Tribe::with('creator')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(fn ($tribe) => [
                'id' => $tribe->id,
                'name' => $tribe->name,
                'slug' => $tribe->slug,
                'creator_name' => $tribe->creator->name ?? 'Unknown',
                'member_count' => $tribe->member_count,
                'privacy' => $tribe->privacy,
                'created_at' => $tribe->created_at->format('M d, Y'),
            ]);

        return Inertia::render('Admin/Tribes', [
            'tribes' => $tribes,
        ]);
    }

    public function show(Tribe $tribe)
    {
        return Inertia::render('Admin/TribeDetail', [
            'tribe' => $tribe->load(['creator', 'members.user']),
        ]);
    }

    public function update(Request $request, Tribe $tribe)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'privacy' => 'required|in:public,private',
            'forum_enabled' => 'boolean',
        ]);

        $tribe->update($validated);

        return back()->with('success', 'Tribe updated successfully');
    }

    public function destroy(Tribe $tribe)
    {
        $tribe->delete();

        return back()->with('success', 'Tribe deleted');
    }
}
