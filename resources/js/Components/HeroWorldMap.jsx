import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import WorldMap from 'react-svg-worldmap';

/*
 * Full world map for the Hero section.
 * Shows all continents centered; highlights host countries and the
 * currently-displayed stadium's country.
 */

/* Country name → ISO-2 (lowercase) for stadium→country mapping.
 * Includes Wikipedia venue names and common city/location names
 * so that venues pulled from Wikipedia can be accurately matched. */
const COUNTRY_NAME_TO_ISO2 = {
    /* North America */
    'usa': 'us', 'united states': 'us', 'us': 'us',
    'canada': 'ca', 'ca': 'ca',
    'mexico': 'mx', 'mx': 'mx',
    /* Europe */
    'germany': 'de', 'de': 'de',
    'france': 'fr', 'spain': 'es', 'italy': 'it',
    'england': 'gb', 'united kingdom': 'gb', 'gb': 'gb',
    'scotland': 'gb', 'wales': 'gb',
    'netherlands': 'nl', 'belgium': 'be', 'portugal': 'pt',
    'switzerland': 'ch', 'austria': 'at', 'poland': 'pl',
    'czech republic': 'cz', 'denmark': 'dk', 'sweden': 'se',
    'norway': 'no', 'finland': 'fi', 'ireland': 'ie',
    'romania': 'ro', 'hungary': 'hu', 'croatia': 'hr',
    'greece': 'gr', 'turkey': 'tr', 'ukraine': 'ua',
    'russia': 'ru', 'serbia': 'rs', 'bulgaria': 'bg',
    /* Africa */
    'kenya': 'ke', 'ke': 'ke',
    'tanzania': 'tz', 'tz': 'tz',
    'uganda': 'ug', 'ug': 'ug',
    'nigeria': 'ng', 'ghana': 'gh', 'senegal': 'sn',
    'cameroon': 'cm', 'ivory coast': 'ci', "cote d'ivoire": 'ci',
    'south africa': 'za', 'morocco': 'ma', 'egypt': 'eg',
    'tunisia': 'tn', 'algeria': 'dz', 'ethiopia': 'et',
    'mali': 'ml', 'burkina faso': 'bf', 'guinea': 'gn',
    'mozambique': 'mz', 'zambia': 'zm', 'zimbabwe': 'zw',
    'madagascar': 'mg', 'congo': 'cg', 'gabon': 'ga',
    'rwanda': 'rw', 'burundi': 'bi', 'somalia': 'so',
    'djibouti': 'dj', 'eritrea': 'er', 'south sudan': 'ss',
    'namibia': 'na', 'botswana': 'bw', 'angola': 'ao',
    'malawi': 'mw', 'lesotho': 'ls', 'eswatini': 'sz',
    'mauritius': 'mu', 'seychelles': 'sc', 'cape verde': 'cv',
    'comoros': 'km', 'libya': 'ly', 'sudan': 'sd',
    /* Asia */
    'china': 'cn', 'japan': 'jp', 'south korea': 'kr', 'korea': 'kr',
    'india': 'in', 'pakistan': 'pk', 'bangladesh': 'bd',
    'sri lanka': 'lk', 'nepal': 'np', 'afghanistan': 'af',
    'iran': 'ir', 'iraq': 'iq', 'saudi arabia': 'sa',
    'uae': 'ae', 'united arab emirates': 'ae', 'qatar': 'qa',
    'kuwait': 'kw', 'oman': 'om', 'jordan': 'jo',
    'lebanon': 'lb', 'israel': 'il', 'yemen': 'ye',
    'thailand': 'th', 'vietnam': 'vn', 'indonesia': 'id',
    'malaysia': 'my', 'philippines': 'ph', 'myanmar': 'mm',
    'cambodia': 'kh', 'laos': 'la', 'mongolia': 'mn',
    'taiwan': 'tw', 'hong kong': 'hk',
    /* South America */
    'brazil': 'br', 'argentina': 'ar', 'colombia': 'co',
    'chile': 'cl', 'peru': 'pe', 'ecuador': 'ec',
    'venezuela': 've', 'bolivia': 'bo', 'paraguay': 'py',
    'uruguay': 'uy', 'guyana': 'gy', 'suriname': 'sr',
    /* Oceania */
    'australia': 'au', 'new zealand': 'nz', 'fiji': 'fj',
    /* City → country lookups for Wikipedia venues */
    'nairobi': 'ke', 'mombasa': 'ke', 'kisumu': 'ke',
    'dar es salaam': 'tz', 'arusha': 'tz', 'zanzibar': 'tz', 'dodoma': 'tz',
    'kampala': 'ug', 'entebbe': 'ug',
    'lagos': 'ng', 'abuja': 'ng', 'accra': 'gh',
    'dakar': 'sn', 'yaounde': 'cm', 'abidjan': 'ci',
    'johannesburg': 'za', 'cape town': 'za', 'durban': 'za', 'pretoria': 'za',
    'casablanca': 'ma', 'cairo': 'eg', 'tunis': 'tn',
    'addis ababa': 'et', 'kigali': 'rw',
    'london': 'gb', 'paris': 'fr', 'berlin': 'de', 'madrid': 'es',
    'rome': 'it', 'munich': 'de', 'dortmund': 'de', 'gelsenkirchen': 'de',
    'stuttgart': 'de', 'hamburg': 'de', 'leipzig': 'de', 'frankfurt': 'de', 'cologne': 'de',
    'lisbon': 'pt', 'amsterdam': 'nl', 'brussels': 'be', 'vienna': 'at',
    'warsaw': 'pl', 'budapest': 'hu', 'bucharest': 'ro', 'prague': 'cz',
    'sochi': 'ru', 'moscow': 'ru', 'saint petersburg': 'ru',
    'istanbul': 'tr', 'ankara': 'tr',
    'doha': 'qa', 'riyadh': 'sa', 'jeddah': 'sa', 'dubai': 'ae', 'abu dhabi': 'ae',
    'tokyo': 'jp', 'beijing': 'cn', 'shanghai': 'cn', 'seoul': 'kr',
    'mumbai': 'in', 'delhi': 'in', 'bangalore': 'in',
    'singapore': 'sg', 'bangkok': 'th', 'hanoi': 'vn', 'jakarta': 'id',
    'kuala lumpur': 'my', 'manila': 'ph',
    'sydney': 'au', 'melbourne': 'au', 'brisbane': 'au',
    'auckland': 'nz', 'wellington': 'nz',
    'new york': 'us', 'los angeles': 'us', 'miami': 'us',
    'dallas': 'us', 'houston': 'us', 'atlanta': 'us', 'boston': 'us',
    'seattle': 'us', 'philadelphia': 'us', 'san francisco': 'us', 'kansas city': 'us',
    'toronto': 'ca', 'vancouver': 'ca',
    'mexico city': 'mx', 'guadalajara': 'mx', 'monterrey': 'mx',
    'buenos aires': 'ar', 'rio de janeiro': 'br', 'sao paulo': 'br',
    'bogota': 'co', 'lima': 'pe', 'santiago': 'cl',
    'mecca': 'sa', 'medina': 'sa',
};

/**
 * Determine which country a stadium belongs to.
 * Uses venue_tiers config (explicit country) when available,
 * falls back to heuristic matching on stadium name/location.
 */
function stadiumCountryCode(stadiumName, tournament) {
    if (!stadiumName || !tournament) return null;

    /* 1. Check venue_tiers (config has explicit country per venue) */
    const tiers = tournament.pricing?.venue_tiers;
    if (tiers) {
        for (const [venue, info] of Object.entries(tiers)) {
            if (
                stadiumName.toLowerCase().includes(venue.toLowerCase()) ||
                venue.toLowerCase().includes(stadiumName.toLowerCase())
            ) {
                const iso2 = COUNTRY_NAME_TO_ISO2[(info.country || '').toLowerCase()];
                if (iso2) return iso2;
            }
        }
    }

    /* 2. Check the full stadium name + location against known cities/countries */
    const nameLower = (stadiumName || '').toLowerCase();

    /* Try exact city matches first (most specific) */
    for (const [city, code] of Object.entries(COUNTRY_NAME_TO_ISO2)) {
        if (city.length > 3 && nameLower.includes(city)) return code;
    }

    /* 3. If single host, use the first (and only) host country */
    if (tournament.host_flag_codes?.length === 1) {
        return tournament.host_flag_codes[0].toLowerCase();
    }

    /* 4. Check hosts list for any keyword match */
    const hosts = (tournament.hosts || []).map(h => h.toLowerCase());
    const hostFlags = (tournament.host_flag_codes || []).map(f => f.toLowerCase());
    for (let i = 0; i < hosts.length; i++) {
        if (nameLower.includes(hosts[i])) return hostFlags[i];
    }

    return null;
}

export default function HeroWorldMap({ tournament, stadiums, currentSlide, className }) {
    const activeStadium = stadiums?.[currentSlide] || {};

    const activeCountry = useMemo(
        () => stadiumCountryCode(activeStadium.name, tournament),
        [activeStadium.name, tournament?.id]
    );

    const hostCountries = useMemo(() => {
        return (tournament?.host_flag_codes || []).map(c => c.toLowerCase());
    }, [tournament?.id, tournament?.host_flag_codes]);

    /* No zoom/pan — show the full world centered, same as the wizard map.
     * Scale 1.35 enlarges the SVG content to fill the viewport. */
    const mapTransform = 'scale(1.35)';

    /* Style function — full opacity colors */
    const styleFunction = ({ countryCode }) => {
        const code = (countryCode || '').toLowerCase();
        if (code === activeCountry) {
            return {
                fill: '#DC143C',
                stroke: '#fff',
                strokeWidth: 1.5,
                filter: 'drop-shadow(0 0 8px rgba(220, 20, 60, 0.6))',
                cursor: 'default',
            };
        }
        if (hostCountries.includes(code)) {
            return {
                fill: '#ffffff',
                stroke: 'rgba(255,255,255,0.5)',
                strokeWidth: 0.8,
                cursor: 'default',
            };
        }
        return {
            fill: 'rgba(255,255,255,0.12)',
            stroke: 'rgba(255,255,255,0.08)',
            strokeWidth: 0.3,
            cursor: 'default',
        };
    };

    const worldMapData = useMemo(() => {
        return hostCountries.map(code => ({ country: code, value: 1 }));
    }, [hostCountries]);

    return (
        <div className={`hero-worldmap-wrapper ${className || ''}`}>
            <div className="hero-worldmap-viewport">
                <motion.div
                    className="hero-worldmap-inner"
                    animate={{ transform: mapTransform }}
                    transition={{
                        type: 'spring',
                        stiffness: 60,
                        damping: 18,
                        mass: 0.8,
                    }}
                >
                    <WorldMap
                        color="rgba(255,255,255,0.12)"
                        size="responsive"
                        data={worldMapData.length > 0 ? worldMapData : [{ country: 'us', value: 1 }]}
                        styleFunction={styleFunction}
                        tooltipBgColor="#1a1a2e"
                        tooltipTextColor="#e5e7eb"
                        strokeOpacity={0.15}
                        backgroundColor="transparent"
                    />
                </motion.div>
            </div>
            {/* Active country label — hidden when location is the generic "Wikipedia venue" fallback */}
            {activeCountry && activeStadium.location && !activeStadium.location.toLowerCase().includes('wikipedia') && (
                <motion.div
                    key={activeCountry}
                    className="hero-worldmap-country-label"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <span
                        className="hero-worldmap-dot"
                        style={{ background: '#DC143C' }}
                    />
                    <span>{activeStadium.location?.split(',').pop()?.trim() || activeCountry.toUpperCase()}</span>
                </motion.div>
            )}
        </div>
    );
}
