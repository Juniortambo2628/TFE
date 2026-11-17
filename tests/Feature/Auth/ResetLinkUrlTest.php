<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The reset email must open TFE's own reset page (route password.reset),
 * with the email, on this site's address. okjt/laravel-kit builds the link;
 * since 0.10 it uses the app's own password.reset route when one exists
 * (okjt.auth.password_reset.link_to_app left at null), so TFE needs no
 * override of its own.
 */
class ResetLinkUrlTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_reset_email_links_to_the_reset_page(): void
    {
        $user = User::factory()->create(['email' => 'fan@example.com']);

        $url = (new ResetPassword('tok123'))->toMail($user)->actionUrl;

        $this->assertSame(route('password.reset', ['token' => 'tok123', 'email' => 'fan@example.com']), $url);
    }
}
