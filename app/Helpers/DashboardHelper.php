<?php

namespace App\Helpers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class DashboardHelper
{
    /**
     * Redirect the authenticated user to their appropriate dashboard based on role.
     */
    public static function redirectByRole(?string $intended = null): RedirectResponse
    {
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->is_admin) {
            return redirect()->route('admin.dashboard');
        }

        if ($user->is_partner) {
            return redirect()->route('partner.dashboard');
        }

        return redirect()->route('fan.dashboard');
    }
}
