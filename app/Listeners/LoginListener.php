<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;

/**
 * LoginListener — Historical hook point.
 *
 * Reintroduced as a defensive no-op after a stale bootstrap/cache/events.php
 * on at least one dev machine caused BindingResolutionException on every
 * successful login (the cache still named this class from an older
 * revision that removed it). Keeping an empty class in place means a
 * stale cache never blocks auth again; when we actually need post-login
 * side effects (audit logging, referral attribution, etc.) they land here.
 *
 * Registered automatically via Laravel's event auto-discovery — the
 * Login type-hint on handle() tells the framework which event to bind.
 */
class LoginListener
{
    public function handle(Login $event): void
    {
        // Intentionally empty — see class docblock.
    }
}
