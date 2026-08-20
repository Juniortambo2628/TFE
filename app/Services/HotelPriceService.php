<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * HotelPriceService — Hotel price estimates via Amadeus Self-Service API.
 *
 * Shares OAuth token with FlightPriceService via the same token cache key.
 * Hotel offers are cached per city+date for 24 hours.
 */
class HotelPriceService
{
    private const OFFER_CACHE_TTL = 86400;

    private string $clientId;

    private string $clientSecret;

    private string $baseUrl;

    public function __construct()
    {
        $this->clientId = config('services.amadeus.client_id', '');
        $this->clientSecret = config('services.amadeus.client_secret', '');
        $this->baseUrl = config('services.amadeus.base_url', 'https://api.amadeus.com');
    }

    public function isConfigured(): bool
    {
        return ! empty($this->clientId) && ! empty($this->clientSecret);
    }

    private function getToken(): ?string
    {
        // Reuse the same token cache as FlightPriceService
        $cached = cache()->get('amadeus_token');
        if ($cached) {
            return $cached;
        }

        if (! $this->isConfigured()) {
            return null;
        }

        try {
            $response = Http::asForm()->post("{$this->baseUrl}/v1/security/oauth2/token", [
                'grant_type' => 'client_credentials',
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
            ]);

            if ($response->successful()) {
                $token = $response->json('access_token');
                cache()->put('amadeus_token', $token, 1700);

                return $token;
            }
        } catch (\Exception $e) {
            \Log::warning('HotelPriceService: Token request failed', ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Search for hotel offers by city.
     *
     * @param  string  $cityCode  IATA city code (e.g., 'NBO' for Nairobi)
     * @param  string  $checkIn  YYYY-MM-DD
     * @param  string  $checkOut  YYYY-MM-DD
     * @return array|null Price range or null on failure
     */
    public function searchHotels(
        string $cityCode,
        string $checkIn,
        string $checkOut,
        int $adults = 1
    ): ?array {
        $cacheKey = "hotel_{$cityCode}_{$checkIn}_{$checkOut}_{$adults}";

        return Cache::remember($cacheKey, self::OFFER_CACHE_TTL, function () use ($cityCode, $checkIn, $checkOut, $adults) {
            $token = $this->getToken();
            if (! $token) {
                return $this->getFallbackEstimate($cityCode);
            }

            try {
                // First get hotel list by city
                $hotelResponse = Http::withToken($token)
                    ->timeout(10)
                    ->get("{$this->baseUrl}/v1/reference-data/locations/hotels/by-city", [
                        'cityCode' => $cityCode,
                        'radius' => 20,
                        'radiusUnit' => 'KM',
                        'hotelSource' => 'ALL',
                    ]);

                if (! $hotelResponse->successful()) {
                    return $this->getFallbackEstimate($cityCode);
                }

                $hotels = array_slice($hotelResponse->json('data', []), 0, 20);
                $hotelIds = array_map(fn ($h) => $h['hotelId'], $hotels);

                if (empty($hotelIds)) {
                    return $this->getFallbackEstimate($cityCode);
                }

                // Get offers for top hotels
                $offerResponse = Http::withToken($token)
                    ->timeout(10)
                    ->post("{$this->baseUrl}/v3/shopping/hotel-offers", [
                        'data' => [
                            'type' => 'hotel-offers-request',
                            'body' => [
                                'data' => [
                                    'type' => 'hotel-offers-request',
                                    'hotelIds' => array_slice($hotelIds, 0, 10),
                                    'checkInDate' => $checkIn,
                                    'checkOutDate' => $checkOut,
                                    'adults' => $adults,
                                    'currency' => 'USD',
                                ],
                            ],
                        ],
                    ]);

                if ($offerResponse->successful()) {
                    $offers = $offerResponse->json('data', []);
                    $prices = [];
                    foreach ($offers as $offer) {
                        foreach ($offer['offers'] ?? [] as $room) {
                            $prices[] = (float) ($room['price']['total'] ?? 0);
                        }
                    }

                    if (! empty($prices)) {
                        $nights = max(1, (strtotime($checkOut) - strtotime($checkIn)) / 86400);
                        $perNight = array_map(fn ($p) => $p / $nights, $prices);

                        return [
                            'min' => min($perNight),
                            'max' => max($perNight),
                            'avg' => array_sum($perNight) / count($perNight),
                            'currency' => 'USD',
                            'source' => 'amadeus',
                        ];
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('HotelPriceService: Search failed', [
                    'error' => $e->getMessage(),
                    'city' => $cityCode,
                ]);
            }

            return $this->getFallbackEstimate($cityCode);
        });
    }

    private function getFallbackEstimate(string $cityCode): array
    {
        $fallbacks = config('budget_api.hotel_estimates', []);
        if (isset($fallbacks[$cityCode])) {
            $data = $fallbacks[$cityCode];

            return [
                'min' => $data['budget'] ?? 30,
                'avg' => $data['mid'] ?? 70,
                'max' => $data['luxury'] ?? 150,
                'currency' => 'USD',
                'source' => 'fallback',
            ];
        }

        return ['min' => 30, 'avg' => 70, 'max' => 150, 'currency' => 'USD', 'source' => 'default'];
    }
}
