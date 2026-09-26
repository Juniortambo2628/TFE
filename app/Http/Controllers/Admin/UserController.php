<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Admin user directory — Phase D slimmed edition.
 *
 * TFE holds only auth + identity (name, email, roles, consent flags,
 * activity counts). Everything KYC (phone, DOB, address, country) lives
 * on the partner platforms that service the fan.
 */
class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }

        $users = $query->latest()
            ->withCount(['posts', 'predictions', 'followers', 'eventRsvps'])
            ->paginate(15)
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'bio' => $user->bio,
                'is_admin' => (bool) $user->is_admin,
                'is_partner' => (bool) $user->is_partner,
                'team_support' => $user->team_support,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                'posts_count' => $user->posts_count,
                'predictions_count' => $user->predictions_count,
                'followers_count' => $user->followers_count,
                'events_count' => $user->event_rsvps_count,
                'marketing_consent' => (bool) $user->marketing_consent,
                'community_consent' => (bool) $user->community_consent,
                'terms_agreed' => (bool) $user->terms_agreed,
            ]);

        $stats = [
            'total' => User::count(),
            'admins' => User::where('is_admin', true)->count(),
            'today' => User::whereDate('created_at', today())->count(),
            'partners' => User::where('is_partner', true)->count(),
        ];

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$user->id,
            'team_support' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'is_admin' => 'boolean',
            'is_partner' => 'boolean',
            'marketing_consent' => 'boolean',
            'community_consent' => 'boolean',
            'terms_agreed' => 'boolean',
        ]);

        $user->update($validated);

        return back()->with('success', 'User updated successfully');
    }

    public function toggleAdmin(User $user)
    {
        $user->update(['is_admin' => ! $user->is_admin]);

        return back()->with('success', $user->is_admin ? 'User promoted to admin' : 'Admin privileges removed');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return back()->with('success', 'User deleted');
    }
}
