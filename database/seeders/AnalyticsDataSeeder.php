<?php

namespace Database\Seeders;

use App\Models\AnalyticsEvent;
use App\Models\Budget;
use App\Models\Event;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Database\Seeder;

class AnalyticsDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        if (! $user) {
            return;
        }

        // 1. Seed 30 days of calculator usage
        for ($i = 30; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $count = rand(5, 25);

            for ($j = 0; $j < $count; $j++) {
                AnalyticsEvent::create([
                    'event_name' => 'calculator_use',
                    'metadata' => [
                        'match_count' => rand(1, 5),
                        'nights' => rand(3, 10),
                        'estimated_cost' => rand(150000, 450000),
                    ],
                    'user_id' => $user->id,
                    'created_at' => $date->copy()->addHours(rand(0, 23)),
                ]);
            }
        }

        // 2. Seed various budgets (itineraries)
        $statuses = ['pending', 'approved', 'modified'];
        $locations = ['Nairobi', 'Lagos', 'Cape Town', 'Accra'];

        for ($i = 0; $i < 40; $i++) {
            $status = $statuses[array_rand($statuses)];
            $cost = rand(200000, 500000);
            $partnerCost = null;

            if ($status === 'approved') {
                $partnerCost = $cost;
            } elseif ($status === 'modified') {
                $partnerCost = $cost + (rand(-5, 15) * 10000);
            }

            Budget::create([
                'user_id' => $user->id,
                'name' => 'Trip to '.$locations[array_rand($locations)],
                'total_cost' => $cost,
                'match_ids' => [rand(1, 10), rand(11, 20)],
                'accommodation_level' => ['basic', 'premium', 'luxury'][rand(0, 2)],
                'flight_class' => ['economy', 'business'][rand(0, 1)],
                'breakdown' => ['Flight' => $cost * 0.4, 'Hotel' => $cost * 0.6],
                'nights' => rand(4, 12),
                'partner_status' => $status,
                'partner_cost' => $partnerCost,
                'partner_notes' => $status === 'modified' ? 'Adjusted for seasonal rates.' : null,
                'created_at' => now()->subDays(rand(0, 45)),
            ]);
        }

        // 3. Seed Categorized Events
        $eventTypes = ['Match Day', 'Watch Party', 'Tournament', 'Community'];
        foreach ($eventTypes as $type) {
            for ($i = 0; $i < rand(2, 6); $i++) {
                Event::create([
                    'title' => $type.' '.rand(1, 100),
                    'description' => 'Experience the thrill of the '.$type,
                    'date' => now()->addDays(rand(1, 60)),
                    'location' => 'Stadium '.rand(1, 5),
                    'type' => $type,
                ]);
            }
        }

        // 4. Seed some payments
        $methods = ['mpesa', 'stripe', 'bank'];
        for ($i = 0; $i < 15; $i++) {
            PaymentTransaction::create([
                'user_id' => $user->id,
                'amount' => rand(500, 5000),
                'status' => 'completed',
                'method' => $methods[array_rand($methods)],
                'reference' => 'TXN'.strtoupper(bin2hex(random_bytes(4))),
            ]);
        }
    }
}
