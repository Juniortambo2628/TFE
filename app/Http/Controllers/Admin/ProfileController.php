<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\MediaLibraryService;
use App\Traits\Uploadable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Admin profile — the admin's own account details.
 *
 * Sprint 56 brought it in line with the fan and partner profiles:
 *
 *  - It can set an avatar. Both other roles could; the admin's picture was
 *    fixed at the initial in a circle, with no way to change it, even though
 *    `users.avatar` has always been there. Uploads go through
 *    MediaLibraryService like every other image on the platform.
 *  - The "Phone Number" field is gone. There is no `users.phone` column and
 *    this controller never validated or saved it, so an admin could type a
 *    number, save, and find it blank again — the same silent-discard bug as
 *    the fan's Bio. Nothing on the platform reads a user phone number, so it
 *    is dropped rather than given a column.
 *  - Changing a password is not duplicated here any more. `password()` and
 *    its `admin.profile.password` route are gone; the shared
 *    AccountSecurity page owns it at `admin.security.password` (Sprint 53),
 *    and the profile page links there — exactly what the fan profile does
 *    with 2FA.
 */
class ProfileController extends Controller
{
    use Uploadable;

    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Admin/Profile', [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->profile?->avatar_path ?? $user->avatar,
                'created_at' => $user->created_at->format('M d, Y'),
                'email_verified' => (bool) $user->email_verified_at,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'avatar' => 'nullable|string|max:255',
            // Accepted types + size live in MediaLibraryService, not spelled
            // out per controller (Sprint 50).
            'avatar_file' => MediaLibraryService::imageRules(5120, false),
        ]);

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($request->hasFile('avatar_file')) {
            $user->avatar = Storage::url($this->uploadFile($request->file('avatar_file'), 'avatars'));
        } elseif (array_key_exists('avatar', $validated)) {
            // Present but empty means the admin cleared it — keep that,
            // rather than reading a cleared field as "not submitted" and
            // writing the old value back.
            $user->avatar = $validated['avatar'] ?: null;
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return back()->with('success', 'Profile updated successfully.');
    }
}
