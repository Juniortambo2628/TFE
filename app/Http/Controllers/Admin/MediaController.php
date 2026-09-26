<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Services\MediaLibraryService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MediaController extends Controller
{
    public function __construct(protected MediaLibraryService $media) {}

    /** The media library page. */
    public function index()
    {
        return Inertia::render('Admin/Media', [
            'assets' => MediaAsset::latest()->paginate(48)->through(fn ($a) => $this->present($a)),
            'stats' => [
                'total' => MediaAsset::count(),
                'images' => MediaAsset::where('kind', 'image')->count(),
                'videos' => MediaAsset::where('kind', 'video')->count(),
                'bytes' => (int) MediaAsset::sum('size'),
            ],
        ]);
    }

    /**
     * JSON feed for the gallery picker (used by ImageUpload's "Choose from
     * library"). `kind=image` keeps a background-image picker from offering
     * videos.
     */
    public function list(Request $request)
    {
        $query = MediaAsset::latest();

        if ($request->string('kind')->isNotEmpty()) {
            $query->where('kind', $request->string('kind'));
        }

        return response()->json([
            'assets' => $query->limit(200)->get()->map(fn ($a) => $this->present($a)),
        ]);
    }

    /** Upload one or more files into the library. */
    public function store(Request $request)
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => MediaLibraryService::mediaRules(),
        ], [
            'files.*.mimes' => 'Files must be an image (JPG, PNG, WebP, GIF, AVIF) or video (MP4, WebM).',
        ]);

        foreach ($request->file('files', []) as $file) {
            $this->media->store($file, 'assets/library');
        }

        return back()->with('success', 'Media uploaded');
    }

    public function destroy(MediaAsset $media)
    {
        $this->media->delete($media);

        return back()->with('success', 'Media deleted');
    }

    private function present(MediaAsset $asset): array
    {
        return [
            'id' => $asset->id,
            'url' => $asset->url,
            'name' => $asset->name,
            'kind' => $asset->kind,
            'mime' => $asset->mime,
            'size' => $asset->size,
            'width' => $asset->width,
            'height' => $asset->height,
            'created_at' => $asset->created_at?->format('M d, Y'),
        ];
    }
}
