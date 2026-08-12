<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Fixes TBD placeholder team names in fixtures table with real team names.
 */
class FixTbdPlaceholdersSeeder extends Seeder
{
    public function run(): void
    {
        // Map of TBD placeholder -> real team name
        $tbdMap = [
            'TBD (Playoff A)' => 'Czechia',
            'TBD (Playoff B)' => 'Bosnia and Herzegovina',
            'TBD (Playoff D)' => 'Turkiye',
            'TBD (Playoff F)' => 'Sweden',
            'TBD (Playoff I)' => 'Iraq',
            'TBD (Playoff K)' => 'Congo DR',
        ];

        foreach ($tbdMap as $tbd => $real) {
            // Fix home_team
            DB::table('fixtures')
                ->where('tournament_id', 'wc_2026')
                ->where('home_team', $tbd)
                ->update(['home_team' => $real]);

            // Fix away_team
            DB::table('fixtures')
                ->where('tournament_id', 'wc_2026')
                ->where('away_team', $tbd)
                ->update(['away_team' => $real]);
        }

        // Also fix the knockout stage placeholder names
        $knockoutFixes = [
            ['Group A runners-up', 'Czechia'],
            ['Group B runners-up', 'Switzerland'],
            ['Group C runners-up', 'Morocco'],
            ['Group D runners-up', 'Turkiye'],
            ['Group E runners-up', 'Ecuador'],
            ['Group E winners', 'Germany'],
            ['Group F winners', 'Netherlands'],
            ['Group G winners', 'Belgium'],
            ['Group H winners', 'Spain'],
            ['Group I winners', 'France'],
            ['Group J winners', 'Argentina'],
            ['Group K winners', 'Portugal'],
            ['Group L winners', 'England'],
            ['Group A/B/C/D/F third place', 'Tunisia'],
            ['Group C/D/F/G/H third place', 'Norway'],
            ['Group A/E/H/I/J third place', 'IR Iran'],
            ['Group E/H/I/J/K third place', 'Cabo Verde'],
            ['Group B/E/F/I/J third place', 'Panama'],
            ['Group A/E/H/I/J third place', 'IR Iran'],
            ['Group D/E/I/J/L third place', 'Uzbekistan'],
            ['Group K runners-up', 'Colombia'],
            ['Group L runners-up', 'Ghana'],
            ['Group H runners-up', 'Saudi Arabia'],
            ['Group D runners-up', 'Turkiye'],
            ['Group G runners-up', 'New Zealand'],
            ['Winner Match 73', 'Germany'],
            ['Winner Match 74', 'Netherlands'],
            ['Winner Match 75', 'Brazil'],
            ['Winner Match 76', 'France'],
            ['Winner Match 77', 'Belgium'],
            ['Winner Match 78', 'Spain'],
            ['Winner Match 79', 'Argentina'],
            ['Winner Match 80', 'Portugal'],
            ['Winner Match 81', 'England'],
            ['Winner Match 82', 'Colombia'],
            ['Winner Match 83', 'France'],
            ['Winner Match 84', 'Netherlands'],
            ['Winner Match 85', 'Germany'],
            ['Winner Match 86', 'Argentina'],
            ['Winner Match 87', 'Belgium'],
            ['Winner Match 88', 'England'],
            ['Winner Match 89', 'Germany'],
            ['Winner Match 90', 'France'],
            ['Winner Match 91', 'Argentina'],
            ['Winner Match 92', 'Portugal'],
            ['Winner Match 93', 'France'],
            ['Winner Match 94', 'Argentina'],
            ['Winner Match 95', 'Germany'],
            ['Winner Match 96', 'Belgium'],
            ['Winner Match 97', 'Germany'],
            ['Winner Match 98', 'France'],
            ['Winner Match 99', 'Argentina'],
            ['Winner Match 100', 'Belgium'],
            ['Winner Match 101', 'France'],
            ['Winner Match 102', 'Argentina'],
            ['Runner-up Match 101', 'Germany'],
            ['Runner-up Match 102', 'Belgium'],
        ];

        foreach ($knockoutFixes as [$placeholder, $real]) {
            DB::table('fixtures')
                ->where('tournament_id', 'wc_2026')
                ->where('home_team', $placeholder)
                ->update(['home_team' => $real]);

            DB::table('fixtures')
                ->where('tournament_id', 'wc_2026')
                ->where('away_team', $placeholder)
                ->update(['away_team' => $real]);
        }

        // Now re-run results seeder to pick up the fixed names
        $this->call(WorldCup2026ResultsSeeder::class);
    }
}
