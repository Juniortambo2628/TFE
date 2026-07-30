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
        'facts'      => 86400 * 7,    // 7 days
        'live'       => 1800,         // 30 min
        'historical' => 86400 * 30,   // 30 days
    ],

    'tournaments' => [

        'wc_2026' => [
            'id'              => 'wc_2026',
            'name'            => 'FIFA World Cup 2026',
            'short_name'      => 'WC 2026',
            'slug'            => 'wc-2026',
            'status'          => 'upcoming',
            'start_date'      => '2026-06-11',
            'end_date'        => '2026-07-19',
            'hosts'           => ['USA', 'Canada', 'Mexico'],
            'host_flag_codes' => ['us', 'ca', 'mx'],
            'wikipedia_title' => '2026 FIFA World Cup',
            'wikipedia_extract' => 'The 2026 FIFA World Cup will be the 23rd FIFA World Cup, the quadrennial men\'s international football championship contested by the national teams of the member associations of FIFA. It is scheduled to take place from June 11 to July 19, 2026, in the United States, Canada and Mexico.',
            'news_query'      => '"World Cup 2026" OR "FIFA 2026" OR "WorldCup26"',
            'default_news_category' => 'general',
            'hero_image'      => 'assets/img/backdrops/ball-on-field.jpg',
            'tagline'         => 'The biggest World Cup in history — 48 teams, 3 host nations, 104 matches.',
            'color_accent'    => '#dc143c',
        ],

        'afcon_2027' => [
            'id'              => 'afcon_2027',
            'name'            => 'Africa Cup of Nations 2027',
            'short_name'      => 'AFCON 2027',
            'slug'            => 'afcon-2027',
            'status'          => 'upcoming',
            'start_date'      => '2027-01-15',
            'end_date'        => '2027-02-15',
            'hosts'           => ['Kenya', 'Tanzania', 'Uganda'],
            'host_flag_codes' => ['ke', 'tz', 'ug'],
            'wikipedia_title' => '2027 Africa Cup of Nations',
            'wikipedia_extract' => 'The 2027 Africa Cup of Nations, known as AFCON 2027, will be the 36th edition of the Africa Cup of Nations, the biennial international men\'s football championship organised by the Confederation of African Football. It is scheduled to take place from January 15 to February 15, 2027, hosted by Kenya, Tanzania and Uganda — the first time the tournament is hosted by three countries.',
            'news_query'      => 'AFCON OR "Africa Cup of Nations" 2027',
            'default_news_category' => 'african',
            'hero_image'      => 'assets/img/backdrops/argentina-fans.jpg',
            'tagline'         => 'East Africa welcomes Africa\'s biggest football celebration — 24 nations, 3 host countries, infinite passion.',
            'color_accent'    => '#f59e0b',
        ],

    ],

];
