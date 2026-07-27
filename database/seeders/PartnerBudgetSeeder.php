<?php

namespace Database\Seeders;

use App\Models\Budget;
use App\Models\User;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;

class PartnerBudgetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Get a non-partner user to assign budgets to
        $fanUser = User::where(function ($q) {
            $q->whereNull('is_partner')->orWhere('is_partner', 0);
        })->first();

        if (! $fanUser) {
            $this->command->info('No fan user found. Creating one...');
            $fanUser = User::create([
                'name' => 'Test Fan User',
                'email' => 'fan@example.com',
                'password' => bcrypt('password123'),
                'is_partner' => false,
                'email_verified_at' => now(),
            ]);
        }

        $statuses = ['pending', 'pending', 'pending', 'approved', 'modified'];
        $accommodations = ['budget', 'mid-range', 'luxury'];
        $flights = ['economy', 'business', 'first'];

        foreach (range(1, 8) as $i) {
            $status = $statuses[array_rand($statuses)];
            $totalCost = rand(150000, 800000);

            Budget::create([
                'user_id' => $fanUser->id,
                'name' => 'World Cup Trip '.$i,
                'total_cost' => $totalCost,
                'match_ids' => [rand(1, 10), rand(11, 20), rand(21, 30)],
                'accommodation_level' => $accommodations[array_rand($accommodations)],
                'flight_class' => $flights[array_rand($flights)],
                'breakdown' => [
                    'flights' => rand(50000, 200000),
                    'hotel' => rand(40000, 150000),
                    'tickets' => rand(30000, 100000),
                    'misc' => rand(10000, 50000),
                ],
                'nights' => rand(5, 14),
                'is_active' => true,
                'partner_status' => $status,
                'partner_cost' => in_array($status, ['approved', 'modified']) ? rand(140000, intval($totalCost * 0.95)) : null,
                'partner_notes' => in_array($status, ['approved', 'modified']) ? $faker->sentence() : null,
            ]);
        }

        $this->command->info('Created 8 test budget requests for partner review.');
    }
}
