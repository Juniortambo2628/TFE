<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Security headers from the OKJT kit's middleware (kit migration, phase 0).
 * The content-security policy is report-only for now, so a source the pages
 * use that the policy forgot is reported rather than blocked.
 */
class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_page_sends_the_security_headers(): void
    {
        $response = $this->get('/about')->assertOk();

        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Strict-Transport-Security');
    }

    public function test_the_content_security_policy_is_report_only_and_allows_the_font_host(): void
    {
        $response = $this->get('/about')->assertOk();

        $this->assertFalse($response->headers->has('Content-Security-Policy'));
        $policy = $response->headers->get('Content-Security-Policy-Report-Only');
        $this->assertNotNull($policy);
        $this->assertStringContainsString("default-src 'self'", $policy);
        $this->assertMatchesRegularExpression('/style-src [^;]*https:\/\/fonts\.bunny\.net/', $policy);
        $this->assertMatchesRegularExpression('/font-src [^;]*https:\/\/fonts\.bunny\.net/', $policy);
    }
}
