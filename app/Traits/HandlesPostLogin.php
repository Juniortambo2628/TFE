<?php

namespace App\Traits;

use App\Models\LoginHistory;
use App\Models\User;
use App\Models\UserSecuritySetting;
use App\Notifications\LoginAlertNotification;
use Illuminate\Http\Request;

/**
 * Shared post-authentication concerns.
 *
 * Both the password flow (AuthenticatedSessionController) and the passkey flow
 * (WebAuthn\WebAuthnLoginController) land here, so a fan gets the same
 * two-factor gate, the same login history row and the same landing page
 * whichever credential they signed in with. Before this trait existed the
 * passkey route skipped all three — it authenticated, answered 204 and left
 * the SPA sitting on the login screen.
 */
trait HandlesPostLogin
{
    /**
     * Whether this account still has to clear the two-factor challenge.
     */
    protected function requiresTwoFactor(User $user): bool
    {
        return (bool) UserSecuritySetting::where('user_id', $user->id)
            ->value('two_factor_enabled');
    }

    /**
     * Park the half-authenticated user on the two-factor challenge.
     *
     * The session is dropped again on purpose: until the second factor is
     * presented the visitor is not logged in.
     */
    protected function stashTwoFactorChallenge(Request $request, User $user, bool $remember): void
    {
        auth()->logout();

        $request->session()->put('login.id', $user->id);
        $request->session()->put('login.remember', $remember);
    }

    /**
     * Record login history and optionally notify the account owner.
     */
    protected function recordLoginAndNotify(Request $request, User $user): void
    {
        $userAgent = $request->userAgent() ?? '';
        $device = $this->parseDevice($userAgent);

        LoginHistory::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $userAgent,
            'device' => $device,
            'location' => 'Unknown', // Could integrate IP geolocation later
            'successful' => true,
        ]);

        $settings = UserSecuritySetting::where('user_id', $user->id)->first();

        if ($settings && $settings->login_notifications) {
            $user->notify(new LoginAlertNotification([
                'ip_address' => $request->ip(),
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
     * The dashboard this account belongs on.
     */
    protected function dashboardRouteFor(User $user): string
    {
        if ($user->is_admin) {
            return route('admin.dashboard');
        }

        if ($user->is_partner) {
            return route('partner.dashboard');
        }

        return route('fan.dashboard', absolute: false);
    }
}
