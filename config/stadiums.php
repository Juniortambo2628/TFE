<?php

/*
|--------------------------------------------------------------------------
| Locally-hosted stadium imagery + geodata
|--------------------------------------------------------------------------
|
| The hero slider used to render whatever thumbnail Wikipedia happened to
| return for a venue. That was slow (a cold tournament cache fanned out one
| summary request per venue before the hero could paint), unreliable (the
| thumbnail is whatever the article's lead image is that week — sometimes a
| crowd shot, sometimes a logo, sometimes nothing), and unstyleable.
|
| This file is the single source of truth instead. Images are pre-optimized
| WebP committed under `public/stadiums/{SET}/` — the same "commit it or it
| never deploys" rule that applies to `public/tournament-organizers-card-visuals`
| and `public/assets/WC26_Stadia_HD_images`. Admins can override any single
| image from Admin -> Content -> Stadium Images; that override is stored as
| SiteSetting `stadium_image_{slug}` and wins over the committed default,
| which stays in place as the fallback so a bad upload can never blank a hero.
|
| `aliases` exist because venue names arrive from Wikipedia wikitext, not from
| our own database — there is no stadium table to join on. The same ground is
| variously "Moi International Sports Centre", "Kasarani Stadium" and
| "Moi International Sports Centre, Kasarani" depending on the article. Every
| plausible rendering of a name gets listed so StadiumImageService can match
| it; matching is normalized (lowercased, punctuation and the noise words
| "stadium"/"the" stripped) before the alias list is consulted.
|
| `lat`/`lng` are here for the same reason. ItineraryMap needs coordinates to
| plot venue pins and haversine the route, and it used to depend on Wikipedia
| infobox coordinates that frequently parse to null — leaving fans with the
| "we'll pin the map once Wikipedia data lands" placeholder. These are
| approximate stadium-site coordinates (good to roughly a city block), which
| is ample for a country-scale SVG projection and route distances quoted to
| the nearest kilometre.
|
*/

return [

    /*
     * Keyed by tournament id (see config/tournaments.php). A tournament with
     * no entry here simply falls back to whatever imagery its data source
     * supplies — nothing breaks, the slider just keeps its old behaviour.
     */
    'sets' => [

        'afcon_2027' => [

            /*
             * ---- Kenya ----
             */
            'talanta-sports-city' => [
                // Renamed to Raila Odinga International Stadium (2025). Wikipedia
                // flips between the two names between edits — we saw both in
                // consecutive fetches — so both must resolve.
                'name' => 'Talanta Sports City Stadium',
                'city' => 'Nairobi',
                'country' => 'Kenya',
                'lat' => -1.3006,
                'lng' => 36.7566,
                'image' => 'stadiums/AFCON/talanta-sports-city_hero.webp',
                'aliases' => [
                    'talanta sports',
                    'talanta sports stadium',
                    'talanta sports city',
                    'raila odinga',
                    'raila odinga stadium',
                    'raila odinga international',
                    'raila odinga international stadium',
                    'talanta sports city stadium',
                    'talanta',
                    'talanta stadium',
                ],
            ],

            'moi-kasarani' => [
                'name' => 'Moi International Sports Centre, Kasarani',
                'city' => 'Nairobi',
                'country' => 'Kenya',
                'lat' => -1.2264,
                'lng' => 36.8945,
                'image' => 'stadiums/AFCON/moi-kasarani_hero.webp',
                'aliases' => [
                    'moi international',
                    'moi international stadium',
                    'moi international sports centre',
                    'moi international sports center',
                    'moi international sports centre kasarani',
                    'moi international sports center kasarani',
                    'kasarani',
                    'kasarani stadium',
                    'moi stadium kasarani',
                ],
            ],

            'nyayo-national' => [
                'name' => 'Nyayo National Stadium',
                'city' => 'Nairobi',
                'country' => 'Kenya',
                'lat' => -1.3055,
                'lng' => 36.8265,
                'image' => 'stadiums/AFCON/nyayo-national_hero.webp',
                'aliases' => [
                    'nyayo national',
                    'nyayo national stadium',
                    'nyayo',
                    'nyayo stadium',
                ],
            ],

            'bukhungu' => [
                'name' => 'Bukhungu Stadium',
                'city' => 'Kakamega',
                'country' => 'Kenya',
                'lat' => 0.2827,
                'lng' => 34.7519,
                'image' => 'stadiums/AFCON/bukhungu_hero.webp',
                'aliases' => [
                    'bukhungu',
                    'bukhungu stadium',
                ],
            ],

            'kipchoge-keino' => [
                'name' => 'Kipchoge Keino Stadium',
                'city' => 'Eldoret',
                'country' => 'Kenya',
                'lat' => 0.5143,
                'lng' => 35.2698,
                'image' => 'stadiums/AFCON/kipchoge-keino_hero.webp',
                'aliases' => [
                    'kipchoge keino',
                    'kipchoge keino stadium',
                ],
            ],

            /*
             * ---- Uganda ----
             */
            'mandela-national' => [
                'name' => 'Mandela National Stadium',
                'city' => 'Kampala',
                'country' => 'Uganda',
                'lat' => 0.3613,
                'lng' => 32.6553,
                'image' => 'stadiums/AFCON/mandela-national_hero.webp',
                'aliases' => [
                    'mandela national',
                    'mandela national stadium',
                    'nelson mandela national stadium',
                    'namboole',
                    'namboole stadium',
                    'mandela national stadium namboole',
                ],
            ],

            'hoima-city' => [
                'name' => 'Hoima City Stadium',
                'city' => 'Hoima',
                'country' => 'Uganda',
                'lat' => 1.4330,
                'lng' => 31.3520,
                'image' => 'stadiums/AFCON/hoima-city_hero.webp',
                'aliases' => [
                    'hoima city',
                    'hoima city stadium',
                    'kabaale',
                ],
            ],

            'akii-bua' => [
                'name' => 'Akii-Bua Olympic Stadium',
                'city' => 'Lira',
                'country' => 'Uganda',
                'lat' => 2.2499,
                'lng' => 32.8998,
                'image' => 'stadiums/AFCON/akii-bua_hero.webp',
                'aliases' => [
                    'akii bua',
                    'akii bua olympic',
                    'akii bua olympic stadium',
                    'akiibua',
                    'john akii bua',
                    'john akii bua olympic stadium',
                ],
            ],

            /*
             * ---- Tanzania ----
             */
            'benjamin-mkapa' => [
                'name' => 'Benjamin Mkapa Stadium',
                'city' => 'Dar es Salaam',
                'country' => 'Tanzania',
                'lat' => -6.8657,
                'lng' => 39.2378,
                'image' => 'stadiums/AFCON/benjamin-mkapa_hero.webp',
                'aliases' => [
                    'benjamin mkapa',
                    'benjamin mkapa stadium',
                    'benjamin william mkapa stadium',
                    'mkapa',
                    'mkapa stadium',
                ],
            ],

            'samia-suluhu-hassan' => [
                'name' => 'Samia Suluhu Hassan Stadium',
                'city' => 'Arusha',
                'country' => 'Tanzania',
                'lat' => -3.3869,
                'lng' => 36.6830,
                'image' => 'stadiums/AFCON/samia-suluhu-hassan_hero.webp',
                'aliases' => [
                    'samia suluhu hassan',
                    'samia suluhu hassan stadium',
                    'samia stadium',
                ],
            ],

            'dodoma' => [
                'name' => 'Dodoma Stadium',
                'city' => 'Dodoma',
                'country' => 'Tanzania',
                'lat' => -6.1730,
                'lng' => 35.7419,
                'image' => 'stadiums/AFCON/dodoma_hero.webp',
                'aliases' => [
                    'dodoma',
                    'dodoma stadium',
                    'new dodoma stadium',
                    'jamhuri stadium',
                    'jamhuri stadium dodoma',
                ],
            ],

            'amaan' => [
                'name' => 'Amaan Stadium',
                'city' => 'Zanzibar City',
                'country' => 'Tanzania',
                'lat' => -6.1650,
                'lng' => 39.1990,
                'image' => 'stadiums/AFCON/amaan_hero.webp',
                'aliases' => [
                    'amaan',
                    'amaan stadium',
                    'amaan complex',
                    'amaan sports complex',
                ],
            ],
        ],
    ],

    /*
     * Cache TTL for the resolved slug -> url map. Short relative to the
     * tournament payload (24h) because an admin swapping an image should see
     * it on the next page load, not tomorrow. StadiumImageService also busts
     * this key outright whenever an override is written.
     */
    'cache_ttl' => 900,
];
