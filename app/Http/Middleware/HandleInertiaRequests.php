<?php

namespace App\Http\Middleware;

use App\Models\ContactMessage;
use App\Models\SiteSetting;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $tournamentService = app(TournamentService::class);

        // Use the tournament ID resolved by ResolveTournament middleware
        // (stored in request attributes, respects session + ?tournament= param)
        $tournamentId = $request->attributes->get('tournament_id');

        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                // Guest requests short-circuit every notification/message
                // query — no DB round-trips on landing pages. Auth requests
                // still send eagerly, driven by the header dropdown.
                'unreadNotificationsCount' => fn () => $user ? $user->unreadNotifications()->count() : 0,
                'unreadMessagesCount' => fn () => $user
                    ? ($user->is_admin
                        ? $user->receivedMessages()->where('is_read', false)->count()
                            + ContactMessage::where('is_read', false)->count()
                        : $user->receivedMessages()->where('is_read', false)->count())
                    : 0,
                'notifications' => fn () => $user
                    ? $user->notifications()->latest()->take(5)->get()
                    : [],
                'messages' => fn () => $user
                    ? ($user->is_admin
                        ? collect($user->receivedMessages()->with('sender')->latest()->take(5)->get())
                            ->merge(ContactMessage::latest()->take(5)->get()->map(function ($m) {
                                return [
                                    'id' => $m->id,
                                    'sender' => ['name' => $m->name],
                                    'body' => $m->message,
                                    'subject' => $m->subject,
                                    'created_at' => $m->created_at,
                                    'is_contact_form' => true,
                                ];
                            }))
                            ->sortByDesc('created_at')
                            ->take(5)
                            ->values()
                        : $user->receivedMessages()->with('sender')->latest()->take(5)->get())
                    : [],
            ],
            'assetUrl' => asset(''),
            'partners' => config('partners.links', []),
            // Full tournament payload is cached; list is cached too. Both
            // stay eager because the Hero / TournamentContext consume them
            // on every landing / dashboard render.
            'tournament' => fn () => $tournamentId
                ? $tournamentService->get($tournamentId)
                : $tournamentService->current(),
            'tournament_list' => fn () => $tournamentService->all(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'two_factor_setup' => $request->session()->get('two_factor_setup'),
                'two_factor_code' => $request->session()->get('two_factor_code'),
                'tournament_refresh_output' => $request->session()->get('tournament_refresh_output'),
            ],
            // Only load the full settings map when explicitly requested by
            // an admin page — otherwise every admin nav hit reads the whole
            // site_settings table.
            'adminSettings' => Inertia::optional(fn () => ($user && $user->is_admin)
                ? SiteSetting::all()->pluck('value', 'key')
                : null),
        ];
    }
}
