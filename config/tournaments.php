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

    'default' => 'wc_2026',

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
            'data_source' => 'thestatsapi',
            'data_source_url' => 'https://www.thestatsapi.com/world-cup/data/fixtures.json',
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
        ],

    ],

];
