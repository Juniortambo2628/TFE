<?php

namespace Tests\Feature\Auth;

use App\Models\LoginHistory;
use App\Models\User;
use App\Models\UserSecuritySetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laragear\WebAuthn\Models\WebAuthnCredential;
use Tests\TestCase;

/**
 * Passkey sign-in, exercised with real ECDSA assertions rather than fixtures.
 *
 * The login route used to answer a bare 204, so Inertia had nothing to navigate
 * to, two-factor was skipped outright, and any throw Laragear did not catch
 * itself (chiefly a public key that will not decrypt under the current APP_KEY)
 * surfaced as an unexplained 500.
 */
class WebAuthnLoginTest extends TestCase
{
    use RefreshDatabase;

    private static function b64u(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    /**
     * Register a credential for the user and forge the assertion their
     * authenticator would produce for a freshly issued challenge.
     *
     * @return array{0: User, 1: array<string, mixed>}
     */
    private function passkeyFor(User $user, array $opts = []): array
    {
        $rpId = 'localhost';
        $origin = 'http://localhost';

        $pkey = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
        $publicPem = openssl_pkey_get_details($pkey)['key'];

        $handle = (string) Str::uuid();
        $credId = self::b64u(random_bytes($opts['cred_id_len'] ?? 32));

        $user->webAuthnCredentials()->make()->forceFill([
            'id' => $credId,
            'user_id' => $handle,
            'alias' => 'Test Key',
            'counter' => 0,
            'rp_id' => $rpId,
            'origin' => $origin,
            'aaguid' => '00000000-0000-0000-0000-000000000000',
            'public_key' => $opts['public_key'] ?? $publicPem,
            'attestation_format' => 'none',
        ])->save();

        $challenge = $this->getJson('/webauthn/login?email='.$user->email)->json('challenge');

        $clientDataJson = json_encode([
            'type' => 'webauthn.get',
            'challenge' => $challenge,
            'origin' => $origin,
            'crossOrigin' => false,
        ]);

        $authData = hash('sha256', $rpId, true).chr(0x05).pack('N', 1);
        openssl_sign($authData.hash('sha256', $clientDataJson, true), $signature, $pkey, OPENSSL_ALGO_SHA256);

        return [$credId, [
            'id' => $credId,
            'rawId' => $credId,
            'response' => [
                'authenticatorData' => self::b64u($authData),
                'clientDataJSON' => self::b64u($clientDataJson),
                'signature' => self::b64u($signature),
                'userHandle' => $handle,
            ],
            'type' => 'public-key',
        ]];
    }

    public function test_challenge_is_issued_without_an_email(): void
    {
        $this->getJson('/webauthn/login')
            ->assertOk()
            ->assertJsonStructure(['challenge', 'timeout']);
    }

    public function test_passkey_login_redirects_a_fan_to_their_dashboard(): void
    {
        $user = User::factory()->create();
        [, $assertion] = $this->passkeyFor($user);

        $this->post('/webauthn/login', $assertion)
            ->assertRedirect(route('fan.dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
    }

    public function test_passkey_login_routes_an_admin_to_the_admin_dashboard(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        [, $assertion] = $this->passkeyFor($admin);

        $this->post('/webauthn/login', $assertion)
            ->assertRedirect(route('admin.dashboard'));
    }

    public function test_passkey_login_records_login_history(): void
    {
        $user = User::factory()->create();
        [, $assertion] = $this->passkeyFor($user);

        $this->post('/webauthn/login', $assertion);

        $this->assertDatabaseHas('login_history', [
            'user_id' => $user->id,
            'successful' => true,
        ]);
        $this->assertSame(1, LoginHistory::where('user_id', $user->id)->count());
    }

    public function test_passkey_login_still_demands_the_second_factor(): void
    {
        $user = User::factory()->create();
        UserSecuritySetting::create([
            'user_id' => $user->id,
            'two_factor_enabled' => true,
            'two_factor_secret' => 'ABCDEFGHIJKLMNOP',
        ]);

        [, $assertion] = $this->passkeyFor($user);

        $this->post('/webauthn/login', $assertion)
            ->assertRedirect(route('login.two-factor'));

        $this->assertGuest();
        $this->assertSame($user->id, session('login.id'));
    }

    public function test_a_long_credential_id_still_authenticates(): void
    {
        $user = User::factory()->create();
        [$credId, $assertion] = $this->passkeyFor($user, ['cred_id_len' => 200]);

        $this->assertGreaterThan(191, strlen($credId));

        $this->post('/webauthn/login', $assertion)->assertRedirect();
        $this->assertAuthenticatedAs($user);
    }

    public function test_an_unreadable_public_key_fails_cleanly_and_retires_the_passkey(): void
    {
        $user = User::factory()->create();
        [$credId, $assertion] = $this->passkeyFor($user);

        // Mimic a credential stored under a different APP_KEY: the encrypted
        // cast can no longer decrypt it, which used to escape as a 500.
        WebAuthnCredential::whereKey($credId)->update(['public_key' => 'not-a-decryptable-payload']);

        $this->post('/webauthn/login', $assertion)
            ->assertRedirect()
            ->assertSessionHasErrors('passkey');

        $this->assertGuest();
        $this->assertNotNull(WebAuthnCredential::whereKey($credId)->first()->disabled_at);
    }

    public function test_an_unreadable_public_key_returns_422_to_an_api_client(): void
    {
        $user = User::factory()->create();
        [$credId, $assertion] = $this->passkeyFor($user);

        WebAuthnCredential::whereKey($credId)->update(['public_key' => 'not-a-decryptable-payload']);

        $this->postJson('/webauthn/login', $assertion)->assertStatus(422);
    }

    public function test_a_forged_assertion_is_rejected_without_a_server_error(): void
    {
        $user = User::factory()->create();
        [, $assertion] = $this->passkeyFor($user);

        $assertion['response']['signature'] = self::b64u('garbage-signature');

        $this->postJson('/webauthn/login', $assertion)->assertStatus(422);
        $this->assertGuest();
    }

    public function test_an_unknown_credential_is_rejected_without_a_server_error(): void
    {
        $this->postJson('/webauthn/login', [
            'id' => self::b64u(random_bytes(32)),
            'rawId' => self::b64u(random_bytes(32)),
            'response' => [
                'authenticatorData' => self::b64u('x'),
                'clientDataJSON' => self::b64u('x'),
                'signature' => self::b64u('x'),
                'userHandle' => null,
            ],
            'type' => 'public-key',
        ])->assertStatus(422);

        $this->assertGuest();
    }
}
