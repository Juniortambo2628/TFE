<?php

namespace App\Http\Controllers\WebAuthn;

use Illuminate\Contracts\Support\Responsable;
use Laragear\WebAuthn\Http\Requests\AttestationRequest;
use Laragear\WebAuthn\Http\Requests\AttestedRequest;

class WebAuthnRegisterController
{
    /**
     * Returns a challenge to be verified by the user device.
     */
    public function options(AttestationRequest $request): Responsable
    {
        return $request
            ->fastRegistration()
            ->toCreate();
    }

    /**
     * Registers a device for further WebAuthn authentication.
     */
    public function register(AttestedRequest $request)
    {
        $request->save();

        return back()->with('success', 'Passkey registered successfully');
    }

    /**
     * Removes a registered passkey.
     */
    public function destroy(string $id)
    {
        auth()->user()->webAuthnCredentials()->where('id', $id)->delete();

        return back()->with('success', 'Passkey removed successfully');
    }
}
