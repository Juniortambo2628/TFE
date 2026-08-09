<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'country_code' => 'nullable|string|max:10',
            'date_of_birth' => 'nullable|date',
            'team_support' => 'nullable|string|max:100',
            'marketing_consent' => 'nullable|boolean',
            'community_consent' => 'nullable|boolean',
            'terms_agreed' => 'required|accepted',
            'privacy_consent' => 'required|accepted',
        ]);

        $user = User::create([
            'name' => $request->first_name.' '.$request->last_name,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'country' => $request->country,
            'country_code' => $request->country_code,
            'date_of_birth' => $request->date_of_birth,
            'team_support' => $request->team_support,
            'marketing_consent' => $request->marketing_consent ?? false,
            'community_consent' => $request->community_consent ?? false,
            'email_verified_at' => app()->environment('local') ? now() : null,
            'terms_agreed' => true,
            'privacy_consent' => true,
            'privacy_consent_at' => now(),
            'registration_completed' => true,
            'status' => 'active',
        ]);

        event(new Registered($user));

        Auth::login($user);

        return to_route('fan.dashboard');
    }

    public function checkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $exists = User::where('email', $request->email)->exists();

        return response()->json(['exists' => $exists]);
    }
}
