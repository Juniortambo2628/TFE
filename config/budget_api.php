<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Budget API Configuration
    |--------------------------------------------------------------------------
    |
    | API keys and fallback data for the budget calculator's real-time services.
    | Set API keys in .env file.
    |
    */

    'amadeus' => [
        'client_id' => env('AMADEUS_CLIENT_ID', ''),
        'client_secret' => env('AMADEUS_CLIENT_SECRET', ''),
        'base_url' => env('AMADEUS_BASE_URL', 'https://api.amadeus.com'),
    ],

    'orizn' => [
        'api_key' => env('ORIZN_API_KEY', ''),
        'base_url' => env('ORIZN_BASE_URL', 'https://visa.orizn.app/api/v1'),
    ],

    'serpapi' => [
        'api_key' => env('SERPAPI_KEY', ''),
    ],

    // Fallback exchange rates when HexaRate API is unavailable
    'fallback_rates' => [
        'USD_KES' => 130,
        'EUR_KES' => 155,
        'GBP_KES' => 165,
        'USD_EUR' => 0.92,
        'USD_GBP' => 0.79,
        'USD_UGX' => 3750,
        'USD_TZS' => 2500,
    ],

    // Fallback hotel estimates by Amadeus city code
    'hotel_estimates' => [
        'NBO' => ['budget' => 25, 'mid' => 60, 'luxury' => 140],
        'DAR' => ['budget' => 20, 'mid' => 50, 'luxury' => 120],
        'EBB' => ['budget' => 18, 'mid' => 45, 'luxury' => 100],
        'MBA' => ['budget' => 22, 'mid' => 55, 'luxury' => 130],
        'JFK' => ['budget' => 80, 'mid' => 180, 'luxury' => 400],
        'LAX' => ['budget' => 75, 'mid' => 170, 'luxury' => 380],
        'MEX' => ['budget' => 30, 'mid' => 70, 'luxury' => 160],
        'YYZ' => ['budget' => 65, 'mid' => 140, 'luxury' => 300],
        'BER' => ['budget' => 45, 'mid' => 100, 'luxury' => 250],
        'MUC' => ['budget' => 50, 'mid' => 110, 'luxury' => 280],
    ],

    // Fallback flight estimates (origin_dest → economy/business price in USD)
    'flight_estimates' => [
        'NBO_JFK' => ['economy' => 1100, 'business' => 3200],
        'NBO_LAX' => ['economy' => 1200, 'business' => 3500],
        'NBO_LHR' => ['economy' => 600, 'business' => 1800],
        'NBO_CDG' => ['economy' => 650, 'business' => 1900],
        'NBO_DXB' => ['economy' => 400, 'business' => 1200],
        'JFK_NBO' => ['economy' => 1100, 'business' => 3200],
        'LHR_NBO' => ['economy' => 600, 'business' => 1800],
        'CDG_NBO' => ['economy' => 650, 'business' => 1900],
        'DXB_NBO' => ['economy' => 400, 'business' => 1200],
    ],

];
