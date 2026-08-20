<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * CurrencyService — Real-time exchange rates via HexaRate (no auth required).
 *
 * Rates are cached for 24 hours. Falls back to config defaults if the API is unreachable.
 */
class CurrencyService
{
    private const BASE_URL = 'https://hexarate.paikama.co/api/rates';
    private const CACHE_TTL = 86400; // 24 hours

    /**
     * Get the exchange rate from one currency to another.
     */
    public function getRate(string $from, string $to): float
    {
        $from = strtoupper($from);
        $to = strtoupper($to);

        if ($from === $to) {
            return 1.0;
        }

        $cacheKey = "fx_{$from}_{$to}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($from, $to) {
            try {
                $response = Http::timeout(5)->get(self::BASE_URL . "/{$from}/{$to}/latest");

                if ($response->successful()) {
                    $data = $response->json();
                    return (float) ($data['data']['rate'] ?? $this->getFallbackRate($from, $to));
                }
            } catch (\Exception $e) {
                \Log::warning("CurrencyService: API request failed for {$from}→{$to}", [
                    'error' => $e->getMessage(),
                ]);
            }

            return $this->getFallbackRate($from, $to);
        });
    }

    /**
     * Get rates for multiple target currencies from a single base.
     */
    public function getRates(string $from, array $to): array
    {
        $results = [];
        foreach ($to as $target) {
            $results[$target] = $this->getRate($from, $target);
        }
        return $results;
    }

    /**
     * Fallback rates from config when API is unavailable.
     */
    private function getFallbackRate(string $from, string $to): float
    {
        $rates = config('budget_api.fallback_rates', []);
        return $rates["{$from}_{$to}"] ?? 1.0;
    }
}
