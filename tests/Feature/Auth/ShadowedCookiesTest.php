<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpFoundation\Cookie;
use Tests\TestCase;

/**
 * A browser that used the cPanel site holds the session + XSRF cookies on
 * ".okjtech.co.ke" as well as ours on "tfe.okjtech.co.ke", sends both, and
 * PHP reads the stale one first — so every login answered 419.
 */
class ShadowedCookiesTest extends TestCase
{
    use RefreshDatabase;

    private function visit(string $cookieHeader)
    {
        $this->withoutVite();
        config(['session.domain' => 'tfe.okjtech.co.ke']);

        return $this->call('GET', 'https://tfe.okjtech.co.ke/login', [], [], [], [
            'HTTP_HOST' => 'tfe.okjtech.co.ke',
            'HTTP_COOKIE' => $cookieHeader,
        ]);
    }

    /** @return list<Cookie> */
    private function expired($response): array
    {
        return array_values(array_filter(
            $response->headers->getCookies(),
            fn (Cookie $c) => $c->getExpiresTime() > 0 && $c->getExpiresTime() < time(),
        ));
    }

    public function test_duplicate_session_and_xsrf_cookies_are_expired_on_other_domains(): void
    {
        $session = config('session.cookie');
        $response = $this->visit("$session=old; XSRF-TOKEN=old; $session=new; XSRF-TOKEN=new");

        $response->assertOk();
        $expired = collect($this->expired($response))->map(fn (Cookie $c) => $c->getName().'@'.$c->getDomain());

        $this->assertContains("$session@.okjtech.co.ke", $expired);
        $this->assertContains('XSRF-TOKEN@.okjtech.co.ke', $expired);
        $this->assertContains("$session@", $expired, 'host-only stale copy');
        // The live cookie, on the configured domain, must never be expired.
        $this->assertNotContains("$session@.tfe.okjtech.co.ke", $expired);
        $this->assertNotContains("$session@tfe.okjtech.co.ke", $expired);
    }

    public function test_nothing_is_expired_when_each_cookie_arrives_once(): void
    {
        $session = config('session.cookie');
        $response = $this->visit("$session=a; XSRF-TOKEN=b; other=x; other=y");

        $response->assertOk();
        $this->assertSame([], $this->expired($response));
    }
}
