<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Services\FixtureService;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Admin CRUD for prepacked packages — fixed-price templates fans can pick
 * as a starting point in the BudgetCalculator. Tournament-scoped (a
 * package belongs to exactly one tournament from config/tournaments.php).
 */
class PackageController extends Controller
{
    public function index(Request $request)
    {
        $tournamentService = app(TournamentService::class);
        $tournaments = $tournamentService->all();

        // Filter surface — default to all tournaments.
        $filterTournament = $request->query('tournament_id');

        $query = Package::query()->orderBy('display_order')->orderByDesc('is_featured')->orderBy('name');
        if ($filterTournament) {
            $query->where('tournament_id', $filterTournament);
        }

        $packages = $query->get()->map(function (Package $p) {
            $config = config("tournaments.tournaments.{$p->tournament_id}");

            return [
                'id' => $p->id,
                'tournament_id' => $p->tournament_id,
                'tournament_name' => $config['short_name'] ?? $config['name'] ?? $p->tournament_id,
                'name' => $p->name,
                'slug' => $p->slug,
                'description' => $p->description,
                'hero_image' => $p->hero_image,
                'base_price' => $p->base_price,
                'currency' => $p->currency,
                'included_match_ids' => $p->included_match_ids ?? [],
                'included_venues' => $p->included_venues ?? [],
                'nights' => $p->nights,
                'flight_class' => $p->flight_class,
                'accommodation_level' => $p->accommodation_level,
                'capacity' => $p->capacity,
                'sold_count' => $p->sold_count,
                'seats_left' => $p->seats_left,
                'availability_pct' => $p->availability_pct,
                'is_sold_out' => $p->is_sold_out,
                'is_active' => $p->is_active,
                'is_featured' => $p->is_featured,
                'display_order' => $p->display_order,
                'created_at' => $p->created_at?->format('M d, Y'),
            ];
        });

        return Inertia::render('Admin/Packages', [
            'packages' => $packages,
            'tournaments' => $tournaments,
            'filter_tournament_id' => $filterTournament,
        ]);
    }

    /**
     * Fixture list for a tournament — powers the match/venue pickers in
     * the admin form. Kept as a JSON endpoint so opening the form
     * doesn't pull hundreds of fixtures on every /admin/packages hit.
     */
    public function fixtures(Request $request)
    {
        $tournamentId = $request->query('tournament_id');
        if (! $tournamentId) {
            return response()->json(['fixtures' => [], 'venues' => []]);
        }

        $fixtures = app(FixtureService::class)->getFixtures($tournamentId);
        $venues = collect($fixtures)->pluck('venue')->filter()->unique()->values()->toArray();

        return response()->json([
            'fixtures' => $fixtures,
            'venues' => $venues,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateRequest($request);

        if ($request->hasFile('hero_image_file')) {
            $validated['hero_image'] = Storage::url(
                $request->file('hero_image_file')->store('packages', 'public')
            );
        }

        $validated['created_by'] = $request->user()->id;

        Package::create($validated);

        return back()->with('success', 'Package created successfully');
    }

    public function update(Request $request, Package $package)
    {
        $validated = $this->validateRequest($request, $package);

        if ($request->hasFile('hero_image_file')) {
            $validated['hero_image'] = Storage::url(
                $request->file('hero_image_file')->store('packages', 'public')
            );
        }

        $package->update($validated);

        return back()->with('success', 'Package updated successfully');
    }

    public function destroy(Package $package)
    {
        $package->delete();

        return back()->with('success', 'Package deleted successfully');
    }

    /**
     * Shared validation for store + update.
     */
    private function validateRequest(Request $request, ?Package $package = null): array
    {
        $tournamentIds = array_keys(config('tournaments.tournaments', []));

        return $request->validate([
            'tournament_id' => 'required|string|in:'.implode(',', $tournamentIds),
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'hero_image' => 'nullable|string',
            'hero_image_file' => 'nullable|image|max:5120',
            'base_price' => 'required|numeric|min:0',
            'currency' => 'required|string|max:8',
            'included_match_ids' => 'nullable|array',
            'included_match_ids.*' => 'string',
            'included_venues' => 'nullable|array',
            'included_venues.*' => 'string',
            'nights' => 'required|integer|min:1|max:60',
            'flight_class' => 'required|string|in:economy,business,first',
            'accommodation_level' => 'required|string',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'required|boolean',
            'is_featured' => 'required|boolean',
            'display_order' => 'nullable|integer|min:0',
        ]);
    }
}
