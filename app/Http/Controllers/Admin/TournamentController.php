<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Services\StadiumImageService;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

/**
 * Tournament management.
 *
 * Tournament configuration used to be scattered: the featured tournament, the
 * Wikipedia refresh, hero backgrounds, taglines, trophies and accents sat on a
 * tab of Site Settings, while stadium imagery sat on a tab of Content
 * Management — and the organiser card background had no admin surface at all.
 * Everything about a tournament now lives here, one tournament per page, in
 * the same index → edit shape the partner directory uses.
 */
class TournamentController extends Controller
{
    /**
     * The SiteSetting key for each editable field, keyed by the name used in
     * the payload. Single source of truth for reading, writing and cache
     * invalidation — these prefixes must stay in step with
     * TournamentService::loadOverrides().
     */
    private const FIELD_KEYS = [
        'tagline' => 'tournament_tagline_',
        'accent' => 'tournament_accent_',
        'trophy_image' => 'tournament_trophy_',
        'hero_image' => 'hero_bg_',
        'organizer_card_bg' => 'tournament_card_bg_',
    ];

    /** Which of those fields are uploads rather than text. */
    private const IMAGE_FIELDS = ['trophy_image', 'hero_image', 'organizer_card_bg'];

    public function __construct(
        protected TournamentService $tournaments,
        protected StadiumImageService $stadiumImages,
    ) {}

    public function index()
    {
        $settings = SiteSetting::pluck('value', 'key');

        $tournaments = collect($this->tournaments->all())->map(function (array $t) use ($settings) {
            $id = $t['id'];

            return [
                'id' => $id,
                'name' => $t['name'],
                'slug' => $t['slug'] ?? $id,
                'short_name' => $t['short_name'] ?? null,
                'status' => $t['status'] ?? null,
                'tagline' => $t['tagline'] ?? null,
                'hosts' => $t['hosts'] ?? [],
                'start_date' => $t['start_date'] ?? null,
                'end_date' => $t['end_date'] ?? null,
                'accent' => $t['color_accent'] ?? '#dc143c',
                'trophy_image' => $t['trophy_image'] ?? null,
                'hero_image' => $t['hero_image'] ?? null,
                'organizer_card_bg' => $t['organizer_card_bg'] ?? null,
                'venue_count' => count($t['venues'] ?? []),
                'has_catalogue' => $this->stadiumImages->hasCatalogueSet($id),
                // How many fields this tournament has been customised on —
                // surfaced on the card so an admin can see what is overridden.
                'override_count' => collect(self::FIELD_KEYS)
                    ->filter(fn (string $prefix) => filled($settings[$prefix.$id] ?? null))
                    ->count(),
            ];
        })->values();

        return Inertia::render('Admin/Tournaments', [
            'tournaments' => $tournaments,
            'activeTournament' => SiteSetting::get('active_tournament')
                ?: ($tournaments->firstWhere('status', '!=', 'concluded')['id'] ?? $tournaments[0]['id'] ?? null),
        ]);
    }

    public function edit(string $tournament)
    {
        // NOTE: TournamentService::get() falls back to the default tournament
        // for an unknown id, so it can never double as an existence check —
        // ask the config directly.
        abort_unless($this->exists($tournament), 404);

        $payload = $this->tournaments->get($tournament);
        $settings = SiteSetting::pluck('value', 'key');
        $config = config("tournaments.tournaments.{$tournament}", []);

        // Each field reports both the live value and the config default, so
        // the editor can preview what is live and offer "reset to default".
        $fields = [];
        foreach (self::FIELD_KEYS as $field => $prefix) {
            $configKey = match ($field) {
                'accent' => 'color_accent',
                default => $field,
            };

            $fields[$field] = [
                'setting_key' => $prefix.$tournament,
                'value' => $settings[$prefix.$tournament] ?? '',
                'default' => $config[$configKey] ?? null,
                'resolved' => $payload[$configKey === 'accent' ? 'color_accent' : $configKey] ?? null,
            ];
        }

        return Inertia::render('Admin/TournamentEdit', [
            'tournament' => [
                'id' => $tournament,
                'name' => $payload['name'],
                'slug' => $payload['slug'] ?? $tournament,
                'short_name' => $payload['short_name'] ?? null,
                'status' => $payload['status'] ?? null,
                'hosts' => $payload['hosts'] ?? [],
                'start_date' => $payload['start_date'] ?? null,
                'end_date' => $payload['end_date'] ?? null,
                'num_teams' => $payload['num_teams'] ?? null,
                'public_url' => url('/tournaments/'.($payload['slug'] ?? $tournament)),
            ],
            'fields' => $fields,
            'isFeatured' => SiteSetting::get('active_tournament') === $tournament,
            'venues' => $this->venuesFor($tournament, $payload, $settings),
            'hasCatalogue' => $this->stadiumImages->hasCatalogueSet($tournament),
        ]);
    }

    public function update(Request $request, string $tournament)
    {
        abort_unless($this->exists($tournament), 404);

        // Explicit mimes, never Laravel's `image` rule — that one admits SVG,
        // and a same-origin /storage URL turns an uploaded SVG into a
        // stored-XSS vector.
        $rules = [
            'tagline' => 'nullable|string|max:255',
            'accent' => 'nullable|string|max:32',
        ];
        foreach (self::IMAGE_FIELDS as $field) {
            $rules[$field] = 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120';
        }
        $validated = $request->validate($rules, [
            '*.mimes' => 'Images must be a JPG, PNG or WebP file.',
            '*.max' => 'Images must be 5MB or smaller.',
        ]);

        foreach (self::FIELD_KEYS as $field => $prefix) {
            $key = $prefix.$tournament;

            if (in_array($field, self::IMAGE_FIELDS, true)) {
                if ($request->hasFile($field)) {
                    $path = $request->file($field)->store('tournaments', 'public');
                    SiteSetting::set($key, '/storage/'.$path, 'image', 'tournament');
                } elseif ($request->boolean("clear_{$field}")) {
                    // Blank means "fall back to config", which is how every
                    // reader treats an empty override.
                    SiteSetting::set($key, '', 'image', 'tournament');
                }

                continue;
            }

            if ($request->has($field)) {
                SiteSetting::set($key, $validated[$field] ?? '', 'text', 'tournament');
            }
        }

        $this->tournaments->clearCache($tournament);
        $this->stadiumImages->clearCache($tournament);

        return back()->with('success', 'Tournament updated.');
    }

    /**
     * Set the site-wide featured tournament.
     */
    public function feature(Request $request)
    {
        $data = $request->validate(['tournament' => 'required|string']);

        abort_unless($this->exists($data['tournament']), 404);

        SiteSetting::set('active_tournament', $data['tournament'], 'text', 'tournament');
        Cache::forget('tournament:list:all');

        return back()->with('success', 'Featured tournament updated.');
    }

    /**
     * Re-pull Wikipedia data. Optionally scoped to one tournament.
     */
    public function refresh(Request $request)
    {
        $id = $request->input('tournament');

        // The command takes repeatable --id options; no id means "all".
        $exitCode = Artisan::call('tournaments:refresh', $id ? ['--id' => [$id]] : []);

        return back()->with([
            'success' => $exitCode === 0 ? 'Tournament data refreshed.' : 'Refresh finished with errors.',
            'tournament_refresh_output' => Artisan::output(),
        ]);
    }

    /**
     * Is this a real tournament id?
     */
    private function exists(string $id): bool
    {
        return (bool) config("tournaments.tournaments.{$id}");
    }

    /**
     * Venue rows for the stadium-image editor, in the same shape the Content
     * page used — catalogued tournaments render their config-derived venues,
     * uncatalogued ones the Wikipedia-parsed list with per-name overrides.
     */
    private function venuesFor(string $tournamentId, array $payload, $settings): array
    {
        if ($this->stadiumImages->hasCatalogueSet($tournamentId)) {
            return $this->stadiumImages->all($tournamentId);
        }

        $prefix = StadiumImageService::NAME_PREFIX.$tournamentId.'_';
        $venues = [];

        foreach (($payload['venues'] ?? []) as $venue) {
            $normalized = StadiumImageService::normalize($venue['name'] ?? '');
            if ($normalized === '') {
                continue;
            }

            $override = $settings[$prefix.$normalized] ?? null;
            $venues[] = [
                'slug' => $normalized,
                'setting_key' => $prefix.$normalized,
                'name' => $venue['name'] ?? '',
                'city' => $venue['city'] ?? null,
                'country' => $venue['country'] ?? null,
                'default_url' => $venue['thumbnail'] ?? $venue['image'] ?? null,
                'url' => $override ?: ($venue['thumbnail'] ?? $venue['image'] ?? null),
                'is_overridden' => (bool) $override,
            ];
        }

        return $venues;
    }
}
