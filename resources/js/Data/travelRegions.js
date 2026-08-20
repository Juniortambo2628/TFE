/**
 * Region and country data for travel origin selection.
 * Regions are grouped by geographic proximity and relevance to tournament travel.
 */

export const REGIONS = {
    east_africa: {
        name: 'East Africa',
        color: '#10b981',
        countries: [
            { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
            { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
            { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
            { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
            { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
            { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
            { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
            { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
            { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
            { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
        ],
    },
    west_africa: {
        name: 'West Africa',
        color: '#f59e0b',
        countries: [
            { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
            { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
            { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
            { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
            { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
            { code: 'ML', name: 'Mali', flag: '🇲🇱' },
            { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
            { code: 'NE', name: 'Niger', flag: '🇳🇪' },
            { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
            { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
            { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
            { code: 'TG', name: 'Togo', flag: '🇹🇬' },
            { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
            { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
            { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
            { code: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
        ],
    },
    southern_africa: {
        name: 'Southern Africa',
        color: '#8b5cf6',
        countries: [
            { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
            { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
            { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
            { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
            { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
            { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
            { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
            { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
            { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
            { code: 'AO', name: 'Angola', flag: '🇦🇴' },
        ],
    },
    north_africa: {
        name: 'North Africa',
        color: '#ef4444',
        countries: [
            { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
            { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
            { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
            { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
            { code: 'LY', name: 'Libya', flag: '🇱🇾' },
            { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
        ],
    },
    europe: {
        name: 'Europe',
        color: '#3b82f6',
        countries: [
            { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
            { code: 'FR', name: 'France', flag: '🇫🇷' },
            { code: 'DE', name: 'Germany', flag: '🇩🇪' },
            { code: 'ES', name: 'Spain', flag: '🇪🇸' },
            { code: 'IT', name: 'Italy', flag: '🇮🇹' },
            { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
            { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
            { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
            { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
            { code: 'AT', name: 'Austria', flag: '🇦🇹' },
            { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
            { code: 'NO', name: 'Norway', flag: '🇳🇴' },
            { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
            { code: 'FI', name: 'Finland', flag: '🇫🇮' },
            { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
            { code: 'PL', name: 'Poland', flag: '🇵🇱' },
            { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
            { code: 'RO', name: 'Romania', flag: '🇷🇴' },
            { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
            { code: 'GR', name: 'Greece', flag: '🇬🇷' },
            { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
        ],
    },
    middle_east: {
        name: 'Middle East',
        color: '#f97316',
        countries: [
            { code: 'AE', name: 'UAE', flag: '🇦🇪' },
            { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
            { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
            { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
            { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
            { code: 'OM', name: 'Oman', flag: '🇴🇲' },
            { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
            { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
            { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
            { code: 'IL', name: 'Israel', flag: '🇮🇱' },
        ],
    },
    south_asia: {
        name: 'South Asia',
        color: '#ec4899',
        countries: [
            { code: 'IN', name: 'India', flag: '🇮🇳' },
            { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
            { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
            { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
            { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
            { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
            { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
        ],
    },
    east_asia: {
        name: 'East Asia',
        color: '#06b6d4',
        countries: [
            { code: 'JP', name: 'Japan', flag: '🇯🇵' },
            { code: 'CN', name: 'China', flag: '🇨🇳' },
            { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
            { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
            { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
            { code: 'MO', name: 'Macau', flag: '🇲🇴' },
            { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
        ],
    },
    north_america: {
        name: 'North America',
        color: '#6366f1',
        countries: [
            { code: 'US', name: 'United States', flag: '🇺🇸' },
            { code: 'CA', name: 'Canada', flag: '🇨🇦' },
            { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
        ],
    },
    south_america: {
        name: 'South America',
        color: '#84cc16',
        countries: [
            { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
            { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
            { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
            { code: 'CL', name: 'Chile', flag: '🇨🇱' },
            { code: 'PE', name: 'Peru', flag: '🇵🇪' },
            { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
            { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
            { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
            { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
            { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
        ],
    },
    oceania: {
        name: 'Oceania',
        color: '#14b8a6',
        countries: [
            { code: 'AU', name: 'Australia', flag: '🇦🇺' },
            { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
            { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
        ],
    },
};

/**
 * Map ISO2 country codes to ISO3 for API compatibility.
 */
export const ISO2_TO_ISO3 = {
    KE: 'KEN', TZ: 'TZA', UG: 'UGA', RW: 'RWA', ET: 'ETH', BI: 'BDI', SS: 'SSD', SO: 'SOM', DJ: 'DJI', ER: 'ERI',
    NG: 'NGA', GH: 'GHA', SN: 'SEN', CI: 'CIV', CM: 'CMR', ML: 'MLI', BF: 'BFA', NE: 'NER', GN: 'GIN', SL: 'SLE',
    LR: 'LBR', TG: 'TGO', BJ: 'BEN', GM: 'GMB', GW: 'GNB', CV: 'CPV',
    ZA: 'ZAF', ZW: 'ZWE', ZM: 'ZMB', BW: 'BWA', NA: 'NAM', MZ: 'MOZ', MW: 'MWI', SZ: 'SWZ', LS: 'LSO', AO: 'AGO',
    MA: 'MAR', EG: 'EGY', TN: 'TUN', DZ: 'DZA', LY: 'LBY', SD: 'SDN',
    GB: 'GBR', FR: 'FRA', DE: 'DEU', ES: 'ESP', IT: 'ITA', NL: 'NLD', PT: 'PRT', BE: 'BEL', CH: 'CHE', AT: 'AUT',
    SE: 'SWE', NO: 'NOR', DK: 'DNK', FI: 'FIN', IE: 'IRL', PL: 'POL', CZ: 'CZE', RO: 'ROU', HU: 'HUN', GR: 'GRC', TR: 'TUR',
    AE: 'ARE', SA: 'SAU', QA: 'QAT', KW: 'KWT', BH: 'BHR', OM: 'OMN', JO: 'JOR', LB: 'LBN', IQ: 'IRQ', IL: 'ISR',
    IN: 'IND', PK: 'PAK', BD: 'BGD', LK: 'LKA', NP: 'NPL', MV: 'MDV', BT: 'BTN',
    JP: 'JPN', CN: 'CHN', KR: 'KOR', TW: 'TWN', HK: 'HKG', MO: 'MAC', MN: 'MNG',
    US: 'USA', CA: 'CAN', MX: 'MEX',
    BR: 'BRA', AR: 'ARG', CO: 'COL', CL: 'CHL', PE: 'PER', EC: 'ECU', VE: 'VEN', BO: 'BOL', PY: 'PRY', UY: 'URY',
    AU: 'AUS', NZ: 'NZL', FJ: 'FJI',
};

/**
 * Get region key from country ISO2 code.
 */
export function getRegionForCountry(countryCode) {
    for (const [regionKey, region] of Object.entries(REGIONS)) {
        if (region.countries.some(c => c.code === countryCode)) {
            return regionKey;
        }
    }
    return null;
}

/**
 * Country codes to region color mapping for the world map.
 */
export function getCountryRegionColors() {
    const colors = {};
    for (const [regionKey, region] of Object.entries(REGIONS)) {
        region.countries.forEach(c => {
            colors[c.code.toLowerCase()] = region.color;
        });
    }
    return colors;
}
