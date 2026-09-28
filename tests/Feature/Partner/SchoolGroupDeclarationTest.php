<?php

namespace Tests\Feature\Partner;

use App\Models\Budget;
use App\Models\Listing;
use App\Models\SchoolGroupDeclaration;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 61 — a school declares; TFE never holds pupil data.
 *
 * The engagement is with the school through an appointed official, not with
 * each child's guardian. One duty does NOT transfer with that: if TFE knows
 * minors are travelling and fails to tell the partner, that is TFE's
 * failure. These tests exist mostly to keep that flag propagating.
 */
class SchoolGroupDeclarationTest extends TestCase
{
    use RefreshDatabase;

    private function partnerWithBudget(?array $declaration = null): array
    {
        $partner = User::factory()->partner()->create(['partner_type' => 'travel_agent']);

        $listing = Listing::factory()->create([
            'publisher_type' => User::class,
            'publisher_id' => $partner->id,
            'moderation_status' => 'approved',
            'is_active' => true,
        ]);

        $fan = User::factory()->create();

        $budget = Budget::create([
            'user_id' => $fan->id,
            'listing_id' => $listing->id,
            'name' => 'School trip',
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

        if ($declaration !== null) {
            SchoolGroupDeclaration::create(array_merge([
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
            ], $declaration));
        }

        return [$partner, $budget];
    }

    public function test_the_minors_flag_reaches_the_partner_queue(): void
    {
        [$partner] = $this->partnerWithBudget([]);

        $response = $this->actingAs($partner)->get(route('partner.dashboard'));
        $response->assertStatus(200);

        $group = $response->viewData('page')['props']['requests'][0]['school_group'];

        $this->assertTrue($group['involves_minors']);
        $this->assertSame('34 under 18, 6 staff · youngest 12', $group['party_summary']);
    }

    public function test_the_flag_and_the_contact_reach_the_single_brief(): void
    {
        [$partner, $budget] = $this->partnerWithBudget([]);

        $response = $this->actingAs($partner)->get(route('partner.requests.show', $budget->id));
        $response->assertStatus(200);

        $group = $response->viewData('page')['props']['budget']['school_group'];

        $this->assertTrue($group['involves_minors']);
        // Its whole purpose is to be reachable in two years.
        $this->assertSame('Jane Mwangi', $group['official_name']);
        $this->assertSame('games@nairobigirls.sc.ke', $group['official_email']);
        $this->assertTrue($group['is_complete']);
    }

    public function test_an_ordinary_budget_carries_no_declaration(): void
    {
        // Most budgets are one fan planning their own trip. Absence is the
        // normal case and must not read as missing data.
        [$partner, $budget] = $this->partnerWithBudget(null);

        $queue = $this->actingAs($partner)->get(route('partner.dashboard'));
        $this->assertNull($queue->viewData('page')['props']['requests'][0]['school_group']);

        $brief = $this->actingAs($partner)->get(route('partner.requests.show', $budget->id));
        $this->assertNull($brief->viewData('page')['props']['budget']['school_group']);
    }

    public function test_involves_minors_is_derived_from_the_count(): void
    {
        // Never a separate boolean: a stored flag can disagree with the
        // numbers rendered beside it, and then one of them is lying.
        $staffOnly = new SchoolGroupDeclaration(['travellers_adults' => 4, 'travellers_minors' => 0]);
        $withPupils = new SchoolGroupDeclaration(['travellers_adults' => 4, 'travellers_minors' => 1]);

        $this->assertFalse($staffOnly->involvesMinors());
        $this->assertTrue($withPupils->involvesMinors());
    }

    public function test_budget_involves_minors_reads_through_the_declaration(): void
    {
        [, $withDeclaration] = $this->partnerWithBudget([]);
        [, $plainTrip] = $this->partnerWithBudget(null);
        [, $staffOnly] = $this->partnerWithBudget(['travellers_minors' => 0, 'youngest_traveller_age' => null]);

        $this->assertTrue($withDeclaration->fresh()->involvesMinors());
        // No declaration at all must be false, not an error.
        $this->assertFalse($plainTrip->fresh()->involvesMinors());
        // A declared party of adults only is a school group WITHOUT minors.
        $this->assertFalse($staffOnly->fresh()->involvesMinors());
    }

    public function test_a_half_signed_declaration_is_not_complete(): void
    {
        // One box ticked is not a partial warranty — it is not a warranty,
        // and must not read as though a school stood behind the trip.
        $both = new SchoolGroupDeclaration([
            'channels_confirmed' => true, 'information_accurate' => true, 'declared_at' => now(),
        ]);
        $one = new SchoolGroupDeclaration([
            'channels_confirmed' => true, 'information_accurate' => false, 'declared_at' => now(),
        ]);
        $unsigned = new SchoolGroupDeclaration([
            'channels_confirmed' => true, 'information_accurate' => true, 'declared_at' => null,
        ]);

        $this->assertTrue($both->isComplete());
        $this->assertFalse($one->isComplete());
        $this->assertFalse($unsigned->isComplete());
    }

    public function test_party_summary_omits_an_unknown_age_rather_than_guessing(): void
    {
        $known = new SchoolGroupDeclaration([
            'travellers_adults' => 6, 'travellers_minors' => 34, 'youngest_traveller_age' => 12,
        ]);
        $unknown = new SchoolGroupDeclaration([
            'travellers_adults' => 6, 'travellers_minors' => 34, 'youngest_traveller_age' => null,
        ]);
        $staffOnly = new SchoolGroupDeclaration(['travellers_adults' => 4, 'travellers_minors' => 0]);
        $empty = new SchoolGroupDeclaration(['travellers_adults' => 0, 'travellers_minors' => 0]);

        $this->assertSame('34 under 18, 6 staff · youngest 12', $known->partySummary());
        $this->assertSame('34 under 18, 6 staff', $unknown->partySummary());
        // A staff-only party never mentions an age, even if one was stored.
        $this->assertSame('4 staff', $staffOnly->partySummary());
        $this->assertSame('No travellers declared', $empty->partySummary());
    }

    public function test_a_declaration_stores_no_pupil_identity(): void
    {
        // The design guarantee, asserted rather than assumed: adding a
        // pupil-name or date-of-birth column later should fail this.
        $columns = \Schema::getColumnListing('school_group_declarations');

        foreach ($columns as $column) {
            $this->assertStringNotContainsString('pupil', $column);
            $this->assertStringNotContainsString('child', $column);
            $this->assertStringNotContainsString('date_of_birth', $column);
        }
    }

    public function test_one_declaration_per_request(): void
    {
        // Two declarations against one budget makes "what was agreed"
        // unanswerable, which is the only reason to hold one.
        [, $budget] = $this->partnerWithBudget([]);

        $this->expectException(QueryException::class);

        SchoolGroupDeclaration::create([
            'budget_id' => $budget->id,
            'school_name' => 'Another School',
            'official_name' => 'Someone Else',
            'official_role' => 'Head',
            'official_email' => 'head@other.sc.ke',
        ]);
    }
}
