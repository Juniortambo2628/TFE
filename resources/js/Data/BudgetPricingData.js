/**
 * Budget Pricing Adapter
 *
 * Transforms tournament-scoped pricing from the backend (config/tournaments.php)
 * into the shapes the calculator components expect. Falls back to WC2026 defaults
 * if the tournament has no pricing data.
 */

const FALLBACK = {
    currency: 'USD',
    exchange_rate: 130,
    surge_rates: {
        'Group Stage': 1.0, 'Round of 32': 1.1, 'Round of 16': 1.15,
        'Quarter-finals': 1.25, 'Semi-finals': 1.5, 'Third Place': 1.2, 'Final': 2.0,
    },
    ticket_prices: {
        'Group Stage': 150, 'Round of 32': 250, 'Round of 16': 250,
        'Quarter-finals': 350, 'Semi-finals': 600, 'Third Place': 300, 'Final': 1500,
    },
    daily_costs: { food: 60, transport: 30, misc: 20 },
    spending_tiers: { budget: 0.6, mid_range: 1.0, luxury: 1.8 },
    visa_cost: {},
    insurance_daily: 8,
    merchandise_per_match: 40,
    venue_tiers: {},
    flight_origins: [
        { id: 'north_america', label: 'North America (USA/Can/Mex)', economy: 400, business: 1200 },
        { id: 'south_america', label: 'South America', economy: 900, business: 2200 },
        { id: 'europe', label: 'Europe', economy: 1000, business: 2800 },
        { id: 'africa', label: 'Africa', economy: 1300, business: 3500 },
        { id: 'asia', label: 'Asia / Pacific', economy: 1500, business: 4000 },
        { id: 'middle_east', label: 'Middle East', economy: 1200, business: 3200 },
    ],
    accommodation: {
        hostel: 0.4, airbnb: 0.8, '3_star': 1.0, '4_star': 1.6, '5_star': 2.5, resort: 3.5,
    },
};

function merge(base, override) {
    if (!override || typeof override !== 'object') return { ...base };
    const out = { ...base };
    for (const key of Object.keys(override)) {
        if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key]) && base[key]) {
            out[key] = merge(base[key], override[key]);
        } else {
            out[key] = override[key];
        }
    }
    return out;
}

/** Build the CITY_TIERS map from venue_tiers config. */
export function getCityTiers(pricing) {
    const tiers = pricing?.venue_tiers || FALLBACK.venue_tiers;
    const map = {};
    for (const [venue, data] of Object.entries(tiers)) {
        map[venue] = {
            tier: data.tier || 'Standard',
            multiplier: data.multiplier ?? 1.0,
            avg_hotel_3star: data.hotel_3star ?? 160,
        };
    }
    return map;
}

/** Get the flight origins array. */
export function getFlightOrigins(pricing) {
    return pricing?.flight_origins || FALLBACK.flight_origins;
}

/** Get the surge rates map. */
export function getSurgeRates(pricing) {
    return pricing?.surge_rates || FALLBACK.surge_rates;
}

/** Get the base daily costs. */
export function getDailyCosts(pricing) {
    return pricing?.daily_costs || FALLBACK.daily_costs;
}

/** Get the ticket prices map. */
export function getTicketPrices(pricing) {
    return pricing?.ticket_prices || FALLBACK.ticket_prices;
}

/** Get the accommodation multipliers. */
export function getAccommodationFactors(pricing) {
    return pricing?.accommodation || FALLBACK.accommodation;
}

/** Get the exchange rate to KES. */
export function getExchangeRate(pricing) {
    return pricing?.exchange_rate ?? FALLBACK.exchange_rate;
}

/** Get spending tier multipliers. */
export function getSpendingTiers(pricing) {
    return pricing?.spending_tiers || FALLBACK.spending_tiers;
}

/** Get visa costs per host country. */
export function getVisaCosts(pricing) {
    return pricing?.visa_cost || FALLBACK.visa_cost;
}

/** Get daily travel insurance cost. */
export function getInsuranceDaily(pricing) {
    return pricing?.insurance_daily ?? FALLBACK.insurance_daily;
}

/** Get average merchandise spending per match. */
export function getMerchandisePerMatch(pricing) {
    return pricing?.merchandise_per_match ?? FALLBACK.merchandise_per_match;
}
