<?php

namespace Tests\Unit;

use App\Support\VisitorCurrency;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

class VisitorCurrencyTest extends TestCase
{
    private function req(array $headers): Request
    {
        $r = Request::create('/');
        foreach ($headers as $k => $v) {
            $r->headers->set($k, $v);
        }

        return $r;
    }

    public function test_cdn_country_wins(): void
    {
        $this->assertSame('KES', VisitorCurrency::guess($this->req(['CF-IPCountry' => 'KE', 'Accept-Language' => 'en-GB'])));
    }

    public function test_falls_back_to_the_browser_region(): void
    {
        $this->assertSame('NGN', VisitorCurrency::guess($this->req(['Accept-Language' => 'en-NG,en;q=0.9'])));
        $this->assertSame('XOF', VisitorCurrency::guess($this->req(['Accept-Language' => 'fr_SN'])));
    }

    public function test_unknown_or_missing_is_usd(): void
    {
        $this->assertSame('USD', VisitorCurrency::guess($this->req([])));
        $this->assertSame('USD', VisitorCurrency::guess($this->req(['CF-IPCountry' => 'XX', 'Accept-Language' => 'en'])));
        $this->assertSame('USD', VisitorCurrency::guess($this->req(['CF-IPCountry' => 'JP'])));
    }
}
