<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * okjt/laravel-kit sets its own reset-link builder when it boots. The link
 * must still open TFE's own reset page (route password.reset), with the
 * email, on this site's address.
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
