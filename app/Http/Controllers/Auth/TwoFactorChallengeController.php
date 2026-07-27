<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorChallengeController extends Controller
{
    protected $twoFactorService;

    public function __construct(TwoFactorService $twoFactorService)
    {
        $this->twoFactorService = $twoFactorService;
    }

    /**
     * Display the 2FA challenge view.
     */
    public function create(Request $request): Response
    {
        if (! $request->session()->has('login.id')) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge');
    }

    /**
     * Verify the 2FA code and log the user in.
     */
    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        if (! $request->session()->has('login.id')) {
            return redirect()->route('login');
        }

        $user = User::findOrFail($request->session()->get('login.id'));
        $secret = Crypt::decryptString($user->two_factor_secret);

        if ($this->twoFactorService->verifyCode($secret, $request->code)) {
            Auth::login($user, $request->session()->get('login.remember', false));

            $request->session()->forget(['login.id', 'login.remember']);
            $request->session()->regenerate();

            return redirect()->intended(route('fan.dashboard'));
        }

        return back()->withErrors(['code' => 'The provided two-factor authentication code was invalid.']);
    }
}
