<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialUser;
use Mockery;
use Tests\TestCase;

/**
 * Google sign-in used to `updateOrCreate` with a FIXED dummy password, so it
 * reset any matching account's password to a string in the source (Sprint 65).
 */
class SocialAuthPasswordTest extends TestCase
{
    use RefreshDatabase;

    private function fakeGoogle(string $email): void
    {
        $social = (new SocialUser)->map(['id' => 'g-1', 'name' => 'Amina Otieno', 'email' => $email, 'avatar' => null]);
        $driver = Mockery::mock();
        $driver->shouldReceive('user')->andReturn($social);
        $driver->shouldReceive('setHttpClient')->andReturnSelf();
        Socialite::shouldReceive('driver')->with('google')->andReturn($driver);
    }

    public function test_an_existing_accounts_password_is_untouched(): void
    {
        $user = User::factory()->create(['email' => 'amina@example.com', 'password' => Hash::make('her-own-secret'), 'team_support' => 'Kenya']);
        $this->fakeGoogle('amina@example.com');

        $this->get(route('social.callback', 'google'))->assertRedirect();

        $fresh = $user->fresh();
        $this->assertTrue(Hash::check('her-own-secret', $fresh->password));
        $this->assertFalse(Hash::check('google_auth_dummy_password', $fresh->password));
        $this->assertAuthenticatedAs($fresh);
    }

    public function test_a_new_account_gets_an_unguessable_password(): void
    {
        $this->fakeGoogle('new@example.com');

        $this->get(route('social.callback', 'google'));

        $user = User::where('email', 'new@example.com')->firstOrFail();
        $this->assertFalse(Hash::check('google_auth_dummy_password', $user->password));
    }
}
