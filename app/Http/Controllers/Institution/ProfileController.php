<?php

namespace App\Http\Controllers\Institution;

use App\Http\Controllers\Controller;
use App\Models\InstitutionProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * The institution's own record (Sprint 62).
 *
 * Editable because organisations change — a new head of games, a school that
 * moves, a registration that finally comes through. `verification_status` is
 * NOT editable here: an account that could mark itself verified is an account
 * whose verification means nothing.
 */
class ProfileController extends Controller
{
    public function edit()
    {
        $user = Auth::user();

        return Inertia::render('Institution/Profile', [
            'institutionTypes' => InstitutionProfile::TYPES,
            'profile' => [
                'institution_name' => $user->institutionProfile?->institution_name,
                'institution_type' => $user->institutionProfile?->institution_type,
                'registration_number' => $user->institutionProfile?->registration_number,
                'country' => $user->institutionProfile?->country,
                'city' => $user->institutionProfile?->city,
                'address' => $user->institutionProfile?->address,
                'official_role' => $user->institutionProfile?->official_role,
                'contact_phone' => $user->institutionProfile?->contact_phone,
                'verification_status' => $user->institutionProfile?->verification_status,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

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
        ]);

        // Nullable fields are written unconditionally from the validated set,
        // never with `?? $existing` — ConvertEmptyStringsToNull turns a
        // cleared field into null before validation, so `??` cannot tell
        // "emptied" from "not submitted" and writes the old value back
        // (Sprint 56).
        InstitutionProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'institution_name' => $validated['institution_name'],
                'institution_type' => $validated['institution_type'],
                'registration_number' => $validated['registration_number'] ?? null,
                'country' => $validated['country'],
                'city' => $validated['city'] ?? null,
                'address' => $validated['address'] ?? null,
                'official_role' => $validated['official_role'],
                'contact_phone' => $validated['contact_phone'] ?? null,
            ],
        );

        $user->update([
            // The account is the organisation, so its display name follows
            // the institution rather than the person currently running it.
            'name' => $validated['institution_name'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
        ]);

        return back()->with('success', 'Institution details updated.');
    }
}
