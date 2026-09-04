<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * WeatherService — Free weather forecast via Open-Meteo (no API key).
 *
 * Two-step call:
 *   1. Resolve a city name to lat/lng via Open-Meteo's geocoding API.
 *   2. Fetch daily forecast for the resolved coordinates.
 *
 * Both hops are cached: geocoding for 30 days (place lat/lng doesn't
 * move), forecast for 3 hours (matches Open-Meteo's own update cadence).
 * A derived "packing hint" set is produced from the forecast so the UI
 * can render an at-a-glance checklist.
 */
class WeatherService
{
    protected string $geocodeUrl = 'https://geocoding-api.open-meteo.com/v1/search';

    protected string $forecastUrl = 'https://api.open-meteo.com/v1/forecast';

    protected function http(): PendingRequest
    {
        $timeout = app()->environment('local') ? 3 : 6;
        $http = Http::timeout($timeout)->withHeaders([
            'User-Agent' => 'TFE/1.0 (https://tfe.okjtech.co.ke)',
        ]);
        if (app()->environment('local')) {
            $http = $http->withoutVerifying();
        }

        return $http;
    }

    /**
     * Look up lat/lng for a city name.
     */
    public function geocode(string $city): ?array
    {
        if (empty($city)) {
            return null;
        }
        $key = 'weather:geo:'.md5(strtolower($city));

        return Cache::remember($key, 86400 * 30, function () use ($city) {
            try {
                $response = $this->http()->get($this->geocodeUrl, [
                    'name' => $city,
                    'count' => 1,
                    'language' => 'en',
                    'format' => 'json',
                ]);
                if (! $response->successful()) {
                    return null;
                }
                $first = $response->json()['results'][0] ?? null;
                if (! $first) {
                    return null;
                }

                return [
                    'lat' => $first['latitude'],
                    'lng' => $first['longitude'],
                    'name' => $first['name'],
                    'country' => $first['country'] ?? null,
                    'timezone' => $first['timezone'] ?? 'auto',
                ];
            } catch (\Throwable $e) {
                return null;
            }
        });
    }

    /**
     * Fetch daily forecast + derive packing hints for a city, optionally
     * clamped to a specific date range (Y-m-d strings).
     */
    public function forecast(string $city, ?string $startDate = null, ?string $endDate = null): array
    {
        $geo = $this->geocode($city);
        if (! $geo) {
            return ['available' => false, 'city' => $city];
        }

        $key = 'weather:forecast:'.md5($geo['lat'].'|'.$geo['lng'].'|'.($startDate ?? '').'|'.($endDate ?? ''));

        return Cache::remember($key, 10800, function () use ($geo, $startDate, $endDate) {
            try {
                $params = [
                    'latitude' => $geo['lat'],
                    'longitude' => $geo['lng'],
                    'timezone' => $geo['timezone'] ?? 'auto',
                    'daily' => 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,weathercode,wind_speed_10m_max',
                    'temperature_unit' => 'celsius',
                    'wind_speed_unit' => 'kmh',
                ];
                if ($startDate) {
                    $params['start_date'] = $startDate;
                }
                if ($endDate) {
                    $params['end_date'] = $endDate;
                }
                $response = $this->http()->get($this->forecastUrl, $params);
                if (! $response->successful()) {
                    return ['available' => false, 'city' => $geo['name']];
                }
                $data = $response->json();
                $daily = $data['daily'] ?? [];
                $days = [];
                $times = $daily['time'] ?? [];
                foreach ($times as $i => $date) {
                    $days[] = [
                        'date' => $date,
                        'temp_max' => $daily['temperature_2m_max'][$i] ?? null,
                        'temp_min' => $daily['temperature_2m_min'][$i] ?? null,
                        'precip_pct' => $daily['precipitation_probability_max'][$i] ?? null,
                        'uv_max' => $daily['uv_index_max'][$i] ?? null,
                        'wind_max' => $daily['wind_speed_10m_max'][$i] ?? null,
                        'code' => $daily['weathercode'][$i] ?? null,
                        'summary' => self::codeToSummary($daily['weathercode'][$i] ?? null),
                    ];
                }

                return [
                    'available' => true,
                    'city' => $geo['name'],
                    'country' => $geo['country'],
                    'lat' => $geo['lat'],
                    'lng' => $geo['lng'],
                    'days' => $days,
                    'packing' => self::derivePacking($days),
                    'source' => 'open-meteo',
                ];
            } catch (\Throwable $e) {
                return ['available' => false, 'city' => $geo['name']];
            }
        });
    }

    /**
     * Rules-based packing checklist derived from the daily forecast.
     * Kept public so tests can lock the logic in.
     */
    public static function derivePacking(array $days): array
    {
        if (empty($days)) {
            return [];
        }
        $maxTemp = max(array_filter(array_column($days, 'temp_max'), fn ($v) => $v !== null) ?: [0]);
        $minTemp = min(array_filter(array_column($days, 'temp_min'), fn ($v) => $v !== null) ?: [0]);
        $maxRain = max(array_filter(array_column($days, 'precip_pct'), fn ($v) => $v !== null) ?: [0]);
        $maxUv = max(array_filter(array_column($days, 'uv_max'), fn ($v) => $v !== null) ?: [0]);
        $maxWind = max(array_filter(array_column($days, 'wind_max'), fn ($v) => $v !== null) ?: [0]);

        $items = [];
        if ($maxTemp >= 28) {
            $items[] = ['icon' => 'sun', 'label' => 'Lightweight breathable clothing', 'reason' => 'Highs '.round($maxTemp).'°C+'];
        }
        if ($minTemp <= 15) {
            $items[] = ['icon' => 'jacket', 'label' => 'A warm layer or light jacket', 'reason' => 'Lows near '.round($minTemp).'°C'];
        }
        if (($maxTemp - $minTemp) >= 12) {
            $items[] = ['icon' => 'layers', 'label' => 'Pack in layers', 'reason' => round($maxTemp - $minTemp).'°C daily swing'];
        }
        if ($maxRain >= 40) {
            $items[] = ['icon' => 'umbrella', 'label' => 'Rain jacket or compact umbrella', 'reason' => round($maxRain).'% rain probability'];
        }
        if ($maxUv >= 6) {
            $items[] = ['icon' => 'sunscreen', 'label' => 'SPF 30+ sunscreen and hat', 'reason' => 'UV index '.round($maxUv)];
        }
        if ($maxWind >= 30) {
            $items[] = ['icon' => 'wind', 'label' => 'Wind-resistant outer layer', 'reason' => 'Gusts to '.round($maxWind).' km/h'];
        }
        // Always-on staples fans forget.
        $items[] = ['icon' => 'shoes', 'label' => 'Broken-in walking shoes', 'reason' => 'Long days on foot'];
        $items[] = ['icon' => 'passport', 'label' => 'Passport + ticket printouts', 'reason' => 'Backup for phone battery'];

        return $items;
    }

    /**
     * Map an Open-Meteo WMO weather code to a plain-English summary.
     * Covers the common bands; unknown codes fall back to "Variable".
     */
    public static function codeToSummary(?int $code): string
    {
        if ($code === null) {
            return 'Unknown';
        }
        return match (true) {
            $code === 0 => 'Clear',
            in_array($code, [1, 2, 3]) => 'Partly cloudy',
            in_array($code, [45, 48]) => 'Fog',
            in_array($code, [51, 53, 55, 56, 57]) => 'Drizzle',
            in_array($code, [61, 63, 65, 66, 67, 80, 81, 82]) => 'Rain',
            in_array($code, [71, 73, 75, 77, 85, 86]) => 'Snow',
            in_array($code, [95, 96, 99]) => 'Thunderstorm',
            default => 'Variable',
        };
    }
}
