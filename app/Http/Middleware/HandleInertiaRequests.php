<?php

namespace App\Http\Middleware;

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
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'notifications' => $request->user() ? $request->user()->notifications()->latest()->take(5)->get() : [],
                'unreadNotificationsCount' => $request->user() ? $request->user()->unreadNotifications()->count() : 0,
                'messages' => $request->user() ? ($request->user()->is_admin 
                    ? collect($request->user()->receivedMessages()->with('sender')->latest()->take(5)->get())
                        ->merge(\App\Models\ContactMessage::latest()->take(5)->get()->map(function($m) {
                            return [
                                'id' => $m->id,
                                'sender' => ['name' => $m->name],
                                'body' => $m->message,
                                'subject' => $m->subject,
                                'created_at' => $m->created_at,
                                'is_contact_form' => true
                            ];
                        }))
                        ->sortByDesc('created_at')
                        ->take(5)
                        ->values()
                    : $request->user()->receivedMessages()->with('sender')->latest()->take(5)->get()) : [],
                'unreadMessagesCount' => $request->user() ? ($request->user()->is_admin
                    ? $request->user()->receivedMessages()->where('is_read', false)->count() + \App\Models\ContactMessage::where('is_read', false)->count()
                    : $request->user()->receivedMessages()->where('is_read', false)->count()) : 0,
            ],
            'assetUrl' => asset(''),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'two_factor_setup' => $request->session()->get('two_factor_setup'),
                'two_factor_code' => $request->session()->get('two_factor_code'),
            ],
            'adminSettings' => ($request->user() && $request->user()->is_admin) 
                ? \App\Models\SiteSetting::all()->pluck('value', 'key')
                : null,
        ];
    }
}
