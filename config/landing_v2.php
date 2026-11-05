<?php

/*
|--------------------------------------------------------------------------
| Landing page v2 + audience walkthroughs (UX review, 2 Nov 2026, Track C)
|--------------------------------------------------------------------------
|
| The copy and structure of /v2 (Pages/HomeV2.jsx) and the three walkthrough
| pages (/for-fans, /for-partners, /for-schools — Pages/Walkthrough.jsx).
| v2 is the landing page rebuilt on the Najenga/Naoa structure ("show how
| the platform is used before asking anyone to sign in"), live beside the
| current landing page so the tester group can compare the two.
|
| Every TEXT leaf here can be overridden from Admin -> Content -> Landing v2
| without a deploy: App\Support\LandingContent overlays SiteSetting rows
| keyed `landing_v2_{dot.path}` (e.g. `landing_v2_hero.title`). Structure is
| NOT overridable — ids, icons, partner types, links and image paths stay in
| this file (LandingContent::STRUCTURAL), so a CMS edit cannot break a page.
|
| Claims must be true of the platform today. Payment copy in particular does
| not promise M-Pesa or card: in-app payment depends on Paystack being
| configured (see docs/meetings/shots/README.md, B6).
|
| Image paths are root-relative (the Sprint 49 rule). Feature screenshots are
| produced from the seeded demo by scripts/landing-v2-screens.mjs.
*/

$screen = fn (string $name) => "/assets/img/landing-v2/{$name}.webp";

return [

    'hero' => [
        'eyebrow' => 'Football travel, planned in one place',
        'title' => 'Follow your team. We will plan the rest.',
        'tagline' => 'Matches, flights, stays and tickets for the tournaments you care about — priced in minutes, booked with verified partners, and shared with the fans going too.',
        'primary_cta' => 'Plan my trip',
        'secondary_cta' => 'See how it works',
    ],

    'about' => [
        'eyebrow' => 'About The Football Experience',
        'title' => 'Every part of a football trip, in one place.',
        'text' => 'TFE brings together the people who make a tournament trip happen — travel agents, hotels, airlines, ticketing and finance partners — so a fan can go from "I want to be there" to a booked trip without stitching it together alone.',
    ],

    // Who TFE is for. Each card leads to its walkthrough page.
    'audiences' => [
        [
            'id' => 'fans',
            'icon' => 'fas fa-person-running',
            'title' => 'For fans',
            'text' => 'Pick a match, get a price for the whole trip, and book it with a partner you can trust.',
            'link_label' => 'How it works for fans',
            'image' => '/assets/img/backdrops/argentina-fans.jpg',
        ],
        [
            'id' => 'partners',
            'icon' => 'fas fa-handshake',
            'title' => 'For partners',
            'text' => 'Publish trips, stays, seats and finance offers where travelling fans are already planning.',
            'link_label' => 'How it works for partners',
            'image' => '/assets/img/backdrops/stadium-fans.jpg',
        ],
        [
            'id' => 'schools',
            'icon' => 'fas fa-school',
            'title' => 'For schools & academies',
            'text' => 'Plan a group trip as an institution, declare the party once, and find programmes and learning resources.',
            'link_label' => 'How it works for schools',
            'image' => '/assets/img/backdrops/field-top.jpg',
        ],
    ],

    // Labels for the facts strip. The NUMBERS are counted from the database
    // on every request (HomeController::landingFacts) — never typed in here.
    // "singular|plural" — picked by the count, so one tournament does not
    // read "1 tournaments".
    'facts' => [
        'tournaments' => 'tournament open for planning|tournaments open for planning',
        'cities' => 'host city to travel to|host cities to travel to',
        'matches' => 'match to plan a trip around|matches to plan a trip around',
        'partners' => 'verified partner on the platform|verified partners on the platform',
    ],

    // The sticky "On this page" bar. ids are the section anchors.
    'sections' => [
        ['id' => 'journey', 'label' => 'How it works'],
        ['id' => 'inside', 'label' => 'Inside TFE'],
        ['id' => 'trips', 'label' => 'Trips'],
        ['id' => 'partners', 'label' => 'Partners'],
        ['id' => 'community', 'label' => 'Community'],
        ['id' => 'faq', 'label' => 'Questions'],
    ],

    // A fan's trip, start to finish. Each step opens the feature that does it
    // (`area` selects a tab in the explorer below).
    'journey' => [
        'eyebrow' => 'How it works',
        'title' => 'From "I want to be there" to the stadium gate',
        'text' => 'A tournament trip is a dozen decisions. TFE takes them in order, and each step is one screen.',
        'steps' => [
            ['area' => 'plan', 'title' => 'Pick your matches', 'text' => 'Choose the fixtures you want to see, or just how many — no account needed.', 'link_label' => 'Planning'],
            ['area' => 'plan', 'title' => 'Get a price for the whole trip', 'text' => 'Flights, stay, tickets and the rest, estimated together in your own currency.', 'link_label' => 'Budgeting'],
            ['area' => 'book', 'title' => 'Book with a verified partner', 'text' => 'Pick a partner package at its published price, or save your plan for partners to quote on.', 'link_label' => 'Booking'],
            ['area' => 'finance', 'title' => 'Pay, or spread the cost', 'text' => 'Pay online where your partner offers it, or ask a finance partner to help you get there.', 'link_label' => 'Paying'],
            ['area' => 'community', 'title' => 'Travel with your tribe', 'text' => 'Find the fans going too, before, during and after the tournament.', 'link_label' => 'Community'],
        ],
    ],

    // "Inside TFE" — the feature explorer. Each area shows what the fan will
    // actually see: a desktop and a phone screenshot from the seeded demo.
    'explorer' => [
        'eyebrow' => 'Inside TFE',
        'title' => 'Everything a trip needs',
        'text' => 'Pick an area to see the screen that does it, on a laptop and on a phone.',
        'areas' => [
            [
                'id' => 'plan',
                'icon' => 'fas fa-calculator',
                'label' => 'Plan & budget',
                'summary' => 'A trip estimate in three steps, then a full budget you can save and come back to.',
                'points' => [
                    'Matches, flights, stay, tickets and extras in one total',
                    'Seven currencies, including KES, NGN, ZAR and XOF',
                    'Save several plans and compare them',
                ],
                'cta_label' => 'Plan my trip',
                'action' => 'planner',
                'desktop' => $screen('plan-desktop'),
                'phone' => $screen('plan-phone'),
            ],
            [
                'id' => 'book',
                'icon' => 'fas fa-suitcase-rolling',
                'label' => 'Book a trip',
                'summary' => 'Fixed-price packages from verified partners, bookable in a few taps.',
                'points' => [
                    'Every package shows who runs it and what it includes',
                    'Your place is held for 48 hours while you pay',
                    'Track every step of the trip after you book',
                ],
                'cta_label' => 'See trips you can book',
                'action' => 'section:trips',
                'desktop' => $screen('book-desktop'),
                'phone' => $screen('book-phone'),
            ],
            [
                'id' => 'tickets',
                'icon' => 'fas fa-ticket',
                'label' => 'Tickets & seats',
                'summary' => 'Match tickets by seating tier, chosen on a 3D map of the stadium.',
                'points' => [
                    'Four seating tiers per match, each with its own price',
                    'See where you will sit before you pay',
                    'Availability shown only where real seats are on sale',
                ],
                'cta_label' => 'Browse matches',
                'action' => 'planner',
                'desktop' => $screen('tickets-desktop'),
                'phone' => $screen('tickets-phone'),
            ],
            [
                'id' => 'finance',
                'icon' => 'fas fa-coins',
                'label' => 'Financing',
                'summary' => 'Ask a finance partner to help you pay for a saved trip, and follow the decision.',
                'points' => [
                    'Request financing against a trip you have planned',
                    'The decision comes from the finance partner, not TFE',
                    'Updates arrive in your notifications',
                ],
                'cta_label' => 'Plan a trip to finance',
                'action' => 'planner',
                'desktop' => $screen('finance-desktop'),
                'phone' => $screen('finance-phone'),
            ],
            [
                'id' => 'community',
                'icon' => 'fas fa-users', // fa-people-group is FA 6.1; the bundle is 6.0.0
                'label' => 'Tribes & community',
                'summary' => 'Fan communities for each tournament: open ones anyone can read, private ones you ask to join.',
                'points' => [
                    'Join tribes of fans travelling to the same matches',
                    'Discussions, posts and meetups',
                    'Public tribes are readable without an account',
                ],
                'cta_label' => 'Browse tribes',
                'action' => 'link:/tribes',
                'desktop' => $screen('community-desktop'),
                'phone' => $screen('community-phone'),
            ],
        ],
    ],

    'trips' => [
        'eyebrow' => 'Book in a few taps',
        'title' => 'Trips you can book now',
        'text' => 'Fixed-price packages from verified partners. Pick one, sign in, and pay — no quote to wait for.',
    ],

    // Partner categories. Grouped from the platform's partner types until the
    // team settles the final list (plan item A6). Each type links to the
    // directory filtered to it.
    'partners' => [
        'eyebrow' => 'Partners',
        'title' => 'The people behind every trip',
        'text' => 'Every partner has its own page on TFE, with the trips, stays and offers it publishes. Verified partners are marked.',
        'cta_label' => 'Become a partner',
        'directory_label' => 'See every partner',
        'categories' => [
            ['id' => 'travel', 'icon' => 'fas fa-plane-departure', 'label' => 'Travel & stays', 'text' => 'Travel agents, hotels and airlines that package the trip itself.', 'types' => ['travel_agent', 'hotel_provider', 'airline']],
            ['id' => 'money', 'icon' => 'fas fa-building-columns', 'label' => 'Money', 'text' => 'Banks and finance partners that help fans pay for the journey.', 'types' => ['finance_partner']],
            ['id' => 'tickets', 'icon' => 'fas fa-ticket', 'label' => 'Tickets & events', 'text' => 'Ticket sellers and organisers of the events around the matches.', 'types' => ['ticketing_partner', 'event_organiser']],
            ['id' => 'football', 'icon' => 'fas fa-futbol', 'label' => 'Football', 'text' => 'Clubs, federations, sponsors and the schools programmes growing the next generation.', 'types' => ['club', 'federation', 'sponsor', 'school_community']],
        ],
    ],

    'faq' => [
        'eyebrow' => 'Questions',
        'title' => 'Before you start',
        'items' => [
            ['q' => 'Do I need an account to plan a trip?', 'a' => 'No. You can pick matches and get a price for the whole trip without signing in. You only create an account when you want to save the plan or book it, and your estimate comes with you.'],
            ['q' => 'How do I pay?', 'a' => 'Where online payment is switched on for your booking, you pay securely through Paystack, by card or M-Pesa. Otherwise your travel partner arranges payment with you directly. Either way your place is held for 48 hours while you pay.'],
            ['q' => 'Can I spread the cost?', 'a' => 'You can ask a finance partner to help pay for a trip you have saved. The finance partner makes the decision and you follow it on your Financing page.'],
            ['q' => 'Who are the partners?', 'a' => 'Travel agents, hotels, airlines, ticketing and finance partners, clubs and schools programmes. Each has its own page on TFE, and the ones TFE has verified are marked.'],
            ['q' => 'Does it work on my phone?', 'a' => 'Yes. TFE works in any modern browser, on a phone as well as a laptop. There is nothing to install.'],
            ['q' => 'How do partners join?', 'a' => 'Get in touch through the Contact page. Once your partner account is set up, you can publish listings straight away and they appear on your own page.'],
            ['q' => 'Can a school book a group trip?', 'a' => 'Yes. Schools, academies and community groups register as an institution, plan the trip like any fan, and declare the travelling party once — how many adults and how many under-18s. TFE holds no pupil details.'],
        ],
    ],

    'closing' => [
        'title' => 'Your next tournament starts with a plan.',
        'text' => 'Get a price for the whole trip in three steps. No account needed until you are ready to book.',
        'primary' => 'Plan my trip',
        'secondary' => 'Browse trips',
    ],

    /*
    |----------------------------------------------------------------------
    | Walkthrough pages — one per audience
    |----------------------------------------------------------------------
    | A step-by-step page that shows how each audience uses TFE before they
    | sign up (Najenga's Journey shape). `cta.action` is what the final button
    | does: planner | link:{path} | route:{name}.
    */
    'walkthroughs' => [

        'fans' => [
            'title' => 'For fans',
            'eyebrow' => 'For fans',
            'headline' => 'Your tournament trip, step by step',
            'tagline' => 'How a fan goes from picking a match to walking into the stadium — and what TFE does at each step.',
            'background' => '/assets/img/backdrops/argentina-fans.jpg',
            'chapters' => [
                ['title' => 'Pick your matches', 'text' => 'Start from a match, a stadium or just a number of games. The planner works without an account.', 'points' => ['Filter by team, venue or stage', 'Plan from any stadium on the home page'], 'image' => $screen('planner-desktop'), 'phone' => $screen('planner-phone')],
                ['title' => 'Get a price for the whole trip', 'text' => 'Tell us where you are travelling from, how many of you are going and for how long. You get one estimate for flights, stay, tickets and extras, in your own currency.', 'points' => ['Seven currencies', 'See what each part costs'], 'image' => $screen('plan-desktop'), 'phone' => null],
                ['title' => 'Book with a partner', 'text' => 'Pick a verified partner\'s package at its published price, or save your plan so partners can quote on it.', 'points' => ['Who runs each trip is always shown', 'Your place is held for 48 hours while you pay'], 'image' => $screen('book-desktop'), 'phone' => $screen('book-phone')],
                ['title' => 'Choose your seats', 'text' => 'Match tickets are sold by seating tier, and the 3D stadium map shows where each tier is.', 'points' => ['Four tiers per match', 'Real availability only'], 'image' => $screen('tickets-desktop'), 'phone' => $screen('tickets-phone')],
                ['title' => 'Pay, or spread the cost', 'text' => 'Pay online where your partner offers it, or ask a finance partner to help with a trip you have saved.', 'points' => ['Financing decisions come from the finance partner', 'Every update lands in your notifications'], 'image' => $screen('finance-desktop'), 'phone' => $screen('finance-phone')],
                ['title' => 'Travel with your tribe', 'text' => 'Join the fans going to the same matches, share plans and meet up on the day.', 'points' => ['Open and private tribes', 'Posts, replies and events'], 'image' => $screen('community-desktop'), 'phone' => $screen('community-phone')],
            ],
            'cta' => ['title' => 'Ready to plan yours?', 'text' => 'Three steps to a price for the whole trip. No account needed yet.', 'label' => 'Plan my trip', 'action' => 'planner', 'secondary' => 'See the whole platform'],
        ],

        'partners' => [
            'title' => 'For partners',
            'eyebrow' => 'For partners',
            'headline' => 'Reach fans while they are planning',
            'tagline' => 'How travel agents, hotels, airlines, ticketing and finance partners work on TFE — from publishing an offer to measuring what it brings in.',
            'background' => '/assets/img/backdrops/stadium-fans.jpg',
            'chapters' => [
                ['title' => 'Your own page on TFE', 'text' => 'Every partner gets a branded page with its story, its colours and everything it offers. Verified partners are marked across the platform.', 'points' => ['Your logo, accent colour and hero image', 'A link fans can share'], 'image' => $screen('partner-hub-desktop'), 'phone' => null],
                ['title' => 'Publish what you sell', 'text' => 'Packages, tours, offers, events and programmes go live as soon as you save them, and you can hide or show each one at any time.', 'points' => ['Trip details only where they apply', 'Published under your name'], 'image' => $screen('partner-listings-desktop'), 'phone' => null],
                ['title' => 'Answer fans who picked you', 'text' => 'When a fan builds a trip around one of your listings, their brief lands in your queue. You quote, and they are notified.', 'points' => ['Only briefs for your own listings', 'School groups arrive with their party declared'], 'image' => $screen('partner-requests-desktop'), 'phone' => null],
                ['title' => 'See what it brings in', 'text' => 'Your dashboard counts the requests you receive through TFE, the ones you approve, and the revenue they bring in.', 'points' => ['Figures for your own listings only'], 'image' => $screen('partner-dashboard-desktop'), 'phone' => null],
            ],
            'cta' => ['title' => 'Bring your offer to travelling fans', 'text' => 'Tell us who you are and what you offer, and we will set up your partner account.', 'label' => 'Become a partner', 'action' => 'route:contact', 'secondary' => 'See the whole platform'],
        ],

        'schools' => [
            'title' => 'For schools & academies',
            'eyebrow' => 'For schools & academies',
            'headline' => 'Group trips and programmes, run by the institution',
            'tagline' => 'How a school, academy or community group plans a tournament trip on TFE — and where to find programmes and learning resources.',
            'background' => '/assets/img/backdrops/field-top.jpg',
            'chapters' => [
                ['title' => 'Register as an institution', 'text' => 'The account belongs to the school, not to one teacher, and a named official acts for it.', 'points' => ['Schools, universities, academies, clubs and community groups', 'Reviewed before it is verified'], 'image' => $screen('register-institution-desktop'), 'phone' => null],
                ['title' => 'Plan the trip', 'text' => 'Use the same planner and budget tools as any fan, for the whole party.', 'points' => ['One estimate for the group', 'Save it and share it with partners'], 'image' => $screen('plan-desktop'), 'phone' => null],
                ['title' => 'Declare the party once', 'text' => 'Say how many adults and how many under-18s are travelling, and who signs for the school. Partners see that minors are travelling; TFE holds no pupil details.', 'points' => ['The school runs consent and safeguarding', 'Partners are told minors are travelling'], 'image' => $screen('school-dashboard-desktop'), 'phone' => null],
                ['title' => 'Programmes and learning', 'text' => 'Find leagues, festivals and coaching programmes from schools partners, and open guides for coaches, parents and players in the Learning Hub.', 'points' => ['The Learning Hub is free to read', 'Programmes show dates, place and price'], 'image' => $screen('learn-desktop'), 'phone' => null],
            ],
            'cta' => ['title' => 'Register your school or academy', 'text' => 'Three short steps, and a named official to act for the institution.', 'label' => 'Create an institution account', 'action' => 'route:register.institution', 'secondary' => 'See the whole platform'],
        ],
    ],
];
