<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Controllers\TripPlannerController;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        return $request->user()->hasVerifiedEmail()
                    ? redirect()->intended(route('dashboard', absolute: false))
                    : Inertia::render('Auth/VerifyEmail', [
                        'status' => session('status'),
                        // A visitor who signed up from the trip planner still has
                        // their trip in the session, and `resume()` re-armed
                        // `intended` for after verification. Say so: this is the
                        // step in the booking path where people stop, and "thanks
                        // for signing up" does not tell them the trip is waiting.
                        'tripSaved' => $request->session()->has(TripPlannerController::SESSION_KEY),
                    ]);
    }
}
