<?php

namespace Tests\Feature;

use App\Services\TournamentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 53 — the active tournament context is ongoing/upcoming only.
 *
 * A concluded tournament carries a full venue catalogue, stadium photography
 * and Wikipedia enrichment. Making one the active context rebuilt every
 * context-aware surface — landing hero, venue slider, the fan dashboard —
 * around an event nobody can travel to, and paid for all of that data to be
 * assembled and shipped. Past tournaments keep their own read-only page.
 */
class TournamentContextScopeTest extends TestCase
{
    use RefreshDatabase;

    private function service(): TournamentService
    {
        return app(TournamentService::class);
    }

    public function test_switchable_list_excludes_concluded_tournaments(): void
    {
        $switchable = $this->service()->switchable();

        $this->assertNotEmpty($switchable, 'There should always be something to switch to.');

        foreach ($switchable as $t) {
            $this->assertContains(
                $t['status'],
                TournamentService::SWITCHABLE_STATUSES,
                "{$t['id']} is {$t['status']} and should not be switchable."
            );
        }
    }

    public function test_switchable_is_a_strict_subset_of_the_full_list(): void
    {
        $all = collect($this->service()->all());
        $switchable = collect($this->service()->switchable());

        // The full list still carries the past — TournamentCompare deep-links
        // to each tournament's own page and legitimately shows history.
        $this->assertTrue(
            $all->contains(fn ($t) => $t['status'] === 'concluded'),
            'all() must still return concluded tournaments.'
        );

        $this->assertEmpty($switchable->pluck('id')->diff($all->pluck('id')));
    }

    public function test_is_switchable_rejects_a_concluded_id(): void
    {
        $concluded = collect(config('tournaments.tournaments'))
            ->first(fn ($c) => TournamentService::computedStatus($c) === 'concluded');

        $this->assertNotNull($concluded, 'Fixture expects at least one concluded tournament in config.');
        $this->assertFalse($this->service()->isSwitchable($concluded['id']));
    }

    public function test_a_concluded_tournament_query_param_is_ignored(): void
    {
        $concluded = collect(config('tournaments.tournaments'))
            ->first(fn ($c) => TournamentService::computedStatus($c) === 'concluded');

        $response = $this->get('/?tournament='.$concluded['id']);
        $response->assertOk();

        $active = $response->viewData('page')['props']['tournament'];

        $this->assertNotSame($concluded['id'], $active['id']);
        $this->assertContains($active['status'], TournamentService::SWITCHABLE_STATUSES);
        // …and it must not have been written to the session either.
        $this->assertNotSame($concluded['id'], session('active_tournament'));
    }

    public function test_a_concluded_tournament_left_in_the_session_is_corrected(): void
    {
        $concluded = collect(config('tournaments.tournaments'))
            ->first(fn ($c) => TournamentService::computedStatus($c) === 'concluded');

        $response = $this->withSession(['active_tournament' => $concluded['id']])->get('/');
        $response->assertOk();

        $active = $response->viewData('page')['props']['tournament'];
        $this->assertContains($active['status'], TournamentService::SWITCHABLE_STATUSES);
    }

    public function test_the_switchable_list_is_shared_with_every_page(): void
    {
        $props = $this->get('/')->viewData('page')['props'];

        $this->assertArrayHasKey('tournament_switch_list', $props);
        $this->assertArrayHasKey('tournament_list', $props, 'The full list stays for TournamentCompare.');

        foreach ($props['tournament_switch_list'] as $t) {
            $this->assertNotSame('concluded', $t['status']);
        }
    }

    public function test_a_concluded_tournament_still_has_its_own_page(): void
    {
        $concluded = collect(config('tournaments.tournaments'))
            ->first(fn ($c) => TournamentService::computedStatus($c) === 'concluded');

        $response = $this->get('/tournaments/'.$concluded['slug']);
        $response->assertOk();

        $page = $response->viewData('page');
        $this->assertSame('Tournaments/Show', $page['component']);
        $this->assertSame($concluded['id'], $page['props']['tournament']['id']);
    }

    public function test_the_single_view_page_ships_only_what_it_renders(): void
    {
        $concluded = collect(config('tournaments.tournaments'))
            ->first(fn ($c) => TournamentService::computedStatus($c) === 'concluded');

        $payload = $this->get('/tournaments/'.$concluded['slug'])
            ->viewData('page')['props']['tournament'];

        // The recap page draws results and teams. It never draws a venue, so
        // the venue rows and the raw Wikipedia response have no business
        // being serialised into the page props.
        $this->assertArrayNotHasKey('venues', $payload);
        $this->assertArrayNotHasKey('wikipedia', $payload);

        // …while everything it DOES draw is present.
        foreach (['id', 'name', 'status', 'hosts', 'team_flag_codes', 'trophy_image'] as $key) {
            $this->assertArrayHasKey($key, $payload, "Show.jsx renders `{$key}`.");
        }
    }
}
