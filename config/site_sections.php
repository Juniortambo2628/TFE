<?php

/*
|--------------------------------------------------------------------------
| Public section cards
|--------------------------------------------------------------------------
|
| The content cards shown on the standalone public section pages (/about,
| /features, /services, /contact) and in the matching landing sections.
|
| These used to be hard-coded arrays inside the React components, which meant
| an admin could edit a section's HERO from the CMS but not the cards beneath
| it — and the images were unreachable without a redeploy.
|
| Every field is overridable per card in the admin CMS via SiteSetting keys
| `section_card_{slug}_{index}_{field}` (field in image, title, subtitle,
| description). HomeController::sectionCards() merges the overrides over these
| defaults, so a blank override always falls back to what is here.
|
| Image paths are root-relative on purpose: a bare `assets/...` resolves
| against the current directory and 404s on any nested route.
|
*/
return [

    'about' => [
        [
            'image' => '/assets/img/IMG-11.jpg',
            'title' => 'Premium Travel',
            'subtitle' => 'Curated match experiences',
            'tags' => ['VIP Access', 'Curated'],
            'description' => 'End-to-end match trips built around the fixtures you care about — premium seats, hospitality, and transfers handled so all you do is show up and support your team.',
        ],
        [
            'image' => '/assets/img/backdrops/stadium-fans.jpg',
            'title' => 'Match Day Magic',
            'subtitle' => 'Cheer from the best seats',
            'tags' => ['Live', 'Stadium'],
            'description' => 'Feel the roar from the right seats. We secure vantage points across the host stadiums so you experience the tournament from inside the atmosphere, not the nosebleeds.',
        ],
        [
            'image' => '/assets/img/IMG-15.jpg',
            'title' => 'Travel Concierge',
            'subtitle' => 'Hassle-free arrangements',
            'tags' => ['24/7', 'Support'],
            'description' => 'A dedicated team on the ground and on call — visas, itineraries, last-minute changes and local know-how, so nothing between kick-offs is left to chance.',
        ],
        [
            'image' => '/assets/img/backdrops/plane-square.jpg',
            'title' => 'Flights & Stays',
            'subtitle' => 'Bundled packages',
            'tags' => ['All-Inclusive'],
            'description' => 'Flights, hotels and transfers bundled into one price and one plan, negotiated for travelling fans and timed around match days rather than standard check-in windows.',
        ],
    ],

    'features' => [
        [
            'image' => '/assets/img/IMG-11.jpg',
            'title' => 'Flexible Payment Plans',
            'subtitle' => 'Pay in manageable monthly installments',
            'tags' => ['12-24 Months', 'No Hidden Fees'],
            'description' => 'Spread the cost of your trip over 12 to 24 months instead of paying upfront. Transparent instalments with no hidden fees, so the tournament fits your budget, not the other way round.',
        ],
        [
            'image' => '/assets/img/backdrops/nigeria-fans.jpg',
            'title' => 'Community Savings',
            'subtitle' => 'Group rates with fellow fans',
            'tags' => ['Group Rates', 'Together'],
            'description' => 'Travel as a tribe. Pool with fellow fans to unlock group rates on tickets, stays and transfers, and save together toward a shared match-day goal.',
        ],
        [
            'image' => '/assets/img/backdrops/plane-square.jpg',
            'title' => 'All-Inclusive Packages',
            'subtitle' => 'Flights, hotels, transfers, insurance',
            'tags' => ['Travel Info', 'Travel'],
            'description' => 'One package, everything covered — flights, hotels, transfers and insurance bundled and priced together so there are no surprise line items once you land.',
        ],
        [
            'image' => '/assets/img/IMG-13.jpg',
            'title' => '24/7 Local Support',
            'subtitle' => 'Multilingual team on the ground',
            'tags' => ['24/7', 'Multilingual'],
            'description' => 'A multilingual team on the ground around the clock — for directions, changes, or anything that comes up between kick-offs, in a language you speak.',
        ],
    ],

    'services' => [
        [
            'image' => '/assets/img/IMG-12.jpg',
            'title' => 'Structured Financing',
            'subtitle' => 'Break tournament travel packages into monthly payments over 12-24 months instead of paying upfront.',
            'tags' => ['Financing', '12-24 Months'],
            'description' => 'Turn one big cost into a plan you control. Split your travel package across 12–24 monthly payments, matched to a finance partner, so you can lock in the trip now and pay it down over time.',
        ],
        [
            'image' => '/assets/img/backdrops/plane-square.jpg',
            'title' => 'Travel Packages',
            'subtitle' => 'All-inclusive packages with premium accommodations, flights, transfers, and travel insurance.',
            'tags' => ['Travel', 'All-Inclusive'],
            'description' => 'Everything under one booking — premium stays, flights, airport and stadium transfers, and travel insurance — packaged and priced together so your trip is sorted end to end.',
        ],
        [
            'image' => '/assets/img/IMG-16.jpg',
            'title' => 'Ticketing Guide',
            'subtitle' => 'Stay informed with the latest FIFA ticket sales news. We provide information and direct links to the official portal.',
            'tags' => ['Tickets', 'Info'],
            'description' => 'We keep you ahead of every ticket window with the latest official sale news and direct links to the tournament portal — no touts, no guesswork, just the right dates and the right links.',
        ],
        [
            'image' => '/assets/img/IMG-18.jpg',
            'title' => 'Premium Accommodations',
            'subtitle' => '4-5 star hotels near stadiums with easy access to match venues and local attractions.',
            'tags' => ['4-5 Star', 'Premium'],
            'description' => 'Stay close to the action in hand-picked 4 and 5 star hotels near the stadiums, with easy access to venues and the best of each host city between fixtures.',
        ],
    ],

    'contact' => [
        [
            'image' => '/assets/img/IMG-15.jpg',
            'title' => 'Speak With Our Team',
            'subtitle' => 'Personalised guidance for your journey',
            'tags' => ['Support', '24/7'],
            'description' => 'Our experienced travel concierges help you choose the right package, financing plan, and matches to attend. We respond within 2 hours during business days.',
        ],
        [
            'image' => '/assets/img/backdrops/plane-square.jpg',
            'title' => 'Custom Travel Requests',
            'subtitle' => 'Tell us what you want to see',
            'tags' => ['Custom', 'Bespoke'],
            'description' => 'Planning to combine matches with a city break, family visit, or group tour? Send us your wishlist and we will craft a bespoke itinerary and quote.',
        ],
        [
            'image' => '/assets/img/IMG-13.jpg',
            'title' => 'Partner With Us',
            'subtitle' => 'Travel agencies, sponsors, media',
            'tags' => ['B2B', 'Partners'],
            'description' => 'We collaborate with travel agencies, brands, and media across Africa and beyond. Reach out to explore partnership opportunities for AFCON 2027 and beyond.',
        ],
    ],
];
