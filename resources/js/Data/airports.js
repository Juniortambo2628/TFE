/**
 * Airports — city → IATA code lookup for the budget-calculator's
 * flight/hotel search boxes.
 *
 * Sprint 44 — the calculator used to hard-code the Google Flights
 * search as NBO → JFK regardless of tournament, which was wrong for
 * AFCON in East Africa (fan sees "Nairobi → JFK") and everywhere
 * else. This map lets us derive both sides from the active
 * tournament: the arrival airport from the first selected match's
 * venue city (or the tournament's first host if none is selected),
 * and the departure airport from a fallback per flight-origin
 * region when the origin config doesn't ship its own IATA `code`.
 *
 * We keep the map narrow: every venue city used across
 * `config/tournaments.php` today, plus the largest hub per region
 * that shows up in the flight_origins list. Cities not here fall
 * back to the region's default hub, and if that misses too, the
 * calculator still runs — the search box just falls back to the
 * origin's own IATA (SerpAPI accepts a wide range of codes).
 */

/** Host / venue city → IATA airport code. */
export const CITY_IATA = {
    // AFCON 2027 hosts + venue cities
    Nairobi: 'NBO',
    'Dar es Salaam': 'DAR',
    Kampala: 'EBB',
    Mombasa: 'MBA',
    Arusha: 'ARK',
    Kenya: 'NBO',
    Tanzania: 'DAR',
    Uganda: 'EBB',

    // FIFA WC 2026 venue cities
    'New York New Jersey Stadium': 'JFK',
    'Los Angeles Stadium': 'LAX',
    'San Francisco Bay Area Stadium': 'SFO',
    'Miami Stadium': 'MIA',
    'Boston Stadium': 'BOS',
    'Seattle Stadium': 'SEA',
    'Philadelphia Stadium': 'PHL',
    'Dallas Stadium': 'DFW',
    'Houston Stadium': 'IAH',
    'Atlanta Stadium': 'ATL',
    'Toronto Stadium': 'YYZ',
    'BC Place Vancouver': 'YVR',
    'Kansas City Stadium': 'MCI',
    'Mexico City Stadium': 'MEX',
    'Estadio Guadalajara': 'GDL',
    'Estadio Monterrey': 'MTY',
    USA: 'JFK',
    Canada: 'YYZ',
    Mexico: 'MEX',

    // Euro 2024 host cities
    Munich: 'MUC',
    Berlin: 'BER',
    Dortmund: 'DTM',
    Gelsenkirchen: 'DUS',
    Stuttgart: 'STR',
    Hamburg: 'HAM',
    Leipzig: 'LEJ',
    Frankfurt: 'FRA',
    Cologne: 'CGN',
    Germany: 'FRA',
};

/** Flight-origin region id → default hub IATA when the config lacks its own `code`. */
export const REGION_HUB_IATA = {
    africa_east: 'NBO',
    africa_west: 'LOS',
    africa_south: 'JNB',
    africa_north: 'CAI',
    africa: 'JNB',
    europe: 'LHR',
    europe_intra: 'CDG',
    uk: 'LHR',
    middle_east: 'DXB',
    east_asia: 'NRT',
    south_asia: 'DEL',
    south_america: 'GRU',
    north_america: 'JFK',
    oceania: 'SYD',
    asia: 'NRT',
};

/**
 * Resolve an IATA code for a departure city / region.
 * Prefers the flight_origin's own `code` when the config ships one.
 */
export function iataForOrigin(originData) {
    if (!originData) return 'NBO';
    if (originData.code) return String(originData.code).toUpperCase();
    return REGION_HUB_IATA[originData.id] || 'NBO';
}

/**
 * Resolve an IATA code for a destination based on the active tournament
 * plus (optionally) a selected match venue. Falls back to the first host
 * country, then a generic hub, then the platform default (NBO).
 */
export function iataForDestination(tournament, venue = null) {
    if (venue) {
        // Try exact match, then strip a trailing "Stadium" suffix.
        const trimmed = String(venue).replace(/\s+Stadium$/i, '');
        return CITY_IATA[venue] || CITY_IATA[trimmed] || iataForDestination(tournament, null);
    }
    const hosts = tournament?.hosts || [];
    for (const host of hosts) {
        if (CITY_IATA[host]) return CITY_IATA[host];
    }
    return 'NBO';
}

/**
 * Human-friendly destination city string for the hotel search box.
 * A venue like "Nairobi Stadium" → "Nairobi"; falls back to the
 * tournament's first host country when nothing is selected.
 */
export function destinationCityForHotel(tournament, venue = null) {
    if (venue) {
        const trimmed = String(venue).replace(/\s+Stadium$/i, '').trim();
        return trimmed || venue;
    }
    return tournament?.hosts?.[0] || 'Nairobi';
}
