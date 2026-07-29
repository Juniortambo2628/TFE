<?php

namespace App\Services;

use App\Models\LoginHistory;
use App\Models\UserSecuritySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SecurityService
{
    protected TwoFactorService $twoFactorService;

    public function __construct(TwoFactorService $twoFactorService)
    {
        $this->twoFactorService = $twoFactorService;
    }

    public function getSecurityData($user): array
    {
        $settings = UserSecuritySetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'two_factor_enabled' => false,
                'login_notifications' => true,
            ]
        );

        $loginHistory = LoginHistory::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($login) => [
                'id' => $login->id,
                'ip_address' => $login->ip_address,
                'device' => $login->device ?? 'Unknown',
                'location' => $login->location ?? 'Unknown',
                'successful' => $login->successful,
                'created_at' => $login->created_at->diffForHumans(),
            ]);

        $securityData = [
            'two_factor_enabled' => $settings->two_factor_enabled,
            'login_notifications' => $settings->login_notifications,
            'last_password_change' => $settings->last_password_change?->diffForHumans() ?? 'Never',
        ];

        $stats = [
            'login_count' => LoginHistory::where('user_id', $user->id)->count(),
            'failed_logins' => LoginHistory::where('user_id', $user->id)->where('successful', false)->count(),
            'days_since_password_change' => $settings->last_password_change
                ? $settings->last_password_change->diffInDays(now())
                : 999,
        ];

        return [
            'security_settings' => $securityData,
            'loginHistory' => $loginHistory,
            'stats' => $stats,
            'passkeys' => $user->webAuthnCredentials()
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'alias' => $p->alias,
                    'created_at' => $p->created_at?->toIso8601String(),
                ]),
        ];
    }

    public function changePassword(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            return back()->withErrors(['current_password' => 'Current password is incorrect']);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        UserSecuritySetting::where('user_id', $user->id)->update([
            'last_password_change' => now(),
        ]);

        return back()->with('success', 'Password changed successfully');
    }

    public function toggleTwoFactor(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();
        $settings = UserSecuritySetting::where('user_id', $user->id)->first();

        if ($settings && $settings->two_factor_enabled) {
            $this->twoFactorService->disable($user);

            return back()->with('success', 'Two-factor authentication disabled');
        }

        $secret = $this->twoFactorService->generateSecretKey();
        $qrCodeSvg = $this->twoFactorService->getQrCodeSvg(
            config('app.name'),
            $user->email,
            $secret
        );

        return back()->with('two_factor_setup', [
            'secret' => $secret,
            'qr_code' => $qrCodeSvg,
        ]);
    }

    public function confirmTwoFactor(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'code' => 'required|string',
            'secret' => 'required|string',
        ]);

        $user = $request->user();

        if ($this->twoFactorService->verifyCode($request->secret, $request->code)) {
            $this->twoFactorService->enable($user, $request->secret);

            return back()->with('success', 'Two-factor authentication enabled successfully!');
        }

        return back()->withErrors(['two_factor_code' => 'Invalid verification code. Please try again.']);
    }

    public function toggleLoginNotifications(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();
        $settings = UserSecuritySetting::where('user_id', $user->id)->first();

        if ($settings) {
            $settings->update([
                'login_notifications' => ! $settings->login_notifications,
            ]);
        }

        return back()->with('success', 'Login notifications updated');
    }
}
