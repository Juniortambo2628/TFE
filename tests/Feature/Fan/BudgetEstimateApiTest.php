<?php

namespace Tests\Feature\Fan;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Regression cover for POST /fan/api/budget/estimate.
 *
 * The tournament_id rule was `exists:config:config/tournaments.php` — but
 * `exists` is a DATABASE rule, so validating the request tried to query a
 * connection named "config" and threw a QueryException BEFORE the
 * controller's try/catch. Every single estimate call 500'd, so the budget
 * calculator's live estimate never worked. These tests pin the fixed
 * behaviour: a valid request succeeds, an unknown tournament is a clean 422.
 */
class BudgetEstimateApiTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'tournament_id' => 'afcon_2027',
            'origin_code' => 'NBO',
            'destination_city' => 'Nairobi',
            'departure_date' => now()->addMonths(3)->format('Y-m-d'),
            'return_date' => now()->addMonths(3)->addDays(7)->format('Y-m-d'),
            'nights' => 7,
            'flight_class' => 'economy',
            'spending_tier' => 'mid_range',
            'group_size' => 2,
            'match_count' => 3,
            'knockout_pct' => 30,
            'passport_country' => 'KEN',
        ], $overrides);
    }

    public function test_valid_request_returns_an_estimate(): void
    {
        // Keep every outbound feed off the network so the estimate falls back
        // to its pricing config rather than depending on live APIs.
        Http::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson(route('fan.api.budget.estimate'), $this->validPayload());

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['success', 'data']);
    }

    public function test_unknown_tournament_is_rejected_with_422_not_500(): void
    {
        Http::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson(route('fan.api.budget.estimate'), $this->validPayload([
                'tournament_id' => 'not_a_real_tournament',
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors('tournament_id');
    }
}
