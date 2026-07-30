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

        // ─────────────────────────────────────────────────────────────────
        // UPCOMING
        // ─────────────────────────────────────────────────────────────────

        'wc_2026' => [
            'id' => 'wc_2026',
            'name' => 'FIFA World Cup 2026',
            'short_name' => 'WC 2026',
            'slug' => 'wc-2026',
            'status' => 'upcoming',
            'start_date' => '2026-06-11',
            'end_date' => '2026-07-19',
            'hosts' => ['USA', 'Canada', 'Mexico'],
            'host_flag_codes' => ['us', 'ca', 'mx'],
            'wikipedia_title' => '2026 FIFA World Cup',
            'wikipedia_extract' => 'The 2026 FIFA World Cup will be the 23rd FIFA World Cup, the quadrennial men\'s international football championship contested by the national teams of the member associations of FIFA. It is scheduled to take place from June 11 to July 19, 2026, in the United States, Canada and Mexico.',
            'news_query' => '"World Cup 2026" OR "FIFA 2026" OR "WorldCup26"',
            'default_news_category' => 'general',
            'hero_image' => 'assets/img/backdrops/ball-on-field.jpg',
            'tagline' => 'The biggest World Cup in history — 48 teams, 3 host nations, 104 matches.',
            'color_accent' => '#dc143c',
            'winner' => null,
            'top_scorer' => null,
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
            'wikipedia_title' => '2027 Africa Cup of Nations',
            'wikipedia_extract' => 'The 2027 Africa Cup of Nations, known as AFCON 2027, will be the 36th edition of the Africa Cup of Nations, the biennial international men\'s football championship organised by the Confederation of African Football. It is scheduled to take place from January 15 to February 15, 2027, hosted by Kenya, Tanzania and Uganda — the first time the tournament is hosted by three countries.',
            'news_query' => 'AFCON OR "Africa Cup of Nations" 2027',
            'default_news_category' => 'african',
            'hero_image' => 'assets/img/backdrops/argentina-fans.jpg',
            'tagline' => 'East Africa welcomes Africa\'s biggest football celebration — 24 nations, 3 host countries, infinite passion.',
            'color_accent' => '#f59e0b',
            'winner' => null,
            'top_scorer' => null,
        ],

        // ─────────────────────────────────────────────────────────────────
        // ONGOING (example — adjust dates when tournament is live)
        // ─────────────────────────────────────────────────────────────────

        'ucl_2025_26' => [
            'id'              => 'ucl_2025_26',
            'name'            => 'UEFA Champions League 2025-26',
            'short_name'      => 'UCL 25/26',
            'slug'            => 'ucl-2025-26',
            'status'          => 'ongoing',
            'start_date'      => '2025-09-16',
            'end_date'        => '2026-05-30',
            'hosts'           => ['Europe'],
            'host_flag_codes' => ['eu'],
            'wikipedia_title' => '2025-26 UEFA Champions League',
            'wikipedia_extract' => 'The 2025-26 UEFA Champions League is the 71st season of Europe\'s premier club football tournament organised by UEFA, and the 34th season since it was renamed from the European Cup.',
            'news_query'      => '"Champions League" 2026 OR "UCL final" OR "Champions League final"',
            'default_news_category' => 'european',
            'hero_image'      => 'assets/img/backdrops/field-spotlight.jpg',
            'tagline'         => 'Europe\'s elite clubs battle for the ultimate prize in club football.',
            'color_accent'    => '#3b82f6',
            'winner'          => null,
            'top_scorer'      => null,
        ],

        // ─────────────────────────────────────────────────────────────────
        // CONCLUDED — historical examples with Wikipedia-verified results
        // ─────────────────────────────────────────────────────────────────

        'euro_2024' => [
            'id'              => 'euro_2024',
            'name'            => 'UEFA Euro 2024',
            'short_name'      => 'Euro 2024',
            'slug'            => 'euro-2024',
            'status'          => 'concluded',
            'start_date'      => '2024-06-14',
            'end_date'        => '2024-07-14',
            'hosts'           => ['Germany'],
            'host_flag_codes' => ['de'],
            'wikipedia_title' => 'UEFA Euro 2024',
            'wikipedia_extract' => 'The 2024 UEFA European Championship, commonly referred to as Euro 2024, was the 17th edition of the UEFA European Championship, the quadrennial men\'s football championship organised by UEFA for the European men\'s national football teams. Germany hosted the tournament.',
            'news_query'      => '"Euro 2024" OR "UEFA Euro 2024" OR "Spain Euro"',
            'default_news_category' => 'european',
            'hero_image'      => 'assets/img/IMG-15.jpg',
            'tagline'         => 'A summer of footballing brilliance in Germany — Spain crowned champions of Europe.',
            'color_accent'    => '#3b82f6',
            'winner'          => 'Spain',
            'top_scorer'      => ['name' => 'Cody Gakpo', 'goals' => 3, 'shared_with' => 'Dani Olmo, Jamal Musiala, Georges Mikautadze, Ivan Schranz, Cody Gakpo'],
            'final_venue'     => 'Olympiastadion, Berlin',
            'final_score'     => 'Spain 2-1 England',
        ],

        'copa_2024' => [
            'id'              => 'copa_2024',
            'name'            => 'CONMEBOL Copa America 2024',
            'short_name'      => 'Copa America 2024',
            'slug'            => 'copa-america-2024',
            'status'          => 'concluded',
            'start_date'      => '2024-06-20',
            'end_date'        => '2024-07-14',
            'hosts'           => ['United States'],
            'host_flag_codes' => ['us'],
            'wikipedia_title' => '2024 Copa America',
            'wikipedia_extract' => 'The 2024 Copa América was the 48th edition of the Copa América, the quadrennial international men\'s football championship organised by CONMEBOL. The tournament was held in the United States.',
            'news_query'      => '"Copa America 2024" OR "Argentina Copa"',
            'default_news_category' => 'south_american',
            'hero_image'      => 'assets/img/backdrops/argentina-fans.jpg',
            'tagline'         => 'The reigning world champions defended their continental crown in style.',
            'color_accent'    => '#00d2ff',
            'winner'          => 'Argentina',
            'top_scorer'      => ['name' => 'Lautaro Martinez', 'goals' => 5],
            'final_venue'     => 'Hard Rock Stadium, Miami',
            'final_score'     => 'Argentina 1-0 Colombia',
        ],

        'afcon_2023' => [
            'id'              => 'afcon_2023',
            'name'            => 'Africa Cup of Nations 2023',
            'short_name'      => 'AFCON 2023',
            'slug'            => 'afcon-2023',
            'status'          => 'concluded',
            'start_date'      => '2024-01-13',
            'end_date'        => '2024-02-11',
            'hosts'           => ["Côte d'Ivoire"],
            'host_flag_codes' => ['ci'],
            'wikipedia_title' => '2023 Africa Cup of Nations',
            'wikipedia_extract' => 'The 2023 Africa Cup of Nations, known as AFCON 2023, was the 34th edition of the Africa Cup of Nations, the biennial international men\'s football championship organised by the Confederation of African Football. It was held in Ivory Coast.',
            'news_query'      => '"AFCON 2023" OR "Ivory Coast AFCON"',
            'default_news_category' => 'african',
            'hero_image'      => 'assets/img/backdrops/stadium-fans.jpg',
            'tagline'         => 'The Elephants of Ivory Coast lifted the trophy on home soil.',
            'color_accent'    => '#f59e0b',
            'winner'          => "Côte d'Ivoire",
            'top_scorer'      => ['name' => 'Emilio Nsue', 'goals' => 5],
            'final_venue'     => 'Stade Alassane Ouattara, Abidjan',
            'final_score'     => "Côte d'Ivoire 2-1 Nigeria",
        ],

        'wc_2022' => [
            'id'              => 'wc_2022',
            'name'            => 'FIFA World Cup 2022',
            'short_name'      => 'WC 2022',
            'slug'            => 'wc-2022',
            'status'          => 'concluded',
            'start_date'      => '2022-11-20',
            'end_date'        => '2022-12-18',
            'hosts'           => ['Qatar'],
            'host_flag_codes' => ['qa'],
            'wikipedia_title' => '2022 FIFA World Cup',
            'wikipedia_extract' => 'The 2022 FIFA World Cup was the 22nd FIFA World Cup, the quadrennial men\'s international football championship contested by the national teams of the member associations of FIFA. It was held in Qatar.',
            'news_query'      => '"World Cup 2022" OR "Qatar World Cup"',
            'default_news_category' => 'general',
            'hero_image'      => 'assets/img/backdrops/night-stadium.jpg',
            'tagline'         => 'Argentina lifted the trophy in one of the most dramatic finals in World Cup history.',
            'color_accent'    => '#dc143c',
            'winner'          => 'Argentina',
            'top_scorer'      => ['name' => 'Kylian Mbappé', 'goals' => 8],
            'final_venue'     => 'Lusail Stadium, Lusail',
            'final_score'     => 'Argentina 3-3 France (4-2 pens)',
        ],

    ],

];
