<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\LoginHistory;
use App\Models\UserSecuritySetting;
use App\Notifications\LoginAlertNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        if ($user->two_factor_enabled) {
            // Log out but keep track of who is logging in
            Auth::logout();

            $request->session()->put('login.id', $user->id);
            $request->session()->put('login.remember', $request->boolean('remember'));

            return redirect()->route('login.two-factor');
        }

        $request->session()->regenerate();

        // Record login history & send notification
        $this->recordLoginAndNotify($request, $user);

        if ($user->is_admin) {
            return redirect()->route('admin.dashboard');
        }

        if ($user->is_partner) {
            return redirect()->route('partner.dashboard');
        }

        return redirect()->intended(route('fan.dashboard', absolute: false));
    }

    /**
     * Record login history and optionally send email notification.
     */
    protected function recordLoginAndNotify(Request $request, $user): void
    {
        $userAgent = $request->userAgent();
        $ip = $request->ip();

        // Parse device info from user agent
        $device = $this->parseDevice($userAgent);

        $loginData = [
            'user_id' => $user->id,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'device' => $device,
            'location' => 'Unknown', // Could integrate IP geolocation later
            'successful' => true,
        ];

        LoginHistory::create($loginData);

        // Check if user wants login notifications
        $settings = UserSecuritySetting::where('user_id', $user->id)->first();

        if ($settings && $settings->login_notifications) {
            $user->notify(new LoginAlertNotification([
                'ip_address' => $ip,
                'device' => $device,
                'location' => 'Unknown',
                'time' => now()->format('M d, Y \a\t h:i A'),
            ]));
        }
    }

    /**
     * Parse a human-readable device string from the user agent.
     */
    protected function parseDevice(string $userAgent): string
    {
        // Simple UA parsing — extract browser and OS
        $browser = 'Unknown Browser';
        $os = 'Unknown OS';

        if (str_contains($userAgent, 'Firefox')) {
            $browser = 'Firefox';
        } elseif (str_contains($userAgent, 'Edg')) {
            $browser = 'Microsoft Edge';
        } elseif (str_contains($userAgent, 'Chrome')) {
            $browser = 'Chrome';
        } elseif (str_contains($userAgent, 'Safari')) {
            $browser = 'Safari';
        }

        if (str_contains($userAgent, 'Windows')) {
            $os = 'Windows';
        } elseif (str_contains($userAgent, 'Mac OS')) {
            $os = 'macOS';
        } elseif (str_contains($userAgent, 'Linux')) {
            $os = 'Linux';
        } elseif (str_contains($userAgent, 'Android')) {
            $os = 'Android';
        } elseif (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
            $os = 'iOS';
        }

        return "{$browser} on {$os}";
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
