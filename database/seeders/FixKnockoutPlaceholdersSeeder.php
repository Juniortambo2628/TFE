<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Fixes remaining knockout stage placeholder names and adds scores.
 */
class FixKnockoutPlaceholdersSeeder extends Seeder
{
    public function run(): void
    {
        // Map placeholder names to real team names based on group results
        $placeholderMap = [
            // Group winners/runners-up
            'Runner-up Group A' => 'Czechia',
            'Runner-up Group B' => 'Switzerland',
            'Runner-up Group C' => 'Morocco',
            'Runner-up Group D' => 'Turkiye',
            'Runner-up Group E' => 'Ecuador',
            'Runner-up Group F' => 'Sweden',
            'Runner-up Group G' => 'New Zealand',
            'Runner-up Group H' => 'Saudi Arabia',
            'Runner-up Group I' => 'Senegal',
            'Runner-up Group J' => 'Austria',
            'Runner-up Group K' => 'Uzbekistan',
            'Runner-up Group L' => 'Croatia',
            'Winner Group A' => 'Mexico',
            'Winner Group B' => 'Canada',
            'Winner Group C' => 'Brazil',
            'Winner Group D' => 'United States',
            'Winner Group E' => 'Germany',
            'Winner Group F' => 'Netherlands',
            'Winner Group G' => 'Belgium',
            'Winner Group H' => 'Spain',
            'Winner Group I' => 'France',
            'Winner Group J' => 'Argentina',
            'Winner Group K' => 'Portugal',
            'Winner Group L' => 'England',
            // Third-place qualifiers
            '3rd Place (A/B/C/D/F)' => 'Tunisia',
            '3rd Place (C/D/F/G/H)' => 'Norway',
            '3rd Place (C/E/F/H/I)' => 'IR Iran',
            '3rd Place (E/H/I/J/K)' => 'Cabo Verde',
            '3rd Place (B/E/F/I/J)' => 'Panama',
            '3rd Place (A/E/H/I/J)' => 'Jordan',
            '3rd Place (D/E/I/J/L)' => 'Uzbekistan',
            '3rd Place (E/F/G/I/J)' => 'Paraguay',
            // Winner/Loser placeholders
            'Winner Match 73' => 'Germany',
            'Winner Match 74' => 'Netherlands',
            'Winner Match 75' => 'Brazil',
            'Winner Match 76' => 'France',
            'Winner Match 77' => 'Belgium',
            'Winner Match 78' => 'Spain',
            'Winner Match 79' => 'Argentina',
            'Winner Match 80' => 'Portugal',
            'Winner Match 81' => 'England',
            'Winner Match 82' => 'Colombia',
            'Winner Match 83' => 'France',
            'Winner Match 84' => 'Netherlands',
            'Winner Match 85' => 'Germany',
            'Winner Match 86' => 'Argentina',
            'Winner Match 87' => 'Belgium',
            'Winner Match 88' => 'England',
            'Winner Match 89' => 'Germany',
            'Winner Match 90' => 'France',
            'Winner Match 91' => 'Argentina',
            'Winner Match 92' => 'Portugal',
            'Winner Match 93' => 'France',
            'Winner Match 94' => 'Argentina',
            'Winner Match 95' => 'Germany',
            'Winner Match 96' => 'Belgium',
            'Winner Match 97' => 'Germany',
            'Winner Match 98' => 'France',
            'Winner Match 99' => 'Argentina',
            'Winner Match 100' => 'Belgium',
            'Winner Match 101' => 'France',
            'Winner Match 102' => 'Argentina',
            'Runner-up Match 101' => 'Germany',
            'Runner-up Match 102' => 'Belgium',
        ];

        $updated = 0;
        foreach ($placeholderMap as $placeholder => $real) {
            $affected = DB::table('fixtures')
                ->where('tournament_id', 'wc_2026')
                ->where('home_team', $placeholder)
                ->update(['home_team' => $real]);
            $updated += $affected;

            $affected = DB::table('fixtures')
                ->where('tournament_id', 'wc_2026')
                ->where('away_team', $placeholder)
                ->update(['away_team' => $real]);
            $updated += $affected;
        }

        // Now update knockout stage scores
        $knockoutScores = [
            // Round of 32
            ['Czechia', 'Switzerland', '2026-06-28', 1, 2],
            ['Germany', 'Tunisia', '2026-06-29', 3, 0],
            ['Netherlands', 'Morocco', '2026-06-29', 2, 1],
            ['Brazil', 'Sweden', '2026-06-29', 1, 0],
            ['France', 'Norway', '2026-06-30', 2, 0],
            ['Ecuador', 'Senegal', '2026-06-30', 1, 1],
            ['Mexico', 'IR Iran', '2026-06-30', 3, 1],
            ['England', 'Cabo Verde', '2026-07-01', 2, 0],
            ['United States', 'Panama', '2026-07-01', 1, 0],
            ['Belgium', 'Jordan', '2026-07-01', 2, 2],
            ['Colombia', 'Ghana', '2026-07-02', 0, 1],
            ['Spain', 'Austria', '2026-07-02', 3, 1],
            ['Switzerland', 'Ecuador', '2026-07-02', 2, 0],
            ['Argentina', 'Saudi Arabia', '2026-07-03', 2, 1],
            ['Portugal', 'Uzbekistan', '2026-07-03', 1, 0],
            ['Turkiye', 'New Zealand', '2026-07-03', 0, 2],
            // Round of 16
            ['Netherlands', 'Belgium', '2026-07-04', 2, 1],
            ['Germany', 'Brazil', '2026-07-04', 0, 3],
            ['France', 'Spain', '2026-07-05', 1, 2],
            ['Argentina', 'Portugal', '2026-07-05', 3, 1],
            ['France', 'Colombia', '2026-07-06', 2, 0],
            ['England', 'Germany', '2026-07-06', 1, 1],
            ['Argentina', 'Belgium', '2026-07-07', 2, 1],
            ['England', 'New Zealand', '2026-07-07', 0, 2],
            // Quarter-finals
            ['Germany', 'France', '2026-07-09', 3, 2],
            ['France', 'Argentina', '2026-07-10', 1, 0],
            ['Argentina', 'Portugal', '2026-07-11', 2, 2],
            ['Germany', 'Belgium', '2026-07-11', 0, 3],
            // Semi-finals
            ['Germany', 'France', '2026-07-14', 2, 1],
            ['Argentina', 'Belgium', '2026-07-15', 1, 3],
            // Third place
            ['Germany', 'Belgium', '2026-07-18', 2, 3],
            // Final
            ['France', 'Argentina', '2026-07-19', 3, 2],
        ];

        foreach ($knockoutScores as $r) {
            DB::table('fixtures')
                ->where('tournament_id', 'wc_2026')
                ->where('home_team', $r[0])
                ->where('away_team', $r[1])
                ->where('date', $r[2])
                ->update([
                    'home_score' => $r[3],
                    'away_score' => $r[4],
                    'status' => 'completed',
                ]);
        }

        $this->command->info("Placeholders fixed: {$updated} name updates, " . count($knockoutScores) . " knockout scores added.");
    }
}
