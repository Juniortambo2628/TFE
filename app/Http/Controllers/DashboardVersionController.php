<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * "Try the new dashboard" (UX review, Nov 2026): the Naoa-style dashboard is
 * a per-person choice on the same pages and data, not a second set of URLs.
 * One endpoint for every role; the account menu in both designs posts here.
 *
 * Not in User::$fillable on purpose: no profile form should be able to flip
 * it as a side effect of saving something else.
 */
class DashboardVersionController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate(['v2' => ['required', 'boolean']]);

        $user = $request->user();
        $user->forceFill(['dashboard_v2' => (bool) $data['v2']])->save();

        return back()->with('success', $user->dashboard_v2
            ? 'Switched to the new dashboard. You can switch back from your account menu.'
            : 'Switched back to the current dashboard.');
    }
}
