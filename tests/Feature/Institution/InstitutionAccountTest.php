<?php

namespace Tests\Feature\Institution;

use App\Models\Budget;
use App\Models\InstitutionProfile;
use App\Models\Listing;
use App\Models\SchoolGroupDeclaration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 62 — institutions as an account type of their own.
 *
 * A school taking forty pupils to a tournament is neither a fan nor a
 * partner. These tests pin the three things that makes true: it signs up
 * through its own form, it lands on and can only reach its own surfaces,
 * and a plan saved from the trip planner asks it to declare before a
 * partner has been quoting blind.
 */
class InstitutionAccountTest extends TestCase
{
    use RefreshDatabase;

    private function institution(array $profile = []): User
    {
        $user = User::factory()->create([
            'name' => 'Nairobi Girls High School',
            'first_name' => 'Jane',
            'last_name' => 'Mwangi',
            'account_type' => 'institution',
        ]);

        InstitutionProfile::create(array_merge([
            'user_id' => $user->id,
            'institution_name' => 'Nairobi Girls High School',
            'institution_type' => 'school',
            'country' => 'Kenya',
            'city' => 'Nairobi',
            'official_role' => 'Deputy Head, Games',
            'contact_phone' => '+254 20 555 0142',
            'verification_status' => 'pending',
        ], $profile));

        return $user->fresh();
    }

    private function signUpPayload(array $overrides = []): array
    {
        return array_merge([
            'institution_name' => 'Nairobi Girls High School',
            'institution_type' => 'school',
            'registration_number' => 'MOE/SEC/2291',
            'country' => 'Kenya',
            'city' => 'Nairobi',
            'first_name' => 'Jane',
            'last_name' => 'Mwangi',
            'official_role' => 'Deputy Head, Games',
            'contact_phone' => '+254 20 555 0142',
            'email' => 'games@nairobigirls.sc.ke',
            'password' => 'Password!2345',
            'password_confirmation' => 'Password!2345',
            'authority_confirmed' => true,
            'terms_agreed' => true,
            'privacy_consent' => true,
        ], $overrides);
    }

    public function test_an_institution_signs_up_and_lands_on_its_own_dashboard(): void
    {
        $this->post(route('register.institution'), $this->signUpPayload())
            ->assertRedirect(route('institution.dashboard'));

        $user = User::where('email', 'games@nairobigirls.sc.ke')->first();

        $this->assertTrue($user->isInstitution());
        // The account belongs to the organisation, so that is the name the
        // chrome shows; the person is its appointed official.
        $this->assertSame('Nairobi Girls High School', $user->name);
        $this->assertSame('Jane', $user->first_name);
        $this->assertSame('Deputy Head, Games', $user->institutionProfile->official_role);
    }

    public function test_sign_up_never_self_verifies(): void
    {
        // An account that could mark itself verified is an account whose
        // verification is worth nothing.
        $this->post(route('register.institution'), $this->signUpPayload([
            'verification_status' => 'verified',
        ]));

        $profile = User::where('email', 'games@nairobigirls.sc.ke')->first()->institutionProfile;

        $this->assertSame('pending', $profile->verification_status);
        $this->assertNull($profile->verified_at);
    }

    public function test_authority_must_be_confirmed(): void
    {
        $this->post(route('register.institution'), $this->signUpPayload([
            'authority_confirmed' => false,
        ]))->assertSessionHasErrors('authority_confirmed');

        $this->assertDatabaseCount('institution_profiles', 0);
        $this->assertNull(User::where('email', 'games@nairobigirls.sc.ke')->first());
    }

    public function test_a_failed_profile_never_leaves_a_half_built_account(): void
    {
        // One transaction: an institution without its profile would pass
        // isInstitution() and reach a dashboard with nothing behind it.
        $this->post(route('register.institution'), $this->signUpPayload([
            'institution_type' => 'not_a_real_type',
        ]))->assertSessionHasErrors('institution_type');

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('institution_profiles', 0);
    }

    public function test_only_institutions_reach_the_group_surfaces(): void
    {
        $fan = User::factory()->create();

        $this->actingAs($fan)->get(route('institution.dashboard'))->assertStatus(403);
        $this->actingAs($fan)->get(route('institution.profile'))->assertStatus(403);

        $this->actingAs($this->institution())->get(route('institution.dashboard'))->assertStatus(200);
    }

    public function test_is_institution_reads_the_column_not_the_profile(): void
    {
        // A profile row that failed to save would otherwise silently demote
        // a school back to a fan, and the group surfaces would 403 with
        // nothing to explain why.
        $user = User::factory()->create(['account_type' => 'institution']);

        $this->assertTrue($user->isInstitution());
        $this->assertNull($user->institutionProfile);
        // …and the payload is absent rather than throwing.
        $this->assertNull($user->institutionPayload());
    }

    public function test_the_dashboard_separates_declared_trips_from_undeclared(): void
    {
        $user = $this->institution();

        $declared = Budget::create($this->budgetAttributes($user, 'Declared trip'));
        Budget::create($this->budgetAttributes($user, 'Not yet declared'));

        SchoolGroupDeclaration::create([
            'budget_id' => $declared->id,
            'school_name' => 'Nairobi Girls High School',
            'official_name' => 'Jane Mwangi',
            'official_role' => 'Deputy Head, Games',
            'official_email' => 'games@nairobigirls.sc.ke',
            'travellers_adults' => 6,
            'travellers_minors' => 34,
            'youngest_traveller_age' => 12,
            'channels_confirmed' => true,
            'information_accurate' => true,
            'declared_at' => now(),
        ]);

        $props = $this->actingAs($user)->get(route('institution.dashboard'))->viewData('page')['props'];

        $this->assertSame(2, $props['stats']['trips']);
        $this->assertSame(1, $props['stats']['declared']);
        // The number the panel leads on: a plan a partner may already be
        // quoting with no declaration behind it.
        $this->assertSame(1, $props['stats']['undeclared']);
        $this->assertSame(34, $props['stats']['minors']);
        $this->assertSame(6, $props['stats']['adults']);
        $this->assertSame(1, $props['stats']['trips_with_minors']);
    }

    public function test_the_dashboard_shows_only_its_own_trips(): void
    {
        $user = $this->institution();
        $other = $this->institution(['institution_name' => 'Another School']);

        Budget::create($this->budgetAttributes($user, 'Ours'));
        Budget::create($this->budgetAttributes($other, 'Theirs'));

        $props = $this->actingAs($user)->get(route('institution.dashboard'))->viewData('page')['props'];

        $this->assertSame(1, $props['stats']['trips']);
        $this->assertSame('Ours', $props['trips'][0]['name']);
    }

    public function test_saving_a_plan_prompts_an_institution_to_declare(): void
    {
        // The gap this closes: a plan reaches a partner's Convert queue the
        // moment it is saved against their listing, so a declaration made
        // afterwards leaves a window with no minors flag on the brief.
        $user = $this->institution();

        $this->actingAs($user)
            ->post(route('fan.budget.save'), $this->savePayload())
            ->assertSessionHas('declare_group');

        $budget = Budget::where('user_id', $user->id)->first();
        $this->assertSame($budget->id, session('declare_group'));
    }

    public function test_the_prompt_does_not_fire_for_an_individual_or_a_declared_plan(): void
    {
        $fan = User::factory()->create();

        $this->actingAs($fan)
            ->post(route('fan.budget.save'), $this->savePayload())
            ->assertSessionMissing('declare_group');

        // And an institution amending a plan it has already declared is not
        // asked again — the prompt is for the gap, not for every save.
        $user = $this->institution();
        $budget = Budget::create($this->budgetAttributes($user, 'Already declared'));

        SchoolGroupDeclaration::create([
            'budget_id' => $budget->id,
            'school_name' => 'Nairobi Girls High School',
            'official_name' => 'Jane Mwangi',
            'official_role' => 'Deputy Head, Games',
            'official_email' => 'games@nairobigirls.sc.ke',
            'travellers_adults' => 6,
            'travellers_minors' => 34,
            'youngest_traveller_age' => 12,
            'channels_confirmed' => true,
            'information_accurate' => true,
            'declared_at' => now(),
        ]);

        $this->actingAs($user)
            ->post(route('fan.budget.save'), $this->savePayload(['id' => $budget->id]))
            ->assertSessionMissing('declare_group');
    }

    public function test_the_planner_carries_the_declaration_defaults(): void
    {
        // A school should not retype its own name and its official's role on
        // every trip — a field somebody retypes forty times is one that
        // eventually disagrees with itself.
        $user = $this->institution();

        $props = $this->actingAs($user)->get(route('fan.budget-calculator'))->viewData('page')['props'];

        $this->assertSame('Nairobi Girls High School', $props['institution']['institution_name']);
        $this->assertSame('Jane Mwangi', $props['institution']['official_name']);
        $this->assertSame('Deputy Head, Games', $props['institution']['official_role']);

        // Null for an individual, so the prompt can never fire for one.
        $fanProps = $this->actingAs(User::factory()->create())
            ->get(route('fan.budget-calculator'))->viewData('page')['props'];
        $this->assertNull($fanProps['institution']);
    }

    public function test_an_institution_edits_its_own_record_but_not_its_verification(): void
    {
        $user = $this->institution(['verification_status' => 'pending']);

        $this->actingAs($user)->put(route('institution.profile.update'), [
            'institution_name' => 'Nairobi Girls Secondary School',
            'institution_type' => 'school',
            'country' => 'Kenya',
            'city' => 'Nairobi',
            'first_name' => 'Grace',
            'last_name' => 'Otieno',
            'official_role' => 'Head of Sport',
            'verification_status' => 'verified',
        ])->assertRedirect();

        $user->refresh();

        $this->assertSame('Nairobi Girls Secondary School', $user->institutionProfile->institution_name);
        $this->assertSame('Head of Sport', $user->institutionProfile->official_role);
        // The account name follows the organisation, not the person.
        $this->assertSame('Nairobi Girls Secondary School', $user->name);
        $this->assertSame('pending', $user->institutionProfile->verification_status);
    }

    public function test_a_cleared_optional_field_stays_cleared(): void
    {
        // `?? $existing` cannot tell "emptied" from "not submitted", because
        // ConvertEmptyStringsToNull runs first (Sprint 56).
        $user = $this->institution(['registration_number' => 'MOE/SEC/2291']);

        $this->actingAs($user)->put(route('institution.profile.update'), [
            'institution_name' => 'Nairobi Girls High School',
            'institution_type' => 'school',
            'registration_number' => '',
            'country' => 'Kenya',
            'first_name' => 'Jane',
            'last_name' => 'Mwangi',
            'official_role' => 'Deputy Head, Games',
        ]);

        $this->assertNull($user->fresh()->institutionProfile->registration_number);
    }

    private function budgetAttributes(User $user, string $name): array
    {
        return [
            'user_id' => $user->id,
            'name' => $name,
            'total_cost' => 18400,
            'currency' => 'USD',
            'match_ids' => [],
            'breakdown' => [],
            'accommodation_level' => 'standard',
            'flight_class' => 'economy',
            'nights' => 5,
            'is_active' => true,
            'partner_status' => 'pending',
        ];
    }

    private function savePayload(array $overrides = []): array
    {
        $listing = Listing::factory()->create(['moderation_status' => 'approved', 'is_active' => true]);

        return array_merge([
            'name' => 'AFCON Schools Cup',
            'total_cost' => 18400,
            'currency' => 'USD',
            'match_ids' => [1],
            'accommodation_level' => 'standard',
            'flight_class' => 'economy',
            'breakdown' => ['tickets' => 5200],
            'nights' => 5,
            'listing_id' => $listing->id,
        ], $overrides);
    }
}
