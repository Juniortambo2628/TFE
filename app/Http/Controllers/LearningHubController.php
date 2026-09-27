<?php

namespace App\Http\Controllers;

use App\Models\LearningResource;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * LearningHubController — the public Learning Hub at /learn.
 *
 * Open, not gated. Gating it to registered schools would couple the library
 * to an enrolment model that does not exist yet, and a safeguarding policy
 * is worth more the more widely it is read. Add gating later if a specific
 * resource needs it; do not build the gate speculatively.
 */
class LearningHubController extends Controller
{
    public function index(Request $request)
    {
        $category = $request->query('category');
        $audience = $request->query('audience');
        $q = trim((string) $request->query('q', ''));

        $resources = LearningResource::query()
            ->published()
            ->with('publisher.partnerProfile', 'listing')
            ->inCategory($this->validOr($category, LearningResource::CATEGORIES))
            ->forAudience($this->validOr($audience, LearningResource::AUDIENCES))
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('title', 'like', "%{$q}%")
                        ->orWhere('summary', 'like', "%{$q}%");
                });
            })
            ->orderBy('display_order')
            ->orderBy('title')
            ->get()
            ->map(fn (LearningResource $r) => $this->card($r));

        return Inertia::render('Learn/Index', [
            'resources' => $resources,
            'categories' => LearningResource::CATEGORIES,
            'audiences' => LearningResource::AUDIENCES,
            'filters' => [
                'category' => $category,
                'audience' => $audience,
                'q' => $q,
            ],
            'hero' => HomeController::pageHero('learn'),
        ]);
    }

    public function show(string $slug)
    {
        $resource = LearningResource::query()
            ->published()
            ->with('publisher.partnerProfile', 'listing')
            ->where('slug', $slug)
            ->first();

        if (! $resource) {
            abort(404);
        }

        // Siblings from the same category, so a reader who finishes one has
        // somewhere to go. Excludes itself.
        $related = LearningResource::query()
            ->published()
            ->with('publisher.partnerProfile')
            ->where('category', $resource->category)
            ->whereKeyNot($resource->getKey())
            ->orderBy('display_order')
            ->limit(3)
            ->get()
            ->map(fn (LearningResource $r) => $this->card($r));

        return Inertia::render('Learn/Show', [
            'resource' => $this->card($resource) + [
                'body' => $resource->body,
                'external_url' => $resource->external_url,
                'file_url' => $resource->file_url,
                // The programme this is a module of, so a reader can enrol
                // rather than just read about it.
                'program' => $resource->listing ? [
                    'name' => $resource->listing->name,
                    'slug' => $resource->listing->slug,
                ] : null,
            ],
            'related' => $related,
        ]);
    }

    /** The shape both the grid and the detail page read. */
    private function card(LearningResource $r): array
    {
        return [
            'id' => $r->id,
            'slug' => $r->slug,
            'title' => $r->title,
            'summary' => $r->summary,
            'category' => $r->category,
            'category_label' => $r->categoryLabel(),
            'audience' => $r->audience,
            'audience_label' => $r->audienceLabel(),
            'level' => $r->level,
            'level_label' => LearningResource::LEVELS[$r->level] ?? $r->level,
            'hero_image' => $r->hero_image,
            'read_minutes' => $r->read_minutes,
            'has_file' => filled($r->file_url),
            'has_video' => filled($r->external_url),
            'publisher' => $r->publisherSummary(),
        ];
    }

    /**
     * Drop a filter value that is not in the taxonomy.
     *
     * A bad `?category=` should show everything rather than nothing — an
     * empty grid reads as "we have no resources", which is a different and
     * wrong claim.
     */
    private function validOr(?string $value, array $allowed): ?string
    {
        return $value !== null && array_key_exists($value, $allowed) ? $value : null;
    }
}
