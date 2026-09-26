<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Fan\SecurityController as FanSecurityController;
use Inertia\Inertia;

/**
 * Admin account security — Sprint 53.
 *
 * Extends the fan controller for exactly the reason the partner one does:
 * every action (password, 2FA, login notifications) is already implemented
 * once in SecurityService and is identical whoever is signed in. Only the
 * Inertia page name differs, and all three pages render the same shared
 * AccountSecurity component.
 */
class SecurityController extends FanSecurityController
{
    public function index()
    {
        return Inertia::render('Admin/Security', $this->securityService->getSecurityData(auth()->user()));
    }
}
