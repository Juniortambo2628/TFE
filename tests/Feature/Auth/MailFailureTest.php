<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A mail server that is down or misconfigured must not 500 the auth flows
 * that send mail. Points the mailer at a closed local port, which fails at
 * connect the way a wrong MAIL_HOST / MAIL_PORT does in production.
 */
class MailFailureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => '127.0.0.1',
            'mail.mailers.smtp.port' => 1,
            'mail.mailers.smtp.timeout' => 2,
        ]);
    }

    public function test_resending_verification_reports_failure_instead_of_500(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->from(route('verification.notice'))
            ->post(route('verification.send'))
            ->assertRedirect(route('verification.notice'))
            ->assertSessionHas('status', 'verification-link-failed');
    }

    public function test_registration_still_completes_when_the_verification_mail_fails(): void
    {
        $this->post(route('register'), [
            'first_name' => 'Mail',
            'last_name' => 'Down',
            'email' => 'maildown@example.com',
            'password' => 'Str0ng!Passw0rd#',
            'password_confirmation' => 'Str0ng!Passw0rd#',
            'terms_agreed' => true,
            'privacy_consent' => true,
        ])->assertSessionHasNoErrors()->assertStatus(302);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'maildown@example.com']);
    }

    public function test_password_reset_request_reports_failure_instead_of_500(): void
    {
        User::factory()->create(['email' => 'reset@example.com']);

        $this->from(route('password.request'))
            ->post(route('password.email'), ['email' => 'reset@example.com'])
            ->assertRedirect(route('password.request'))
            ->assertSessionHasErrors('email');
    }
}
