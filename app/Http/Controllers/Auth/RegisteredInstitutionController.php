<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\InstitutionProfile;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sign-up for institutions — schools, universities, academies, clubs and
 * community groups (Sprint 62).
 *
 * Separate from the fan form because the questions are different, not
 * because the form is longer. A fan is asked which team they support; an
 * institution is asked what it is, where, and who is authorised to act for
 * it. Putting both behind one form meant every fan scrolled past fields
 * that did not apply to them, and every school answered none that did.
 *
 * `users.name` is the INSTITUTION's name — it is what the chrome shows, and
 * the account belongs to the organisation. The person signing up is its
 * appointed official: their name is `first_name`/`last_name` and their role
 * is on the profile, so there is one record of who to contact rather than
 * two that can disagree.
 */
class RegisteredInstitutionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/RegisterInstitution', [
            'institutionTypes' => InstitutionProfile::TYPES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'institution_name' => 'required|string|max:255',
            'institution_type' => ['required', Rule::in(array_keys(InstitutionProfile::TYPES))],
            'registration_number' => 'nullable|string|max:120',
            'country' => 'required|string|max:120',
            'city' => 'nullable|string|max:120',
            'address' => 'nullable|string|max:500',

            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'official_role' => 'required|string|max:120',
            'contact_phone' => 'nullable|string|max:40',
            // The institution's own address. A personal one cannot be
            // resolved against the organisation later.
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],

            'authority_confirmed' => 'required|accepted',
            'terms_agreed' => 'required|accepted',
            'privacy_consent' => 'required|accepted',
        ], [
            'authority_confirmed.accepted' => 'Confirm you are authorised to act for this institution.',
        ]);

        // One transaction: an account without its profile is an institution
        // the group surfaces cannot describe, and `isInstitution()` would
        // wave it through to a dashboard with nothing behind it.
        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['institution_name'],
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'account_type' => 'institution',
                'email_verified_at' => app()->environment('local') ? now() : null,
                'terms_agreed' => true,
                'privacy_consent' => true,
                'privacy_consent_at' => now(),
                'registration_completed' => true,
                'status' => 'active',
            ]);

            InstitutionProfile::create([
                'user_id' => $user->id,
                'institution_name' => $validated['institution_name'],
                'institution_type' => $validated['institution_type'],
                'registration_number' => $validated['registration_number'] ?? null,
                'country' => $validated['country'],
                'city' => $validated['city'] ?? null,
                'address' => $validated['address'] ?? null,
                'official_role' => $validated['official_role'],
                'contact_phone' => $validated['contact_phone'] ?? null,
                // Pending, never verified on self-declaration. Verification
                // is what makes "we are a real school" worth anything.
                'verification_status' => 'pending',
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return to_route('institution.dashboard');
    }
}
