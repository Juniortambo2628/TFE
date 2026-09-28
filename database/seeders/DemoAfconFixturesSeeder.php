<?php

namespace Database\Seeders;

use App\Models\Fixture;
use App\Services\FixtureService;
use Illuminate\Database\Seeder;

/**
 * AFCON 2027 match schedule — the demo platform's ONLY playable fixture set.
 *
 * Every one of the 104 seeded fixtures belonged to `wc_2026`, which is
 * `concluded` and therefore cannot be the active tournament (Sprint 53). The
 * default tournament is `afcon_2027`, so a freshly seeded install had a
 * Budget Calculator whose match step offered nothing, an empty Match
 * Schedule, and an Itinerary Map with no coordinates to draw.
 *
 * 24 teams in 6 groups, then a 16-team knockout: 36 + 8 + 4 + 2 + 2 = 52.
 *
 * Deliberately deterministic — no Faker. A demo you screenshot should look
 * the same on every machine and every re-seed, or visual regressions hide in
 * the noise and no two screenshots can be compared.
 *
 * Venues come from `config/stadiums.php` by NAME (not slug), because that is
 * what `Fixture::venue` stores and what `StadiumImageService` alias-matches
 * on. Each group plays in its host nation's grounds, and **Kipchoge Keino is
 * never used** — it is catalogued `is_alternate`, a 15,000-seat training
 * venue rather than a match ground.
 */
class DemoAfconFixturesSeeder extends Seeder
{
    private const TOURNAMENT = 'afcon_2027';

    /** Hosts head their own group, as they do in the real draw. */
    private const GROUPS = [
        'A' => ['Kenya', 'Algeria', 'Zambia', 'Guinea'],
        'B' => ['Tanzania', 'Senegal', 'Mozambique', 'Madagascar'],
        'C' => ['Uganda', 'Morocco', 'Zimbabwe', 'Namibia'],
        'D' => ['Egypt', 'Nigeria', 'Burkina Faso', 'Guinea-Bissau'],
        'E' => ['Ivory Coast', 'Cameroon', 'Mali', 'Cape Verde'],
        'F' => ['Tunisia', 'Ghana', 'South Africa', 'Gabon'],
    ];

    /** Which grounds each group plays on, so a host's fans travel least. */
    private const GROUP_VENUES = [
        'A' => ['Raila Odinga International Stadium', 'Moi International Sports Centre, Kasarani'],
        'B' => ['Benjamin Mkapa Stadium', 'Amaan Stadium'],
        'C' => ['Mandela National Stadium', 'Akii-Bua Olympic Stadium'],
        'D' => ['Nyayo National Stadium', 'Bukhungu Stadium'],
        'E' => ['Samia Suluhu Hassan Stadium', 'Dodoma Stadium'],
        'F' => ['Hoima City Stadium', 'Mandela National Stadium'],
    ];

    /** Kick-offs, staggered so a fan can attend two in a day. */
    private const KICKOFFS = ['14:00', '17:00', '20:00'];

    public function run(): void
    {
        $made = 0;
        $made += $this->groupStage();
        $made += $this->knockouts();

        // FixtureService caches an EMPTY list as readily as a full one, and
        // on any install seeded before this class existed that empty list is
        // already cached. Without this the schedule reads "No matches found"
        // on the install we just populated.
        FixtureService::clearCache(self::TOURNAMENT);

        $this->command?->info("AFCON 2027: {$made} fixtures present.");
    }

    /**
     * Six groups, each a single round-robin over three matchdays.
     *
     * The pairing table is the standard one: with teams indexed 0-3, the
     * matchdays are (0v1, 2v3), (0v2, 3v1), (3v0, 1v2) — so every side plays
     * each of the others exactly once.
     */
    private function groupStage(): int
    {
        $pairings = [
            [[0, 1], [2, 3]],
            [[0, 2], [3, 1]],
            [[3, 0], [1, 2]],
        ];

        // Matchday 1 spans 15-17 Jan, matchday 2 19-21, matchday 3 23-25,
        // three groups a day so the schedule reads like a real one.
        $matchdayStart = ['2027-01-15', '2027-01-19', '2027-01-23'];

        $count = 0;
        foreach (array_values(self::GROUPS) as $groupIndex => $teams) {
            $group = array_keys(self::GROUPS)[$groupIndex];
            $venues = self::GROUP_VENUES[$group];

            foreach ($pairings as $matchdayIndex => $pairs) {
                $date = date('Y-m-d', strtotime($matchdayStart[$matchdayIndex]." +{$this->dayOffset($groupIndex)} day"));

                foreach ($pairs as $pairIndex => [$home, $away]) {
                    $this->fixture([
                        'date' => $date,
                        'time' => self::KICKOFFS[$pairIndex % count(self::KICKOFFS)],
                        'home_team' => $teams[$home],
                        'away_team' => $teams[$away],
                        'group' => $group,
                        'venue' => $venues[$pairIndex % count($venues)],
                        'stage' => 'Group Stage',
                        'matchday' => $matchdayIndex + 1,
                    ]);
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * The knockout bracket, seeded with the group winners and runners-up a
     * real draw would most likely produce from the groups above. Naming real
     * teams rather than "Winner A" keeps every downstream surface — match
     * cards, flags, the itinerary map — rendering something recognisable.
     */
    private function knockouts(): int
    {
        $rounds = [
            ['stage' => 'Round of 16', 'date' => '2027-01-28', 'matchday' => 4, 'ties' => [
                ['Kenya', 'Mozambique', 'Raila Odinga International Stadium'],
                ['Morocco', 'Guinea-Bissau', 'Mandela National Stadium'],
                ['Egypt', 'Namibia', 'Nyayo National Stadium'],
                ['Senegal', 'Zambia', 'Benjamin Mkapa Stadium'],
                ['Ivory Coast', 'Gabon', 'Samia Suluhu Hassan Stadium'],
                ['Tunisia', 'Mali', 'Hoima City Stadium'],
                ['Nigeria', 'Tanzania', 'Moi International Sports Centre, Kasarani'],
                ['Ghana', 'Uganda', 'Akii-Bua Olympic Stadium'],
            ]],
            ['stage' => 'Quarter-finals', 'date' => '2027-02-02', 'matchday' => 5, 'ties' => [
                ['Kenya', 'Morocco', 'Raila Odinga International Stadium'],
                ['Egypt', 'Senegal', 'Benjamin Mkapa Stadium'],
                ['Ivory Coast', 'Tunisia', 'Mandela National Stadium'],
                ['Nigeria', 'Ghana', 'Moi International Sports Centre, Kasarani'],
            ]],
            ['stage' => 'Semi-finals', 'date' => '2027-02-07', 'matchday' => 6, 'ties' => [
                ['Kenya', 'Egypt', 'Raila Odinga International Stadium'],
                ['Ivory Coast', 'Nigeria', 'Benjamin Mkapa Stadium'],
            ]],
            ['stage' => 'Third Place', 'date' => '2027-02-13', 'matchday' => 7, 'ties' => [
                ['Egypt', 'Ivory Coast', 'Mandela National Stadium'],
            ]],
            ['stage' => 'Final', 'date' => '2027-02-14', 'matchday' => 7, 'ties' => [
                ['Kenya', 'Nigeria', 'Raila Odinga International Stadium'],
            ]],
        ];

        $count = 0;
        foreach ($rounds as $round) {
            foreach ($round['ties'] as $i => [$home, $away, $venue]) {
                $this->fixture([
                    // Ties spread over consecutive days, two per day.
                    'date' => date('Y-m-d', strtotime($round['date'].' +'.intdiv($i, 2).' day')),
                    'time' => self::KICKOFFS[($i % 2) + 1],
                    'home_team' => $home,
                    'away_team' => $away,
                    'group' => null,
                    'venue' => $venue,
                    'stage' => $round['stage'],
                    'matchday' => $round['matchday'],
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Idempotent on the tie itself — re-seeding must not double the schedule.
     * Keyed on tournament + both teams + stage, which is unique across this
     * bracket (no pair meets twice at the same stage).
     */
    private function fixture(array $attrs): void
    {
        Fixture::updateOrCreate(
            [
                'tournament_id' => self::TOURNAMENT,
                'home_team' => $attrs['home_team'],
                'away_team' => $attrs['away_team'],
                'stage' => $attrs['stage'],
            ],
            $attrs + ['tournament_id' => self::TOURNAMENT, 'status' => 'scheduled'],
        );
    }

    /** Stagger groups across the matchday window: 3 groups per day. */
    private function dayOffset(int $groupIndex): int
    {
        return intdiv($groupIndex, 3);
    }
}
