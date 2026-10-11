/**
 * The trip-cost engine — pure, JSX-free, so `node --test` can load it.
 *
 * Lifted out of `Fan/BudgetCalculator`'s `clientSideCalculate()` so the
 * public "Plan my trip" dialog and the fan calculator compute the SAME
 * number from the same inputs. Two copies of this arithmetic would drift,
 * and then a visitor's estimate would change the moment they signed in.
 *
 * Computes in USD, converts once at the end with the display currency's
 * rate (Sprint 28). Returns `{ total, breakdown, matchCount }`, every value
 * in that display currency.
 */
import {
    getAccommodationFactors,
    getCityTiers,
    getDailyCosts,
    getFlightOrigins,
    getInsuranceDaily,
    getMerchandisePerMatch,
    getRateForCurrency,
    getSpendingTiers,
    getSurgeRates,
    getTicketPrices,
    getVisaCosts,
} from '../Data/BudgetPricingData.js';

export function estimateTrip(pricing, input = {}) {
    const {
        matches = [],               // selected fixture rows ({ venue, stage })
        quickEstimate = false,
        quickMatches = 3,
        quickKnockoutPct = 30,
        flightOrigin = null,
        flightClass = 'economy',
        accommodation = '3_star',
        nights = 7,
        spendingTier = 'mid_range',
        groupSize = 1,
        includeInsurance = true,
        includeVisa = true,
        includeMerchandise = true,
        hosts = [],
        currency = 'USD',
        realFlightPrice = null,
        realHotelPrice = null,
    } = input;

    const CITY_TIERS = getCityTiers(pricing);
    const SURGE_RATES = getSurgeRates(pricing);
    const FLIGHT_ORIGINS = getFlightOrigins(pricing);
    const BASE_COSTS = getDailyCosts(pricing);
    const TICKET_PRICES = getTicketPrices(pricing);
    const ACCOMMODATION_FACTORS = getAccommodationFactors(pricing);
    const RATE = getRateForCurrency(pricing, currency);
    const SPENDING_TIERS = getSpendingTiers(pricing);
    const VISA_COSTS = getVisaCosts(pricing);
    const INSURANCE_DAILY = getInsuranceDaily(pricing);
    const MERCH_PER_MATCH = getMerchandisePerMatch(pricing);

    const size = Math.max(1, Number(groupSize) || 1);
    const tierMultiplier = SPENDING_TIERS[spendingTier] || 1.0;

    let totalTicketCost = 0;
    let avgMultiplier = 1.0;
    let avgBaseHotel = 160;
    let maxSurge = 1.0;
    let matchCount = 0;

    if (quickEstimate) {
        matchCount = quickMatches;
        const groupMatches = Math.round(matchCount * (1 - quickKnockoutPct / 100));
        const knockoutMatches = matchCount - groupMatches;
        totalTicketCost += groupMatches * (TICKET_PRICES['Group Stage'] || 150);
        totalTicketCost += knockoutMatches * (TICKET_PRICES['Quarter-finals'] || 350);
        maxSurge = quickKnockoutPct > 50 ? 1.4 : 1.15;
        const allTiers = Object.values(CITY_TIERS);
        if (allTiers.length > 0) {
            avgMultiplier = allTiers.reduce((s, t) => s + t.multiplier, 0) / allTiers.length;
            avgBaseHotel = allTiers.reduce((s, t) => s + t.avg_hotel_3star, 0) / allTiers.length;
        }
    } else {
        matchCount = matches.length;
        let totalCityMultiplier = 0;
        let totalHotelCost = 0;
        matches.forEach((m) => {
            const cityData = CITY_TIERS[m.venue] || { multiplier: 1.0, avg_hotel_3star: 160 };
            totalCityMultiplier += cityData.multiplier;
            totalHotelCost += cityData.avg_hotel_3star;
            const stageSurge = SURGE_RATES[m.stage] || 1.0;
            if (stageSurge > maxSurge) maxSurge = stageSurge;
            totalTicketCost += TICKET_PRICES[m.stage] || TICKET_PRICES['Group Stage'] || 150;
        });
        if (matches.length > 0) {
            avgMultiplier = totalCityMultiplier / matches.length;
            avgBaseHotel = totalHotelCost / matches.length;
        }
    }

    const originData = FLIGHT_ORIGINS.find((o) => o.id === flightOrigin) || FLIGHT_ORIGINS[0] || {};
    let flightCost = (originData[flightClass] || 1000) * (1 + ((maxSurge - 1) * 0.5));
    const accFactor = ACCOMMODATION_FACTORS[accommodation] || 1.0;
    const sharedRooms = Math.max(1, Math.ceil(size / 2));
    let accommodationCost = (avgBaseHotel * accFactor * maxSurge * nights) / sharedRooms;

    if (realFlightPrice !== null) flightCost = realFlightPrice;
    if (realHotelPrice !== null) accommodationCost = (realHotelPrice * nights) / sharedRooms;

    const foodCost = BASE_COSTS.food * avgMultiplier * maxSurge * tierMultiplier * nights;
    const transportCost = BASE_COSTS.transport * avgMultiplier * tierMultiplier * nights;
    const miscCost = BASE_COSTS.misc * avgMultiplier * tierMultiplier * nights;
    const insuranceCost = includeInsurance ? INSURANCE_DAILY * nights : 0;
    let visaCost = 0;
    if (includeVisa) {
        hosts.forEach((h) => { visaCost += VISA_COSTS[h] || 0; });
    }
    const merchCost = includeMerchandise ? MERCH_PER_MATCH * matchCount : 0;

    const perPerson = totalTicketCost + flightCost + accommodationCost + foodCost
        + transportCost + miscCost + insuranceCost + merchCost;
    const totalUsd = (perPerson * size) + visaCost;

    return {
        total: totalUsd * RATE,
        matchCount,
        breakdown: {
            match_tickets: totalTicketCost * size * RATE,
            flights: flightCost * size * RATE,
            accommodation: accommodationCost * size * RATE,
            food_and_drink: foodCost * size * RATE,
            local_transport: transportCost * size * RATE,
            insurance: insuranceCost * size * RATE,
            visa: visaCost * RATE,
            merchandise: merchCost * size * RATE,
            miscellaneous: miscCost * size * RATE,
        },
    };
}

/**
 * "From" price for one match, shown on the Match Schedule (Sprint 69): a
 * 3-night trip around that single fixture at the planner's defaults. The
 * card SAYS "3-night trip", so the number is a claim about exactly that,
 * and it comes from this engine so it agrees with what the planner then
 * shows (default rates when a tournament sets none, exactly as the planner).
 */
export const MATCH_TRIP_NIGHTS = 3;

export function matchTripFrom(pricing, match, { hosts = [], currency = 'USD' } = {}) {
    if (!match) return null;
    const { total } = estimateTrip(pricing || {}, { matches: [match], nights: MATCH_TRIP_NIGHTS, hosts, currency });
    return Number.isFinite(total) && total > 0 ? total : null;
}
