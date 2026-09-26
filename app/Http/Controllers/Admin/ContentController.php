<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\SiteSetting;
use App\Services\StadiumImageService;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContentController extends Controller
{
    public function __construct(
        protected StadiumImageService $stadiumImages,
        protected TournamentService $tournaments,
    ) {}

    public function index()
    {
        $posts = Post::with('user')
            ->latest()
            ->paginate(20)
            ->through(function ($post) {
                return [
                    'id' => $post->id,
                    'content' => strlen($post->content) > 100
                        ? substr($post->content, 0, 100).'...'
                        : $post->content,
                    'author' => $post->user?->name ?? 'Unknown',
                    'created_at' => $post->created_at->diffForHumans(),
                ];
            });

        // Flat key => value map — the Content page reads settings by their full
        // key (e.g. `page_hero_about_title`), so this both powers the editors
        // and pre-fills them with saved values.
        $settings = SiteSetting::pluck('value', 'key');

        return Inertia::render('Admin/Content', [
            'posts' => $posts,
            'settings' => $settings,
            'heroDefaults' => config('site_pages', []),
            'sectionCards' => $this->sectionCardsForEditor($settings),
        ]);
    }

    /**
     * The public section cards, shaped for the CMS editor.
     *
     * Each card carries both the saved override and the config default, so the
     * editor can preview what is live, show which fields are overridden, and
     * offer "reset to default" without a second round-trip.
     */
    private function sectionCardsForEditor($settings): array
    {
        $sections = [];

        foreach (config('site_sections', []) as $slug => $cards) {
            $rows = [];

            foreach ($cards as $index => $card) {
                $fields = [];
                foreach (['image', 'title', 'subtitle', 'description'] as $field) {
                    $key = "section_card_{$slug}_{$index}_{$field}";
                    $fields[$field] = [
                        'setting_key' => $key,
                        'field_key' => "{$slug}_{$index}_{$field}",
                        'default' => $card[$field] ?? '',
                        'value' => $settings[$key] ?? '',
                    ];
                }

                $rows[] = [
                    'index' => $index,
                    'label' => $card['title'] ?? "Card {$index}",
                    'tags' => $card['tags'] ?? [],
                    'fields' => $fields,
                ];
            }

            $sections[] = [
                'slug' => $slug,
                'label' => ucfirst($slug),
                'cards' => $rows,
            ];
        }

        return $sections;
    }

    /**
     * Revert one stadium back to its committed default image by deleting the
     * override row. Separate from updateSettings because "no value" there means
     * "save an empty string", which would blank the image rather than restore it.
     */
    public function resetStadiumImage(Request $request)
    {
        $data = $request->validate([
            'slug' => 'required|string',
            'tournament_id' => 'required|string',
        ]);

        // Delete both possible override shapes — the catalogue one keyed
        // by slug, and the free-text one keyed by normalized venue name.
        SiteSetting::where('key', StadiumImageService::SETTING_PREFIX.$data['slug'])->delete();
        SiteSetting::where('key', StadiumImageService::NAME_PREFIX.$data['tournament_id'].'_'.$data['slug'])->delete();

        $this->stadiumImages->clearCache($data['tournament_id']);
        $this->tournaments->clearCache($data['tournament_id']);

        return back()->with('success', 'Stadium image reset to default');
    }

    public function deletePost(Post $post)
    {
        $post->delete();

        return back()->with('success', 'Post deleted');
    }

    public function updateSettings(Request $request)
    {
        // `value` is dual-purpose on this endpoint: a plain string for text
        // settings, an upload for image ones. The file branch gets an explicit
        // mimes allowlist rather than Laravel's `image` rule, because `image`
        // admits SVG and a same-origin /storage URL turns an uploaded SVG into
        // a stored-XSS vector. Applying that rule unconditionally would reject
        // every text setting, hence the branch.
        $valueRules = $request->hasFile('value')
            ? ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:4096']
            : ['nullable'];

        $data = $request->validate([
            'key' => 'required|string',
            'value' => $valueRules,
            'type' => 'required|string', // text, image, etc.
            'group' => 'required|string',
        ], [
            'value.mimes' => 'Images must be a JPG, PNG or WebP file.',
            'value.max' => 'Images must be 4MB or smaller.',
        ]);

        // Handle file upload if type is image
        if ($request->hasFile('value') && $data['type'] === 'image') {
            $path = $request->file('value')->store('assets/uploads', 'public');
            $data['value'] = '/storage/'.$path;
        }

        SiteSetting::set(
            $data['key'],
            $data['value'],
            $data['type'],
            $data['group']
        );

        // A stadium image override has to invalidate two caches to show up:
        // the service's own resolved map, and the assembled tournament payload
        // that carries the overlaid venue rows to the hero slider. Handle both
        // the catalogue prefix (stadium_image_{slug}) and the per-name prefix
        // (stadium_name_{tournament}_{normalized}).
        if (str_starts_with($data['key'], StadiumImageService::SETTING_PREFIX)) {
            $slug = substr($data['key'], strlen(StadiumImageService::SETTING_PREFIX));
            foreach ($this->stadiumImages->tournamentIds() as $tournamentId) {
                if (array_key_exists($slug, config("stadiums.sets.{$tournamentId}", []))) {
                    $this->stadiumImages->clearCache($tournamentId);
                    $this->tournaments->clearCache($tournamentId);
                }
            }
        } elseif (str_starts_with($data['key'], StadiumImageService::NAME_PREFIX)) {
            $rest = substr($data['key'], strlen(StadiumImageService::NAME_PREFIX));
            $tournamentId = explode('_', $rest, 2)[0] ?? null;
            if ($tournamentId) {
                $this->stadiumImages->clearCache($tournamentId);
                $this->tournaments->clearCache($tournamentId);
            }
        }

        return back()->with('success', 'Setting updated');
    }
}
