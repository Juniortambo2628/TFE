<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * FlightPriceService — Flight price estimates via Amadeus Self-Service API.
 *
 * Uses OAuth 2.0 for authentication. Tokens are cached for the duration of their validity.
 * Flight offers are cached per route for 24 hours to minimize API calls.
 */
class FlightPriceService
{
    private const TOKEN_CACHE_KEY = 'amadeus_token';

    private const OFFER_CACHE_TTL = 86400; // 24 hours

    private string $clientId;

    private string $clientSecret;

    private string $baseUrl;

    public function __construct()
    {
        $this->clientId = config('budget_api.amadeus.client_id', '');
        $this->clientSecret = config('budget_api.amadeus.client_secret', '');
        $this->baseUrl = config('budget_api.amadeus.base_url', 'https://api.amadeus.com');
    }

    /**
     * Check if the service is properly configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->clientId) && ! empty($this->clientSecret);
    }

    /**
     * Get an OAuth 2.0 access token from Amadeus.
     */
    private function getToken(): ?string
    {
        if (! $this->isConfigured()) {
            return null;
        }

        return Cache::remember(self::TOKEN_CACHE_KEY, 1700, function () {
            try {
                $response = Http::asForm()->post("{$this->baseUrl}/v1/security/oauth2/token", [
                    'grant_type' => 'client_credentials',
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                ]);

                if ($response->successful()) {
                    return $response->json('access_token');
                }

                \Log::warning('FlightPriceService: Token request failed', [
                    'status' => $response->status(),
                ]);
            } catch (\Exception $e) {
                \Log::warning('FlightPriceService: Token request exception', [
                    'error' => $e->getMessage(),
                ]);
            }

            return null;
        });
    }

    /**
     * Search for flight offers between two cities.
     *
     * @param  string  $originCode  IATA code (e.g., 'NBO' for Nairobi)
     * @param  string  $destCode  IATA code (e.g., 'JFK' for New York)
     * @param  string  $departureDate  YYYY-MM-DD
     * @param  int  $adults  Number of adults
     * @param  string  $travelClass  'ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'
     * @return array|null Average price estimate or null on failure
     */
    public function searchFlights(
        string $originCode,
        string $destCode,
        string $departureDate,
        int $adults = 1,
        string $travelClass = 'ECONOMY'
    ): ?array {
        $cacheKey = "flight_{$originCode}_{$destCode}_{$departureDate}_{$adults}_{$travelClass}";

        return Cache::remember($cacheKey, self::OFFER_CACHE_TTL, function () use ($originCode, $destCode, $departureDate, $adults, $travelClass) {
            $token = $this->getToken();
            if (! $token) {
                return $this->getFallbackEstimate($originCode, $destCode, $travelClass);
            }

            try {
                $response = Http::withToken($token)
                    ->timeout(10)
                    ->get("{$this->baseUrl}/v2/shopping/flight-offers", [
                        'originLocationCode' => $originCode,
                        'destinationLocationCode' => $destCode,
                        'departureDate' => $departureDate,
                        'adults' => $adults,
                        'travelClass' => $travelClass,
                        'max' => 10,
                        'currencyCode' => 'USD',
                    ]);

                if ($response->successful()) {
                    $offers = $response->json('data', []);
                    if (empty($offers)) {
                        return $this->getFallbackEstimate($originCode, $destCode, $travelClass);
                    }

                    $prices = array_map(fn ($o) => (float) $o['price']['grandTotal'], $offers);

                    return [
                        'min' => min($prices),
                        'max' => max($prices),
                        'avg' => array_sum($prices) / count($prices),
                        'currency' => 'USD',
                        'source' => 'amadeus',
                        'offers_count' => count($offers),
                    ];
                }
            } catch (\Exception $e) {
                \Log::warning('FlightPriceService: Search failed', [
                    'error' => $e->getMessage(),
                    'route' => "{$originCode}→{$destCode}",
                ]);
            }

            return $this->getFallbackEstimate($originCode, $destCode, $travelClass);
        });
    }

    /**
     * Fallback estimate from config when API is unavailable.
     */
    private function getFallbackEstimate(string $origin, string $dest, string $travelClass): array
    {
        $fallbacks = config('budget_api.flight_estimates', []);
        $route = "{$origin}_{$dest}";
        $class = strtolower($travelClass);

        if (isset($fallbacks[$route][$class])) {
            $price = $fallbacks[$route][$class];

            return ['min' => $price * 0.8, 'max' => $price * 1.3, 'avg' => $price, 'currency' => 'USD', 'source' => 'fallback'];
        }

        // Default fallback
        $price = $class === 'business' ? 3000 : 800;

        return ['min' => $price * 0.8, 'max' => $price * 1.3, 'avg' => $price, 'currency' => 'USD', 'source' => 'default'];
    }
}
