<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Fan\SecurityController as FanSecurityController;
use Inertia\Inertia;

class SecurityController extends FanSecurityController
{
    public function index()
    {
        $user = auth()->user();
        $data = $this->securityService->getSecurityData($user);

        return Inertia::render('Partner/Security', $data);
    }
}
