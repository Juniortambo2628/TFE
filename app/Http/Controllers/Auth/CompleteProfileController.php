<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;

class CompleteProfileController extends Controller
{
    public function create()
    {
        $user = Auth::user();
        
        // If profile is already complete, redirect to dashboard
        if (!empty($user->phone) && !empty($user->country) && !is_null($user->seeking_financing)) {
            return redirect()->route('fan.dashboard');
        }

        return Inertia::render('Auth/CompleteProfile', [
            'user' => $user
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
            'country' => 'required|string|max:100',
            'country_code' => 'required|string|max:10',
            'team_support' => 'nullable|string|max:100',
            'seeking_financing' => 'required|boolean',
            'terms_agreed' => 'required|accepted',
        ]);

        $user = User::find(Auth::id());
        $user->update([
            'phone' => $request->phone,
            'country' => $request->country,
            'country_code' => $request->country_code,
            'team_support' => $request->team_support,
            'seeking_financing' => $request->seeking_financing,
        ]);

        return redirect()->route('fan.dashboard');
    }
}
