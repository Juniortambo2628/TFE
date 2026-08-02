<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

            $user = User::updateOrCreate([
                'email' => $socialUser->getEmail(),
            ], [
                'name' => $socialUser->getName(),
                'first_name' => explode(' ', $socialUser->getName())[0] ?? $socialUser->getName(),
                'last_name' => explode(' ', $socialUser->getName())[1] ?? '',
                'google_id' => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar(),
                'password' => bcrypt('google_auth_dummy_password'), // Dummy password
                'email_verified_at' => now(), // Assume social login is verified
            ]);

            Auth::login($user);

            // Check if profile is complete
            if ($this->needsProfileCompletion($user)) {
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
        // Check for critical recommended fields
        return empty($user->phone) || empty($user->country) || is_null($user->seeking_financing);
    }
}
