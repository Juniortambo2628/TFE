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
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        \Illuminate\Support\Facades\Log::info('Registration attempt started', $request->all());

        try {
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
                'seeking_financing' => 'nullable|boolean',
                'employment_status' => 'nullable|string|max:50',
                'loan_return_period' => 'nullable|string|max:50',
                'banking_partners_consent' => 'nullable|boolean',
                'marketing_consent' => 'nullable|boolean',
                'community_consent' => 'nullable|boolean',
                'terms_agreed' => 'required|accepted',
                'privacy_consent' => 'required|accepted',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Registration validation failed', ['errors' => $e->errors()]);
            throw $e;
        }

        \Illuminate\Support\Facades\Log::info('Registration validation passed');

        try {
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
                'seeking_financing' => $request->seeking_financing ?? false,
                'employment_status' => $request->employment_status,
                'loan_return_period' => $request->loan_return_period,
                'banking_partners_consent' => $request->banking_partners_consent ?? false,
                'marketing_consent' => $request->marketing_consent ?? false,
                'community_consent' => $request->community_consent ?? false,
                'terms_agreed' => true,
                'privacy_consent' => true,
                'privacy_consent_at' => now(),
                'registration_completed' => true,
                'status' => 'active',
            ]);

            \Illuminate\Support\Facades\Log::info('User created successfully', ['user_id' => $user->id]);

            event(new Registered($user));
            \Illuminate\Support\Facades\Log::info('Registered event dispatched');

            Auth::login($user);
            \Illuminate\Support\Facades\Log::info('User logged in');

            return to_route('fan.dashboard');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Registration failed at creation/login', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
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
