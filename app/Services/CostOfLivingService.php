<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

/**
 * CostOfLivingService — Local cost-of-living data for tournament host cities.
 *
 * Data is pre-seeded from the ReloMap open dataset and stored as a JSON seed file.
 * No API calls needed — all queries are local.
 */
class CostOfLivingService
{
    private ?array $data = null;

    /**
     * Load the seed data from JSON file.
     */
    private function load(): array
    {
        if ($this->data !== null) {
            return $this->data;
        }

        $path = database_path('seeders/data/cost_of_living.json');
        if (File::exists($path)) {
            $this->data = json_decode(File::get($path), true) ?? [];
        } else {
            $this->data = [];
        }

        return $this->data;
    }

    /**
     * Get cost-of-living data for a city.
     * Returns null if city not found.
     */
    public function getCity(string $city): ?array
    {
        $data = $this->load();
        $key = strtolower($city);

        return $data[$key] ?? null;
    }

    /**
     * Get the cost-of-living index for a city (relative to NYC = 100).
     * Returns a default if city not found.
     */
    public function getIndex(string $city): float
    {
        $cityData = $this->getCity($city);

        return $cityData['cost_index'] ?? 50.0;
    }

    /**
     * Get daily expense breakdown for a city.
     */
    public function getDailyExpenses(string $city): array
    {
        $cityData = $this->getCity($city);
        if (! $cityData) {
            return ['food' => 30, 'transport' => 15, 'misc' => 10, 'total' => 55];
        }

        return [
            'food' => $cityData['meal_cost'] ?? 30,
            'transport' => $cityData['transport_cost'] ?? 15,
            'misc' => $cityData['misc_cost'] ?? 10,
            'total' => ($cityData['meal_cost'] ?? 30) + ($cityData['transport_cost'] ?? 15) + ($cityData['misc_cost'] ?? 10),
        ];
    }

    /**
     * Get hotel price range for a city.
     */
    public function getHotelPrices(string $city): array
    {
        $cityData = $this->getCity($city);
        if (! $cityData) {
            return ['budget' => 30, 'mid_range' => 70, 'luxury' => 150];
        }

        return [
            'budget' => $cityData['hotel_budget'] ?? 30,
            'mid_range' => $cityData['hotel_mid'] ?? 70,
            'luxury' => $cityData['hotel_luxury'] ?? 150,
        ];
    }

    /**
     * Get purchasing power index for a city.
     */
    public function getPurchasingPower(string $city): float
    {
        $cityData = $this->getCity($city);

        return $cityData['purchasing_power'] ?? 40.0;
    }

    /**
     * Get all available cities.
     */
    public function getAllCities(): array
    {
        $data = $this->load();

        return array_keys($data);
    }
}
