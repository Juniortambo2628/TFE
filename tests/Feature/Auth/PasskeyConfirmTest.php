<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Sprint 68 — the confirm screen offers a passkey, and a Google sign-up is
 * told how to get past it rather than facing a password it never set.
 */
class PasskeyConfirmTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_confirm_screen_says_when_a_social_signup_has_no_password(): void
    {
        $fan = User::factory()->create(['google_id' => 'g-123']);

        $props = $this->actingAs($fan)->get(route('password.confirm'))->assertOk()->viewData('page')['props'];

        $this->assertTrue($props['socialOnly']);
        $this->assertFalse($props['hasPasskey']);
    }

    public function test_passkey_options_are_for_the_signed_in_user_only(): void
    {
        $this->get(route('passkey.confirm.options'))->assertRedirect(route('login'));

        $this->actingAs(User::factory()->create())
            ->getJson(route('passkey.confirm.options'))
            ->assertOk()
            ->assertJsonStructure(['challenge']);
    }

    public function test_a_bad_assertion_does_not_confirm_the_session(): void
    {
        $fan = User::factory()->create();

        $this->actingAs($fan)->post(route('passkey.confirm'), ['id' => 'nope', 'rawId' => 'nope', 'type' => 'public-key', 'response' => []]);

        $this->assertNull(session('auth.password_confirmed_at'));
        $this->assertAuthenticatedAs($fan);
    }

    private static function b64u(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    /**
     * A real ECDSA passkey registered to $owner, and the assertion it would
     * sign for the challenge the CONFIRM endpoint issues to $signedIn.
     */
    private function assertionFor(User $owner, User $signedIn): array
    {
        $pkey = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
        $handle = (string) Str::uuid();
        $credId = self::b64u(random_bytes(32));

        $owner->webAuthnCredentials()->make()->forceFill([
            'id' => $credId, 'user_id' => $handle, 'alias' => 'Key', 'counter' => 0,
            'rp_id' => 'localhost', 'origin' => 'http://localhost',
            'aaguid' => '00000000-0000-0000-0000-000000000000',
            'public_key' => openssl_pkey_get_details($pkey)['key'], 'attestation_format' => 'none',
        ])->save();

        $challenge = $this->actingAs($signedIn)->getJson(route('passkey.confirm.options'))->json('challenge');
        $clientData = json_encode(['type' => 'webauthn.get', 'challenge' => $challenge, 'origin' => 'http://localhost', 'crossOrigin' => false]);
        $authData = hash('sha256', 'localhost', true).chr(0x05).pack('N', 1);
        openssl_sign($authData.hash('sha256', $clientData, true), $sig, $pkey, OPENSSL_ALGO_SHA256);

        return [
            'id' => $credId, 'rawId' => $credId, 'type' => 'public-key',
            'response' => [
                'authenticatorData' => self::b64u($authData),
                'clientDataJSON' => self::b64u($clientData),
                'signature' => self::b64u($sig),
                'userHandle' => $handle,
            ],
        ];
    }

    public function test_the_fans_own_passkey_confirms_the_session(): void
    {
        $fan = User::factory()->create();
        $assertion = $this->assertionFor($fan, $fan);

        $this->actingAs($fan)->post(route('passkey.confirm'), $assertion)->assertRedirect();

        $this->assertNotNull(session('auth.password_confirmed_at'));
        $this->assertAuthenticatedAs($fan);
    }

    public function test_someone_elses_passkey_neither_confirms_nor_switches_the_account(): void
    {
        $fan = User::factory()->create();
        $other = User::factory()->create();
        $assertion = $this->assertionFor($other, $fan);

        $this->actingAs($fan)->post(route('passkey.confirm'), $assertion);

        $this->assertNull(session('auth.password_confirmed_at'));
        $this->assertAuthenticatedAs($fan);
    }
}
