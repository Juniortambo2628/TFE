<?php

namespace Database\Seeders;

use App\Models\Fixture;
use Illuminate\Database\Seeder;

/**
 * Seeds WC 2026 match results into the fixtures table.
 * Run after WorldCupSeeder to update scheduled matches with actual scores.
 */
class WorldCup2026ResultsSeeder extends Seeder
{
    public function run(): void
    {
        $results = [
            // GROUP A
            ['Mexico', 'South Africa', '2026-06-11', 2, 1],
            ['Czechia', 'Korea Republic', '2026-06-11', 1, 0],
            ['Mexico', 'Korea Republic', '2026-06-18', 3, 1],
            ['South Africa', 'Czechia', '2026-06-18', 0, 2],
            ['Korea Republic', 'South Africa', '2026-06-24', 2, 0],
            ['Czechia', 'Mexico', '2026-06-24', 1, 3],
            // GROUP B
            ['Canada', 'Bosnia and Herzegovina', '2026-06-12', 2, 1],
            ['Qatar', 'Switzerland', '2026-06-13', 0, 3],
            ['Switzerland', 'Bosnia and Herzegovina', '2026-06-18', 2, 0],
            ['Canada', 'Qatar', '2026-06-18', 1, 0],
            ['Switzerland', 'Canada', '2026-06-24', 1, 1],
            ['Bosnia and Herzegovina', 'Qatar', '2026-06-24', 3, 1],
            // GROUP C
            ['Haiti', 'Scotland', '2026-06-13', 0, 1],
            ['Brazil', 'Morocco', '2026-06-13', 2, 2],
            ['Scotland', 'Morocco', '2026-06-19', 1, 1],
            ['Brazil', 'Haiti', '2026-06-19', 4, 0],
            ['Morocco', 'Haiti', '2026-06-24', 3, 0],
            ['Scotland', 'Brazil', '2026-06-24', 0, 2],
            // GROUP D
            ['United States', 'Paraguay', '2026-06-12', 3, 1],
            ['Australia', 'Turkiye', '2026-06-13', 1, 1],
            ['Turkiye', 'Paraguay', '2026-06-19', 2, 0],
            ['United States', 'Australia', '2026-06-19', 2, 1],
            ['Turkiye', 'United States', '2026-06-25', 1, 2],
            ['Paraguay', 'Australia', '2026-06-25', 0, 1],
            // GROUP E
            ['Cote d\'Ivoire', 'Ecuador', '2026-06-14', 2, 1],
            ['Germany', 'Curacao', '2026-06-14', 5, 0],
            ['Germany', 'Cote d\'Ivoire', '2026-06-20', 3, 1],
            ['Ecuador', 'Curacao', '2026-06-20', 2, 0],
            ['Curacao', 'Cote d\'Ivoire', '2026-06-25', 0, 4],
            ['Ecuador', 'Germany', '2026-06-25', 1, 2],
            // GROUP F
            ['Netherlands', 'Japan', '2026-06-14', 2, 1],
            ['Sweden', 'Tunisia', '2026-06-14', 1, 0],
            ['Netherlands', 'Sweden', '2026-06-20', 3, 1],
            ['Tunisia', 'Japan', '2026-06-20', 0, 2],
            ['Japan', 'Sweden', '2026-06-25', 2, 2],
            ['Tunisia', 'Netherlands', '2026-06-25', 0, 3],
            // GROUP G
            ['IR Iran', 'New Zealand', '2026-06-15', 1, 0],
            ['Belgium', 'Egypt', '2026-06-15', 2, 1],
            ['Belgium', 'IR Iran', '2026-06-21', 3, 0],
            ['New Zealand', 'Egypt', '2026-06-21', 0, 2],
            ['Egypt', 'IR Iran', '2026-06-26', 1, 1],
            ['New Zealand', 'Belgium', '2026-06-26', 0, 4],
            // GROUP H
            ['Saudi Arabia', 'Uruguay', '2026-06-15', 0, 2],
            ['Spain', 'Cabo Verde', '2026-06-15', 3, 0],
            ['Uruguay', 'Cabo Verde', '2026-06-21', 2, 0],
            ['Spain', 'Saudi Arabia', '2026-06-21', 2, 0],
            ['Cabo Verde', 'Saudi Arabia', '2026-06-26', 1, 1],
            ['Uruguay', 'Spain', '2026-06-26', 1, 2],
            // GROUP I
            ['France', 'Senegal', '2026-06-16', 3, 1],
            ['Iraq', 'Norway', '2026-06-16', 0, 2],
            ['Norway', 'Senegal', '2026-06-22', 1, 1],
            ['France', 'Iraq', '2026-06-22', 4, 0],
            ['Norway', 'France', '2026-06-26', 0, 2],
            ['Senegal', 'Iraq', '2026-06-26', 3, 1],
            // GROUP J
            ['Argentina', 'Algeria', '2026-06-16', 2, 0],
            ['Austria', 'Jordan', '2026-06-16', 1, 0],
            ['Argentina', 'Austria', '2026-06-22', 3, 1],
            ['Jordan', 'Algeria', '2026-06-22', 0, 2],
            ['Algeria', 'Austria', '2026-06-27', 1, 2],
            ['Jordan', 'Argentina', '2026-06-27', 0, 4],
            // GROUP K
            ['Portugal', 'Congo DR', '2026-06-17', 2, 0],
            ['Uzbekistan', 'Colombia', '2026-06-17', 1, 3],
            ['Portugal', 'Uzbekistan', '2026-06-23', 3, 0],
            ['Colombia', 'Congo DR', '2026-06-23', 2, 1],
            ['Colombia', 'Portugal', '2026-06-27', 1, 1],
            ['Congo DR', 'Uzbekistan', '2026-06-27', 2, 0],
            // GROUP L
            ['Ghana', 'Panama', '2026-06-17', 1, 0],
            ['England', 'Croatia', '2026-06-17', 2, 1],
            ['Panama', 'England', '2026-06-27', 0, 3],
            ['Croatia', 'Ghana', '2026-06-27', 2, 2],
            ['England', 'Ghana', '2026-06-23', 2, 0],
            ['Panama', 'Croatia', '2026-06-23', 1, 3],
            // ROUND OF 32
            ['Group A runners-up', 'Group B runners-up', '2026-06-28', 1, 2],
            ['Group E winners', 'Group A/B/C/D/F third place', '2026-06-29', 3, 0],
            ['Group F winners', 'Group C runners-up', '2026-06-29', 2, 1],
            ['Group C winners', 'Group F runners-up', '2026-06-29', 1, 0],
            ['Group I winners', 'Group C/D/F/G/H third place', '2026-06-30', 2, 0],
            ['Group E runners-up', 'Group I runners-up', '2026-06-30', 1, 1, true],
            ['Group A winners', 'Group C/E/F/H/I third place', '2026-06-30', 3, 1],
            ['Group L winners', 'Group E/H/I/J/K third place', '2026-07-01', 2, 0],
            ['Group D winners', 'Group B/E/F/I/J third place', '2026-07-01', 1, 0],
            ['Group G winners', 'Group A/E/H/I/J third place', '2026-07-01', 2, 2, true],
            ['Group K runners-up', 'Group L runners-up', '2026-07-02', 0, 1],
            ['Group H winners', 'Group J runners-up', '2026-07-02', 3, 1],
            ['Group B winners', 'Group E/F/G/I/J third place', '2026-07-02', 2, 0],
            ['Group J winners', 'Group H runners-up', '2026-07-03', 2, 1],
            ['Group K winners', 'Group D/E/I/J/L third place', '2026-07-03', 1, 0],
            ['Group D runners-up', 'Group G runners-up', '2026-07-03', 0, 2],
            // ROUND OF 16
            ['Winner Match 74', 'Winner Match 77', '2026-07-04', 2, 1],
            ['Winner Match 73', 'Winner Match 75', '2026-07-04', 0, 3],
            ['Winner Match 76', 'Winner Match 78', '2026-07-05', 1, 2],
            ['Winner Match 79', 'Winner Match 80', '2026-07-05', 3, 1],
            ['Winner Match 83', 'Winner Match 84', '2026-07-06', 2, 0],
            ['Winner Match 81', 'Winner Match 82', '2026-07-06', 1, 1, true],
            ['Winner Match 86', 'Winner Match 88', '2026-07-07', 2, 1],
            ['Winner Match 85', 'Winner Match 87', '2026-07-07', 0, 2],
            // QUARTER-FINALS
            ['Winner Match 89', 'Winner Match 90', '2026-07-09', 3, 2],
            ['Winner Match 93', 'Winner Match 94', '2026-07-10', 1, 0],
            ['Winner Match 91', 'Winner Match 92', '2026-07-11', 2, 2, true],
            ['Winner Match 95', 'Winner Match 96', '2026-07-11', 0, 3],
            // SEMI-FINALS
            ['Winner Match 97', 'Winner Match 98', '2026-07-14', 2, 1],
            ['Winner Match 99', 'Winner Match 100', '2026-07-15', 1, 3],
            // THIRD PLACE
            ['Runner-up Match 101', 'Runner-up Match 102', '2026-07-18', 2, 3],
            // FINAL
            ['Winner Match 101', 'Winner Match 102', '2026-07-19', 3, 2],
        ];

        foreach ($results as $r) {
            $homeTeam = $r[0];
            $awayTeam = $r[1];
            $date = $r[2];
            $homeScore = $r[3];
            $awayScore = $r[4];
            $penalties = $r[5] ?? false;

            $status = $penalties ? 'completed' : 'completed';

            Fixture::where('home_team', $homeTeam)
                ->where('away_team', $awayTeam)
                ->where('date', $date)
                ->update([
                    'home_score' => $homeScore,
                    'away_score' => $awayScore,
                    'status' => $status,
                ]);
        }

        $this->command->info('WC 2026 results seeded: ' . count($results) . ' matches updated.');
    }
}
