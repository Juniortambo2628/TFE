<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Controllers\TripPlannerController;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function redirect($provider)
    {
        $driver = Socialite::driver($provider);

        if (app()->environment('local')) {
            $driver->setHttpClient(new Client(['verify' => false]));
        }

        return $driver->redirect();
    }

    public function callback($provider)
    {
        try {
            $driver = Socialite::driver($provider);

            if (app()->environment('local')) {
                $driver->setHttpClient(new Client(['verify' => false]));
            }

            $socialUser = $driver->user();

            // An existing account keeps its own name, avatar and password. This
            // used to `updateOrCreate` with a FIXED dummy password, so signing
            // in with Google reset any matching account's password to a
            // string anyone reading the source knew (Sprint 65).
            $user = User::where('email', $socialUser->getEmail())->first();

            if ($user) {
                $user->forceFill([
                    'google_id' => $socialUser->getId(),
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();
            } else {
                $name = (string) $socialUser->getName();
                $user = User::create([
                    'email' => $socialUser->getEmail(),
                    'name' => $name,
                    'first_name' => explode(' ', $name)[0] ?? $name,
                    'last_name' => explode(' ', $name)[1] ?? '',
                    'google_id' => $socialUser->getId(),
                    'avatar' => $socialUser->getAvatar(),
                    'password' => Hash::make(Str::random(40)),
                    'email_verified_at' => now(), // Google has verified the address
                ]);
            }

            Auth::login($user);

            // Check if profile is complete
            // Someone mid-way through the trip planner goes straight back to
            // their trip; the team question can wait for the profile page.
            if ($this->needsProfileCompletion($user) && ! session()->has(TripPlannerController::SESSION_KEY)) {
                return redirect()->route('register.complete');
            }

            return redirect()->intended(route('fan.dashboard'));

        } catch (\Exception $e) {
            Log::error('Social Auth Error: '.$e->getMessage());

            return redirect()->route('login')->with('error', 'Unable to login with '.ucfirst($provider));
        }
    }

    protected function needsProfileCompletion(User $user)
    {
        // A social sign-up is complete once they've named their supported team.
        return empty($user->team_support);
    }
}
