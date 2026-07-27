<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    /**
     * Display the partner profile page
     */
    public function index()
    {
        $user = Auth::user();
        
        $profile = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'company_name' => $user->company_name ?? '',
            'company_address' => $user->company_address ?? '',
            'created_at' => $user->created_at->format('M d, Y'),
            'avatar' => $user->profile?->avatar_path ?? $user->avatar ?? asset('assets/img/avatars/default-avatar.png'),
            'cover_image' => $user->cover_image,
        ];

        return Inertia::render('Partner/Profile', [
            'profile' => $profile,
        ]);
    }

    /**
     * Update the partner profile
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:255',
            'company_address' => 'nullable|string|max:500',
            'avatar' => 'nullable|string|max:255',
            'cover_image' => 'nullable',
        ]);

        $user = Auth::user();

        // Handle cover_image upload (similar to Fan controller)
        if ($request->hasFile('cover_image')) {
            $request->validate(['cover_image' => 'image|max:2048']);
            $path = $request->file('cover_image')->store('profiles', 'public');
            $validated['cover_image'] = '/storage/' . $path;
        } elseif ($request->filled('cover_image')) {
            $validated['cover_image'] = $request->input('cover_image');
        }

        // Handle avatar if sent (as string/url)
        if ($request->filled('avatar')) {
            $user->avatar = $request->avatar;
        }
        $user->update($validated);

        return back()->with('success', 'Profile updated successfully!');
    }
}
