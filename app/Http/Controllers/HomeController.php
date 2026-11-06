<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\PartnerController as AdminPartnerController;
use App\Models\ContactMessage;
use App\Models\Fixture;
use App\Models\Listing;
use App\Models\SiteSetting;
use App\Models\User;
use App\Services\StadiumBowlService;
use App\Services\TournamentService;
use App\Support\LandingContent;
use App\Support\PageVersion;
use App\Traits\ResolvesTournament;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
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
    /**
     * The tournament payload keys `Pages/Tournaments/Show.jsx` renders. Kept
     * next to the only method that uses it so the two are edited together —
     * a field added to the page needs a line here or it arrives undefined.
     */
    private const SHOW_PAGE_FIELDS = [
        'id', 'name', 'short_name', 'slug', 'status', 'tagline',
        'start_date', 'end_date', 'hosts', 'num_teams', 'matches_played',
        'total_goals', 'facts', 'color_accent', 'trophy_image',
        'organizer_card_bg', 'winner', 'runner_up', 'top_scorer',
        'player_of_tournament', 'team_flag_codes', 'wikipedia_extract',
        'wikipedia_flags',
    ];

    use ResolvesTournament;

    public function index(Request $request, StadiumBowlService $bowls)
    {
        // v2 is the site's landing page (config app.design); this one is the
        // v1 fallback until it is deleted.
        if (PageVersion::isDefault()) {
            return $this->landingV2($request);
        }

        return Inertia::render('Home', [
            'appName' => config('app.name'),

            // Real seating data for the hero's venue dialog. Deferred: the
            // dialog only opens on a click, so this must not hold up the
            // landing page's first paint.
            //
            // Before this the hero HASHED THE STADIUM NAME into a 20-85%
            // figure and presented it as "Live indicative view of how
            // sections fill up". A ground with no fixtures on sale now
            // reports `has_inventory: false` and the map shows its seating
            // layout with no percentage at all.
            'venueBowls' => Inertia::defer(fn () => $bowls->forTournament($this->activeTournament()['id'])),

            // Bookable trips on the landing page (Sprint 70): a visitor
            // reaches a package from the first screen instead of finding the
            // planner, the tournament page or a partner hub first. Packages
            // and tours only — the things "Book now" can actually book.
            // Deferred so it never holds up first paint.
            // Public posts + busiest tribes (Sprint 70). Deferred, and the
            // section re-polls just this prop once a minute so it reads live.
            'communityPreview' => Inertia::defer(fn () => CommunityController::preview(
                $this->activeTournament()['id'],
            )),

            'featuredPackages' => Inertia::defer(fn () => $this->offeringCards(
                $this->activeTournament()['id'], 6, ['package', 'tour'],
            )),
        ]);
    }

    /**
     * Landing page v2 (UX review, 2 Nov 2026, Track C): the platform shown
     * section by section — who it is for, how a trip works, what each screen
     * does — before anyone is asked to sign in. Lives at /v2 beside the
     * current landing page while the tester group compares them.
     *
     * Copy comes from config/landing_v2.php with admin overrides on top
     * (LandingContent); the facts strip is counted here, never typed in.
     */
    public function homeV2(Request $request)
    {
        // The preview address, now that v2 is the landing page itself.
        if (PageVersion::isDefault()) {
            $query = $request->getQueryString();

            return redirect('/'.($query ? "?{$query}" : ''), 301);
        }

        return $this->noindex($this->landingV2($request), $request);
    }

    private function landingV2(Request $request)
    {
        $tournament = $this->activeTournament();
        $content = LandingContent::all();
        unset($content['walkthroughs']); // their own pages

        return Inertia::render('HomeV2', [
            'content' => $content,
            'facts' => $this->landingFacts($tournament),
            'partnerCounts' => $this->partnerCountsByType(),
            // The directory's own labels, so a chip reads as the directory does.
            'partnerTypeLabels' => AdminPartnerController::partnerTypes(),
            // Same queries, and the same deferral, as the current landing
            // page, so the two versions show the same trips and posts.
            'featuredPackages' => Inertia::defer(fn () => $this->offeringCards(
                $tournament['id'], 8, ['package', 'tour'],
            )),
            'communityPreview' => Inertia::defer(fn () => CommunityController::preview($tournament['id'])),
        ]);
    }

    /** /for-fans, /for-partners, /for-schools — how each audience uses TFE. */
    public function walkthrough(Request $request, string $audience)
    {
        $page = LandingContent::all()['walkthroughs'][$audience] ?? null;
        abort_unless($page, 404);

        $response = Inertia::render('Walkthrough', [
            'audience' => $audience,
            'page' => $page,
        ]);

        return PageVersion::isDefault() ? $response : $this->noindex($response, $request);
    }

    /**
     * Real numbers for the v2 facts strip. A fact that counts to zero is
     * dropped rather than shown as "0", which reads as a claim of its own.
     *
     * @return array<string, int>
     */
    private function landingFacts(array $tournament): array
    {
        $cities = collect($tournament['venues'] ?? [])
            ->reject(fn ($v) => ! empty($v['is_alternate']))
            ->pluck('city')
            ->filter()
            ->unique()
            ->count();

        $facts = [
            'tournaments' => count(app(TournamentService::class)->switchable()),
            'cities' => $cities,
            'matches' => Fixture::where('tournament_id', $tournament['id'] ?? null)->count(),
            'partners' => $this->publicPartners()->where('verification_status', 'verified')->count(),
        ];

        return array_filter($facts, fn ($n) => $n > 0);
    }

    /** @return array<string, int> partner_type => number of public partners */
    private function partnerCountsByType(): array
    {
        return $this->publicPartners()
            ->selectRaw('partner_type, count(*) as n')
            ->groupBy('partner_type')
            ->pluck('n', 'partner_type')
            ->map(fn ($n) => (int) $n)
            ->all();
    }

    /** Partners a visitor can see in the directory. */
    private function publicPartners()
    {
        return User::query()
            ->where('is_partner', true)
            ->whereHas('partnerProfile', fn ($q) => $q->public()); // the directory's own rule
    }

    /**
     * Keep an experiment out of search results until it replaces the page it
     * is tested against. The page also sets the robots meta tag.
     */
    /**
     * Pieces of the /v2 landing copy a v2 section page reuses (its audiences,
     * explorer, partner categories, FAQ), so one edit in Admin -> Content ->
     * Landing v2 reads the same on every page that shows it.
     *
     * @param  list<string>  $keys
     * @return array{landing: array<string, mixed>}
     */
    private function v2Landing(array $keys): array
    {
        return ['landing' => Arr::only(LandingContent::all(), $keys)];
    }

    private function noindex($response, Request $request)
    {
        return $response->toResponse($request)->header('X-Robots-Tag', 'noindex, nofollow');
    }

    /**
     * Approved + active listings for a tournament in the shared AccentCard
     * shape — the ONE query behind the tournament page's offerings and the
     * landing page's featured trips, so the two cannot disagree on what is
     * public. Featured first.
     *
     * @param  array<int, string>|null  $types
     */
    private function offeringCards(string $tournamentId, int $limit, ?array $types = null): array
    {
        return Listing::query()
            ->forTournament($tournamentId)
            ->approved()
            ->active()
            ->when($types, fn ($q) => $q->whereIn('type', $types))
            ->with('publisher.partnerProfile')
            ->orderByDesc('is_featured')
            ->orderBy('display_order')
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(fn (Listing $l) => [
                'id' => $l->id,
                'type' => $l->type,
                'name' => $l->name,
                'description' => $l->description,
                'hero_image' => $l->hero_image,
                'base_price' => $l->base_price,
                'currency' => $l->currency,
                'nights' => $l->nights,
                'capacity' => $l->capacity,
                'sold_count' => $l->sold_count,
                'availability_pct' => $l->availability_pct,
                'is_sold_out' => $l->is_sold_out,
                // Partner attribution (null for admin-curated rows).
                'publisher' => $l->publisherSummary(),
            ])
            ->all();
    }

    // Standalone public section pages. Each renders the shared PageHero (config
    // defaults + admin CMS overrides) plus the section component.
    public function about()
    {
        return Inertia::render(PageVersion::component('Sections/About'), [
            'hero' => self::pageHero('about'),
            'cards' => $this->sectionCards('about'),
        ] + (PageVersion::isV2() ? $this->v2Landing(['about', 'audiences', 'facts']) + [
            'facts' => $this->landingFacts($this->activeTournament()),
        ] : []));
    }

    public function features()
    {
        return Inertia::render(PageVersion::component('Sections/Features'), [
            'hero' => self::pageHero('features'),
            'cards' => $this->sectionCards('features'),
        ] + (PageVersion::isV2() ? $this->v2Landing(['explorer']) : []));
    }

    public function services()
    {
        return Inertia::render(PageVersion::component('Sections/Services'), [
            'hero' => self::pageHero('services'),
            'cards' => $this->sectionCards('services'),
        ] + (PageVersion::isV2() ? $this->v2Landing(['audiences', 'partners']) + [
            'partnerCounts' => $this->partnerCountsByType(),
            'partnerTypeLabels' => AdminPartnerController::partnerTypes(),
        ] : []));
    }

    public function news()
    {
        return Inertia::render(PageVersion::component('Sections/News'), ['hero' => self::pageHero('news')]);
    }

    public function contact()
    {
        return Inertia::render(PageVersion::component('Sections/Contact'), [
            'hero' => self::pageHero('contact'),
            'cards' => $this->sectionCards('contact'),
        ] + (PageVersion::isV2() ? $this->v2Landing(['faq']) : []));
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
            $listings = $this->offeringCards($id, 9);
        }

        // Where a past tournament's "plan the next one" CTA should point.
        $upcoming = collect($all)->firstWhere('status', 'upcoming');

        return Inertia::render(PageVersion::component('Tournaments/Show'), [
            // Only the keys Tournaments/Show.jsx actually renders (Sprint 53).
            // The assembled payload also carries the raw Wikipedia response,
            // every venue row with its extract and imagery, and the full
            // fixture list — none of which this recap page draws, and all of
            // which was being serialised into the page props on every visit.
            'tournament' => Arr::only($tournament, self::SHOW_PAGE_FIELDS),
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
    /**
     * The content cards for a public section page.
     *
     * Defaults live in config/site_sections.php; each field is overridable per
     * card from the CMS via `section_card_{slug}_{index}_{field}`. A blank
     * override falls through to the default, same rule as pageHero().
     */
    private function sectionCards(string $slug): array
    {
        $cards = config("site_sections.{$slug}", []);

        try {
            if (! Schema::hasTable('site_settings')) {
                return $cards;
            }

            // One query for the whole section rather than one per field.
            $overrides = SiteSetting::query()
                ->where('key', 'like', "section_card_{$slug}_%")
                ->pluck('value', 'key');

            foreach ($cards as $index => $card) {
                foreach (['image', 'title', 'subtitle', 'description'] as $field) {
                    $value = $overrides["section_card_{$slug}_{$index}_{$field}"] ?? null;
                    if (! empty($value)) {
                        $cards[$index][$field] = $value;
                    }
                }
            }
        } catch (\Throwable $e) {
            // best-effort — config defaults still apply.
        }

        return $cards;
    }

    /**
     * Public + static so any controller rendering a section page reads the
     * same config-then-CMS-override hero. The Learning Hub needs it, and a
     * second copy would drift from the `page_hero_{slug}_{field}` keys the
     * admin CMS writes.
     */
    public static function pageHero(string $slug): array
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
