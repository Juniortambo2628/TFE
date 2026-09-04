<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::all()->pluck('value', 'key');

        // Tournament hero image defaults from config (for preview before admin upload)
        $tournamentHeroImages = [];
        foreach (config('tournaments.tournaments', []) as $id => $cfg) {
            $tournamentHeroImages[$id] = $cfg['hero_image'] ?? null;
        }

        return Inertia::render('Admin/Settings', [
            'settings' => $settings,
            'tournament_hero_images' => $tournamentHeroImages,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->all();
        // Any tournament-scoped settings key (hero_bg / tagline / trophy /
        // accent / active_tournament) invalidates that tournament's cache
        // so the override lands on the next page render, not on the next
        // TTL expiry.
        $touchedTournaments = [];

        foreach ($data as $key => $value) {
            // Handle file uploads
            if ($request->hasFile($key)) {
                $path = $request->file($key)->store('settings', 'public');
                SiteSetting::set($key, Storage::url($path), 'image');
            } elseif (! is_array($value)) {
                // Determine type
                $type = is_bool($value) ? 'boolean' : 'text';
                SiteSetting::set($key, $value, $type);
            }

            if ($tid = $this->tournamentIdFor($key)) {
                $touchedTournaments[$tid] = true;
            }
        }

        if (! empty($touchedTournaments) || array_key_exists('active_tournament', $data)) {
            $tournaments = app(TournamentService::class);
            foreach (array_keys($touchedTournaments) as $tid) {
                $tournaments->clearCache($tid);
            }
            // active_tournament flips the site-wide default — clear
            // the switcher list too.
            if (array_key_exists('active_tournament', $data)) {
                Cache::forget('tournament:list:all');
            }
        }

        return back()->with('success', 'Settings updated successfully');
    }

    /**
     * Extract the tournament id from a per-tournament setting key.
     * Matches hero_bg_{id}, tournament_tagline_{id}, tournament_trophy_{id},
     * tournament_accent_{id}. Returns null when the key is site-wide.
     */
    protected function tournamentIdFor(string $key): ?string
    {
        foreach ([
            'hero_bg_',
            'tournament_tagline_',
            'tournament_trophy_',
            'tournament_accent_',
        ] as $prefix) {
            if (str_starts_with($key, $prefix)) {
                $tid = substr($key, strlen($prefix));

                return $tid !== '' && array_key_exists($tid, config('tournaments.tournaments', []))
                    ? $tid : null;
            }
        }

        return null;
    }

    public function refreshTournaments(Request $request)
    {
        $id = $request->input('id');

        $params = [];
        if (! empty($id)) {
            $params = ['--id' => [$id]];
        }

        Artisan::call('tournaments:refresh', $params);
        $output = Artisan::output();

        return back()->with('success', 'Tournament data refreshed.')->with('tournament_refresh_output', $output);
    }
}
