<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Services\SecurityService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SecurityController extends Controller
{
    protected SecurityService $securityService;

    public function __construct(SecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    public function index()
    {
        $user = auth()->user();
        $data = $this->securityService->getSecurityData($user);

        return Inertia::render('Fan/Security', $data);
    }

    public function changePassword(Request $request)
    {
        return $this->securityService->changePassword($request);
    }

    public function toggleTwoFactor(Request $request)
    {
        return $this->securityService->toggleTwoFactor($request);
    }

    public function confirmTwoFactor(Request $request)
    {
        return $this->securityService->confirmTwoFactor($request);
    }

    public function toggleLoginNotifications(Request $request)
    {
        return $this->securityService->toggleLoginNotifications($request);
    }
}
