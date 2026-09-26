<?php

namespace Tests;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->app['env'] = 'testing';
        $this->withoutMiddleware(ValidateCsrfToken::class);

        // The suite makes no real outbound requests.
        //
        // Rendering almost any page assembles a tournament, which reaches for
        // Wikipedia (tournament summary, then one lookup per catalogued
        // stadium). Every test starts with a cold cache, so that fan-out was
        // being attempted on each one — roughly 2s per test once the stadium
        // catalogue landed, which tripled the suite from ~3min to ~10min.
        //
        // Nothing here asserts on Wikipedia content; the services are written
        // to degrade to config when a fetch fails, and that degraded path is
        // what tests exercise either way. Faking makes it instant instead of
        // waiting on connection attempts, and makes the suite hermetic — it no
        // longer behaves differently depending on whether the machine running
        // it can reach the internet.
        //
        // A test that genuinely needs a response can still call Http::fake()
        // with its own stubs; the last registered fake wins.
        Http::fake();
    }
}
