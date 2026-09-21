<?php

/*
|--------------------------------------------------------------------------
| Public section-page heroes
|--------------------------------------------------------------------------
|
| Default hero content for the standalone public section pages (/about,
| /features, /services, /news, /contact). Each renders the shared PageHero
| (the same layout as the partner hub hero).
|
| Every field is overridable per page in the admin CMS via SiteSetting keys
| `page_hero_{slug}_{field}` (field ∈ title, eyebrow, tagline, background,
| cta_label, cta_href) — HomeController merges the override over these
| defaults. Backgrounds are public paths (served from /public).
|
*/

return [

    'about' => [
        'eyebrow' => 'About TFE',
        'title' => 'About Us',
        'tagline' => 'Premium travel experiences for football fans who value comfort, style and a personal approach — trusted destinations, exclusive offers, top-tier service.',
        'background' => 'assets/img/backdrops/stadium-fans.jpg',
        'cta_label' => 'Explore what we offer',
        'cta_href' => '/services',
    ],

    'features' => [
        'eyebrow' => 'Features',
        'title' => 'Core Features',
        'tagline' => 'Structured financing, flexible payment plans, community savings and all-inclusive packages — built so the tournament fits your budget.',
        'background' => 'assets/img/backdrops/nigeria-fans.jpg',
        'cta_label' => 'See our services',
        'cta_href' => '/services',
    ],

    'services' => [
        'eyebrow' => 'Services',
        'title' => 'What We Offer',
        'tagline' => 'Comprehensive solutions to make your tournament dream a reality — from flexible financing to complete travel packages.',
        'background' => 'assets/img/backdrops/field-night.jpg',
        'cta_label' => 'Get started',
        'cta_href' => '/register',
    ],

    'news' => [
        'eyebrow' => 'News',
        'title' => 'Latest News',
        'tagline' => 'The latest stories from across the football world — fixtures, teams, transfers and tournament news.',
        'background' => 'assets/img/backdrops/night-stadium.jpg',
        'cta_label' => null,
        'cta_href' => null,
    ],

    'contact' => [
        'eyebrow' => 'Contact',
        'title' => 'Get in Touch',
        'tagline' => 'Questions about our packages or financing? Our team is here to help you plan your trip with confidence.',
        'background' => 'assets/img/backdrops/brazil-fan-landscape.jpg',
        'cta_label' => 'Message us',
        'cta_href' => 'mailto:hello@tfe.okjtech.co.ke',
    ],

];
