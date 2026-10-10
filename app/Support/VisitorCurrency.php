<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * A visitor's likely display currency (Sprint 66), so the planner opens in
 * KES for someone in Nairobi rather than making them change it.
 *
 * Read from the CDN's country header when present (Cloudflare's
 * CF-IPCountry), else from the browser's Accept-Language region ("en-KE").
 * Only a DEFAULT: the visitor can always change it, and a saved choice wins.
 * No IP lookup service is called and nothing is stored.
 */
class VisitorCurrency
{
    /** Country → one of the calculator's supported currencies. */
    public const BY_COUNTRY = [
        'KE' => 'KES', 'NG' => 'NGN', 'ZA' => 'ZAR', 'GB' => 'GBP',
        'SN' => 'XOF', 'CI' => 'XOF', 'ML' => 'XOF', 'BF' => 'XOF', 'BJ' => 'XOF', 'TG' => 'XOF', 'NE' => 'XOF', 'GW' => 'XOF',
        'DE' => 'EUR', 'FR' => 'EUR', 'ES' => 'EUR', 'IT' => 'EUR', 'NL' => 'EUR', 'BE' => 'EUR', 'PT' => 'EUR',
        'IE' => 'EUR', 'AT' => 'EUR', 'FI' => 'EUR', 'GR' => 'EUR',
    ];

    public static function guess(Request $request): string
    {
        return self::BY_COUNTRY[self::country($request) ?? ''] ?? 'USD';
    }

    public static function country(Request $request): ?string
    {
        $cdn = strtoupper((string) $request->header('CF-IPCountry', ''));
        if (preg_match('/^[A-Z]{2}$/', $cdn) && $cdn !== 'XX') {
            return $cdn;
        }

        // First Accept-Language tag carrying a region, e.g. "sw-KE" or "en_NG".
        foreach (explode(',', (string) $request->header('Accept-Language', '')) as $tag) {
            if (preg_match('/^[a-z]{2,3}[-_]([A-Za-z]{2})\b/', trim($tag), $m)) {
                return strtoupper($m[1]);
            }
        }

        return null;
    }
}
