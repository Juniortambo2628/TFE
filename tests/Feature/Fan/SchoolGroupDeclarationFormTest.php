<?php

namespace Tests\Feature\Fan;

use App\Models\Budget;
use App\Models\SchoolGroupDeclaration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 61 — the school official's own side of the declaration.
 *
 * The partner-facing half is covered by
 * tests/Feature/Partner/SchoolGroupDeclarationTest.php. This is the form:
 * who may submit it, what it insists on, and what it refuses to keep.
 */
class SchoolGroupDeclarationFormTest extends TestCase
{
    use RefreshDatabase;

    private function budgetFor(User $user): Budget
    {
        return Budget::create([
            'user_id' => $user->id,
            'name' => 'AFCON Schools Cup',
            'total_cost' => 18400,
            'currency' => 'USD',
            'match_ids' => [],
            'breakdown' => [],
            'accommodation_level' => 'standard',
            'flight_class' => 'economy',
            'nights' => 5,
            'is_active' => true,
            'partner_status' => 'pending',
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'school_name' => 'Nairobi Girls High School',
            'official_name' => 'Jane Mwangi',
            'official_role' => 'Deputy Head, Games',
            'official_email' => 'games@nairobigirls.sc.ke',
            'official_phone' => '+254 20 555 0142',
            'travellers_adults' => 6,
            'travellers_minors' => 34,
            'youngest_traveller_age' => 12,
            'channels_confirmed' => true,
            'information_accurate' => true,
        ], $overrides);
    }

    public function test_an_official_declares_a_group_against_their_own_plan(): void
    {
        $official = User::factory()->create();
        $budget = $this->budgetFor($official);

        $this->actingAs($official)
            ->post(route('fan.budgets.school-group.store', $budget->id), $this->payload())
            ->assertRedirect();

        $declaration = $budget->fresh()->schoolDeclaration;

        $this->assertNotNull($declaration);
        $this->assertSame('Nairobi Girls High School', $declaration->school_name);
        $this->assertSame(34, $declaration->travellers_minors);
        $this->assertTrue($declaration->involvesMinors());
        $this->assertTrue($declaration->isComplete());
    }

    public function test_declared_at_is_stamped_by_the_server(): void
    {
        // A client-supplied date on a warranty is worth nothing.
        $official = User::factory()->create();
        $budget = $this->budgetFor($official);

        $this->actingAs($official)->post(
            route('fan.budgets.school-group.store', $budget->id),
            $this->payload(['declared_at' => '1999-01-01 00:00:00']),
        );

        $this->assertTrue(
            $budget->fresh()->schoolDeclaration->declared_at->isToday(),
            'declared_at must be the server clock, never the request body.',
        );
    }

    public function test_amending_re_stamps_the_warranty(): void
    {
        // The warranty given for 20 minors does not cover the 40 that just
        // replaced them, so the declaration date moves with the numbers.
        $official = User::factory()->create();
        $budget = $this->budgetFor($official);

        SchoolGroupDeclaration::create($this->payload([
            'budget_id' => $budget->id,
            'travellers_minors' => 20,
            'declared_at' => now()->subMonth(),
        ]));

        $this->actingAs($official)->post(
            route('fan.budgets.school-group.store', $budget->id),
            $this->payload(['travellers_minors' => 40]),
        );

        // Still ONE declaration — two makes "what was agreed" unanswerable.
        $this->assertSame(1, SchoolGroupDeclaration::where('budget_id', $budget->id)->count());

        $declaration = $budget->fresh()->schoolDeclaration;
        $this->assertSame(40, $declaration->travellers_minors);
        $this->assertTrue($declaration->declared_at->isToday());
    }

    public function test_both_warranties_are_required(): void
    {
        $official = User::factory()->create();
        $budget = $this->budgetFor($official);

        // One box ticked is not a partial warranty — it is not one at all.
        $this->actingAs($official)
            ->post(route('fan.budgets.school-group.store', $budget->id), $this->payload([
                'information_accurate' => false,
            ]))
            ->assertSessionHasErrors('information_accurate');

        $this->actingAs($official)
            ->post(route('fan.budgets.school-group.store', $budget->id), $this->payload([
                'channels_confirmed' => false,
            ]))
            ->assertSessionHasErrors('channels_confirmed');

        $this->assertNull($budget->fresh()->schoolDeclaration);
    }

    public function test_a_party_of_minors_needs_a_supervising_adult(): void
    {
        $official = User::factory()->create();
        $budget = $this->budgetFor($official);

        $this->actingAs($official)
            ->post(route('fan.budgets.school-group.store', $budget->id), $this->payload([
                'travellers_adults' => 0,
            ]))
            ->assertSessionHasErrors('travellers_adults');
    }

    public function test_an_age_is_required_when_minors_travel_and_dropped_when_they_do_not(): void
    {
        $official = User::factory()->create();

        // Required: it decides whether unaccompanied-minor handling applies.
        $withMinors = $this->budgetFor($official);
        $this->actingAs($official)
            ->post(route('fan.budgets.school-group.store', $withMinors->id), $this->payload([
                'youngest_traveller_age' => null,
            ]))
            ->assertSessionHasErrors('youngest_traveller_age');

        // Dropped: a stored value nothing renders is one that can later
        // contradict the numbers beside it.
        $staffOnly = $this->budgetFor($official);
        $this->actingAs($official)
            ->post(route('fan.budgets.school-group.store', $staffOnly->id), $this->payload([
                'travellers_minors' => 0,
                'youngest_traveller_age' => 14,
            ]))
            ->assertSessionHasNoErrors();

        $declaration = $staffOnly->fresh()->schoolDeclaration;
        $this->assertNull($declaration->youngest_traveller_age);
        $this->assertFalse($declaration->involvesMinors());
    }

    public function test_an_official_cannot_declare_against_someone_elses_plan(): void
    {
        // Route-model binding is not an authorization check (Sprint 56).
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $budget = $this->budgetFor($owner);

        $this->actingAs($stranger)
            ->post(route('fan.budgets.school-group.store', $budget->id), $this->payload())
            ->assertStatus(403);

        $this->assertNull($budget->fresh()->schoolDeclaration);
    }

    public function test_a_declaration_can_be_withdrawn_by_its_owner_only(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $budget = $this->budgetFor($owner);

        SchoolGroupDeclaration::create($this->payload(['budget_id' => $budget->id, 'declared_at' => now()]));

        $this->actingAs($stranger)
            ->delete(route('fan.budgets.school-group.destroy', $budget->id))
            ->assertStatus(403);
        $this->assertNotNull($budget->fresh()->schoolDeclaration);

        $this->actingAs($owner)
            ->delete(route('fan.budgets.school-group.destroy', $budget->id))
            ->assertRedirect();
        $this->assertNull($budget->fresh()->schoolDeclaration);
    }

    public function test_the_itinerary_list_carries_the_declaration(): void
    {
        // The school has to be able to see what it declared without
        // re-opening the form.
        $official = User::factory()->create();
        $declared = $this->budgetFor($official);
        $plainTrip = $this->budgetFor($official);

        SchoolGroupDeclaration::create($this->payload(['budget_id' => $declared->id, 'declared_at' => now()]));

        $props = $this->actingAs($official)
            ->get(route('fan.itineraries'))
            ->viewData('page')['props']['itineraries'];

        $rows = collect($props)->keyBy('id');

        $this->assertSame('34 under 18, 6 staff · youngest 12', $rows[$declared->id]['school_group']['party_summary']);
        $this->assertTrue($rows[$declared->id]['school_group']['involves_minors']);
        // Absence is the normal case and must not read as missing data.
        $this->assertNull($rows[$plainTrip->id]['school_group']);
    }

    public function test_the_form_never_accepts_pupil_identity(): void
    {
        // The design guarantee: extra keys are not merely ignored by the
        // validator, they have nowhere to land.
        $official = User::factory()->create();
        $budget = $this->budgetFor($official);

        $this->actingAs($official)->post(
            route('fan.budgets.school-group.store', $budget->id),
            $this->payload([
                'pupil_names' => 'Amina, Joseph, Fatima',
                'date_of_birth' => '2014-03-02',
            ]),
        );

        $stored = $budget->fresh()->schoolDeclaration->getAttributes();

        foreach (array_keys($stored) as $column) {
            $this->assertStringNotContainsString('pupil', $column);
            $this->assertStringNotContainsString('child', $column);
            $this->assertStringNotContainsString('date_of_birth', $column);
        }
    }
}
