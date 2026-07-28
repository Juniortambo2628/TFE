<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Fixture;
use Illuminate\Database\Seeder;

class WorldCupSeeder extends Seeder
{
    public function run(): void
    {
        // Stadiums Data
        $stadiums = [
            'Mexico City Stadium' => ['officialName' => 'Estadio Azteca', 'city' => 'Mexico City', 'country' => 'Mexico', 'capacity' => 87523],
            'Estadio Guadalajara' => ['officialName' => 'Estadio Akron', 'city' => 'Guadalajara', 'country' => 'Mexico', 'capacity' => 44330],
            'Estadio Monterrey' => ['officialName' => 'Estadio BBVA', 'city' => 'Monterrey', 'country' => 'Mexico', 'capacity' => 53500],
            'Toronto Stadium' => ['officialName' => 'BMO Field', 'city' => 'Toronto', 'country' => 'Canada', 'capacity' => 45736],
            'BC Place Vancouver' => ['officialName' => 'BC Place', 'city' => 'Vancouver', 'country' => 'Canada', 'capacity' => 48821],
            'Los Angeles Stadium' => ['officialName' => 'SoFi Stadium', 'city' => 'Los Angeles', 'country' => 'USA', 'capacity' => 70000],
            'New York New Jersey Stadium' => ['officialName' => 'MetLife Stadium', 'city' => 'East Rutherford', 'country' => 'USA', 'capacity' => 78576],
            'Dallas Stadium' => ['officialName' => 'AT&T Stadium', 'city' => 'Arlington', 'country' => 'USA', 'capacity' => 92000],
            'Atlanta Stadium' => ['officialName' => 'Mercedes-Benz Stadium', 'city' => 'Atlanta', 'country' => 'USA', 'capacity' => 67382],
            'Houston Stadium' => ['officialName' => 'NRG Stadium', 'city' => 'Houston', 'country' => 'USA', 'capacity' => 68311],
            'Philadelphia Stadium' => ['officialName' => 'Lincoln Financial Field', 'city' => 'Philadelphia', 'country' => 'USA', 'capacity' => 69176],
            'Miami Stadium' => ['officialName' => 'Hard Rock Stadium', 'city' => 'Miami Gardens', 'country' => 'USA', 'capacity' => 65000],
            'Seattle Stadium' => ['officialName' => 'Lumen Field', 'city' => 'Seattle', 'country' => 'USA', 'capacity' => 69000],
            'San Francisco Bay Area Stadium' => ['officialName' => "Levi's Stadium", 'city' => 'Santa Clara', 'country' => 'USA', 'capacity' => 70909],
            'Boston Stadium' => ['officialName' => 'Gillette Stadium', 'city' => 'Foxborough', 'country' => 'USA', 'capacity' => 65878],
            'Kansas City Stadium' => ['officialName' => 'GEHA Field at Arrowhead Stadium', 'city' => 'Kansas City', 'country' => 'USA', 'capacity' => 76000],
        ];

        // Fixtures (104 Tournament Games)
        $fixtures = [
            // ============ GROUP STAGE - MATCHDAY 1 ============
            // ============ GROUP STAGE - MATCHDAY 1 ============
            ['date' => '2026-06-11', 'time' => '12:00', 'home_team' => 'Mexico', 'away_team' => 'South Africa', 'group' => 'A', 'venue' => 'Mexico City Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-11', 'time' => '18:00', 'home_team' => 'Korea Republic', 'away_team' => 'TBD (Playoff A)', 'group' => 'A', 'venue' => 'Estadio Guadalajara', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-12', 'time' => '12:00', 'home_team' => 'Canada', 'away_team' => 'TBD (Playoff B)', 'group' => 'B', 'venue' => 'Toronto Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-12', 'time' => '18:00', 'home_team' => 'USA', 'away_team' => 'Paraguay', 'group' => 'D', 'venue' => 'Los Angeles Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-13', 'time' => '10:00', 'home_team' => 'Haiti', 'away_team' => 'Scotland', 'group' => 'C', 'venue' => 'Boston Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-13', 'time' => '13:00', 'home_team' => 'Australia', 'away_team' => 'TBD (Playoff D)', 'group' => 'D', 'venue' => 'BC Place Vancouver', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-13', 'time' => '16:00', 'home_team' => 'Brazil', 'away_team' => 'Morocco', 'group' => 'C', 'venue' => 'New York New Jersey Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-13', 'time' => '19:00', 'home_team' => 'Qatar', 'away_team' => 'Switzerland', 'group' => 'B', 'venue' => 'San Francisco Bay Area Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-14', 'time' => '10:00', 'home_team' => "Côte d'Ivoire", 'away_team' => 'Ecuador', 'group' => 'E', 'venue' => 'Philadelphia Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-14', 'time' => '13:00', 'home_team' => 'Germany', 'away_team' => 'Curaçao', 'group' => 'E', 'venue' => 'Houston Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-14', 'time' => '16:00', 'home_team' => 'Netherlands', 'away_team' => 'Japan', 'group' => 'F', 'venue' => 'Dallas Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-14', 'time' => '19:00', 'home_team' => 'TBD (Playoff F)', 'away_team' => 'Tunisia', 'group' => 'F', 'venue' => 'Estadio Monterrey', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-15', 'time' => '10:00', 'home_team' => 'Saudi Arabia', 'away_team' => 'Uruguay', 'group' => 'H', 'venue' => 'Miami Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-15', 'time' => '13:00', 'home_team' => 'Spain', 'away_team' => 'Cabo Verde', 'group' => 'H', 'venue' => 'Atlanta Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-15', 'time' => '16:00', 'home_team' => 'IR Iran', 'away_team' => 'New Zealand', 'group' => 'G', 'venue' => 'Los Angeles Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-15', 'time' => '19:00', 'home_team' => 'Belgium', 'away_team' => 'Egypt', 'group' => 'G', 'venue' => 'Seattle Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-16', 'time' => '10:00', 'home_team' => 'France', 'away_team' => 'Senegal', 'group' => 'I', 'venue' => 'New York New Jersey Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-16', 'time' => '13:00', 'home_team' => 'TBD (Playoff I)', 'away_team' => 'Norway', 'group' => 'I', 'venue' => 'Boston Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-16', 'time' => '16:00', 'home_team' => 'Argentina', 'away_team' => 'Algeria', 'group' => 'J', 'venue' => 'Kansas City Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-16', 'time' => '19:00', 'home_team' => 'Austria', 'away_team' => 'Jordan', 'group' => 'J', 'venue' => 'San Francisco Bay Area Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-17', 'time' => '10:00', 'home_team' => 'Ghana', 'away_team' => 'Panama', 'group' => 'L', 'venue' => 'Toronto Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-17', 'time' => '13:00', 'home_team' => 'England', 'away_team' => 'Croatia', 'group' => 'L', 'venue' => 'Dallas Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-17', 'time' => '16:00', 'home_team' => 'Portugal', 'away_team' => 'TBD (Playoff K)', 'group' => 'K', 'venue' => 'Houston Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],
            ['date' => '2026-06-17', 'time' => '19:00', 'home_team' => 'Uzbekistan', 'away_team' => 'Colombia', 'group' => 'K', 'venue' => 'Mexico City Stadium', 'stage' => 'Group Stage', 'matchday' => 1, 'status' => 'scheduled'],

            // ============ GROUP STAGE - MATCHDAY 2 ============
            ['date' => '2026-06-18', 'time' => '10:00', 'home_team' => 'TBD (Playoff A)', 'away_team' => 'South Africa', 'group' => 'A', 'venue' => 'Atlanta Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-18', 'time' => '13:00', 'home_team' => 'Switzerland', 'away_team' => 'TBD (Playoff B)', 'group' => 'B', 'venue' => 'Los Angeles Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-18', 'time' => '16:00', 'home_team' => 'Canada', 'away_team' => 'Qatar', 'group' => 'B', 'venue' => 'BC Place Vancouver', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-18', 'time' => '19:00', 'home_team' => 'Mexico', 'away_team' => 'Korea Republic', 'group' => 'A', 'venue' => 'Estadio Guadalajara', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-19', 'time' => '10:00', 'home_team' => 'Brazil', 'away_team' => 'Haiti', 'group' => 'C', 'venue' => 'Philadelphia Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-19', 'time' => '13:00', 'home_team' => 'Scotland', 'away_team' => 'Morocco', 'group' => 'C', 'venue' => 'Boston Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-19', 'time' => '16:00', 'home_team' => 'TBD (Playoff D)', 'away_team' => 'Paraguay', 'group' => 'D', 'venue' => 'San Francisco Bay Area Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-19', 'time' => '19:00', 'home_team' => 'USA', 'away_team' => 'Australia', 'group' => 'D', 'venue' => 'Seattle Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-20', 'time' => '10:00', 'home_team' => 'Germany', 'away_team' => "Côte d'Ivoire", 'group' => 'E', 'venue' => 'Toronto Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-20', 'time' => '13:00', 'home_team' => 'Ecuador', 'away_team' => 'Curaçao', 'group' => 'E', 'venue' => 'Kansas City Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-20', 'time' => '16:00', 'home_team' => 'Netherlands', 'away_team' => 'TBD (Playoff F)', 'group' => 'F', 'venue' => 'Houston Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-20', 'time' => '19:00', 'home_team' => 'Tunisia', 'away_team' => 'Japan', 'group' => 'F', 'venue' => 'Estadio Monterrey', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-21', 'time' => '10:00', 'home_team' => 'Uruguay', 'away_team' => 'Cabo Verde', 'group' => 'H', 'venue' => 'Miami Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-21', 'time' => '13:00', 'home_team' => 'Spain', 'away_team' => 'Saudi Arabia', 'group' => 'H', 'venue' => 'Atlanta Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-21', 'time' => '16:00', 'home_team' => 'Belgium', 'away_team' => 'IR Iran', 'group' => 'G', 'venue' => 'Los Angeles Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-21', 'time' => '19:00', 'home_team' => 'New Zealand', 'away_team' => 'Egypt', 'group' => 'G', 'venue' => 'BC Place Vancouver', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-22', 'time' => '10:00', 'home_team' => 'Norway', 'away_team' => 'Senegal', 'group' => 'I', 'venue' => 'New York New Jersey Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-22', 'time' => '13:00', 'home_team' => 'France', 'away_team' => 'TBD (Playoff I)', 'group' => 'I', 'venue' => 'Philadelphia Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-22', 'time' => '16:00', 'home_team' => 'Argentina', 'away_team' => 'Austria', 'group' => 'J', 'venue' => 'Dallas Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-22', 'time' => '19:00', 'home_team' => 'Jordan', 'away_team' => 'Algeria', 'group' => 'J', 'venue' => 'San Francisco Bay Area Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-23', 'time' => '10:00', 'home_team' => 'England', 'away_team' => 'Ghana', 'group' => 'L', 'venue' => 'Boston Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-23', 'time' => '13:00', 'home_team' => 'Panama', 'away_team' => 'Croatia', 'group' => 'L', 'venue' => 'Toronto Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-23', 'time' => '16:00', 'home_team' => 'Portugal', 'away_team' => 'Uzbekistan', 'group' => 'K', 'venue' => 'Houston Stadium', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],
            ['date' => '2026-06-23', 'time' => '19:00', 'home_team' => 'Colombia', 'away_team' => 'TBD (Playoff K)', 'group' => 'K', 'venue' => 'Estadio Guadalajara', 'stage' => 'Group Stage', 'matchday' => 2, 'status' => 'scheduled'],

            // ============ GROUP STAGE - MATCHDAY 3 ============
            ['date' => '2026-06-24', 'time' => '10:00', 'home_team' => 'Scotland', 'away_team' => 'Brazil', 'group' => 'C', 'venue' => 'Miami Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-24', 'time' => '10:00', 'home_team' => 'Morocco', 'away_team' => 'Haiti', 'group' => 'C', 'venue' => 'Atlanta Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-24', 'time' => '16:00', 'home_team' => 'Switzerland', 'away_team' => 'Canada', 'group' => 'B', 'venue' => 'BC Place Vancouver', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-24', 'time' => '16:00', 'home_team' => 'TBD (Playoff B)', 'away_team' => 'Qatar', 'group' => 'B', 'venue' => 'Seattle Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-24', 'time' => '19:00', 'home_team' => 'TBD (Playoff A)', 'away_team' => 'Mexico', 'group' => 'A', 'venue' => 'Mexico City Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-24', 'time' => '19:00', 'home_team' => 'South Africa', 'away_team' => 'Korea Republic', 'group' => 'A', 'venue' => 'Estadio Monterrey', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-25', 'time' => '10:00', 'home_team' => 'Curaçao', 'away_team' => "Côte d'Ivoire", 'group' => 'E', 'venue' => 'Philadelphia Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-25', 'time' => '10:00', 'home_team' => 'Ecuador', 'away_team' => 'Germany', 'group' => 'E', 'venue' => 'New York New Jersey Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-25', 'time' => '16:00', 'home_team' => 'Japan', 'away_team' => 'TBD (Playoff F)', 'group' => 'F', 'venue' => 'Dallas Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-25', 'time' => '16:00', 'home_team' => 'Tunisia', 'away_team' => 'Netherlands', 'group' => 'F', 'venue' => 'Kansas City Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-25', 'time' => '19:00', 'home_team' => 'TBD (Playoff D)', 'away_team' => 'USA', 'group' => 'D', 'venue' => 'Los Angeles Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-25', 'time' => '19:00', 'home_team' => 'Paraguay', 'away_team' => 'Australia', 'group' => 'D', 'venue' => 'San Francisco Bay Area Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-26', 'time' => '10:00', 'home_team' => 'Norway', 'away_team' => 'France', 'group' => 'I', 'venue' => 'Boston Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-26', 'time' => '10:00', 'home_team' => 'Senegal', 'away_team' => 'TBD (Playoff I)', 'group' => 'I', 'venue' => 'Toronto Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-26', 'time' => '16:00', 'home_team' => 'Egypt', 'away_team' => 'IR Iran', 'group' => 'G', 'venue' => 'Seattle Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-26', 'time' => '16:00', 'home_team' => 'New Zealand', 'away_team' => 'Belgium', 'group' => 'G', 'venue' => 'BC Place Vancouver', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-26', 'time' => '19:00', 'home_team' => 'Cabo Verde', 'away_team' => 'Saudi Arabia', 'group' => 'H', 'venue' => 'Houston Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-26', 'time' => '19:00', 'home_team' => 'Uruguay', 'away_team' => 'Spain', 'group' => 'H', 'venue' => 'Estadio Guadalajara', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-27', 'time' => '10:00', 'home_team' => 'Panama', 'away_team' => 'England', 'group' => 'L', 'venue' => 'New York New Jersey Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-27', 'time' => '10:00', 'home_team' => 'Croatia', 'away_team' => 'Ghana', 'group' => 'L', 'venue' => 'Philadelphia Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-27', 'time' => '16:00', 'home_team' => 'Algeria', 'away_team' => 'Austria', 'group' => 'J', 'venue' => 'Kansas City Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-27', 'time' => '16:00', 'home_team' => 'Jordan', 'away_team' => 'Argentina', 'group' => 'J', 'venue' => 'Dallas Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-27', 'time' => '19:00', 'home_team' => 'Colombia', 'away_team' => 'Portugal', 'group' => 'K', 'venue' => 'Miami Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],
            ['date' => '2026-06-27', 'time' => '19:00', 'home_team' => 'TBD (Playoff K)', 'away_team' => 'Uzbekistan', 'group' => 'K', 'venue' => 'Atlanta Stadium', 'stage' => 'Group Stage', 'matchday' => 3, 'status' => 'scheduled'],

            // ============ ROUND OF 32 ============
            ['date' => '2026-06-28', 'time' => '16:00', 'home_team' => 'Runner-up Group A', 'away_team' => 'Runner-up Group B', 'group' => null, 'venue' => 'Los Angeles Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-06-29', 'time' => '10:00', 'home_team' => 'Winner Group E', 'away_team' => '3rd Place (A/B/C/D/F)', 'group' => null, 'venue' => 'Boston Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-06-29', 'time' => '13:00', 'home_team' => 'Winner Group F', 'away_team' => 'Runner-up Group C', 'group' => null, 'venue' => 'Estadio Monterrey', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-06-29', 'time' => '16:00', 'home_team' => 'Winner Group C', 'away_team' => 'Runner-up Group F', 'group' => null, 'venue' => 'Houston Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-06-30', 'time' => '10:00', 'home_team' => 'Winner Group I', 'away_team' => '3rd Place (C/D/F/G/H)', 'group' => null, 'venue' => 'New York New Jersey Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-06-30', 'time' => '13:00', 'home_team' => 'Runner-up Group E', 'away_team' => 'Runner-up Group I', 'group' => null, 'venue' => 'Dallas Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-06-30', 'time' => '16:00', 'home_team' => 'Winner Group A', 'away_team' => '3rd Place (C/E/F/H/I)', 'group' => null, 'venue' => 'Mexico City Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-01', 'time' => '10:00', 'home_team' => 'Winner Group L', 'away_team' => '3rd Place (E/H/I/J/K)', 'group' => null, 'venue' => 'Atlanta Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-01', 'time' => '13:00', 'home_team' => 'Winner Group D', 'away_team' => '3rd Place (B/E/F/I/J)', 'group' => null, 'venue' => 'San Francisco Bay Area Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-01', 'time' => '16:00', 'home_team' => 'Winner Group G', 'away_team' => '3rd Place (A/E/H/I/J)', 'group' => null, 'venue' => 'Seattle Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-02', 'time' => '10:00', 'home_team' => 'Runner-up Group K', 'away_team' => 'Runner-up Group L', 'group' => null, 'venue' => 'Toronto Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-02', 'time' => '13:00', 'home_team' => 'Winner Group H', 'away_team' => 'Runner-up Group J', 'group' => null, 'venue' => 'Los Angeles Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-02', 'time' => '16:00', 'home_team' => 'Winner Group B', 'away_team' => '3rd Place (E/F/G/I/J)', 'group' => null, 'venue' => 'BC Place Vancouver', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-03', 'time' => '10:00', 'home_team' => 'Winner Group J', 'away_team' => 'Runner-up Group H', 'group' => null, 'venue' => 'Miami Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-03', 'time' => '13:00', 'home_team' => 'Winner Group K', 'away_team' => '3rd Place (D/E/I/J/L)', 'group' => null, 'venue' => 'Kansas City Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-03', 'time' => '16:00', 'home_team' => 'Runner-up Group D', 'away_team' => 'Runner-up Group G', 'group' => null, 'venue' => 'Dallas Stadium', 'stage' => 'Round of 32', 'matchday' => null, 'status' => 'scheduled'],

            // ============ ROUND OF 16 ============
            ['date' => '2026-07-04', 'time' => '13:00', 'home_team' => 'Winner Match 74', 'away_team' => 'Winner Match 77', 'group' => null, 'venue' => 'Philadelphia Stadium', 'stage' => 'Round of 16', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-04', 'time' => '16:00', 'home_team' => 'Winner Match 73', 'away_team' => 'Winner Match 75', 'group' => null, 'venue' => 'Houston Stadium', 'stage' => 'Round of 16', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-05', 'time' => '13:00', 'home_team' => 'Winner Match 76', 'away_team' => 'Winner Match 78', 'group' => null, 'venue' => 'New York New Jersey Stadium', 'stage' => 'Round of 16', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-05', 'time' => '16:00', 'home_team' => 'Winner Match 79', 'away_team' => 'Winner Match 80', 'group' => null, 'venue' => 'Mexico City Stadium', 'stage' => 'Round of 16', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-06', 'time' => '13:00', 'home_team' => 'Winner Match 83', 'away_team' => 'Winner Match 84', 'group' => null, 'venue' => 'Dallas Stadium', 'stage' => 'Round of 16', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-06', 'time' => '16:00', 'home_team' => 'Winner Match 81', 'away_team' => 'Winner Match 82', 'group' => null, 'venue' => 'Seattle Stadium', 'stage' => 'Round of 16', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-07', 'time' => '13:00', 'home_team' => 'Winner Match 86', 'away_team' => 'Winner Match 88', 'group' => null, 'venue' => 'Atlanta Stadium', 'stage' => 'Round of 16', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-07', 'time' => '16:00', 'home_team' => 'Winner Match 85', 'away_team' => 'Winner Match 87', 'group' => null, 'venue' => 'BC Place Vancouver', 'stage' => 'Round of 16', 'matchday' => null, 'status' => 'scheduled'],

            // ============ QUARTER-FINALS ============
            ['date' => '2026-07-09', 'time' => '16:00', 'home_team' => 'Winner Match 89', 'away_team' => 'Winner Match 90', 'group' => null, 'venue' => 'Boston Stadium', 'stage' => 'Quarter-finals', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-10', 'time' => '16:00', 'home_team' => 'Winner Match 93', 'away_team' => 'Winner Match 94', 'group' => null, 'venue' => 'Los Angeles Stadium', 'stage' => 'Quarter-finals', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-11', 'time' => '13:00', 'home_team' => 'Winner Match 91', 'away_team' => 'Winner Match 92', 'group' => null, 'venue' => 'Miami Stadium', 'stage' => 'Quarter-finals', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-11', 'time' => '16:00', 'home_team' => 'Winner Match 95', 'away_team' => 'Winner Match 96', 'group' => null, 'venue' => 'Kansas City Stadium', 'stage' => 'Quarter-finals', 'matchday' => null, 'status' => 'scheduled'],

            // ============ SEMI-FINALS ============
            ['date' => '2026-07-14', 'time' => '16:00', 'home_team' => 'Winner Match 97', 'away_team' => 'Winner Match 98', 'group' => null, 'venue' => 'Dallas Stadium', 'stage' => 'Semi-finals', 'matchday' => null, 'status' => 'scheduled'],
            ['date' => '2026-07-15', 'time' => '16:00', 'home_team' => 'Winner Match 99', 'away_team' => 'Winner Match 100', 'group' => null, 'venue' => 'Atlanta Stadium', 'stage' => 'Semi-finals', 'matchday' => null, 'status' => 'scheduled'],

            // ============ BRONZE FINAL ============
            ['date' => '2026-07-18', 'time' => '16:00', 'home_team' => 'Runner-up Match 101', 'away_team' => 'Runner-up Match 102', 'group' => null, 'venue' => 'Miami Stadium', 'stage' => 'Third Place', 'matchday' => null, 'status' => 'scheduled'],

            // ============ FINAL ============
            ['date' => '2026-07-19', 'time' => '16:00', 'home_team' => 'Winner Match 101', 'away_team' => 'Winner Match 102', 'group' => null, 'venue' => 'New York New Jersey Stadium', 'stage' => 'Final', 'matchday' => null, 'status' => 'scheduled'],
        ];

        foreach ($fixtures as $fixture) {
            Fixture::firstOrCreate(
                ['home_team' => $fixture['home_team'], 'away_team' => $fixture['away_team'], 'date' => $fixture['date']],
                $fixture
            );
        }

        // Seed some Events
        Event::firstOrCreate([
            'title' => 'Opening Ceremony Fan Fest',
            'description' => 'Join us for the kickoff celebration!',
            'date' => '2026-06-11',
            'location' => 'Mexico City Central Plaza',
            'type' => 'fan_fest',
        ]);

        Event::firstOrCreate([
            'title' => 'USA Team Meet & Greet',
            'description' => 'Meet the players before the big game.',
            'date' => '2026-06-12',
            'location' => 'Los Angeles Convention Center',
            'type' => 'meetup',
        ]);

        // Seed a system message
        $admin = \App\Models\User::first();
        if ($admin) {
            \App\Models\Message::create([
                'user_id' => $admin->id,
                'sender_id' => null, // System
                'subject' => 'Welcome to TFE!',
                'body' => 'Welcome to your Tournament Fan Experience dashboard. Get ready for an amazing journey!',
                'is_read' => false,
            ]);
        }
    }
}
