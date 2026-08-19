<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Tournament Configuration
    |--------------------------------------------------------------------------
    |
    | Single source of truth for all tournament-related data. The active
    | tournament can be overridden at runtime via the ?tournament= query
    | parameter (e.g. /?tournament=afcon-2027).
    |
    | status: 'upcoming' (before start), 'ongoing' (between start/end),
    |         'concluded' (after end_date).
    |
    */

    'default' => 'afcon_2027',

    /*
     * Cache TTLs (in seconds).
     *  - 'facts'      : tournament metadata (host, dates, summary) — rarely changes
     *  - 'live'       : during 'ongoing' tournaments — match results, news
     *  - 'historical' : after 'concluded' — longer TTL since data is stable
     */
    'cache' => [
        'facts' => 86400 * 7,    // 7 days
        'live' => 1800,         // 30 min
        'historical' => 86400 * 30,   // 30 days
    ],

    'tournaments' => [

        'wc_2026' => [
            'id' => 'wc_2026',
            'name' => 'FIFA World Cup 2026',
            'short_name' => 'WC 2026',
            'slug' => 'wc-2026',
            'status' => 'concluded',
            'start_date' => '2026-06-11',
            'end_date' => '2026-07-19',
            'hosts' => ['USA', 'Canada', 'Mexico'],
            'host_flag_codes' => ['us', 'ca', 'mx'],
            'data_source' => 'database',
            'data_source_url' => null,
            'team_flag_codes' => [
                'ar', 'au', 'at', 'be', 'br', 'cm', 'ca', 'hr',
                'ci', 'cu', 'cz', 'dk', 'ec', 'eg', 'gb', 'fr',
                'de', 'gh', 'gr', 'ht', 'ir', 'it', 'jm', 'jp',
                'ke', 'kr', 'ma', 'mx', 'nl', 'nz', 'ng', 'no',
                'pa', 'pl', 'pt', 'qa', 'sa', 'sn', 'rs', 'es',
                'ch', 'tn', 'tr', 'ua', 'us', 'uy', 'uz', 've',
            ],
            'wikipedia_title' => '2026 FIFA World Cup',
            'wikipedia_extract' => 'The 2026 FIFA World Cup will be the 23rd FIFA World Cup, the quadrennial men\'s international football championship contested by the national teams of the member associations of FIFA. It is scheduled to take place from June 11 to July 19, 2026, in the United States, Canada and Mexico.',
            'news_query' => '"World Cup 2026" OR "FIFA 2026" OR "WorldCup26"',
            'default_news_category' => 'general',
            'hero_image' => 'assets/img/backdrops/ball-on-field.jpg',
            'tagline' => 'The biggest World Cup in history — 48 teams, 3 host nations, 104 matches.',
            'color_accent' => '#dc143c',
            'winner' => null,
            'runner_up' => null,
            'second_runner_up' => null,
            'top_scorer' => null,
            'num_teams' => 48,
            'matches_played' => 104,
            'pricing' => [
                'currency' => 'USD',
                'exchange_rate' => 130,
                'surge_rates' => [
                    'Group Stage' => 1.0,
                    'Round of 32' => 1.1,
                    'Round of 16' => 1.15,
                    'Quarter-finals' => 1.25,
                    'Semi-finals' => 1.5,
                    'Third Place' => 1.2,
                    'Final' => 2.0,
                ],
                'ticket_prices' => [
                    'Group Stage' => 150,
                    'Round of 32' => 250,
                    'Round of 16' => 250,
                    'Quarter-finals' => 350,
                    'Semi-finals' => 600,
                    'Third Place' => 300,
                    'Final' => 1500,
                ],
                'daily_costs' => ['food' => 60, 'transport' => 30, 'misc' => 20],
                'venue_tiers' => [
                    'New York New Jersey Stadium' => ['tier' => 'High', 'multiplier' => 1.5, 'hotel_3star' => 250, 'country' => 'USA'],
                    'Los Angeles Stadium' => ['tier' => 'High', 'multiplier' => 1.45, 'hotel_3star' => 240, 'country' => 'USA'],
                    'San Francisco Bay Area Stadium' => ['tier' => 'High', 'multiplier' => 1.45, 'hotel_3star' => 240, 'country' => 'USA'],
                    'Miami Stadium' => ['tier' => 'High', 'multiplier' => 1.4, 'hotel_3star' => 220, 'country' => 'USA'],
                    'Boston Stadium' => ['tier' => 'High', 'multiplier' => 1.35, 'hotel_3star' => 210, 'country' => 'USA'],
                    'Seattle Stadium' => ['tier' => 'Standard', 'multiplier' => 1.1, 'hotel_3star' => 180, 'country' => 'USA'],
                    'Philadelphia Stadium' => ['tier' => 'Standard', 'multiplier' => 1.1, 'hotel_3star' => 180, 'country' => 'USA'],
                    'Dallas Stadium' => ['tier' => 'Standard', 'multiplier' => 1.0, 'hotel_3star' => 160, 'country' => 'USA'],
                    'Houston Stadium' => ['tier' => 'Standard', 'multiplier' => 1.0, 'hotel_3star' => 160, 'country' => 'USA'],
                    'Atlanta Stadium' => ['tier' => 'Standard', 'multiplier' => 1.0, 'hotel_3star' => 160, 'country' => 'USA'],
                    'Toronto Stadium' => ['tier' => 'Standard', 'multiplier' => 1.1, 'hotel_3star' => 180, 'country' => 'Canada'],
                    'BC Place Vancouver' => ['tier' => 'Standard', 'multiplier' => 1.15, 'hotel_3star' => 190, 'country' => 'Canada'],
                    'Kansas City Stadium' => ['tier' => 'Standard', 'multiplier' => 0.95, 'hotel_3star' => 150, 'country' => 'USA'],
                    'Mexico City Stadium' => ['tier' => 'Low', 'multiplier' => 0.7, 'hotel_3star' => 100, 'country' => 'Mexico'],
                    'Estadio Guadalajara' => ['tier' => 'Low', 'multiplier' => 0.6, 'hotel_3star' => 85, 'country' => 'Mexico'],
                    'Estadio Monterrey' => ['tier' => 'Low', 'multiplier' => 0.65, 'hotel_3star' => 90, 'country' => 'Mexico'],
                ],
                'flight_origins' => [
                    ['id' => 'north_america', 'label' => 'North America (USA/Can/Mex)', 'economy' => 400, 'business' => 1200],
                    ['id' => 'south_america', 'label' => 'South America', 'economy' => 900, 'business' => 2200],
                    ['id' => 'europe', 'label' => 'Europe', 'economy' => 1000, 'business' => 2800],
                    ['id' => 'africa', 'label' => 'Africa', 'economy' => 1300, 'business' => 3500],
                    ['id' => 'asia', 'label' => 'Asia / Pacific', 'economy' => 1500, 'business' => 4000],
                    ['id' => 'middle_east', 'label' => 'Middle East', 'economy' => 1200, 'business' => 3200],
                ],
                'accommodation' => [
                    'hostel' => 0.4, 'airbnb' => 0.8, '3_star' => 1.0,
                    '4_star' => 1.6, '5_star' => 2.5, 'resort' => 3.5,
                ],
            ],
        ],

        'euro_2024' => [
            'id' => 'euro_2024',
            'name' => 'UEFA Euro 2024',
            'short_name' => 'Euro 2024',
            'slug' => 'euro-2024',
            'status' => 'concluded',
            'start_date' => '2024-06-14',
            'end_date' => '2024-07-14',
            'hosts' => ['Germany'],
            'host_flag_codes' => ['de'],
            'data_source' => 'openfootball',
            'data_source_url' => 'https://raw.githubusercontent.com/openfootball/euro.json/master/2024/euro.json',
            'team_flag_codes' => ['al', 'at', 'be', 'hr', 'cz', 'dk', 'gb', 'fr', 'ge', 'de', 'hu', 'it', 'nl', 'pl', 'pt', 'ro', 'rs', 'sk', 'si', 'es', 'ch', 'tr', 'ua'],
            'wikipedia_title' => 'UEFA Euro 2024',
            'wikipedia_extract' => 'The 2024 UEFA European Championship, commonly referred to as Euro 2024, was the 17th edition of the UEFA European Championship, the quadrennial men\'s football championship organised by UEFA for the European men\'s national football teams. Germany hosted the tournament.',
            'news_query' => '"Euro 2024" OR "UEFA Euro 2024" OR "Spain Euro"',
            'default_news_category' => 'european',
            'hero_image' => 'assets/img/IMG-15.jpg',
            'tagline' => 'A summer of footballing brilliance in Germany — Spain crowned champions of Europe.',
            'color_accent' => '#3b82f6',
            'winner' => 'Spain',
            'runner_up' => 'England',
            'second_runner_up' => 'France',
            'top_scorer' => ['name' => 'Cody Gakpo', 'goals' => 3],
            'final_venue' => 'Olympiastadion, Berlin',
            'final_score' => 'Spain 2-1 England',
            'num_teams' => 24,
            'matches_played' => 51,
            'pricing' => [
                'currency' => 'EUR',
                'exchange_rate' => 155,
                'surge_rates' => [
                    'Group Stage' => 1.0,
                    'Round of 16' => 1.15,
                    'Quarter-finals' => 1.3,
                    'Semi-finals' => 1.5,
                    'Final' => 2.0,
                ],
                'ticket_prices' => [
                    'Group Stage' => 130,
                    'Round of 16' => 200,
                    'Quarter-finals' => 300,
                    'Semi-finals' => 550,
                    'Final' => 1200,
                ],
                'daily_costs' => ['food' => 55, 'transport' => 25, 'misc' => 15],
                'venue_tiers' => [
                    'Munich' => ['tier' => 'High', 'multiplier' => 1.3, 'hotel_3star' => 170, 'country' => 'Germany'],
                    'Berlin' => ['tier' => 'High', 'multiplier' => 1.25, 'hotel_3star' => 160, 'country' => 'Germany'],
                    'Dortmund' => ['tier' => 'Standard', 'multiplier' => 1.0, 'hotel_3star' => 130, 'country' => 'Germany'],
                    'Gelsenkirchen' => ['tier' => 'Low', 'multiplier' => 0.9, 'hotel_3star' => 110, 'country' => 'Germany'],
                    'Stuttgart' => ['tier' => 'Standard', 'multiplier' => 1.1, 'hotel_3star' => 140, 'country' => 'Germany'],
                    'Hamburg' => ['tier' => 'Standard', 'multiplier' => 1.15, 'hotel_3star' => 145, 'country' => 'Germany'],
                    'Leipzig' => ['tier' => 'Low', 'multiplier' => 0.85, 'hotel_3star' => 105, 'country' => 'Germany'],
                    'Frankfurt' => ['tier' => 'Standard', 'multiplier' => 1.2, 'hotel_3star' => 155, 'country' => 'Germany'],
                    'Cologne' => ['tier' => 'Standard', 'multiplier' => 1.05, 'hotel_3star' => 135, 'country' => 'Germany'],
                ],
                'flight_origins' => [
                    ['id' => 'europe', 'label' => 'Europe', 'economy' => 200, 'business' => 600],
                    ['id' => 'uk', 'label' => 'United Kingdom', 'economy' => 150, 'business' => 450],
                    ['id' => 'north_america', 'label' => 'North America', 'economy' => 800, 'business' => 2400],
                    ['id' => 'south_america', 'label' => 'South America', 'economy' => 1100, 'business' => 3000],
                    ['id' => 'africa', 'label' => 'Africa', 'economy' => 900, 'business' => 2800],
                    ['id' => 'asia', 'label' => 'Asia / Pacific', 'economy' => 1200, 'business' => 3500],
                ],
                'accommodation' => [
                    'hostel' => 0.4, 'airbnb' => 0.75, '3_star' => 1.0,
                    '4_star' => 1.5, '5_star' => 2.3, 'resort' => 3.0,
                ],
            ],
        ],

        'afcon_2027' => [
            'id' => 'afcon_2027',
            'name' => 'Africa Cup of Nations 2027',
            'short_name' => 'AFCON 2027',
            'slug' => 'afcon-2027',
            'status' => 'upcoming',
            'start_date' => '2027-01-15',
            'end_date' => '2027-02-15',
            'hosts' => ['Kenya', 'Tanzania', 'Uganda'],
            'host_flag_codes' => ['ke', 'tz', 'ug'],
            'data_source' => 'wikipedia',
            'team_flag_codes' => ['dz', 'bf', 'bi', 'cm', 'cv', 'cf', 'cg', 'eg', 'ga', 'gh', 'gn', 'gw', 'ci', 'mg', 'ml', 'mr', 'ma', 'mz', 'na', 'ng', 'sn', 'za', 'tz', 'tn', 'ug', 'zm', 'zw'],
            'wikipedia_title' => '2027 Africa Cup of Nations',
            'wikipedia_extract' => 'The 2027 Africa Cup of Nations, known as AFCON 2027, will be the 36th edition of the Africa Cup of Nations, the biennial international men\'s football championship organised by the Confederation of African Football. It is scheduled to take place from January 15 to February 15, 2027, hosted by Kenya, Tanzania and Uganda.',
            'news_query' => 'AFCON OR "Africa Cup of Nations" 2027',
            'default_news_category' => 'african',
            'hero_image' => 'assets/img/backdrops/argentina-fans.jpg',
            'tagline' => 'East Africa welcomes Africa\'s biggest football celebration — 24 nations, 3 host countries, infinite passion.',
            'color_accent' => '#f59e0b',
            'winner' => null,
            'runner_up' => null,
            'second_runner_up' => null,
            'top_scorer' => null,
            'pricing' => [
                'currency' => 'USD',
                'exchange_rate' => 130,
                'surge_rates' => [
                    'Group Stage' => 1.0,
                    'Round of 16' => 1.1,
                    'Quarter-finals' => 1.2,
                    'Semi-finals' => 1.4,
                    'Third Place' => 1.15,
                    'Final' => 1.8,
                ],
                'ticket_prices' => [
                    'Group Stage' => 60,
                    'Round of 16' => 100,
                    'Quarter-finals' => 150,
                    'Semi-finals' => 250,
                    'Third Place' => 120,
                    'Final' => 500,
                ],
                'daily_costs' => ['food' => 25, 'transport' => 15, 'misc' => 10],
                'venue_tiers' => [
                    'Nairobi' => ['tier' => 'High', 'multiplier' => 1.2, 'hotel_3star' => 90, 'country' => 'Kenya'],
                    'Dar es Salaam' => ['tier' => 'Standard', 'multiplier' => 1.0, 'hotel_3star' => 75, 'country' => 'Tanzania'],
                    'Kampala' => ['tier' => 'Low', 'multiplier' => 0.8, 'hotel_3star' => 55, 'country' => 'Uganda'],
                    'Mombasa' => ['tier' => 'Standard', 'multiplier' => 0.95, 'hotel_3star' => 70, 'country' => 'Kenya'],
                    'Arusha' => ['tier' => 'Low', 'multiplier' => 0.85, 'hotel_3star' => 60, 'country' => 'Tanzania'],
                ],
                'flight_origins' => [
                    ['id' => 'africa_east', 'label' => 'East Africa', 'economy' => 200, 'business' => 600],
                    ['id' => 'africa_west', 'label' => 'West / Southern Africa', 'economy' => 450, 'business' => 1200],
                    ['id' => 'africa_north', 'label' => 'North Africa', 'economy' => 500, 'business' => 1400],
                    ['id' => 'europe', 'label' => 'Europe', 'economy' => 600, 'business' => 1800],
                    ['id' => 'middle_east', 'label' => 'Middle East', 'economy' => 500, 'business' => 1500],
                    ['id' => 'asia', 'label' => 'Asia / Pacific', 'economy' => 900, 'business' => 2800],
                ],
                'accommodation' => [
                    'hostel' => 0.35, 'airbnb' => 0.7, '3_star' => 1.0,
                    '4_star' => 1.8, '5_star' => 3.0, 'resort' => 4.0,
                ],
            ],
        ],

    ],

];
