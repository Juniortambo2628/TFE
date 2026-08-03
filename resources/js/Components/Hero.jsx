import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import DashboardModal from '@/Components/Common/DashboardModal';
import { useTournament } from '@/Context/TournamentContext';

const calculateTimeLeft = (targetDate) => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }
    return timeLeft;
};

const TEAM_CODES = {
    'Mexico': 'mx', 'Argentina': 'ar', 'Germany': 'de', 'Cameroon': 'cm',
    'USA': 'us', 'Italy': 'it', 'Spain': 'es', 'Morocco': 'ma',
    'Brazil': 'br', 'France': 'fr', 'Nigeria': 'ng', 'Korea Republic': 'kr',
    'Canada': 'ca', 'Belgium': 'be', 'Croatia': 'hr', 'Ghana': 'gh',
    'Japan': 'jp', 'England': 'gb', 'Portugal': 'pt', 'Uruguay': 'uy',
    'Netherlands': 'nl', 'Senegal': 'sn', 'Poland': 'pl', 'Saudi Arabia': 'sa',
    'South Africa': 'za', 'Qatar': 'qa', 'Switzerland': 'ch', 'Haiti': 'ht',
    'Scotland': 'sc', 'Paraguay': 'py', 'Australia': 'au', "Cote d'Ivoire": 'ci',
    'Ecuador': 'ec', 'Curacao': 'cw', 'Tunisia': 'tn', 'Egypt': 'eg',
    'IR Iran': 'ir', 'New Zealand': 'nz', 'Cabo Verde': 'cv', 'Norway': 'no',
    'Austria': 'at', 'Jordan': 'jo', 'Algeria': 'dz', 'Colombia': 'co',
    'Uzbekistan': 'uz', 'Panama': 'pa', 'TBD': 'TBD', 'TBD (Playoff A)': 'TBD',
    'TBD (Playoff B)': 'TBD', 'TBD (Playoff D)': 'TBD', 'TBD (Playoff F)': 'TBD',
    'TBD (Playoff I)': 'TBD', 'TBD (Playoff K)': 'TBD'
};

const STADIUM_MATCHES = {
    'Estadio Azteca': [ // Mexico City Stadium
        { id: 1, home: 'mx', away: 'za', date: '11 June 2026', time: '12:00', type: 'Match 1 (Group A)' },
        { id: 24, home: 'uz', away: 'co', date: '17 June 2026', time: '19:00', type: 'Match 24 (Group K)' },
        { id: 53, home: 'TBD', away: 'mx', date: '24 June 2026', time: '19:00', type: 'Match 53 (Group A)' },
        { id: 79, home: 'TBD', away: 'TBD', date: '30 June 2026', time: '16:00', type: 'Round of 32' },
        { id: 92, home: 'TBD', away: 'TBD', date: '5 July 2026', time: '16:00', type: 'Round of 16' },
    ],
    'Estadio Akron': [ // Estadio Guadalajara
        { id: 2, home: 'kr', away: 'TBD', date: '11 June 2026', time: '18:00', type: 'Match 2 (Group A)' },
        { id: 28, home: 'mx', away: 'kr', date: '18 June 2026', time: '19:00', type: 'Match 28 (Group A)' },
        { id: 48, home: 'co', away: 'TBD', date: '23 June 2026', time: '19:00', type: 'Match 48 (Group K)' },
        { id: 66, home: 'uy', away: 'es', date: '26 June 2026', time: '19:00', type: 'Match 66 (Group H)' },
    ],
    'Estadio BBVA': [ // Estadio Monterrey
        { id: 12, home: 'TBD', away: 'tn', date: '14 June 2026', time: '19:00', type: 'Match 12 (Group F)' },
        { id: 36, home: 'tn', away: 'jp', date: '20 June 2026', time: '19:00', type: 'Match 36 (Group F)' },
        { id: 54, home: 'za', away: 'kr', date: '24 June 2026', time: '19:00', type: 'Match 54 (Group A)' },
        { id: 75, home: 'TBD', away: 'TBD', date: '29 June 2026', time: '13:00', type: 'Round of 32' },
    ],
    'BMO Field': [ // Toronto Stadium
        { id: 3, home: 'ca', away: 'TBD', date: '12 June 2026', time: '12:00', type: 'Match 3 (Group B)' },
        { id: 21, home: 'gh', away: 'pa', date: '17 June 2026', time: '10:00', type: 'Match 21 (Group L)' },
        { id: 33, home: 'de', away: 'ci', date: '20 June 2026', time: '10:00', type: 'Match 33 (Group E)' },
        { id: 46, home: 'pa', away: 'hr', date: '23 June 2026', time: '13:00', type: 'Match 46 (Group L)' },
        { id: 62, home: 'sn', away: 'TBD', date: '26 June 2026', time: '10:00', type: 'Match 62 (Group I)' },
        { id: 83, home: 'TBD', away: 'TBD', date: '2 July 2026', time: '10:00', type: 'Round of 32' },
    ],
    'BC Place': [ // BC Place Vancouver
        { id: 6, home: 'au', away: 'TBD', date: '13 June 2026', time: '13:00', type: 'Match 6 (Group D)' },
        { id: 27, home: 'ca', away: 'qa', date: '18 June 2026', time: '16:00', type: 'Match 27 (Group B)' },
        { id: 51, home: 'ch', away: 'ca', date: '24 June 2026', time: '16:00', type: 'Match 51 (Group B)' },
        { id: 64, home: 'nz', away: 'be', date: '26 June 2026', time: '16:00', type: 'Match 64 (Group G)' },
        { id: 85, home: 'TBD', away: 'TBD', date: '2 July 2026', time: '16:00', type: 'Round of 32' },
        { id: 96, home: 'TBD', away: 'TBD', date: '7 July 2026', time: '16:00', type: 'Round of 16' },
    ],
    'SoFi Stadium': [ // Los Angeles Stadium
        { id: 4, home: 'us', away: 'py', date: '12 June 2026', time: '18:00', type: 'Match 4 (Group D)' },
        { id: 15, home: 'ir', away: 'nz', date: '15 June 2026', time: '16:00', type: 'Match 15 (Group G)' },
        { id: 26, home: 'ch', away: 'TBD', date: '18 June 2026', time: '13:00', type: 'Match 26 (Group B)' },
        { id: 39, home: 'be', away: 'ir', date: '21 June 2026', time: '16:00', type: 'Match 39 (Group G)' },
        { id: 59, home: 'TBD', away: 'us', date: '25 June 2026', time: '19:00', type: 'Match 59 (Group D)' },
        { id: 73, home: 'TBD', away: 'TBD', date: '28 June 2026', time: '16:00', type: 'Round of 32' },
        { id: 84, home: 'TBD', away: 'TBD', date: '2 July 2026', time: '13:00', type: 'Round of 32' },
        { id: 98, home: 'TBD', away: 'TBD', date: '10 July 2026', time: '16:00', type: 'Quarter-Final' },
    ],
    'MetLife Stadium': [ // New York New Jersey Stadium
        { id: 7, home: 'br', away: 'ma', date: '13 June 2026', time: '16:00', type: 'Match 7 (Group C)' },
        { id: 17, home: 'fr', away: 'sn', date: '16 June 2026', time: '10:00', type: 'Match 17 (Group I)' },
        { id: 41, home: 'no', away: 'sn', date: '22 June 2026', time: '10:00', type: 'Match 41 (Group I)' },
        { id: 56, home: 'ec', away: 'de', date: '25 June 2026', time: '10:00', type: 'Match 56 (Group E)' },
        { id: 67, home: 'pa', away: 'gb', date: '27 June 2026', time: '10:00', type: 'Match 67 (Group L)' },
        { id: 77, home: 'TBD', away: 'TBD', date: '30 June 2026', time: '10:00', type: 'Round of 32' },
        { id: 91, home: 'TBD', away: 'TBD', date: '5 July 2026', time: '13:00', type: 'Round of 16' },
        { id: 104, home: 'TBD', away: 'TBD', date: '19 July 2026', time: '16:00', type: 'WORLD CUP FINAL' },
    ],
    'AT&T Stadium': [ // Dallas Stadium
        { id: 11, home: 'nl', away: 'jp', date: '14 June 2026', time: '16:00', type: 'Match 11 (Group F)' },
        { id: 22, home: 'gb', away: 'hr', date: '17 June 2026', time: '13:00', type: 'Match 22 (Group L)' },
        { id: 43, home: 'ar', away: 'at', date: '22 June 2026', time: '16:00', type: 'Match 43 (Group J)' },
        { id: 57, home: 'jp', away: 'TBD', date: '25 June 2026', time: '16:00', type: 'Match 57 (Group F)' },
        { id: 70, home: 'jo', away: 'ar', date: '27 June 2026', time: '16:00', type: 'Match 70 (Group J)' },
        { id: 78, home: 'TBD', away: 'TBD', date: '30 June 2026', time: '13:00', type: 'Round of 32' },
        { id: 88, home: 'TBD', away: 'TBD', date: '3 July 2026', time: '16:00', type: 'Round of 32' },
        { id: 93, home: 'TBD', away: 'TBD', date: '6 July 2026', time: '13:00', type: 'Round of 16' },
        { id: 101, home: 'TBD', away: 'TBD', date: '14 July 2026', time: '16:00', type: 'Semi-Final' },
    ],
    'Mercedes-Benz Stadium': [ // Atlanta Stadium
        { id: 14, home: 'es', away: 'cv', date: '15 June 2026', time: '13:00', type: 'Match 14 (Group H)' },
        { id: 25, home: 'TBD', away: 'za', date: '18 June 2026', time: '10:00', type: 'Match 25 (Group A)' },
        { id: 38, home: 'es', away: 'sa', date: '21 June 2026', time: '13:00', type: 'Match 38 (Group H)' },
        { id: 50, home: 'ma', away: 'ht', date: '24 June 2026', time: '10:00', type: 'Match 50 (Group C)' },
        { id: 72, home: 'TBD', away: 'uz', date: '27 June 2026', time: '19:00', type: 'Match 72 (Group K)' },
        { id: 80, home: 'TBD', away: 'TBD', date: '1 July 2026', time: '10:00', type: 'Round of 32' },
        { id: 95, home: 'TBD', away: 'TBD', date: '7 July 2026', time: '13:00', type: 'Round of 16' },
        { id: 102, home: 'TBD', away: 'TBD', date: '15 July 2026', time: '16:00', type: 'Semi-Final' },
    ],
    'NRG Stadium': [ // Houston Stadium
        { id: 10, home: 'de', away: 'cw', date: '14 June 2026', time: '13:00', type: 'Match 10 (Group E)' },
        { id: 23, home: 'pt', away: 'TBD', date: '17 June 2026', time: '16:00', type: 'Match 23 (Group K)' },
        { id: 35, home: 'nl', away: 'TBD', date: '20 June 2026', time: '16:00', type: 'Match 35 (Group F)' },
        { id: 47, home: 'pt', away: 'uz', date: '23 June 2026', time: '16:00', type: 'Match 47 (Group K)' },
        { id: 65, home: 'cv', away: 'sa', date: '26 June 2026', time: '19:00', type: 'Match 65 (Group H)' },
        { id: 76, home: 'TBD', away: 'TBD', date: '29 June 2026', time: '16:00', type: 'Round of 32' },
        { id: 90, home: 'TBD', away: 'TBD', date: '4 July 2026', time: '16:00', type: 'Round of 16' },
    ],
    'Lincoln Financial Field': [ // Philadelphia Stadium
        { id: 9, home: 'ci', away: 'ec', date: '14 June 2026', time: '10:00', type: 'Match 9 (Group E)' },
        { id: 29, home: 'br', away: 'ht', date: '19 June 2026', time: '10:00', type: 'Match 29 (Group C)' },
        { id: 42, home: 'fr', away: 'TBD', date: '22 June 2026', time: '13:00', type: 'Match 42 (Group I)' },
        { id: 55, home: 'cw', away: 'ci', date: '25 June 2026', time: '10:00', type: 'Match 55 (Group E)' },
        { id: 68, home: 'hr', away: 'gh', date: '27 June 2026', time: '10:00', type: 'Match 68 (Group L)' },
        { id: 89, home: 'TBD', away: 'TBD', date: '4 July 2026', time: '13:00', type: 'Round of 16' },
    ],
    'Hard Rock Stadium': [ // Miami Stadium
        { id: 13, home: 'sa', away: 'uy', date: '15 June 2026', time: '10:00', type: 'Match 13 (Group H)' },
        { id: 37, home: 'uy', away: 'cv', date: '21 June 2026', time: '10:00', type: 'Match 37 (Group H)' },
        { id: 49, home: 'sc', away: 'br', date: '24 June 2026', time: '10:00', type: 'Match 49 (Group C)' },
        { id: 71, home: 'co', away: 'pt', date: '27 June 2026', time: '19:00', type: 'Match 71 (Group K)' },
        { id: 86, home: 'TBD', away: 'TBD', date: '3 July 2026', time: '10:00', type: 'Round of 32' },
        { id: 99, home: 'TBD', away: 'TBD', date: '11 July 2026', time: '13:00', type: 'Quarter-Final' },
        { id: 103, home: 'TBD', away: 'TBD', date: '18 July 2026', time: '16:00', type: 'Third Place' },
    ],
    'Lumen Field': [ // Seattle Stadium
        { id: 16, home: 'be', away: 'eg', date: '15 June 2026', time: '19:00', type: 'Match 16 (Group G)' },
        { id: 32, home: 'us', away: 'au', date: '19 June 2026', time: '19:00', type: 'Match 32 (Group D)' },
        { id: 52, home: 'TBD', away: 'qa', date: '24 June 2026', time: '16:00', type: 'Match 52 (Group B)' },
        { id: 63, home: 'eg', away: 'ir', date: '26 June 2026', time: '16:00', type: 'Match 63 (Group G)' },
        { id: 82, home: 'TBD', away: 'TBD', date: '1 July 2026', time: '16:00', type: 'Round of 32' },
        { id: 94, home: 'TBD', away: 'TBD', date: '6 July 2026', time: '16:00', type: 'Round of 16' },
    ],
    'Levi\'s Stadium': [ // San Francisco Bay Area Stadium
        { id: 8, home: 'qa', away: 'ch', date: '13 June 2026', time: '19:00', type: 'Match 8 (Group B)' },
        { id: 20, home: 'at', away: 'jo', date: '16 June 2026', time: '19:00', type: 'Match 20 (Group J)' },
        { id: 31, home: 'TBD', away: 'py', date: '19 June 2026', time: '16:00', type: 'Match 31 (Group D)' },
        { id: 44, home: 'jo', away: 'dz', date: '22 June 2026', time: '19:00', type: 'Match 44 (Group J)' },
        { id: 60, home: 'py', away: 'au', date: '25 June 2026', time: '19:00', type: 'Match 60 (Group D)' },
        { id: 81, home: 'TBD', away: 'TBD', date: '1 July 2026', time: '13:00', type: 'Round of 32' },
    ],
    'Gillette Stadium': [ // Boston Stadium
        { id: 5, home: 'ht', away: 'sc', date: '13 June 2026', time: '10:00', type: 'Match 5 (Group C)' },
        { id: 18, home: 'TBD', away: 'no', date: '16 June 2026', time: '13:00', type: 'Match 18 (Group I)' },
        { id: 30, home: 'sc', away: 'ma', date: '19 June 2026', time: '13:00', type: 'Match 30 (Group C)' },
        { id: 45, home: 'gb', away: 'gh', date: '23 June 2026', time: '10:00', type: 'Match 45 (Group L)' },
        { id: 61, home: 'no', away: 'fr', date: '26 June 2026', time: '10:00', type: 'Match 61 (Group I)' },
        { id: 74, home: 'TBD', away: 'TBD', date: '29 June 2026', time: '10:00', type: 'Round of 32' },
        { id: 97, home: 'TBD', away: 'TBD', date: '9 July 2026', time: '16:00', type: 'Quarter-Final' },
    ],
    'GEHA Field at Arrowhead Stadium': [ // Kansas City Stadium
        { id: 19, home: 'ar', away: 'dz', date: '16 June 2026', time: '16:00', type: 'Match 19 (Group J)' },
        { id: 34, home: 'ec', away: 'cw', date: '20 June 2026', time: '13:00', type: 'Match 34 (Group E)' },
        { id: 58, home: 'tn', away: 'nl', date: '25 June 2026', time: '16:00', type: 'Match 58 (Group F)' },
        { id: 69, home: 'dz', away: 'at', date: '27 June 2026', time: '16:00', type: 'Match 69 (Group J)' },
        { id: 87, home: 'TBD', away: 'TBD', date: '3 July 2026', time: '13:00', type: 'Round of 32' },
        { id: 100, home: 'TBD', away: 'TBD', date: '11 July 2026', time: '16:00', type: 'Quarter-Final' },
    ],
};

const TEAM_NAMES = {
    'mx': 'Mexico', 'ar': 'Argentina', 'de': 'Germany', 'cm': 'Cameroon',
    'us': 'USA', 'it': 'Italy', 'es': 'Spain', 'ma': 'Morocco',
    'br': 'Brazil', 'fr': 'France', 'ng': 'Nigeria', 'kr': 'South Korea',
    'ca': 'Canada', 'be': 'Belgium', 'hr': 'Croatia', 'gh': 'Ghana',
    'jp': 'Japan', 'gb': 'England', 'pt': 'Portugal', 'uy': 'Uruguay',
    'nl': 'Netherlands', 'sn': 'Senegal', 'pl': 'Poland', 'sa': 'Saudi Arabia',
    'za': 'South Africa', 'qa': 'Qatar', 'ch': 'Switzerland', 'ht': 'Haiti',
    'sc': 'Scotland', 'py': 'Paraguay', 'au': 'Australia', 'ci': "Cote d'Ivoire",
    'ec': 'Ecuador', 'cw': 'Curacao', 'tn': 'Tunisia', 'eg': 'Egypt',
    'ir': 'IR Iran', 'nz': 'New Zealand', 'cv': 'Cabo Verde', 'no': 'Norway',
    'at': 'Austria', 'jo': 'Jordan', 'dz': 'Algeria', 'co': 'Colombia',
    'uz': 'Uzbekistan', 'pa': 'Panama',     'TBD': 'To Be Determined'
};

// Map Wikipedia team names to flag codes for non-WC2026 tournaments
function teamNameToCode(name) {
    if (!name) return null;
    var n = name.toLowerCase().trim();
    // Direct lookup first
    if (TEAM_CODES[name]) return TEAM_CODES[name];
    // Common Wikipedia variations
    var variations = {
        'united states': 'us', 'usa': 'us', 'united states of america': 'us',
        'south korea': 'kr', 'korea republic': 'kr', 'republic of korea': 'kr',
        'iran': 'ir', 'islamic republic of iran': 'ir',
        'ivory coast': 'ci', "cote d'ivoire": 'ci', "côte d'ivoire": 'ci',
        'cape verde': 'cv', 'cabo verde': 'cv',
        'curacao': 'cw', 'curaçao': 'cw',
        'england': 'gb', 'scotland': 'gb', 'wales': 'gb',
        'republic of ireland': 'ie', 'ireland': 'ie',
        'czech republic': 'cz', 'czechia': 'cz',
        'turkey': 'tr', 'türkiye': 'tr',
        'netherlands': 'nl', 'holland': 'nl',
        'germany': 'de', 'france': 'fr', 'spain': 'es', 'italy': 'it',
        'brazil': 'br', 'argentina': 'ar', 'portugal': 'pt',
        'belgium': 'be', 'croatia': 'hr', 'morocco': 'ma',
        'japan': 'jp', 'australia': 'au', 'mexico': 'mx',
        'canada': 'ca', 'uruguay': 'uy', 'colombia': 'co',
        'ecuador': 'ec', 'senegal': 'sn', 'ghana': 'gh',
        'cameroon': 'cm', 'nigeria': 'ng', 'tunisia': 'tn',
        'egypt': 'eg', 'algeria': 'dz', 'south africa': 'za',
        'qatar': 'qa', 'saudi arabia': 'sa', 'saudi': 'sa',
        'poland': 'pl', 'denmark': 'dk', 'sweden': 'se',
        'switzerland': 'ch', 'austria': 'at', 'norway': 'no',
        'paraguay': 'py', 'panama': 'pa', 'jamaica': 'jm',
        'haiti': 'ht', 'usmnt': 'us', 'socceroos': 'au',
        'black stars': 'gh', 'super eagles': 'ng', 'atlas lions': 'ma',
         'new zealand': 'nz', 'new-zealand': 'nz',
    };
    if (variations[n]) return variations[n];
    // Fallback: try lowercase as flag code (works for "mexico" -> "mx"? No, need 2-letter)
    return null;
}

const DEFAULT_MATCHES = [
    { id: 101, home: 'br', away: 'fr', date: 'June 2026', time: 'TBD', type: 'Group Stage' },
    { id: 102, home: 'ng', away: 'kr', date: 'June 2026', time: 'TBD', type: 'Group Stage' },
    { id: 103, home: 'mx', away: 'de', date: 'June 2026', time: 'TBD', type: 'Group Stage' },
    { id: 104, home: 'gb', away: 'jp', date: 'June 2026', time: 'TBD', type: 'Group Stage' },
];

export default function Hero({ stadiums: stadiumsProp }) {
    const { assetUrl } = usePage().props;
    var tournamentCtx = useTournament();
    var tournament = tournamentCtx.tournament;
    var targetDate = tournament ? tournament.start_date : '2026-06-11T00:00:00';
    var baseUrl = assetUrl || '';
    var heroImage = (tournament && tournament.hero_image) ? baseUrl + tournament.hero_image : baseUrl + 'assets/img/backdrops/ball-on-field.jpg';
    var tournamentStatus = tournament ? tournament.status : 'upcoming';
    var isConcluded = tournamentStatus === 'concluded';
    var wikipediaVenues = (tournament && tournament.venues) || [];
    var wikipediaLogo = (tournament && tournament.wikipedia_logo) || null;
    var wikipediaMatches = (tournament && tournament.wikipedia_matches) || [];
    var wikipediaAwards = (tournament && tournament.wikipedia_awards) || {};
    var wikipediaTeams = (tournament && tournament.teams) || [];
    var topScorer = (tournament && tournament.top_scorer) || null;
    var wikipediaFlags = (tournament && tournament.wikipedia_flags) || {};

    var stadiums;
    if (wikipediaVenues.length > 0) {
        stadiums = wikipediaVenues.map(function (v) {
            return {
                name: v.name || v.extract?.substring(0, 40) || 'Unknown Venue',
                location: v.location || 'Wikipedia venue',
                capacity: v.capacity || 'TBD',
                history: v.opened || '',
                fun_fact: v.extract || '',
                image: v.thumbnail || v.image || heroImage,
                matches: [],
                attribution: 'Data from Wikipedia',
                url: v.url || '',
            };
        });
    } else if (tournament && tournament.id !== 'wc_2026') {
        stadiums = [{
            name: tournament.short_name + ' Venues',
            location: (tournament.hosts || []).join(', '),
            capacity: 'TBD',
            history: '',
            fun_fact: '',
            image: heroImage,
            matches: [],
            attribution: '',
        }];
    } else {
        stadiums = stadiumsProp || [];
    }

    // Guard against empty stadiums array - keep at least one placeholder so
    // activeStadium.name and carousel interval don't crash.
    if (stadiums.length === 0) {
        stadiums = [{
            name: tournament ? tournament.short_name : 'Tournament Venue',
            location: (tournament && tournament.hosts) ? tournament.hosts.join(', ') : '',
            capacity: 'TBD',
            history: '',
            fun_fact: '',
            image: heroImage,
            matches: [],
            attribution: '',
        }];
    }

    const [currentSlide, setCurrentSlide] = useState(0);
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [loaderReady, setLoaderReady] = useState(typeof window !== 'undefined' && window.tfeLoaderFinished === true);
    const [activeModalTab, setActiveModalTab] = useState('matches');
    
    const carouselRef = useRef(null);
    const controls = useAnimation();

    // Listen for loader completion event
    useEffect(() => {
        const handleLoaderFinished = () => setLoaderReady(true);
        window.addEventListener('tfeLoaderFinished', handleLoaderFinished);
        // Check if already finished (in case event fired before mount)
        if (window.tfeLoaderFinished) setLoaderReady(true);
        return () => window.removeEventListener('tfeLoaderFinished', handleLoaderFinished);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    // Reset countdown when tournament switches
    useEffect(() => {
        setTimeLeft(calculateTimeLeft(targetDate));
        setCurrentSlide(0);
    }, [targetDate]);

    // Auto-rotate hero slider ONLY after loader is ready
    useEffect(() => {
        if (isPaused || !loaderReady) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % stadiums.length);
        }, 10000); 
        return () => clearInterval(interval);
    }, [stadiums.length, isPaused, loaderReady]);

    const activeStadium = stadiums[currentSlide] || {};
    // Get team flags: config team_flag_codes > Wikipedia teams > host_flag_codes > STADIUM_MATCHES
    var configFlags = (tournament && tournament.team_flag_codes) || [];
    var wikiTeams = (tournament && tournament.teams) || [];
    // Match data source: STADIUM_MATCHES (WC2026) or Wikipedia matches (all others)
    var allMatches = [];
    var activeStadiumLower = (activeStadium.name || '').toLowerCase();
    // Prefer hardcoded STADIUM_MATCHES (has full schedule); merge Wikipedia scores where available
    var hardcodedMatches = STADIUM_MATCHES[activeStadium.name] || [];
    if (hardcodedMatches.length > 0) {
        allMatches = hardcodedMatches.map(function(m) {
            // Try to find a Wikipedia match with a score for the same teams/date
            var wikiMatch = wikipediaMatches.find(function(wm) {
                var wCode1 = teamNameToCode(wm.team1) || wm.team1;
                var wCode2 = teamNameToCode(wm.team2) || wm.team2;
                return (wCode1 === m.home && wCode2 === m.away) || (wCode1 === m.away && wCode2 === m.home);
            });
            return {
                id: m.id,
                home: m.home,
                away: m.away,
                score: (wikiMatch && wikiMatch.score) || m.score || null,
                date: m.date || (wikiMatch && wikiMatch.date) || '',
                time: m.time || (wikiMatch && wikiMatch.time) || '',
                type: m.type || 'Match',
                stadium: m.stadium || (wikiMatch && wikiMatch.stadium) || '',
                goals1: (wikiMatch && wikiMatch.goals1) || m.goals1 || '',
                goals2: (wikiMatch && wikiMatch.goals2) || m.goals2 || '',
            };
        });
    } else if (wikipediaMatches.length > 0) {
        // Filter Wikipedia matches by current stadium name (fuzzy match)
        var stadiumMatches = wikipediaMatches.filter(function(m) {
            if (!m.stadium) return false;
            return m.stadium.toLowerCase().includes(activeStadiumLower) ||
                   activeStadiumLower.includes(m.stadium.toLowerCase());
        });
        // If no stadium-specific matches found, show all Wikipedia matches
        var matchesToUse = stadiumMatches.length > 0 ? stadiumMatches : wikipediaMatches;
        allMatches = matchesToUse.map(function(m, idx) {
            var code1 = teamNameToCode(m.team1) || m.team1;
            var code2 = teamNameToCode(m.team2) || m.team2;
            return {
                id: idx + 1,
                home: code1,
                away: code2,
                score: m.score || null,
                date: m.date || '',
                time: m.time || '',
                type: m.section || 'Match',
                stadium: m.stadium || '',
                goals1: m.goals1 || '',
                goals2: m.goals2 || '',
            };
        });
    }
    var matches = allMatches;
    var flagCodes;
    if (configFlags.length > 0) {
        flagCodes = configFlags;
    } else if (wikiTeams.length > 0) {
        flagCodes = [...new Set(wikiTeams.map(function (t) { return teamNameToCode(t.name); }).filter(Boolean))];
    } else if (tournament && tournament.host_flag_codes && tournament.host_flag_codes.length > 0) {
        flagCodes = tournament.host_flag_codes;
    } else {
        flagCodes = matches.length > 0 ? [...new Set(matches.flatMap(function (m) { return [m.home, m.away]; }).filter(function (f) { return f !== 'TBD'; }))] : [];
    }
    // Double the list for seamless -50% loop
    var flagTrack = flagCodes.concat(flagCodes);

    const openModal = (team = null) => {
        setSelectedTeam(team);
        setActiveModalTab('matches');
        setShowMatchModal(true);
        setIsPaused(true);
    };

    const closeModal = () => {
        setShowMatchModal(false);
        setIsPaused(false);
    };

    const filteredMatches = selectedTeam 
        ? matches.filter(m => m.home === selectedTeam || m.away === selectedTeam)
        : matches;

    return (
        <section className="banner-section position-relative d-flex align-items-end min-vh-100 tfe-hero-slider" id="hero">
            {/* Background Layer - Only this dissolves on slide change */}
            <div className="stadium-slider-wrapper position-absolute top-0 start-0 w-100 h-100 z-0">
                <AnimatePresence mode='wait'>
                    <motion.div 
                        key={currentSlide}
                        className="stadium-slide active position-absolute top-0 start-0 w-100 h-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        style={{ 
                            backgroundImage: `url(${activeStadium.image || heroImage})`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center' 
                        }}
                    />
                </AnimatePresence>
                <div className="stadium-slide-overlay" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(220,20,60,0.35) 45%, rgba(0,0,0,0.88) 100%)', position: 'absolute', inset: 0 }}></div>
            </div>

            {/* Content Layer - Persistent across slide changes */}
            <div className="container h-100 position-relative z-1">
                <div className="d-flex flex-column gap-4 pb-8 position-relative min-vh-100 justify-content-center pb-5">
                    {/* Row 1: Title + Hosting Countries | Countdown/Winners Card */}
                    <div className="row align-items-center gx-0">
                        {/* Left Content */}
                        <div className="col-xl-7 px-3 px-md-0">
                            <motion.div 
                                key={`left-${tournament ? tournament.id : 'default'}-${currentSlide}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h1 className="mb-3 display-3 text-white lh-1 fw-bold" key={`title-${tournament ? tournament.id : 'default'}`}>{tournament ? tournament.name : 'The Football Experience'}</h1>
                                <p className="mb-3 text-white fs-5 text-opacity-80" style={{ maxWidth: '640px' }}>{tournament ? tournament.tagline : ''}</p>
                                {/* Hosting Countries - flags grouped in one glass pill */}
                                {tournament && tournament.hosts && tournament.hosts.length > 0 && (
                                    <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
                                        <i className="fas fa-map-marker-alt text-danger me-1" style={{ fontSize: '0.85rem' }}></i>
                                        <span className="d-inline-flex align-items-center px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            {tournament.hosts.map(function(host, idx) {
                                                var code = (tournament.host_flag_codes && tournament.host_flag_codes[idx]) || null;
                                                if (!code) code = TEAM_CODES[host] || teamNameToCode(host);
                                                return code && code !== 'TBD' ? (
                                                    <img key={idx} src={`${assetUrl}assets/Flags/${code}.png`} alt={host} title={host} style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '2px', marginLeft: idx > 0 ? '-4px' : 0, border: '1px solid rgba(0,0,0,0.3)' }} onError={function(e) { if (wikipediaFlags[host]) { e.target.src = wikipediaFlags[host]; } }} />
                                                ) : null;
                                            })}
                                      </span>
                                        <span className="text-white text-opacity-70" style={{ fontSize: '0.8rem' }}>{tournament.hosts.join(' · ')}</span>
                                  </div>
                                )}
                                
                                <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-3 gap-md-3 mt-4" style={{ maxWidth: 'fit-content' }}>
                                    <button onClick={() => openModal()} className="btn-glass-pill justify-content-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                        <span>View Matches</span>
                                        <i className="fas fa-calendar-alt ms-2"/>
                                   </button>
                               </div>
                           </motion.div>
                        </div>

                        {/* Right Content: Countdown/Winners Card — compact with red header */}
                        <div className="col-xl-5 d-none d-xl-block">
                            <div className="d-flex justify-content-end">
                                <motion.div
                                    key={`countdown-${tournament ? tournament.id : 'default'}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="rounded-3xl overflow-hidden border border-white/10"
                                    style={{ maxWidth: '420px', width: '100%' }}
                                >
                                    {/* Red header bar — mimics FIFA+ matches card */}
                                    <div className="d-flex align-items-center justify-content-between px-4 py-2" style={{ background: '#DC143C' }}>
                                        <div className="d-flex align-items-center gap-2">
                                            {wikipediaLogo ? (
                                                <img src={wikipediaLogo} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '3px' }} />
                                            ) : (
                                                <i className="fas fa-trophy text-white" style={{ fontSize: '0.75rem' }}></i>
                                            )}
                                            <span className="text-white fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.03em' }}>TFE</span>
                                        </div>
                                        <span className="text-white fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.03em' }}>{isConcluded ? 'Results' : 'Countdown'}</span>
                                    </div>
                                    {/* Content area with 2-column layout */}
                                    <div className="d-flex" style={{ background: 'rgba(15,15,20,0.95)', minHeight: '180px' }}>
                                        {/* Left column: logo / visual */}
                                        <div className="d-flex align-items-center justify-content-center p-3" style={{ width: '120px', background: 'rgba(220,20,60,0.06)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                            {wikipediaLogo ? (
                                                <img src={wikipediaLogo} alt="" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', padding: '6px' }} />
                                            ) : (
                                                <div style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'rgba(220,20,60,0.12)' }}>
                                                    <i className="fas fa-trophy" style={{ color: '#DC143C', fontSize: '1.6rem' }}></i>
                                                </div>
                                            )}
                                        </div>
                                        {/* Right column: data */}
                                        <div className="flex-grow-1 p-3">
                                            <div className="fw-bold text-white mb-1" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>{tournament ? tournament.name : 'Tournament'}</div>
                                            <span className={'px-2 py-0.5 rounded-pill fw-bold d-inline-block mb-2 ' + (tournament && tournament.status === 'concluded' ? 'text-bg-secondary' : (tournament && tournament.status === 'ongoing' ? 'text-bg-success' : 'text-bg-warning'))} style={{ fontSize: '0.5rem', letterSpacing: '0.05em' }}>{tournament ? tournament.status.toUpperCase() : ''}</span>
                                            {isConcluded ? (
                                                <div>
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        {tournament.winner && teamNameToCode(tournament.winner) && (
                                                            <img src={`${assetUrl}assets/Flags/${teamNameToCode(tournament.winner)}.png`} alt="" style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} onError={function(e) { if (wikipediaFlags[tournament.winner]) { e.target.src = wikipediaFlags[tournament.winner]; } }} />
                                                        )}
                                                        <span className="text-warning fw-bold" style={{ fontSize: '0.85rem' }}>{tournament.winner || 'TBD'}</span>
                                                    </div>
                                                    {tournament.runner_up && (
                                                        <div className="d-flex align-items-center gap-2 mb-1">
                                                            <span className="text-white text-opacity-40" style={{ fontSize: '0.55rem', minWidth: '55px' }}>2nd</span>
                                                            {teamNameToCode(tournament.runner_up) && (
                                                                <img src={`${assetUrl}assets/Flags/${teamNameToCode(tournament.runner_up)}.png`} alt="" style={{ width: '16px', height: '11px', objectFit: 'cover', borderRadius: '2px' }} onError={function(e) { if (wikipediaFlags[tournament.runner_up]) { e.target.src = wikipediaFlags[tournament.runner_up]; } }} />
                                                            )}
                                                            <span className="text-white" style={{ fontSize: '0.65rem' }}>{tournament.runner_up}</span>
                                                        </div>
                                                    )}
                                                    {tournament.second_runner_up && (
                                                        <div className="d-flex align-items-center gap-2 mb-1">
                                                            <span className="text-white text-opacity-40" style={{ fontSize: '0.55rem', minWidth: '55px' }}>3rd</span>
                                                            {teamNameToCode(tournament.second_runner_up) && (
                                                                <img src={`${assetUrl}assets/Flags/${teamNameToCode(tournament.second_runner_up)}.png`} alt="" style={{ width: '16px', height: '11px', objectFit: 'cover', borderRadius: '2px' }} onError={function(e) { if (wikipediaFlags[tournament.second_runner_up]) { e.target.src = wikipediaFlags[tournament.second_runner_up]; } }} />
                                                            )}
                                                            <span className="text-white" style={{ fontSize: '0.65rem' }}>{tournament.second_runner_up}</span>
                                                        </div>
                                                    )}
                                                    {tournament.final_score && (
                                                        <div className="mt-2 pt-2 border-top border-white/10">
                                                            <span className="text-white text-opacity-40" style={{ fontSize: '0.5rem' }}>Final </span>
                                                            <span className="text-white fw-bold" style={{ fontSize: '0.65rem' }}>{tournament.final_score}</span>
                                                        </div>
                                                    )}
                                                    {tournament.top_scorer && tournament.top_scorer.name && (
                                                        <div className="mt-1">
                                                            <span className="text-white text-opacity-40" style={{ fontSize: '0.5rem' }}>Top: </span>
                                                            <span className="text-white fw-bold" style={{ fontSize: '0.6rem' }}>{tournament.top_scorer.name}</span>
                                                            {tournament.top_scorer.goals && <span className="text-danger" style={{ fontSize: '0.55rem' }}> ({tournament.top_scorer.goals})</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="d-flex gap-2 mt-1">
                                                    {[
                                                        { label: 'D', value: timeLeft.days || 0, max: 1000 },
                                                        { label: 'H', value: timeLeft.hours || 0, max: 24 },
                                                        { label: 'M', value: timeLeft.minutes || 0, max: 60 },
                                                        { label: 'S', value: timeLeft.seconds || 0, max: 60 }
                                                    ].map((item, idx) => {
                                                        const size = 48;
                                                        const radius = 20;
                                                        const center = size / 2;
                                                        const circumference = 2 * Math.PI * radius;
                                                        const strokeDashoffset = circumference - (item.value / item.max) * circumference;
                                                        return (
                                                            <div key={idx} className="d-flex flex-column align-items-center">
                                                                <div className="position-relative" style={{ width: size + 'px', height: size + 'px' }}>
                                                                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                                                                        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                                                                        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#DC143C" strokeWidth="2" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                                                                    </svg>
                                                                    <div className="position-absolute top-50 start-50 translate-middle text-center">
                                                                        <div className="text-white fw-bold font-monospace" style={{ fontSize: '0.85rem' }}>{String(item.value).padStart(2, '0')}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-white-50 mt-1" style={{ fontSize: '8px', letterSpacing: '0.05em' }}>{item.label}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Tournament Stats Card — full width, aligned with row above */}
                    <div className="row gx-0">
                        <div className="col-12 px-3">
                            <motion.div
                                key={`stats-${tournament ? tournament.id : 'default'}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="rounded-3xl overflow-hidden position-relative border border-white/10"
                                style={{ minHeight: '200px' }}
                            >
                                {/* Stadium slideshow background */}
                                <AnimatePresence mode='wait'>
                                    <motion.div
                                        key={currentSlide}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.8, ease: "easeInOut" }}
                                        style={{
                                            position: 'absolute', inset: 0,
                                            backgroundImage: `url(${activeStadium.image || heroImage})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    />
                                </AnimatePresence>
                                {/* Dark overlay */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.65) 100%)',
                                }} />
                                {/* Content */}
                                <div className="position-relative p-4 d-flex align-items-center gap-4 flex-wrap flex-md-nowrap">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="fas fa-chart-bar text-danger" style={{ fontSize: '0.75rem' }}></i>
                                        <span className="text-white fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Tournament Stats</span>
                                    </div>
                                    <div className="d-flex gap-4 flex-grow-1 justify-content-center">
                                        <div className="text-center px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', minWidth: '120px' }}>
                                            <div className="text-white-50 mb-1" style={{ fontSize: '0.6rem' }}><i className="fas fa-futbol me-1"></i>Teams</div>
                                            <div className="text-white fw-bold" style={{ fontSize: '1.5rem' }}>{tournament.facts?.teams || tournament.num_teams || 'TBD'}</div>
                                        </div>
                                        <div className="text-center px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', minWidth: '120px' }}>
                                            <div className="text-white-50 mb-1" style={{ fontSize: '0.6rem' }}><i className="fas fa-calendar me-1"></i>Matches</div>
                                            <div className="text-white fw-bold" style={{ fontSize: '1.5rem' }}>{tournament.matches_played || 'TBD'}</div>
                                        </div>
                                        <div className="text-center px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', minWidth: '120px' }}>
                                            <div className="text-white-50 mb-1" style={{ fontSize: '0.6rem' }}><i className="fas fa-bullseye me-1"></i>Goals</div>
                                            <div className="text-white fw-bold" style={{ fontSize: '1.5rem' }}>{tournament.total_goals || 'TBD'}</div>
                                        </div>
                                    </div>
                                    <div className="text-white text-opacity-30 d-none d-md-block" style={{ fontSize: '0.6rem' }}>
                                        <i className="fas fa-map-pin me-1"></i>{activeStadium.name}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Stadium Slider Controls */}
                <div className="stadium-controls-arrows d-flex align-items-center gap-3 position-absolute end-0 bottom-0 mb-5 me-5 d-none d-md-flex" style={{ zIndex: 1200, pointerEvents: 'auto' }}>
                    <button 
                        className="slider-nav-btn prev" 
                        onClick={() => setCurrentSlide((prev) => (prev - 1 + stadiums.length) % stadiums.length)}
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button 
                        className="slider-nav-btn next" 
                        onClick={() => setCurrentSlide((prev) => (prev + 1) % stadiums.length)}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            {/* Mobile Countdown (visible only on mobile) */}
            <div className="container d-block d-xl-none position-relative z-1 mb-4">
                <div className="d-flex justify-content-center">
                    <div className="hero-countdown p-3 rounded-2xl d-inline-flex flex-column align-items-center glass-card border border-white/5" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', maxWidth: '340px', width: '100%' }}>
                         {/* Tournament Badge — full name */}
                         <div className="d-flex align-items-center gap-2 mb-2 w-100 justify-content-center">
                             {wikipediaLogo ? (
                                 <img src={wikipediaLogo} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', padding: '2px' }} />
                             ) : (
                                 <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: 'rgba(220,20,60,0.15)' }}>
                                     <i className="fas fa-trophy" style={{ color: '#DC143C', fontSize: '0.9rem' }}></i>
                                 </div>
                             )}
                             <div className="flex-grow-1 text-center">
                                 <div className="fw-bold text-white" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>{tournament ? tournament.name : 'Tournament'}</div>
                                 <span className={'px-2 py-0.5 rounded-pill fw-bold d-inline-block mt-1 ' + (tournament && tournament.status === 'concluded' ? 'text-bg-secondary' : (tournament && tournament.status === 'ongoing' ? 'text-bg-success' : 'text-bg-warning'))} style={{ fontSize: '0.5rem', letterSpacing: '0.05em' }}>{tournament ? tournament.status : ''}</span>
                             </div>
                         </div>

                         {isConcluded ? (
                             <div className="text-center w-100">
                                 {/* Winner */}
                                 <div className="text-white text-opacity-40 mb-1" style={{ fontSize: '0.55rem' }}>Champion</div>
                                 <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                     {tournament.winner && teamNameToCode(tournament.winner) && (
                                         <img src={`${assetUrl}assets/Flags/${teamNameToCode(tournament.winner)}.png`} alt="" style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} onError={function(e) { if (wikipediaFlags[tournament.winner]) { e.target.src = wikipediaFlags[tournament.winner]; } }} />
                                     )}
                                     <div className="text-warning fw-bold" style={{ fontSize: '0.9rem' }}>{tournament.winner || 'To Be Determined'}</div>
                                 </div>

                                 {/* Runner-ups */}
                                 <div className="d-flex gap-2 mb-2 pt-2 border-top border-white/10">
                                     {tournament.runner_up && (
                                         <div className="flex-grow-1 text-center">
                                             <div className="text-white text-opacity-30" style={{ fontSize: '0.45rem' }}>Runner-up</div>
                                             <div className="d-flex align-items-center justify-content-center gap-1">
                                                 {teamNameToCode(tournament.runner_up) && (
                                                     <img src={`${assetUrl}assets/Flags/${teamNameToCode(tournament.runner_up)}.png`} alt="" style={{ width: '14px', height: '10px', objectFit: 'cover', borderRadius: '1px' }} onError={function(e) { if (wikipediaFlags[tournament.runner_up]) { e.target.src = wikipediaFlags[tournament.runner_up]; } }} />
                                                 )}
                                                 <span className="text-white fw-semibold" style={{ fontSize: '0.6rem' }}>{tournament.runner_up}</span>
                                             </div>
                                         </div>
                                     )}
                                     {tournament.second_runner_up && (
                                         <div className="flex-grow-1 text-center">
                                             <div className="text-white text-opacity-30" style={{ fontSize: '0.45rem' }}>3rd Place</div>
                                             <div className="d-flex align-items-center justify-content-center gap-1">
                                                 {teamNameToCode(tournament.second_runner_up) && (
                                                     <img src={`${assetUrl}assets/Flags/${teamNameToCode(tournament.second_runner_up)}.png`} alt="" style={{ width: '14px', height: '10px', objectFit: 'cover', borderRadius: '1px' }} onError={function(e) { if (wikipediaFlags[tournament.second_runner_up]) { e.target.src = wikipediaFlags[tournament.second_runner_up]; } }} />
                                                 )}
                                                 <span className="text-white fw-semibold" style={{ fontSize: '0.6rem' }}>{tournament.second_runner_up}</span>
                                             </div>
                                         </div>
                                     )}
                                 </div>

                                 {/* Final Score */}
                                 {tournament.final_score && (
                                     <div className="pt-2 border-top border-white/10 mb-2">
                                         <div className="text-white text-opacity-30" style={{ fontSize: '0.45rem' }}>Final Score</div>
                                         <div className="text-white fw-bold" style={{ fontSize: '0.75rem' }}>{tournament.final_score}</div>
                                     </div>
                                 )}

                                 {tournament.top_scorer && tournament.top_scorer.name && (
                                     <div className="text-white text-opacity-50 mt-1" style={{ fontSize: '0.55rem' }}>Top Scorer: <span className="text-white fw-bold">{tournament.top_scorer.name}</span>{tournament.top_scorer.goals ? ' (' + tournament.top_scorer.goals + ')' : ''}</div>
                                 )}
                             </div>
                         ) : (
                             <div className="d-flex gap-3">
                                {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
                                    <div key={unit} className="text-center">
                                        <div className="text-white fw-bold fs-5 font-monospace">{String(timeLeft[unit] || 0).padStart(2, '0')}</div>
                                        <div className="text-white-50 text-uppercase small" style={{ fontSize: '8px' }}>{unit.charAt(0)}</div>
                                    </div>
                                ))}
                             </div>
                         )}
                    </div>
                </div>
            </div>

            {/* Bottom Enhancements: Flag Carousel & Stadium Badge */}
            <div className="hero-bottom-section">
                 {/* Flag Carousel Container - Only show if we have flags */}
                {flagTrack.length > 0 && (
                    <motion.div 
                        className="flag-carousel-container mb-3" 
                        ref={carouselRef}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => {
                            if (!showMatchModal) setIsPaused(false);
                        }}
                        key={`flags-${currentSlide}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ pointerEvents: 'auto', zIndex: 100 }}
                    >
                        <motion.div 
                            className="flag-track"
                        drag="x"
                        dragConstraints={carouselRef}
                        initial={{ x: 0 }}
                        animate={!isPaused ? { x: [0, "-50%"] } : {}}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 30,
                                ease: "linear",
                            },
                        }}
                        style={{ pointerEvents: 'auto' }}
                    >
                        {flagTrack.map((f, i) => (
                            <motion.div 
                                key={`${f}-${i}`} 
                                className="flag-item"
                                whileHover={{ scale: 1.1, translateY: -5 }}
                                whileTap={{ scale: 0.9 }}
                                onTap={() => {
                                    openModal(f);
                                }}
                                style={{ pointerEvents: 'auto', zIndex: 110 }}
                            >
                                <img 
                                    src={`${assetUrl}assets/Flags/${f}.png`} 
                                    alt={f} 
                                    draggable="false"
                                    onError={function(e) {
                                        if (wikipediaFlags[f]) {
                                            e.target.src = wikipediaFlags[f];
                                        }
                                    }}
                                />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Navigation Arrows for Flags */}
                    <div className="carousel-arrow left" onClick={(e) => { 
                        e.stopPropagation(); 
                        setIsPaused(true);
                        controls.start({ x: "-25%", transition: { duration: 0.5 } });
                    }}>
                        <i className="fas fa-chevron-left"></i>
                    </div>
                        <div className="carousel-arrow right" onClick={(e) => { 
                            e.stopPropagation(); 
                            setIsPaused(true);
                            controls.start({ x: "-75%", transition: { duration: 0.5 } });
                        }}>
                            <i className="fas fa-chevron-right"></i>
                        </div>
                    </motion.div>
                )}

                {/* Stadium Badge */}
                <motion.div 
                    key={`badge-${currentSlide}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="hero-stadium-badge"
                >
                    <div className="badge-dot"></div>
                    <span className="text-white fw-bold tracking-wider">{activeStadium.name}</span>
                    <span className="text-white text-opacity-50"> — {activeStadium.location.split(',').pop().trim()}</span>
                </motion.div>
            </div>

            {/* Attribution Glass Pill */}
            <motion.div 
                key={`attr-${currentSlide}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="stadium-attribution position-absolute bottom-0 end-0 m-3 z-1"
            >
                <small className="text-white text-opacity-60">{activeStadium.attribution}</small>
            </motion.div>

            {/* Refactored Match Modal using DashboardModal */}
            <DashboardModal
                open={showMatchModal}
                onOpenChange={closeModal}
                title={selectedTeam ? TEAM_NAMES[selectedTeam] : activeStadium.name}
                label={selectedTeam ? "Team Insights" : "Stadium Schedule"}
                activeTab={activeModalTab}
                onTabChange={setActiveModalTab}
                tabs={
                    selectedTeam 
                        ? [
                            { id: 'matches', label: 'Matches', icon: 'fas fa-futbol' },
                            { id: 'details', label: 'Team Info', icon: 'fas fa-info-circle' }
                          ]
                        : [
                            { id: 'matches', label: 'Schedules', icon: 'fas fa-calendar-alt' },
                            { id: 'details', label: 'Stadium Details', icon: 'fas fa-map-marker-alt' },
                            { id: 'stats', label: 'Stats & Awards', icon: 'fas fa-trophy' }
                          ]
                }
            >
                <div className="modal-body p-0">
                    {activeModalTab === 'matches' && (
                        <div className="match-modal-card">
                            <div className="match-modal-list overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '60vh' }}>
                                {filteredMatches.length > 0 ? (
                                    filteredMatches.map((match) => (
                                        <div key={match.id} className="match-item p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                                                {/* Match Info */}
                                                <div className="d-flex flex-column gap-1" style={{ minWidth: '140px' }}>
                                                    <span className={`fw-bold text-uppercase ${match.type.includes('FINAL') ? 'text-warning' : 'text-danger'}`} style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                                                        {match.type}
                                                    </span>
                                                    <span className="text-white text-opacity-50" style={{ fontSize: '0.65rem' }}>{match.date}{match.time ? ' \u2013 ' + match.time : ''}</span>
                                                </div>
                                                
                                                {/* Teams VS Layout */}
                                                <div className="d-flex align-items-center justify-content-center gap-3 flex-grow-1">
                                                    {/* Home Team */}
                                                    <div className="d-flex align-items-center justify-content-end gap-3" style={{ flex: '1' }}>
                                                        <span className="text-white fw-bold text-truncate d-none d-md-inline" style={{ fontSize: '0.8rem' }}>
                                                            {TEAM_NAMES[match.home] || (match.home !== 'TBD' ? match.home.toUpperCase() : 'TBD')}
                                                        </span>
                                                        {match.home === 'TBD' ? (
                                                            <div className="tbd-flag-placeholder"><i className="fas fa-question text-white text-opacity-20" style={{ fontSize: '10px' }}></i></div>
                                                        ) : (
                                                             <img src={`${assetUrl}assets/Flags/${match.home}.png`} alt={match.home} className="match-list-flag" onError={function(e) { if (wikipediaFlags[match.home]) { e.target.src = wikipediaFlags[match.home]; } }} />
                                                        )}
                                                    </div>
                                                    
                                                    {/* VS or Score */}
                                                    <div className="vs-badge">{match.score || 'VS'}</div>
                                                    
                                                    {/* Away Team */}
                                                    <div className="d-flex align-items-center justify-content-start gap-3" style={{ flex: '1' }}>
                                                        {match.away === 'TBD' ? (
                                                            <div className="tbd-flag-placeholder"><i className="fas fa-question text-white text-opacity-20" style={{ fontSize: '10px' }}></i></div>
                                                        ) : (
                                                             <img src={`${assetUrl}assets/Flags/${match.away}.png`} alt={match.away} className="match-list-flag" onError={function(e) { if (wikipediaFlags[match.away]) { e.target.src = wikipediaFlags[match.away]; } }} />
                                                        )}
                                                        <span className="text-white fw-bold text-truncate d-none d-md-inline" style={{ fontSize: '0.8rem' }}>
                                                            {TEAM_NAMES[match.away] || (match.away !== 'TBD' ? match.away.toUpperCase() : 'TBD')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="fas fa-calendar-times text-5xl text-white text-opacity-10 mb-3"></i>
                                        <p className="text-white text-opacity-40">No matches scheduled for this selection.</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-4 p-3 rounded-xl bg-red-600/5 border border-red-600/10">
                                <p className="text-white text-opacity-50 mb-0" style={{ fontSize: '0.7rem', lineHeight: '1.5' }}>
                                    <i className="fas fa-info-circle me-2 text-danger"></i>
                                    Final match schedules and pairings will be confirmed after the official draw. Tickets not yet available for purchase.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeModalTab === 'details' && (
                        <div className="p-4">
                            {selectedTeam ? (
                                <div className="team-details-content">
                                    <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-b border-white/10">
                                         <img src={`${assetUrl}assets/Flags/${selectedTeam}.png`} alt={selectedTeam} style={{ width: '64px', height: 'auto', borderRadius: '4px' }} onError={function(e) { if (wikipediaFlags[selectedTeam]) { e.target.src = wikipediaFlags[selectedTeam]; } }} />
                                        <div>
                                            <h4 className="text-white mb-1">{TEAM_NAMES[selectedTeam] || selectedTeam.toUpperCase()}</h4>
                                            <span className="text-danger fw-bold small tracking-wider">National Team</span>
                                        </div>
                                    </div>
                                    <div className="row g-3">
                                        {/* Try to find Wikipedia team data */}
                                        {(() => {
                                            var wikiTeam = wikipediaTeams.find(function(t) {
                                                var code = teamNameToCode(t.name);
                                                return code === selectedTeam || (t.name && t.name.toLowerCase() === (TEAM_NAMES[selectedTeam] || '').toLowerCase());
                                            });
                                            if (wikiTeam) {
                                                return (
                                                    <>
                                                        <div className="col-md-6">
                                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                                <div className="text-white text-opacity-40 small mb-1">Confederation</div>
                                                                <div className="text-white fw-medium">{wikiTeam.confederation || 'FIFA'}</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                                <div className="text-white text-opacity-40 small mb-1">FIFA Ranking</div>
                                                                <div className="text-white fw-medium">{wikiTeam.rank || wikiTeam.fifa_ranking || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                        {wikiTeam.captain && (
                                                            <div className="col-md-6">
                                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                                    <div className="text-white text-opacity-40 small mb-1">Captain</div>
                                                                    <div className="text-white fw-medium">{wikiTeam.captain}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {wikiTeam.coach && (
                                                            <div className="col-md-6">
                                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                                    <div className="text-white text-opacity-40 small mb-1">Coach</div>
                                                                    <div className="text-white fw-medium">{wikiTeam.coach}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {wikiTeam.federation && (
                                                            <div className="col-12">
                                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                                    <div className="text-white text-opacity-40 small mb-1">Football Association</div>
                                                                    <div className="text-white fw-medium">{wikiTeam.federation}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            }
                                            // Fallback: generic info
                                            return (
                                                <>
                                                    <div className="col-md-6">
                                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                            <div className="text-white text-opacity-40 small mb-1">Confederation</div>
                                                            <div className="text-white fw-medium">FIFA Approved</div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                            <div className="text-white text-opacity-40 small mb-1">Status</div>
                                                            <div className="text-success fw-medium"><i className="fas fa-check-circle me-1"></i> Qualified</div>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <p className="text-white text-opacity-60 mt-4 small leading-relaxed">
                                        {tournament ? 'Qualified for ' + tournament.name + '.' : 'National team information.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="stadium-details-content">
                                    <div className="mb-4 rounded-xl overflow-hidden shadow-lg border border-white/10">
                                        <img src={activeStadium.image} alt={activeStadium.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 d-flex align-items-center gap-3">
                                                <div className="icon-box text-danger"><i className="fas fa-map-marker-alt"></i></div>
                                                <div>
                                                    <div className="text-white text-opacity-40 small">Location</div>
                                                    <div className="text-white">{activeStadium.location}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 d-flex align-items-center gap-3">
                                                <div className="icon-box text-warning"><i className="fas fa-users"></i></div>
                                                <div>
                                                    <div className="text-white text-opacity-40 small">Tournament Capacity</div>
                                                    <div className="text-white">{activeStadium.capacity}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 d-flex align-items-center gap-3">
                                                <div className="icon-box text-info"><i className="fas fa-history"></i></div>
                                                <div>
                                                    <div className="text-white text-opacity-40 small">Year Opened</div>
                                                    <div className="text-white">{activeStadium.history}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {activeStadium.url && (
                                        <div className="mt-3">
                                            <a href={activeStadium.url} target="_blank" rel="noopener noreferrer" className="text-danger text-decoration-none small">
                                                <i className="fas fa-external-link-alt me-1"></i>View on Wikipedia
                                            </a>
                                        </div>
                                    )}
                                    <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <h5 className="text-white fs-6 mb-2">Heritage & Fact</h5>
                                        <p className="text-white text-opacity-60 small mb-0">{activeStadium.fun_fact}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeModalTab === 'stats' && !selectedTeam && (
                        <div className="p-4">
                            <div className="mb-4">
                                <h5 className="text-white fs-6 mb-3">
                                    <i className="fas fa-trophy text-warning me-2"></i>Tournament Results
                                </h5>
                                {tournament.winner ? (
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div className="text-white text-opacity-40 small mb-1">Champion</div>
                                                <div className="text-warning fw-bold">{tournament.winner}</div>
                                            </div>
                                        </div>
                                        {tournament.top_scorer && tournament.top_scorer.name && (
                                            <div className="col-6">
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="text-white text-opacity-40 small mb-1">Top Scorer</div>
                                                    <div className="text-danger fw-bold">{tournament.top_scorer.name}{tournament.top_scorer.goals ? ' (' + tournament.top_scorer.goals + ')' : ''}</div>
                                                </div>
                                            </div>
                                        )}
                                        {tournament.final_score && (
                                            <div className="col-12">
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="text-white text-opacity-40 small mb-1">Final</div>
                                                    <div className="text-white fw-bold">{tournament.final_score}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-white text-opacity-40 small mb-0">Results will be available once the tournament concludes.</p>
                                )}
                            </div>

                            {Object.keys(wikipediaAwards).length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-white fs-6 mb-3">
                                        <i className="fas fa-medal text-info me-2"></i>Awards
                                    </h5>
                                    <div className="row g-3">
                                        {wikipediaAwards.golden_ball && (
                                            <div className="col-md-6">
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="text-white text-opacity-40 small mb-1">Golden Ball</div>
                                                    <div className="text-warning fw-bold">{wikipediaAwards.golden_ball}</div>
                                                </div>
                                            </div>
                                        )}
                                        {wikipediaAwards.golden_boot && (
                                            <div className="col-md-6">
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="text-white text-opacity-40 small mb-1">Golden Boot</div>
                                                    <div className="text-danger fw-bold">{wikipediaAwards.golden_boot}</div>
                                                </div>
                                            </div>
                                        )}
                                        {wikipediaAwards.golden_glove && (
                                            <div className="col-md-6">
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="text-white text-opacity-40 small mb-1">Golden Glove</div>
                                                    <div className="text-info fw-bold">{wikipediaAwards.golden_glove}</div>
                                                </div>
                                            </div>
                                        )}
                                        {wikipediaAwards.best_young && (
                                            <div className="col-md-6">
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="text-white text-opacity-40 small mb-1">Best Young Player</div>
                                                    <div className="text-success fw-bold">{wikipediaAwards.best_young}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {allMatches.length > 0 && (
                                <div>
                                    <h5 className="text-white fs-6 mb-3">
                                        <i className="fas fa-list text-danger me-2"></i>All Matches ({allMatches.length})
                                    </h5>
                                    <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '300px' }}>
                                        {allMatches.map(function(m, idx) {
                                            return (
                                                <div key={idx} className="d-flex align-items-center justify-content-between py-2 border-bottom border-white/5" style={{ fontSize: '0.8rem' }}>
                                                    <span className="text-white text-opacity-40" style={{ minWidth: '80px' }}>{m.date}</span>
                                                    <span className="text-white fw-bold">{TEAM_NAMES[m.home] || m.home}</span>
                                                    <span className="text-danger fw-bold px-2">{m.score || 'vs'}</span>
                                                    <span className="text-white fw-bold">{TEAM_NAMES[m.away] || m.away}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer border-t border-white/5">
                    <button className="btn-glass-pill py-2 px-4 w-100 justify-content-center" onClick={closeModal}>
                        <span>Close View</span>
                    </button>
                </div>
            </DashboardModal>
        </section>
    );
}
