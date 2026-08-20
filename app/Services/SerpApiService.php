<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * SerpApiService — Google Flights and Hotels search via SerpAPI.
 *
 * Scrapes live pricing data from Google Flights and Google Hotels.
 * Results are cached per query for 1 hour to conserve free-tier quota.
 */
class SerpApiService
{
    private const SEARCH_CACHE_TTL = 3600; // 1 hour

    private string $apiKey;

    private string $baseUrl = 'https://serpapi.com/search.json';

    public function __construct()
    {
        $this->apiKey = config('budget_api.serpapi.api_key', '');
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Search Google Flights for options between two airports.
     *
     * @param  array  $params  departure_id, arrival_id, outbound_date, return_date, adults, travel_class, stops, etc.
     * @return array Normalized flight results with price_insights
     */
    public function searchFlights(array $params): array
    {
        if (! $this->isConfigured()) {
            return ['error' => 'SerpAPI key not configured', 'flights' => [], 'source' => 'unavailable'];
        }

        $cacheKey = 'serpapi_flights_'.md5(json_encode($params));

        return Cache::remember($cacheKey, self::SEARCH_CACHE_TTL, function () use ($params) {
            try {
                $queryParams = [
                    'engine' => 'google_flights',
                    'api_key' => $this->apiKey,
                    'departure_id' => $params['departure_id'] ?? '',
                    'arrival_id' => $params['arrival_id'] ?? '',
                    'outbound_date' => $params['outbound_date'] ?? '',
                    'type' => $params['type'] ?? '2', // one-way default
                    'adults' => $params['adults'] ?? 1,
                    'travel_class' => $params['travel_class'] ?? '1',
                    'sort_by' => $params['sort_by'] ?? '2', // sort by price
                    'currency' => $params['currency'] ?? 'USD',
                    'gl' => $params['gl'] ?? 'us',
                    'hl' => $params['hl'] ?? 'en',
                ];

                if (! empty($params['return_date'])) {
                    $queryParams['return_date'] = $params['return_date'];
                    $queryParams['type'] = '1'; // round trip
                }

                if (! empty($params['stops'])) {
                    $queryParams['stops'] = $params['stops'];
                }

                if (! empty($params['max_price'])) {
                    $queryParams['max_price'] = $params['max_price'];
                }

                $response = Http::timeout(15)->get($this->baseUrl, $queryParams);

                if (! $response->successful()) {
                    return ['error' => 'SerpAPI request failed', 'status' => $response->status(), 'flights' => [], 'source' => 'api_error'];
                }

                $data = $response->json();

                $flights = $this->normalizeFlights($data);

                return [
                    'flights' => $flights,
                    'price_insights' => $data['price_insights'] ?? null,
                    'source' => 'serpapi',
                ];
            } catch (\Exception $e) {
                \Log::warning('SerpApiService: Flight search failed', ['error' => $e->getMessage()]);

                return ['error' => 'Search failed', 'flights' => [], 'source' => 'exception'];
            }
        });
    }

    /**
     * Search Google Hotels for options near a destination.
     *
     * @param  array  $params  q, check_in_date, check_out_date, adults, sort_by, etc.
     * @return array Normalized hotel results
     */
    public function searchHotels(array $params): array
    {
        if (! $this->isConfigured()) {
            return ['error' => 'SerpAPI key not configured', 'hotels' => [], 'source' => 'unavailable'];
        }

        $cacheKey = 'serpapi_hotels_'.md5(json_encode($params));

        return Cache::remember($cacheKey, self::SEARCH_CACHE_TTL, function () use ($params) {
            try {
                $queryParams = [
                    'engine' => 'google_hotels',
                    'api_key' => $this->apiKey,
                    'q' => $params['q'] ?? '',
                    'check_in_date' => $params['check_in_date'] ?? '',
                    'check_out_date' => $params['check_out_date'] ?? '',
                    'adults' => $params['adults'] ?? 2,
                    'currency' => $params['currency'] ?? 'USD',
                    'hl' => $params['hl'] ?? 'en',
                    'gl' => $params['gl'] ?? 'us',
                    'sort_by' => $params['sort_by'] ?? '3', // lowest price
                ];

                if (! empty($params['min_price'])) {
                    $queryParams['min_price'] = $params['min_price'];
                }

                if (! empty($params['max_price'])) {
                    $queryParams['max_price'] = $params['max_price'];
                }

                if (! empty($params['hotel_class'])) {
                    $queryParams['hotel_class'] = $params['hotel_class'];
                }

                $response = Http::timeout(15)->get($this->baseUrl, $queryParams);

                if (! $response->successful()) {
                    return ['error' => 'SerpAPI request failed', 'status' => $response->status(), 'hotels' => [], 'source' => 'api_error'];
                }

                $data = $response->json();

                $hotels = $this->normalizeHotels($data);

                return [
                    'hotels' => $hotels,
                    'total_results' => $data['search_information']['total_results'] ?? 0,
                    'source' => 'serpapi',
                ];
            } catch (\Exception $e) {
                \Log::warning('SerpApiService: Hotel search failed', ['error' => $e->getMessage()]);

                return ['error' => 'Search failed', 'hotels' => [], 'source' => 'exception'];
            }
        });
    }

    /**
     * Normalize flight results from SerpAPI response into a clean format.
     */
    private function normalizeFlights(array $data): array
    {
        $flights = [];

        foreach (($data['best_flights'] ?? []) as $flight) {
            $flights[] = $this->parseFlight($flight, true);
        }

        foreach (($data['other_flights'] ?? []) as $flight) {
            $flights[] = $this->parseFlight($flight, false);
        }

        return $flights;
    }

    /**
     * Parse a single flight result into a normalized structure.
     */
    private function parseFlight(array $flight, bool $isBest): array
    {
        $segments = [];
        foreach ($flight['flights'] ?? [] as $segment) {
            $segments[] = [
                'airline' => $segment['airline'] ?? '',
                'airline_logo' => $segment['airline_logo'] ?? '',
                'flight_number' => $segment['flight_number'] ?? '',
                'departure_airport' => $segment['departure_airport']['id'] ?? '',
                'departure_time' => $segment['departure_airport']['time'] ?? '',
                'arrival_airport' => $segment['arrival_airport']['id'] ?? '',
                'arrival_time' => $segment['arrival_airport']['time'] ?? '',
                'duration' => $segment['duration'] ?? 0,
                'airplane' => $segment['airplane'] ?? '',
                'travel_class' => $segment['travel_class'] ?? 'Economy',
                'legroom' => $segment['legroom'] ?? '',
                'extensions' => $segment['extensions'] ?? [],
            ];
        }

        $layovers = [];
        foreach ($flight['layovers'] ?? [] as $layover) {
            $layovers[] = [
                'airport' => $layover['id'] ?? '',
                'name' => $layover['name'] ?? '',
                'duration' => $layover['duration'] ?? 0,
                'overnight' => $layover['overnight'] ?? false,
            ];
        }

        $emissions = null;
        if (! empty($flight['carbon_emissions'])) {
            $emissions = [
                'this_flight' => $flight['carbon_emissions']['this_flight'] ?? 0,
                'typical' => $flight['carbon_emissions']['typical_for_this_route'] ?? 0,
                'difference_percent' => $flight['carbon_emissions']['difference_percent'] ?? 0,
            ];
        }

        return [
            'id' => md5(json_encode($segments).($flight['price'] ?? 0)),
            'price_usd' => $flight['price'] ?? 0,
            'total_duration_minutes' => $flight['total_duration'] ?? 0,
            'segments' => $segments,
            'layovers' => $layovers,
            'stops' => count($flight['layovers'] ?? []),
            'extensions' => $flight['extensions'] ?? [],
            'carbon_emissions' => $emissions,
            'is_best' => $isBest,
            'airline_logo' => $flight['airline_logo'] ?? ($segments[0]['airline_logo'] ?? ''),
        ];
    }

    /**
     * Normalize hotel results from SerpAPI response into a clean format.
     */
    private function normalizeHotels(array $data): array
    {
        $hotels = [];

        foreach (($data['properties'] ?? []) as $property) {
            $prices = [];
            foreach ($property['prices'] ?? [] as $price) {
                $prices[] = [
                    'source' => $price['source'] ?? '',
                    'price_per_night' => $price['rate_per_night']['extracted_lowest'] ?? 0,
                    'total_price' => $price['total_rate']['extracted_lowest'] ?? 0,
                    'free_cancellation' => $price['free_cancellation'] ?? false,
                    'cancellation_until' => $price['free_cancellation_until_date'] ?? '',
                ];
            }

            $nearby = [];
            foreach ($property['nearby_places'] ?? [] as $place) {
                $nearby[] = [
                    'name' => $place['name'] ?? '',
                    'transport' => $place['transportations'][0]['duration'] ?? '',
                ];
            }

            $images = [];
            foreach ($property['images'] ?? [] as $img) {
                $images[] = $img['thumbnail'] ?? $img['original_image'] ?? '';
            }

            $hotels[] = [
                'id' => $property['property_token'] ?? md5($property['name'] ?? ''),
                'name' => $property['name'] ?? '',
                'type' => $property['type'] ?? 'hotel',
                'rating' => $property['overall_rating'] ?? 0,
                'reviews' => $property['reviews'] ?? 0,
                'price_per_night_usd' => $property['rate_per_night']['extracted_lowest'] ?? 0,
                'total_price_usd' => $property['total_rate']['extracted_lowest'] ?? 0,
                'check_in_time' => $property['check_in_time'] ?? '',
                'check_out_time' => $property['check_out_time'] ?? '',
                'amenities' => $property['amenities'] ?? [],
                'essential_info' => $property['essential_info'] ?? [],
                'prices' => $prices,
                'nearby_places' => $nearby,
                'images' => array_slice($images, 0, 3),
                'gps' => $property['gps_coordinates'] ?? null,
                'free_cancellation' => ! empty($prices) && $prices[0]['free_cancellation'] ?? false,
            ];
        }

        return $hotels;
    }
}
