<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Sprint 47 Phase D — profile completion is now just team-support (opt).
 * All PII (phone, country, DOB, address) was moved off users.
 */
class CompleteProfileController extends Controller
{
    public function create()
    {
        $user = Auth::user();
        if (! empty($user->team_support)) {
            return redirect()->route('fan.dashboard');
        }

        return Inertia::render('Auth/CompleteProfile', [
            'user' => $user,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'team_support' => 'nullable|string|max:100',
            'terms_agreed' => 'required|accepted',
        ]);

        $user = User::find(Auth::id());
        $user->update(['team_support' => $request->team_support]);

        return redirect()->route('fan.dashboard');
    }
}
