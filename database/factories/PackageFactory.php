<?php

namespace Database\Factories;

use App\Models\Listing;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Package>
 */
class PackageFactory extends Factory
{
    protected $model = Listing::class;

    public function definition(): array
    {
        $tournamentIds = array_keys(config('tournaments.tournaments', []));
        $tournamentId = $this->faker->randomElement($tournamentIds ?: ['afcon_2027']);

        return [
            'tournament_id' => $tournamentId,
            'type' => 'package',
            'name' => $this->faker->words(3, true),
            'slug' => Str::slug($this->faker->words(3, true)).'-'.Str::random(6),
            'description' => $this->faker->sentence(15),
            'base_price' => $this->faker->numberBetween(500, 4500),
            'currency' => 'USD',
            'included_match_ids' => [],
            'included_venues' => [],
            'nights' => $this->faker->numberBetween(5, 14),
            'flight_class' => $this->faker->randomElement(['economy', 'business']),
            'accommodation_level' => $this->faker->randomElement(['3_star', '4_star', '5_star']),
            'capacity' => $this->faker->numberBetween(15, 80),
            'sold_count' => 0,
            'is_active' => true,
            'is_featured' => false,
            'display_order' => 0,
        ];
    }

    public function featured(): static
    {
        return $this->state(['is_featured' => true]);
    }

    public function forTournament(string $tournamentId): static
    {
        return $this->state(['tournament_id' => $tournamentId]);
    }

    public function sellingFast(): static
    {
        return $this->state(function (array $attrs) {
            $cap = $attrs['capacity'] ?? 50;

            return ['sold_count' => (int) round($cap * 0.82)];
        });
    }
}
