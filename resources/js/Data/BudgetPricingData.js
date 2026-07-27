/**
 * Budget Pricing Data for World Cup 2026 Calculator
 * Contains city tiers, flight estimates by region, and surge pricing logic.
 */

export const CITY_TIERS = {
    // HIGH COST (Tier 1) - Multiplier 1.5x
    'New York New Jersey Stadium': { tier: 'High', multiplier: 1.5, avg_hotel_3star: 250 },
    'Los Angeles Stadium': { tier: 'High', multiplier: 1.45, avg_hotel_3star: 240 },
    'San Francisco Bay Area Stadium': { tier: 'High', multiplier: 1.45, avg_hotel_3star: 240 },
    'Miami Stadium': { tier: 'High', multiplier: 1.4, avg_hotel_3star: 220 },
    'Boston Stadium': { tier: 'High', multiplier: 1.35, avg_hotel_3star: 210 },
    
    // MEDIUM COST (Tier 2) - Multiplier 1.0x (Baseline)
    'Seattle Stadium': { tier: 'Standard', multiplier: 1.1, avg_hotel_3star: 180 },
    'Philadelphia Stadium': { tier: 'Standard', multiplier: 1.1, avg_hotel_3star: 180 },
    'Dallas Stadium': { tier: 'Standard', multiplier: 1.0, avg_hotel_3star: 160 },
    'Houston Stadium': { tier: 'Standard', multiplier: 1.0, avg_hotel_3star: 160 },
    'Atlanta Stadium': { tier: 'Standard', multiplier: 1.0, avg_hotel_3star: 160 },
    'Toronto Stadium': { tier: 'Standard', multiplier: 1.1, avg_hotel_3star: 180 }, // CAD factor
    'BC Place Vancouver': { tier: 'Standard', multiplier: 1.15, avg_hotel_3star: 190 },
    'Kansas City Stadium': { tier: 'Standard', multiplier: 0.95, avg_hotel_3star: 150 },

    // LOW COST (Tier 3) - Multiplier ~0.6x
    'Mexico City Stadium': { tier: 'Low', multiplier: 0.7, avg_hotel_3star: 100 },
    'Estadio Guadalajara': { tier: 'Low', multiplier: 0.6, avg_hotel_3star: 85 },
    'Estadio Monterrey': { tier: 'Low', multiplier: 0.65, avg_hotel_3star: 90 },
};

export const FLIGHT_ORIGINS = [
    { id: 'north_america', label: 'North America (USA/Can/Mex)', economy: 400, business: 1200 },
    { id: 'south_america', label: 'South America', economy: 900, business: 2200 },
    { id: 'europe', label: 'Europe', economy: 1000, business: 2800 },
    { id: 'africa', label: 'Africa', economy: 1300, business: 3500 },
    { id: 'asia', label: 'Asia / Pacific', economy: 1500, business: 4000 },
    { id: 'middle_east', label: 'Middle East', economy: 1200, business: 3200 },
];

export const SURGE_RATES = {
    'Group Stage': 1.0,
    'Round of 32': 1.1,
    'Round of 16': 1.15,
    'Quarter-finals': 1.25,
    'Semi-finals': 1.5,
    'Final': 2.0, // Major premium for the final
};

export const BASE_COSTS = {
    food_drink_daily: 60,   // Base USD per day for food
    transport_daily: 30,    // Base USD per day for local transport
    misc_daily: 20          // Base USD per day for misc
};
