<?php

namespace App\Services;

/**
 * TournamentBudgetService — Orchestrates all pricing services to produce
 * a comprehensive, real-time budget estimate for a tournament trip.
 *
 * This is the single entry point the controller uses. It combines:
 * - FlightPriceService (Amadeus)
 * - HotelPriceService (Amadeus)
 * - CostOfLivingService (local)
 * - CurrencyService (HexaRate)
 * - VisaService (Orizn)
 * - Static pricing from tournament config
 */
class TournamentBudgetService
{
    private const ESTIMATE_CACHE_TTL = 3600; // 1 hour for full estimates

    public function __construct(
        private FlightPriceService $flights,
        private HotelPriceService $hotels,
        private CostOfLivingService $costOfLiving,
        private CurrencyService $currency,
        private VisaService $visa,
    ) {}

    /**
     * Generate a comprehensive budget estimate.
     *
     * @param  array  $params  Estimate parameters
     * @return array Full estimate with breakdown
     */
    public function estimate(array $params): array
    {
        $tournamentId = $params['tournament_id'] ?? config('tournaments.default');
        $pricing = config("tournaments.tournaments.{$tournamentId}.pricing", []);
        $hosts = config("tournaments.tournaments.{$tournamentId}.hosts", []);

        // Extract params
        $originCode = $params['origin_code'] ?? 'NBO';
        $destCity = $params['destination_city'] ?? ($hosts[0] ?? 'Nairobi');
        $destCode = $params['destination_code'] ?? $this->getIataCode($destCity);
        $departureDate = $params['departure_date'] ?? now()->addMonths(3)->format('Y-m-d');
        $returnDate = $params['return_date'] ?? now()->addMonths(3)->addDays($params['nights'] ?? 7)->format('Y-m-d');
        $nights = max(1, $params['nights'] ?? 7);
        $travelClass = strtoupper($params['flight_class'] ?? 'economy');
        $spendingTier = $params['spending_tier'] ?? 'mid_range';
        $groupSize = max(1, $params['group_size'] ?? 1);
        $matchCount = max(0, $params['match_count'] ?? 3);
        $knockoutPct = $params['knockout_pct'] ?? 30;
        $passportCountry = strtoupper($params['passport_country'] ?? 'KEN');
        $includeInsurance = $params['include_insurance'] ?? true;
        $includeVisa = $params['include_visa'] ?? true;
        $includeMerch = $params['include_merchandise'] ?? true;

        $tierMultiplier = ($pricing['spending_tiers'][$spendingTier] ?? 1.0);
        $exchangeRate = $pricing['exchange_rate'] ?? 130;

        // 1. Flight prices (per person)
        $flightEstimate = $this->flights->searchFlights($originCode, $destCode, $departureDate, 1, $travelClass);
        $flightPerPerson = $flightEstimate['avg'] ?? ($pricing['flight_origins'][0][$travelClass === 'BUSINESS' ? 'business' : 'economy'] ?? 800);

        // 2. Hotel prices (per night, per room — shared across group)
        $hotelEstimate = $this->hotels->searchHotels($destCode, $departureDate, $returnDate, 1);
        $hotelFallback = $this->getHotelFromPricing($pricing, $spendingTier);
        $hotelPerNight = $hotelEstimate['avg'] ?? $hotelFallback;
        $sharedRooms = max(1, ceil($groupSize / 2));
        $hotelPerPerson = ($hotelPerNight * $nights) / $sharedRooms;

        // 3. Cost of living — daily expenses
        $colData = $this->costOfLiving->getDailyExpenses($destCity);
        $dailyExpensesPerPerson = ($colData['total'] * $tierMultiplier);

        // If cost of living service has no data, use pricing config
        if ($colData['total'] === 55) {
            $baseCosts = $pricing['daily_costs'] ?? ['food' => 30, 'transport' => 15, 'misc' => 10];
            $dailyExpensesPerPerson = (($baseCosts['food'] + $baseCosts['transport'] + $baseCosts['misc']) * $tierMultiplier);
        }

        $foodPerPerson = $dailyExpensesPerPerson * ($colData['food'] / max(1, $colData['total'])) * $nights;
        $transportPerPerson = $dailyExpensesPerPerson * ($colData['transport'] / max(1, $colData['total'])) * $nights;
        $miscPerPerson = $dailyExpensesPerPerson * ($colData['misc'] / max(1, $colData['total'])) * $nights;

        // 4. Tickets
        $ticketPrices = $pricing['ticket_prices'] ?? ['Group Stage' => 100, 'Quarter-finals' => 200, 'Final' => 500];
        $surgeRates = $pricing['surge_rates'] ?? ['Group Stage' => 1.0, 'Final' => 2.0];
        $groupMatches = round($matchCount * (1 - $knockoutPct / 100));
        $knockoutMatches = $matchCount - $groupMatches;
        $avgTicket = ($groupMatches * ($ticketPrices['Group Stage'] ?? 100) + $knockoutMatches * ($ticketPrices['Quarter-finals'] ?? 200)) / max(1, $matchCount);
        $totalTicketsPerPerson = $avgTicket * $matchCount;
        $maxSurge = $knockoutPct > 50 ? ($surgeRates['Semi-finals'] ?? 1.4) : ($surgeRates['Quarter-finals'] ?? 1.15);

        // 5. Insurance
        $insurancePerPerson = $includeInsurance ? ($pricing['insurance_daily'] ?? 5) * $nights : 0;

        // 6. Visa (one-time, not per person)
        $visaCost = 0;
        if ($includeVisa && ! empty($hosts)) {
            $visaResult = $this->visa->checkVisa($passportCountry, $this->getCountryCode($hosts[0]));
            $visaCost = $visaResult['cost_usd'] ?? 0;
        }

        // 7. Merchandise
        $merchPerPerson = $includeMerch ? ($pricing['merchandise_per_match'] ?? 25) * $matchCount : 0;

        // Totals (per person)
        $perPersonUSD = $flightPerPerson + $hotelPerPerson + $foodPerPerson + $transportPerPerson
            + $miscPerPerson + $totalTicketsPerPerson + $insurancePerPerson + $merchPerPerson;

        // Total for group
        $totalGroupUSD = ($perPersonUSD * $groupSize) + $visaCost;
        $totalKES = $totalGroupUSD * $exchangeRate;

        return [
            'summary' => [
                'total_usd' => round($totalGroupUSD, 2),
                'total_kes' => round($totalKES, 2),
                'per_person_usd' => round($perPersonUSD, 2),
                'group_size' => $groupSize,
                'nights' => $nights,
                'matches' => $matchCount,
                'exchange_rate' => $exchangeRate,
            ],
            'breakdown' => [
                'flights' => ['usd' => round($flightPerPerson * $groupSize, 2), 'kes' => round($flightPerPerson * $groupSize * $exchangeRate, 2), 'per_person' => round($flightPerPerson, 2)],
                'accommodation' => ['usd' => round($hotelPerPerson * $groupSize, 2), 'kes' => round($hotelPerPerson * $groupSize * $exchangeRate, 2), 'per_person' => round($hotelPerPerson, 2)],
                'match_tickets' => ['usd' => round($totalTicketsPerPerson * $groupSize, 2), 'kes' => round($totalTicketsPerPerson * $groupSize * $exchangeRate, 2), 'per_person' => round($totalTicketsPerPerson, 2)],
                'food_and_drink' => ['usd' => round($foodPerPerson * $groupSize, 2), 'kes' => round($foodPerPerson * $groupSize * $exchangeRate, 2), 'per_person' => round($foodPerPerson, 2)],
                'local_transport' => ['usd' => round($transportPerPerson * $groupSize, 2), 'kes' => round($transportPerPerson * $groupSize * $exchangeRate, 2), 'per_person' => round($transportPerPerson, 2)],
                'insurance' => ['usd' => round($insurancePerPerson * $groupSize, 2), 'kes' => round($insurancePerPerson * $groupSize * $exchangeRate, 2), 'per_person' => round($insurancePerPerson, 2)],
                'visa' => ['usd' => round($visaCost, 2), 'kes' => round($visaCost * $exchangeRate, 2), 'per_person' => round($visaCost / max(1, $groupSize), 2)],
                'merchandise' => ['usd' => round($merchPerPerson * $groupSize, 2), 'kes' => round($merchPerPerson * $groupSize * $exchangeRate, 2), 'per_person' => round($merchPerPerson, 2)],
                'miscellaneous' => ['usd' => round($miscPerPerson * $groupSize, 2), 'kes' => round($miscPerPerson * $groupSize * $exchangeRate, 2), 'per_person' => round($miscPerPerson, 2)],
            ],
            'sources' => [
                'flights' => $flightEstimate['source'] ?? 'config',
                'hotels' => $hotelEstimate['source'] ?? 'config',
                'cost_of_living' => $this->costOfLiving->getCity($destCity) ? 'relomap' : 'config',
                'visa' => $visaResult['source'] ?? 'config',
                'currency' => 'hexarate',
            ],
        ];
    }

    /**
     * Get hotel estimate from pricing config based on spending tier.
     */
    private function getHotelFromPricing(array $pricing, string $tier): float
    {
        $venueTiers = $pricing['venue_tiers'] ?? [];
        if (empty($venueTiers)) {
            return $tier === 'budget' ? 30 : ($tier === 'luxury' ? 150 : 70);
        }

        $avgHotel = array_sum(array_column($venueTiers, 'hotel_3star')) / count($venueTiers);
        $tierFactors = $pricing['accommodation'] ?? ['hostel' => 0.4, '3_star' => 1.0, '5_star' => 2.5];
        $factor = $tier === 'budget' ? ($tierFactors['hostel'] ?? 0.4) : ($tier === 'luxury' ? ($tierFactors['5_star'] ?? 2.5) : 1.0);

        return $avgHotel * $factor;
    }

    /**
     * Map common city names to IATA codes.
     */
    private function getIataCode(string $city): string
    {
        $map = [
            'Nairobi' => 'NBO', 'Dar es Salaam' => 'DAR', 'Kampala' => 'EBB',
            'Mombasa' => 'MBA', 'Arusha' => 'ARK',
            'Mexico City' => 'MEX', 'New York' => 'JFK', 'Los Angeles' => 'LAX',
            'Toronto' => 'YYZ', 'Vancouver' => 'YVR', 'Miami' => 'MIA',
            'Dallas' => 'DFW', 'Houston' => 'IAH', 'Atlanta' => 'ATL',
            'Seattle' => 'SEA', 'San Francisco' => 'SFO', 'Boston' => 'BOS',
            'Guadalajara' => 'GDL', 'Monterrey' => 'MTY',
            'Berlin' => 'BER', 'Munich' => 'MUC', 'Dortmund' => 'DTM',
            'Hamburg' => 'HAM', 'Stuttgart' => 'STR', 'Frankfurt' => 'FRA',
            'Cologne' => 'CGN', 'Leipzig' => 'LEJ',
        ];

        return $map[$city] ?? strtoupper(substr($city, 0, 3));
    }

    /**
     * Map country names to ISO 3166-1 alpha-3 codes for visa checks.
     */
    private function getCountryCode(string $country): string
    {
        $map = [
            'Kenya' => 'KEN', 'Tanzania' => 'TZA', 'Uganda' => 'UGA',
            'USA' => 'USA', 'Canada' => 'CAN', 'Mexico' => 'MEX',
            'Germany' => 'DEU', 'Spain' => 'ESP', 'England' => 'GBR',
            'France' => 'FRA', 'Brazil' => 'BRA', 'Argentina' => 'ARG',
            'South Africa' => 'ZAF', 'Nigeria' => 'NGA', 'Morocco' => 'MAR',
            'Japan' => 'JPN', 'Australia' => 'AUS',
        ];

        return $map[$country] ?? strtoupper(substr($country, 0, 3));
    }
}
