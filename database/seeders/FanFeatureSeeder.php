<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Fixture;
use App\Models\Prize;
use App\Models\Product;
use App\Models\WorldCupMatch;
use Illuminate\Database\Seeder;

class FanFeatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed Products
        $products = [
            ['name' => 'World Cup 2026 Official Jersey', 'category' => 'Apparel', 'price' => 12999, 'description' => 'Official FIFA World Cup 2026 jersey', 'in_stock' => true, 'stock_quantity' => 100],
            ['name' => 'Fan Scarf Collection', 'category' => 'Accessories', 'price' => 2499, 'description' => 'Premium supporter scarf', 'in_stock' => true, 'stock_quantity' => 200],
            ['name' => 'Stadium Cap', 'category' => 'Accessories', 'price' => 1999, 'description' => 'Official World Cup cap', 'in_stock' => true, 'stock_quantity' => 150],
            ['name' => 'Collectible Football', 'category' => 'Collectibles', 'price' => 4999, 'description' => 'Limited edition match ball replica', 'in_stock' => false, 'stock_quantity' => 0],
            ['name' => 'Fan Flag Pack', 'category' => 'Accessories', 'price' => 999, 'description' => 'Set of supporter flags', 'in_stock' => true, 'stock_quantity' => 300],
            ['name' => 'Premium Travel Kit', 'category' => 'Travel', 'price' => 8999, 'description' => 'Essential travel accessories for fans', 'in_stock' => true, 'stock_quantity' => 50],
            ['name' => 'Team Poster Set', 'category' => 'Collectibles', 'price' => 1499, 'description' => 'Set of 32 team posters', 'in_stock' => true, 'stock_quantity' => 75],
            ['name' => 'World Cup Mug', 'category' => 'Accessories', 'price' => 799, 'description' => 'Ceramic mug with World Cup 2026 branding', 'in_stock' => true, 'stock_quantity' => 200],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(['name' => $product['name']], $product);
        }

        // Seed World Cup Matches
        $matches = [
            ['home_team' => 'Brazil', 'away_team' => 'Germany', 'date' => '2026-06-15', 'time' => '18:00:00', 'stage' => 'Group Stage', 'venue' => 'MetLife Stadium', 'group_name' => 'Group A', 'status' => 'open'],
            ['home_team' => 'Argentina', 'away_team' => 'France', 'date' => '2026-06-16', 'time' => '15:00:00', 'stage' => 'Group Stage', 'venue' => 'SoFi Stadium', 'group_name' => 'Group B', 'status' => 'open'],
            ['home_team' => 'England', 'away_team' => 'Spain', 'date' => '2026-06-17', 'time' => '21:00:00', 'stage' => 'Group Stage', 'venue' => 'AT&T Stadium', 'group_name' => 'Group C', 'status' => 'open'],
            ['home_team' => 'USA', 'away_team' => 'Mexico', 'date' => '2026-06-18', 'time' => '19:00:00', 'stage' => 'Group Stage', 'venue' => 'Rose Bowl', 'group_name' => 'Group A', 'status' => 'open'],
            ['home_team' => 'Portugal', 'away_team' => 'Netherlands', 'date' => '2026-06-19', 'time' => '20:00:00', 'stage' => 'Group Stage', 'venue' => 'Hard Rock Stadium', 'group_name' => 'Group D', 'status' => 'upcoming'],
            ['home_team' => 'Italy', 'away_team' => 'Belgium', 'date' => '2026-06-20', 'time' => '17:00:00', 'stage' => 'Group Stage', 'venue' => 'Lumen Field', 'group_name' => 'Group E', 'status' => 'upcoming'],
        ];

        foreach ($matches as $match) {
            WorldCupMatch::updateOrCreate(
                ['home_team' => $match['home_team'], 'away_team' => $match['away_team'], 'date' => $match['date']],
                $match
            );
        }

        // Seed Prizes
        $prizes = [
            ['position' => '1st', 'name' => 'VIP Match Experience', 'description' => 'Watch a World Cup match from VIP seats with all expenses paid', 'value' => 500000, 'active' => true],
            ['position' => '2nd', 'name' => 'Official Jersey Set', 'description' => 'Complete set of all 32 team jerseys', 'value' => 50000, 'active' => true],
            ['position' => '3rd', 'name' => 'Fan Merchandise Bundle', 'description' => 'Premium merchandise package', 'value' => 25000, 'active' => true],
        ];

        foreach ($prizes as $prize) {
            Prize::updateOrCreate(['position' => $prize['position']], $prize);
        }

        // Seed Events (uses title, location, type columns)
        $events = [
            ['title' => 'World Cup 2026 Opening Ceremony', 'description' => 'The spectacular opening ceremony featuring world-class performances', 'date' => '2026-06-11', 'location' => 'MetLife Stadium', 'type' => 'Ceremony'],
            ['title' => 'Fan Zone Festival', 'description' => 'Live music, food, and football activities at the official fan zone', 'date' => '2026-06-12', 'location' => 'Times Square', 'type' => 'Festival'],
            ['title' => 'Kenya Supporters Meetup', 'description' => 'Official meetup for Kenyan fans attending the World Cup', 'date' => '2026-06-13', 'location' => 'Central Park', 'type' => 'Meetup'],
            ['title' => 'Pre-Match Fan Rally', 'description' => 'Supporting our teams before the big match', 'date' => '2026-06-14', 'location' => 'Stadium District', 'type' => 'Rally'],
        ];

        foreach ($events as $event) {
            Event::updateOrCreate(['title' => $event['title'], 'date' => $event['date']], $event);
        }

        // Seed Fixtures (uses group column, not group_name)
        $fixtures = [
            ['home_team' => 'Brazil', 'away_team' => 'Germany', 'date' => '2026-06-15', 'time' => '18:00:00', 'venue' => 'MetLife Stadium', 'stage' => 'Group Stage', 'group' => 'Group A', 'matchday' => 1],
            ['home_team' => 'Argentina', 'away_team' => 'France', 'date' => '2026-06-16', 'time' => '15:00:00', 'venue' => 'SoFi Stadium', 'stage' => 'Group Stage', 'group' => 'Group B', 'matchday' => 1],
            ['home_team' => 'England', 'away_team' => 'Spain', 'date' => '2026-06-17', 'time' => '21:00:00', 'venue' => 'AT&T Stadium', 'stage' => 'Group Stage', 'group' => 'Group C', 'matchday' => 1],
            ['home_team' => 'USA', 'away_team' => 'Mexico', 'date' => '2026-06-18', 'time' => '19:00:00', 'venue' => 'Rose Bowl', 'stage' => 'Group Stage', 'group' => 'Group A', 'matchday' => 1],
        ];

        foreach ($fixtures as $fixture) {
            Fixture::updateOrCreate(
                ['home_team' => $fixture['home_team'], 'away_team' => $fixture['away_team'], 'date' => $fixture['date']],
                $fixture
            );
        }
    }
}
