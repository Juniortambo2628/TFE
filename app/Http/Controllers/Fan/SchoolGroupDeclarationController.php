<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\SchoolGroupDeclaration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Where a school declares a group trip (Sprint 61).
 *
 * TFE's engagement is with the SCHOOL, through an appointed official — not
 * with each child's guardian. The school already runs parental consent,
 * safeguarding, supervision ratios and duty of care; this endpoint records
 * that those channels were followed, who says so, and how many people are
 * travelling. It deliberately collects nothing that identifies a pupil.
 *
 * One duty does not transfer with the declaration: if TFE knows minors are
 * travelling and fails to tell the partner booking the flights, that is
 * TFE's failure. The traveller SPLIT is what carries that, which is why it
 * is required here rather than optional.
 */
class SchoolGroupDeclarationController extends Controller
{
    public function store(Request $request, Budget $budget)
    {
        $this->authorizeBudget($budget);

        // An age is only meaningful — and only asked for — when minors are
        // actually travelling. It decides whether unaccompanied-minor
        // handling applies, and is still nobody's identity.
        $hasMinors = (int) $request->input('travellers_minors') > 0;

        $validated = $request->validate([
            'school_name' => 'required|string|max:255',
            'official_name' => 'required|string|max:255',
            'official_role' => 'required|string|max:120',
            // The official's school address, not a personal one: "the school
            // agreed" has to be resolvable against in a dispute.
            'official_email' => 'required|email|max:255',
            'official_phone' => 'nullable|string|max:40',
            // At least one adult, always. A party of minors with nobody
            // supervising them is not a school group, and a partner quoting
            // flights against one would be quoting against a mistake.
            'travellers_adults' => 'required|integer|min:1|max:500',
            'travellers_minors' => 'required|integer|min:0|max:2000',
            'youngest_traveller_age' => [
                Rule::requiredIf($hasMinors),
                'nullable', 'integer', 'min:2', 'max:17',
            ],
            // Both warranties, or there is no declaration. One box ticked is
            // not a partial warranty — the model's isComplete() still guards
            // the render, because a record can reach a partner by routes
            // other than this form, but nothing incomplete starts here.
            'channels_confirmed' => 'accepted',
            'information_accurate' => 'accepted',
            'notes' => 'nullable|string|max:1000',
        ], [
            'channels_confirmed.accepted' => 'The school must confirm its own consent and safeguarding channels were followed.',
            'information_accurate.accepted' => 'The school must confirm this information is accurate.',
            'travellers_adults.min' => 'At least one accompanying adult must be travelling.',
            'youngest_traveller_age.required' => 'Tell us the age of the youngest traveller so minor handling can be arranged.',
        ]);

        SchoolGroupDeclaration::updateOrCreate(
            ['budget_id' => $budget->id],
            [
                'school_name' => $validated['school_name'],
                'official_name' => $validated['official_name'],
                'official_role' => $validated['official_role'],
                'official_email' => $validated['official_email'],
                'official_phone' => $validated['official_phone'] ?? null,
                'travellers_adults' => $validated['travellers_adults'],
                'travellers_minors' => $validated['travellers_minors'],
                // Never keep an age for a staff-only party. A stored value
                // nothing renders is a value that can later contradict the
                // numbers beside it.
                'youngest_traveller_age' => $hasMinors ? $validated['youngest_traveller_age'] : null,
                'channels_confirmed' => true,
                'information_accurate' => true,
                // Server-stamped, always. A client-supplied date on a legal
                // warranty is worth nothing, and an AMENDED declaration is a
                // new warranty: the one given for 20 minors does not cover
                // the 40 that were just submitted.
                'declared_at' => now(),
                'notes' => $validated['notes'] ?? null,
            ],
        );

        return back()->with('success', 'School group declaration saved. The travel partner will see it on this request.');
    }

    /**
     * Withdraw a declaration.
     *
     * Needed because a declaration can land on the wrong itinerary, and the
     * only other way out would be deleting the whole plan. It clears the
     * minors flag from the partner's brief, which is correct: without a
     * declaration this is an ordinary trip, and nobody has warranted
     * otherwise.
     */
    public function destroy(Budget $budget)
    {
        $this->authorizeBudget($budget);

        $budget->schoolDeclaration?->delete();

        return back()->with('success', 'School group declaration withdrawn.');
    }

    /**
     * Route-model binding is not an authorization check — it serves whatever
     * id it is handed (Sprint 56, the partner Convert queue).
     */
    private function authorizeBudget(Budget $budget): void
    {
        if ($budget->user_id !== Auth::id()) {
            abort(403);
        }
    }
}
