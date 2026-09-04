<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tribe;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TribeController extends Controller
{
    public function index()
    {
        $tribes = Tribe::with('creator')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(function ($tribe) {
                $tCfg = $tribe->tournament_id
                    ? config("tournaments.tournaments.{$tribe->tournament_id}")
                    : null;

                return [
                    'id' => $tribe->id,
                    'name' => $tribe->name,
                    'slug' => $tribe->slug,
                    'creator_name' => $tribe->creator->name ?? 'Unknown',
                    'member_count' => $tribe->member_count,
                    'privacy' => $tribe->privacy,
                    'created_at' => $tribe->created_at->format('M d, Y'),
                    'tournament_id' => $tribe->tournament_id,
                    'tournament_short' => $tCfg['short_name'] ?? $tCfg['name'] ?? null,
                ];
            });

        return Inertia::render('Admin/Tribes', [
            'tribes' => $tribes,
            'tournaments' => app(TournamentService::class)->all(),
        ]);
    }

    public function show(Tribe $tribe)
    {
        return Inertia::render('Admin/TribeDetail', [
            'tribe' => $tribe->load(['creator', 'members.user']),
            'tournaments' => app(TournamentService::class)->all(),
        ]);
    }

    public function update(Request $request, Tribe $tribe)
    {
        $tournamentIds = array_keys(config('tournaments.tournaments', []));

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'privacy' => 'nullable|in:public,private,invite_only',
            'forum_enabled' => 'nullable|boolean',
            // Admin can pin a tribe to a specific tournament, clear the
            // pin (cross-tournament), or leave the field untouched.
            'tournament_id' => 'nullable|in:'.implode(',', $tournamentIds),
            'clear_tournament' => 'nullable|boolean',
        ]);

        // Explicit "clear" wins over an incoming tournament_id so admin
        // can send both without surprises.
        if ($request->boolean('clear_tournament')) {
            $validated['tournament_id'] = null;
        } elseif (! $request->has('tournament_id')) {
            unset($validated['tournament_id']);
        }
        unset($validated['clear_tournament']);

        $tribe->update(array_filter(
            $validated,
            fn ($v, $k) => $v !== null || $k === 'tournament_id',
            ARRAY_FILTER_USE_BOTH,
        ));

        return back()->with('success', 'Tribe updated successfully');
    }

    public function destroy(Tribe $tribe)
    {
        $tribe->delete();

        return back()->with('success', 'Tribe deleted');
    }
}
