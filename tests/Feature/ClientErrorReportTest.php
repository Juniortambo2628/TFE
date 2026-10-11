<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

/**
 * Browser error reports (Sprint 69): stored stripped, never from the
 * savings pages, and throttled.
 */
class ClientErrorReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_report_is_logged_with_paths_only(): void
    {
        $channel = Mockery::mock();
        $channel->shouldReceive('warning')->once()->withArgs(function ($message, $context) {
            return $message === 'x is undefined'
                && $context['page'] === '/fan/bookings/9'
                && $context['source'] === '/build/assets/app.js'
                && ! str_contains(json_encode($context), 'secret-token');
        });
        Log::shouldReceive('channel')->with('client')->andReturn($channel);

        $this->postJson(route('client-errors.store'), [
            'message' => 'x is undefined',
            'page' => 'https://tfe.test/fan/bookings/9?token=secret-token#pay',
            'source' => 'https://tfe.test/build/assets/app.js?v=secret-token',
            'kind' => 'error',
        ])->assertNoContent();
    }

    public function test_nothing_from_the_savings_pages_is_kept(): void
    {
        Log::shouldReceive('channel')->never();

        $this->postJson(route('client-errors.store'), [
            'message' => 'boom',
            'page' => 'https://tfe.test/fan/bank-savings/3',
        ])->assertNoContent();
    }

    public function test_reports_are_throttled_per_client(): void
    {
        Log::shouldReceive('channel')->andReturn(Mockery::mock(['warning' => null]));

        for ($i = 0; $i < 30; $i++) {
            $this->post(route('client-errors.store'), ['message' => "e{$i}"], ['Accept' => 'application/json'])
                ->assertNoContent();
        }

        $this->post(route('client-errors.store'), ['message' => 'one more'], ['Accept' => 'application/json'])
            ->assertStatus(429);
    }
}
