<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Traits\Uploadable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NewsController extends Controller
{
    use Uploadable;

    public function index()
    {
        $news = News::latest()->paginate(20);

        return Inertia::render('Admin/News', [
            'news' => $news,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|image|max:2048',
            'category' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $this->uploadFile($request->file('image'), 'news');
        }

        News::create($validated);

        return back()->with('success', 'News article created');
    }

    public function update(Request $request, News $news)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|image|max:2048',
            'category' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $this->uploadFile($request->file('image'), 'news', $news->image);
        }

        $news->update($validated);

        return back()->with('success', 'News article updated');
    }

    public function destroy(News $news)
    {
        $this->deleteFile($news->image);
        $news->delete();

        return back()->with('success', 'News article deleted');
    }
}
