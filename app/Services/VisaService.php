<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * VisaService — Visa requirement checks via Orizn API.
 *
 * Results are cached indefinitely per passport+destination pair since
 * visa requirements change very rarely.
 */
class VisaService
{
    private const CACHE_TTL = 2592000; // 30 days

    private string $apiKey;

    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('budget_api.orizn.api_key', '');
        $this->baseUrl = config('budget_api.orizn.base_url', 'https://visa.orizn.app/api/v1');
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Check visa requirements for a passport holder visiting a destination.
     *
     * @param  string  $passport  ISO 3166-1 alpha-3 passport country code (e.g., 'KEN')
     * @param  string  $destination  ISO 3166-1 alpha-3 destination country code (e.g., 'TZA')
     * @return array Visa requirement data
     */
    public function checkVisa(string $passport, string $destination): array
    {
        $passport = strtoupper($passport);
        $destination = strtoupper($destination);

        $cacheKey = "visa_{$passport}_{$destination}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($passport, $destination) {
            if (! $this->isConfigured()) {
                return $this->getFallbackResult($passport, $destination);
            }

            try {
                $response = Http::withHeaders([
                    'X-API-Key' => $this->apiKey,
                ])->timeout(8)->get("{$this->baseUrl}/visa/check", [
                    'passport' => $passport,
                    'destination' => $destination,
                ]);

                if ($response->successful()) {
                    $data = $response->json();

                    return [
                        'visa_required' => $data['visa_required'] ?? $data['required'] ?? true,
                        'visa_type' => $data['visa_type'] ?? 'unknown',
                        'duration_days' => $data['max_stay'] ?? $data['duration'] ?? 90,
                        'cost_usd' => $data['cost'] ?? $data['fee'] ?? 0,
                        'processing_days' => $data['processing_time'] ?? null,
                        'e_visa' => $data['e_visa'] ?? $data['electronic'] ?? false,
                        'on_arrival' => $data['on_arrival'] ?? false,
                        'source' => 'orizn',
                    ];
                }
            } catch (\Exception $e) {
                \Log::warning('VisaService: Check failed', [
                    'error' => $e->getMessage(),
                    'passport' => $passport,
                    'destination' => $destination,
                ]);
            }

            return $this->getFallbackResult($passport, $destination);
        });
    }

    /**
     * Batch check visa requirements for multiple destinations.
     */
    public function checkMultiple(string $passport, array $destinations): array
    {
        $results = [];
        foreach ($destinations as $dest) {
            $results[$dest] = $this->checkVisa($passport, $dest);
        }

        return $results;
    }

    /**
     * Fallback when API is unavailable — use known visa-free regions.
     */
    private function getFallbackResult(string $passport, string $destination): array
    {
        // Common visa-free arrangements
        $visaFree = [
            'KEN' => ['UGA', 'TZA', 'RWA', 'BDI', 'SSD', 'SSA'], // EAC
            'TZA' => ['KEN', 'UGA', 'RWA', 'BDI', 'SSD', 'SSA'], // EAC
            'UGA' => ['KEN', 'TZA', 'RWA', 'BDI', 'SSD', 'SSA'], // EAC
            'ZAF' => ['NAM', 'BWA', 'LSO', 'SWZ', 'MOZ'], // SADC
            'NGA' => ['GHA', 'BEN', 'NER', 'CMR'], // ECOWAS
            'GBR' => ['USA', 'CAN', 'AUS', 'NZL', 'JPN', 'KOR', 'SGP'],
            'USA' => ['CAN', 'GBR', 'AUS', 'NZL', 'JPN', 'KOR', 'SGP', 'DEU', 'FRA', 'ESP'],
        ];

        $isVisaFree = isset($visaFree[$passport]) && in_array($destination, $visaFree[$passport]);

        return [
            'visa_required' => ! $isVisaFree,
            'visa_type' => $isVisaFree ? 'visa_free' : 'visa_required',
            'duration_days' => $isVisaFree ? 90 : 30,
            'cost_usd' => $isVisaFree ? 0 : 50,
            'processing_days' => null,
            'e_visa' => false,
            'on_arrival' => false,
            'source' => 'fallback',
        ];
    }
}
