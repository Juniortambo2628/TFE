<?php

namespace Database\Seeders;

/**
 * The ONE place a seeded account's password comes from (Sprint 63).
 *
 * The demo accounts exist so every surface has something on it — but the
 * deploy now seeds automatically, so `password` would be a known credential
 * on a live site, including for `admin@tfe.com`.
 *
 * Set `DEMO_ACCOUNT_PASSWORD` in the production `.env` and every seeded
 * account uses it instead. Unset (dev, CI, a fresh clone) the default keeps
 * the documented `password`, so nothing about local work changes.
 *
 * It is deliberately NOT a random value per run: a seeder is idempotent and
 * re-runs on every deploy, so a random password would silently change on
 * each one and lock out whoever was using it.
 */
class DemoCredentials
{
    public static function password(): string
    {
        $configured = config('app.demo_account_password');

        return is_string($configured) && $configured !== '' ? $configured : 'password';
    }

    /**
     * Whether the seeded accounts are still on the shipped default, so a
     * caller can say so out loud rather than leaving it to be discovered.
     */
    public static function isDefault(): bool
    {
        return self::password() === 'password';
    }
}
