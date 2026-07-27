<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Tribe;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContentController extends Controller
{
    public function index()
    {
        $posts = Post::with('user')
            ->latest()
            ->paginate(20)
            ->through(function ($post) {
                return [
                    'id' => $post->id,
                    'content' => strlen($post->content) > 100 
                        ? substr($post->content, 0, 100) . '...' 
                        : $post->content,
                    'author' => $post->user?->name ?? 'Unknown',
                    'created_at' => $post->created_at->diffForHumans(),
                ];
            });

        $tribes = Tribe::withCount('members')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($tribe) {
                return [
                    'id' => $tribe->id,
                    'name' => $tribe->name,
                    'members_count' => $tribe->members_count,
                    'privacy' => $tribe->privacy,
                ];
            });

        $stats = [
            'total_posts' => Post::count(),
            'total_tribes' => Tribe::count(),
        ];
        
        $settings = \App\Models\SiteSetting::all()->groupBy('group');

        return Inertia::render('Admin/Content', [
            'posts' => $posts,
            'tribes' => $tribes,
            'stats' => $stats,
            'settings' => $settings,
        ]);
    }

    public function deletePost(Post $post)
    {
        $post->delete();
        return back()->with('success', 'Post deleted');
    }
    
    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'key' => 'required|string',
            'value' => 'nullable',
            'type' => 'required|string', // text, image, etc.
            'group' => 'required|string'
        ]);
        
        // Handle file upload if type is image
        if ($request->hasFile('value') && $data['type'] === 'image') {
            $path = $request->file('value')->store('assets/uploads', 'public');
            $data['value'] = '/storage/' . $path;
        }

        \App\Models\SiteSetting::set(
            $data['key'],
            $data['value'],
            $data['type'],
            $data['group']
        );

        return back()->with('success', 'Setting updated');
    }
}
