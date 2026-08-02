<?php

namespace App\Http\Middleware;

use App\Models\ContactMessage;
use App\Models\SiteSetting;
use App\Services\TournamentService;
use Illuminate\Http\Request;
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

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'notifications' => $request->user() ? $request->user()->notifications()->latest()->take(5)->get() : [],
                'unreadNotificationsCount' => $request->user() ? $request->user()->unreadNotifications()->count() : 0,
                'messages' => $request->user() ? ($request->user()->is_admin
                    ? collect($request->user()->receivedMessages()->with('sender')->latest()->take(5)->get())
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
                    : $request->user()->receivedMessages()->with('sender')->latest()->take(5)->get()) : [],
                'unreadMessagesCount' => $request->user() ? ($request->user()->is_admin
                    ? $request->user()->receivedMessages()->where('is_read', false)->count() + ContactMessage::where('is_read', false)->count()
                    : $request->user()->receivedMessages()->where('is_read', false)->count()) : 0,
            ],
            'assetUrl' => asset(''),
            'partners' => config('partners.links', []),
            'tournament' => $tournamentService->current(),
            'tournament_list' => $tournamentService->all(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'two_factor_setup' => $request->session()->get('two_factor_setup'),
                'two_factor_code' => $request->session()->get('two_factor_code'),
                'tournament_refresh_output' => $request->session()->get('tournament_refresh_output'),
            ],
            'adminSettings' => ($request->user() && $request->user()->is_admin)
                ? SiteSetting::all()->pluck('value', 'key')
                : null,
        ];
    }
}
