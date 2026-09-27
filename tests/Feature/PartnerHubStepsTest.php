<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\PartnerController as AdminPartnerController;
use App\Http\Controllers\PartnerHubController;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 59 — the public hub's docked StepFlow bar carries the pipeline
 * this partner archetype actually runs, not one hardcoded set of four
 * steps that told an airline its fan would receive a "Trip delivered".
 */
class PartnerHubStepsTest extends TestCase
{
    use RefreshDatabase;

    private function publishedPartner(string $partnerType): User
    {
        $user = User::factory()->partner()->create(['partner_type' => $partnerType]);
        PartnerProfile::create([
            'user_id' => $user->id,
            'display_name' => 'Demo '.$partnerType,
            'slug' => 'demo-'.str_replace('_', '-', $partnerType),
            'is_public' => true,
            'published_at' => now(),
        ]);

        return $user;
    }

    public function test_hub_passes_steps_for_the_partner_type(): void
    {
        $user = $this->publishedPartner('ticketing_partner');

        $response = $this->get(route('partners.hub', $user->partnerProfile->slug));
        $response->assertStatus(200);

        $steps = $response->viewData('page')['props']['steps'];
        $titles = array_column($steps, 'title');

        $this->assertSame(
            ['Match listed', 'Seat + tier picked', 'Secure payment', 'Ticket issued'],
            $titles,
        );
    }

    public function test_each_archetype_gets_its_own_pipeline(): void
    {
        $finance = PartnerHubController::stepsFor('finance_partner');
        $airline = PartnerHubController::stepsFor('airline');
        $travel = PartnerHubController::stepsFor('travel_agent');

        $this->assertNotSame($finance, $airline);
        $this->assertNotSame($finance, $travel);
        $this->assertSame('Funds released', end($finance)['title']);
        $this->assertSame('Booking issued', end($airline)['title']);
    }

    public function test_unmapped_type_falls_back_to_the_travel_pipeline(): void
    {
        // club / federation / destination / event_organiser all follow the
        // brief → quote → pay → deliver shape, so they share it by design
        // rather than each getting four invented nouns.
        $expected = PartnerHubController::stepsFor('travel_agent');

        $this->assertSame($expected, PartnerHubController::stepsFor('club'));
        $this->assertSame($expected, PartnerHubController::stepsFor('federation'));
        $this->assertSame($expected, PartnerHubController::stepsFor(null));
    }

    public function test_every_configured_partner_type_yields_titled_steps(): void
    {
        // A type added to partnerTypes() without a flow must still render a
        // usable bar — an empty or untitled step list renders nothing, and
        // the primitive drops blank titles silently.
        foreach (array_keys(AdminPartnerController::partnerTypes()) as $type) {
            $steps = PartnerHubController::stepsFor($type);

            $this->assertGreaterThanOrEqual(3, count($steps), "{$type} has too few steps");
            foreach ($steps as $step) {
                $this->assertArrayHasKey('title', $step);
                $this->assertNotSame('', trim($step['title']), "{$type} has a blank step title");
            }
        }
    }

    public function test_sponsor_flow_is_three_steps(): void
    {
        // The primitive numbers and separates whatever it is given, so a
        // flow that genuinely has three stages must not be padded to four.
        $this->assertCount(3, PartnerHubController::stepsFor('sponsor'));
    }
}
