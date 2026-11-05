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
    /*
    | The v2 twins of the public pages (/v2/about, /v2/partners, …). Same
    | rules as above: wording here, wiring (icons, actions, ids) ignored by
    | the CMS. `{name}` in a hub or tournament line is that page's name.
    */
    'pages' => [
        'about' => [
            'sections' => [
                ['id' => 'what', 'label' => 'What TFE is'],
                ['id' => 'principles', 'label' => 'How we work'],
                ['id' => 'behind', 'label' => 'Who is behind it'],
            ],
            'principles' => [
                'eyebrow' => 'How we work',
                'title' => 'Four things we hold to',
                'text' => 'They decide what we build, and what we leave to the people better placed to do it.',
                'items' => [
                    ['icon' => 'fas fa-calculator', 'title' => 'An estimate before an account', 'text' => 'Anyone can price a trip in three steps. We only ask you to sign in when you want to save or book it.'],
                    ['icon' => 'fas fa-circle-check', 'title' => 'Partners we have checked', 'text' => 'Trips, flights, tickets and financing come from partners on TFE. A verified badge means we have checked who they are.'],
                    ['icon' => 'fas fa-building-columns', 'title' => 'Your savings stay with your bank', 'text' => 'Saving and financing run through bank and finance partners. TFE never holds, receives or moves your savings.'],
                    ['icon' => 'fas fa-school', 'title' => 'Schools stay in charge of their pupils', 'text' => 'A school declares its own group through a named official. It runs consent and supervision; TFE holds no pupil data.'],
                ],
            ],
            'behind' => [
                'eyebrow' => 'Who is behind it',
                'title' => 'Built by OKJ Technologies with Terik Tours',
                'text' => 'A technology team and a travel company, building the trip we wanted to take ourselves: one plan, one price and the people who make it happen, all in one place.',
            ],
            'closing' => ['title' => 'See what your trip would cost', 'text' => 'Three steps, no account.', 'primary' => 'Plan my trip', 'secondary' => 'How it works'],
        ],
        'features' => [
            'sections' => [
                ['id' => 'inside', 'label' => 'The main screens'],
                ['id' => 'more', 'label' => 'Also built in'],
            ],
            'more' => [
                'eyebrow' => 'Also built in',
                'title' => 'The smaller things that add up',
                'text' => 'Some depend on a partner switching them on, and we say where they do.',
                'items' => [
                    ['icon' => 'fas fa-coins', 'title' => 'Seven currencies', 'text' => 'Plan in US dollars, euros, pounds, shillings, rand, naira or CFA francs. A saved plan keeps the currency you chose.'],
                    ['icon' => 'fas fa-cube', 'title' => '3D seat map', 'text' => 'See each ground tier by tier, and how full it is where tickets are on sale through TFE.'],
                    ['icon' => 'fas fa-mobile-screen', 'title' => 'M-Pesa', 'text' => 'Pay a booking from your phone, where in-app payment is switched on.'],
                    ['icon' => 'fas fa-comment-sms', 'title' => 'Text alerts', 'text' => 'Quotes, payments and holds about to expire, by SMS or WhatsApp. Only if you ask, and one reply stops them.'],
                    ['icon' => 'fas fa-fingerprint', 'title' => 'Passkeys', 'text' => 'Sign in with your fingerprint or face instead of a password, and add two-step sign-in.'],
                    ['icon' => 'fas fa-users', 'title' => 'Tribes', 'text' => 'Supporter groups for each tournament, public, by request or by invitation.'],
                ],
            ],
            'closing' => ['title' => 'Try it with your own trip', 'text' => 'Pick a match and see the price, before you sign up.', 'primary' => 'Plan my trip', 'secondary' => 'See the services'],
        ],
        'services' => [
            'sections' => [
                ['id' => 'for-fans', 'label' => 'For fans'],
                ['id' => 'for-partners', 'label' => 'For partners'],
                ['id' => 'for-schools', 'label' => 'For schools'],
                ['id' => 'partners', 'label' => 'Partner types'],
            ],
            'groups' => [
                [
                    'id' => 'for-fans',
                    'eyebrow' => 'For fans',
                    'title' => 'Everything between you and the stadium',
                    'text' => 'One plan from the match you pick to the trip home.',
                    'items' => ['A trip estimate in three steps, no account needed', 'Packages from verified partners, with the price up front', 'Match tickets by tier, through ticketing partners', 'Financing requests to a finance partner, or saving with your bank', 'Your whole trip, and what happens next, on one booking page'],
                    'link_label' => 'How it works for fans',
                    'action' => 'link:/for-fans',
                ],
                [
                    'id' => 'for-partners',
                    'eyebrow' => 'For partners',
                    'title' => 'A shop window and a request queue',
                    'text' => 'Travel agents, airlines, hotels, ticketing and finance partners, clubs and sponsors.',
                    'items' => ['A branded hub page fans can find in the directory', 'Listings that go live the moment you save them', 'Trip requests from fans who picked your listing', 'Your own numbers: requests, sales and revenue'],
                    'link_label' => 'How it works for partners',
                    'action' => 'link:/for-partners',
                ],
                [
                    'id' => 'for-schools',
                    'eyebrow' => 'For schools and academies',
                    'title' => 'Group trips, declared once',
                    'text' => 'An institution account, with a named official who acts for it.',
                    'items' => ['Plan group trips on the same tools fans use', 'Declare the travelling party: adults, under-18s, youngest age', 'Partners see that minors travel on every request', 'Free coaching and safeguarding guides in the Learning Hub'],
                    'link_label' => 'How it works for schools',
                    'action' => 'link:/for-schools',
                ],
            ],
            'closing' => ['title' => 'Start with an estimate', 'text' => 'It takes three steps, and you can save it later.', 'primary' => 'Plan my trip', 'secondary' => 'Contact us'],
        ],
        'news' => [
            'intro' => 'Headlines from around football, from public news sources. Each one opens on the publisher\'s site.',
            'empty' => 'The news feed is not switched on yet.',
            'closing' => ['title' => 'Going to the tournament?', 'text' => 'Price your trip before the crowds do.', 'primary' => 'Plan my trip', 'secondary' => 'Our partners'],
        ],
        'contact' => [
            'sections' => [
                ['id' => 'message', 'label' => 'Send a message'],
                ['id' => 'routes', 'label' => 'Quicker routes'],
                ['id' => 'faq', 'label' => 'Questions'],
            ],
            'form' => [
                'eyebrow' => 'Send a message',
                'title' => 'Tell us what you need',
                'text' => 'Messages reach the TFE team. We reply by email.',
                'subjects' => ['Planning a trip', 'Becoming a partner', 'A school or group trip', 'My booking', 'Something else'],
                'submit' => 'Send message',
            ],
            'routes' => [
                'eyebrow' => 'Quicker routes',
                'title' => 'You may not need to wait for us',
                'items' => [
                    ['icon' => 'fas fa-plane', 'title' => 'Pricing a trip', 'text' => 'The planner gives you an estimate straight away.', 'label' => 'Plan my trip', 'action' => 'planner'],
                    ['icon' => 'fas fa-handshake', 'title' => 'Finding a partner', 'text' => 'Every partner on TFE, by type and tournament.', 'label' => 'Browse partners', 'action' => 'link:/partners'],
                    ['icon' => 'fas fa-school', 'title' => 'A school trip', 'text' => 'Register your institution in three steps.', 'label' => 'Register a school', 'action' => 'route:register.institution'],
                ],
            ],
            'closing' => ['title' => 'Ready when you are', 'text' => 'Price a trip now, and talk to us about the rest.', 'primary' => 'Plan my trip', 'secondary' => 'Back to the top'],
        ],
        'partners' => [
            'eyebrow' => 'Partners',
            'title' => 'Every partner behind your trip',
            'tagline' => 'Travel agents, airlines, hotels, ticketing and finance partners, clubs and schools programmes: the organisations whose offers you book on TFE.',
            'search' => 'Search partners by name, service or place',
            'type_label' => 'Type',
            'tournament_label' => 'Tournament',
            'all' => 'All',
            'count' => 'partner|partners',
            'empty_title' => 'No partners match those filters',
            'empty_text' => 'Try another type, or clear the tournament.',
            'clear' => 'Clear filters',
            'closing' => ['title' => 'Want your business here?', 'text' => 'Publish your packages, flights, tickets or programmes to fans planning their trip.', 'primary' => 'Become a partner', 'secondary' => 'How it works for partners'],
        ],
        'hub' => [
            'sections' => [
                ['id' => 'about', 'label' => 'About'],
                ['id' => 'support', 'label' => 'What they do'],
                ['id' => 'steps', 'label' => 'How it works'],
                ['id' => 'tickets', 'label' => 'Tickets'],
                ['id' => 'listings', 'label' => 'On offer'],
            ],
            'verified' => 'Verified partner',
            'contact' => 'Contact',
            'website' => 'Website',
            'offer_title' => 'What they offer',
            'support_eyebrow' => 'What they do',
            'support_title' => 'How {name} supports your trip',
            'steps_eyebrow' => 'How it works',
            'steps_title' => 'From first look to the day itself',
            'tickets_eyebrow' => 'Tickets',
            'tickets_title' => 'On-sale fixtures',
            'listings_eyebrow' => 'On offer',
            'listings_title' => 'Available from {name}',
            'listings_empty' => 'Nothing published yet. Check back soon.',
            'closing' => ['title' => 'Plan a trip around what {name} offers', 'text' => 'Get an estimate first, then book the package that fits.', 'primary' => 'Plan my trip', 'secondary' => 'All partners'],
        ],
        'tournament' => [
            'sections' => [
                ['id' => 'glance', 'label' => 'At a glance'],
                ['id' => 'highlights', 'label' => 'Highlights'],
                ['id' => 'offers', 'label' => 'Plan your trip'],
                ['id' => 'teams', 'label' => 'Teams'],
            ],
            'glance_eyebrow' => 'At a glance',
            'offers_eyebrow' => 'Plan your trip',
            'offers_title' => 'Trips to {name}',
            'offers_text' => 'Packages from verified partners. Open one to see what it includes.',
            'teams_eyebrow' => 'Teams',
            'closing' => ['title' => 'Going to {name}?', 'text' => 'See what your trip would cost, in three steps.', 'primary' => 'Plan my trip', 'secondary' => 'Our partners'],
            'closing_past' => ['title' => 'The next tournament is already in motion', 'text' => 'Lock in your plans early.', 'primary' => 'Plan the next one', 'secondary' => 'Our partners'],
        ],
        'listing' => [
            'sections' => [
                ['id' => 'details', 'label' => 'Details'],
                ['id' => 'how', 'label' => 'How booking works'],
                ['id' => 'more', 'label' => 'More like this'],
            ],
            'how' => [
                'eyebrow' => 'How booking works',
                'title' => 'Three steps from here',
                'steps' => [
                    ['title' => 'Book now', 'text' => 'Choose this listing. Your place is held for 48 hours.'],
                    ['title' => 'Sign in or sign up', 'text' => 'One account for your plan, your booking and your messages.'],
                    ['title' => 'Pay', 'text' => 'Pay in the app where that is switched on, or through the partner\'s own checkout.'],
                ],
            ],
            'more_eyebrow' => 'More like this',
            'closing' => ['title' => 'Not sure yet?', 'text' => 'Price the whole trip first: flights, stay and tickets together.', 'primary' => 'Plan my trip', 'secondary' => 'All partners'],
        ],
        'learn' => [
            'closing' => ['title' => 'Running a programme?', 'text' => 'Schools and academies publish leagues, courses and guides on TFE.', 'primary' => 'Register a school', 'secondary' => 'How it works for schools'],
        ],
        'tribes' => [
            'closing' => ['title' => 'Travel with your people', 'text' => 'Join a tribe for your tournament, or start one.', 'primary' => 'Join TFE', 'secondary' => 'Plan my trip'],
        ],
    ],
];
