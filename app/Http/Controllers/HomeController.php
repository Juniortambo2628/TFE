<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Listing;
use App\Models\SiteSetting;
use App\Services\TournamentService;
use App\Traits\ResolvesTournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

/**
 * HomeController — Landing page.
 *
 * The active tournament (venues, teams, matches, results, hero image, trophy)
 * is shared globally via HandleInertiaRequests. This controller no longer
 * carries any tournament-specific data — everything the Hero renders comes
 * from the resolved tournament payload on the frontend.
 */
class HomeController extends Controller
{
    use ResolvesTournament;

    public function index()
    {
        return Inertia::render('Home', [
            'appName' => config('app.name'),
        ]);
    }

    // Standalone public section pages. Each renders the shared PageHero (config
    // defaults + admin CMS overrides) plus the section component.
    public function about()
    {
        return Inertia::render('Sections/About', ['hero' => $this->pageHero('about')]);
    }

    public function features()
    {
        return Inertia::render('Sections/Features', ['hero' => $this->pageHero('features')]);
    }

    public function services()
    {
        return Inertia::render('Sections/Services', ['hero' => $this->pageHero('services')]);
    }

    public function news()
    {
        return Inertia::render('Sections/News', ['hero' => $this->pageHero('news')]);
    }

    public function contact()
    {
        return Inertia::render('Sections/Contact', ['hero' => $this->pageHero('contact')]);
    }

    /**
     * Public contact form submission (from the Contact page dialogs). Stored
     * as a ContactMessage so admins see it under Messages; no auth required.
     */
    public function contactStore(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|max:190',
            'subject' => 'required|string|max:180',
            'message' => 'required|string|max:4000',
        ]);

        ContactMessage::create($data + ['user_id' => optional($request->user())->id]);

        return back()->with('success', 'Thanks — your message is in. Our team will be in touch shortly.');
    }

    /**
     * Public single-view page for one tournament. Past (concluded) tournaments
     * show the recap (teams, results, scorer, player of the tournament);
     * upcoming ones focus on sign-up + trip-planning offerings (partner
     * listings). Reached by slug (e.g. /tournaments/afcon-2027).
     */
    public function tournament(string $slug, TournamentService $tournaments)
    {
        $all = config('tournaments.tournaments', []);

        // Resolve the config id from the slug (fall back to a raw id).
        $id = collect($all)->firstWhere('slug', $slug)['id'] ?? (isset($all[$slug]) ? $slug : null);
        abort_unless($id, 404);

        $tournament = $tournaments->get($id);
        $status = $tournament['status'] ?? 'upcoming';

        // Offerings for upcoming tournaments — approved, active listings scoped
        // to this tournament, formatted for the shared AccentCard (same shape
        // the partner hub uses).
        $listings = [];
        if ($status !== 'concluded') {
            $listings = Listing::query()
                ->forTournament($id)
                ->approved()
                ->active()
                ->with('publisher.partnerProfile')
                ->orderByDesc('is_featured')
                ->orderBy('display_order')
                ->orderBy('name')
                ->limit(9)
                ->get()
                ->map(fn (Listing $l) => [
                    'id' => $l->id,
                    'name' => $l->name,
                    'description' => $l->description,
                    'hero_image' => $l->hero_image,
                    'base_price' => $l->base_price,
                    'currency' => $l->currency,
                    'capacity' => $l->capacity,
                    'sold_count' => $l->sold_count,
                    'availability_pct' => $l->availability_pct,
                    'is_sold_out' => $l->is_sold_out,
                    // Partner attribution so the tournament page can feature
                    // WHO the offering is from (null for admin-curated rows).
                    'publisher' => $l->publisherSummary(),
                ])
                ->all();
        }

        // Where a past tournament's "plan the next one" CTA should point.
        $upcoming = collect($all)->firstWhere('status', 'upcoming');

        return Inertia::render('Tournaments/Show', [
            'tournament' => $tournament,
            'listings' => $listings,
            'upcoming' => $upcoming ? [
                'slug' => $upcoming['slug'],
                'short_name' => $upcoming['short_name'] ?? $upcoming['name'],
            ] : null,
        ]);
    }

    /**
     * Hero content for a section page: config/site_pages.php defaults, with any
     * admin CMS override (SiteSetting `page_hero_{slug}_{field}`) laid over the
     * top. Tolerates a missing site_settings table (fresh installs).
     */
    private function pageHero(string $slug): array
    {
        $hero = config("site_pages.{$slug}", []);

        try {
            if (Schema::hasTable('site_settings')) {
                foreach (['title', 'eyebrow', 'tagline', 'background', 'cta_label', 'cta_href'] as $field) {
                    $value = SiteSetting::get("page_hero_{$slug}_{$field}");
                    if (! empty($value)) {
                        $hero[$field] = $value;
                    }
                }
            }
        } catch (\Throwable $e) {
            // best-effort — config defaults still apply.
        }

        return $hero;
    }
}
