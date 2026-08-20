import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import WorldMap from 'react-svg-worldmap';

/*
 * Zoomable, animated world map for the Hero section.
 * Shows the tournament's host region zoomed in and highlights
 * the country where the currently-displayed stadium is located.
 */

/* ── Region zoom targets ──────────────────────────────────────
 * Lower scale = more zoomed out = more context visible.
 * targetX/targetY are coordinates in the SVG's 1000×450 viewBox.
 */
const REGION_ZOOM = {
    east_africa:      { targetX: 545, targetY: 220, scale: 1.7 },
    west_africa:      { targetX: 470, targetY: 210, scale: 1.6 },
    southern_africa:  { targetX: 530, targetY: 275, scale: 1.6 },
    north_africa:     { targetX: 500, targetY: 170, scale: 1.5 },
    europe:           { targetX: 510, targetY: 140, scale: 1.5 },
    middle_east:      { targetX: 590, targetY: 180, scale: 1.6 },
    south_asia:       { targetX: 665, targetY: 200, scale: 1.6 },
    east_asia:        { targetX: 785, targetY: 180, scale: 1.4 },
    north_america:    { targetX: 240, targetY: 175, scale: 1.2 },
    south_america:    { targetX: 300, targetY: 300, scale: 1.3 },
    oceania:          { targetX: 865, targetY: 310, scale: 1.6 },
    default:          { targetX: 500, targetY: 225, scale: 1.0 },
};

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

/**
 * Get the region key for a given tournament.
 */
function getTournamentRegion(tournament) {
    if (!tournament) return 'default';
    const id = tournament.id || '';
    const hosts = (tournament.hosts || []).map(h => h.toLowerCase());
    const flags = (tournament.host_flag_codes || []).map(f => f.toLowerCase());

    if (id.includes('afcon') || id.includes('africa')) {
        if (hosts.some(h => h === 'kenya' || h === 'tanzania' || h === 'uganda')) return 'east_africa';
        if (hosts.some(h => h === 'nigeria' || h === 'ghana' || h === 'senegal')) return 'west_africa';
        if (hosts.some(h => h === 'south africa')) return 'southern_africa';
        return 'west_africa';
    }
    if (id.includes('euro')) return 'europe';
    if (id.includes('wc') || id.includes('world-cup') || id.includes('world_cup')) return 'north_america';
    if (id.includes('copicopa') || id.includes('copa')) return 'south_america';
    if (id.includes('asian') || id.includes('afc')) return 'east_asia';
    if (id.includes('gold') && id.includes('cup')) return 'north_america';

    if (flags.includes('ke') || flags.includes('tz') || flags.includes('ug')) return 'east_africa';
    if (flags.includes('ng') || flags.includes('gh') || flags.includes('sn')) return 'west_africa';
    if (flags.includes('za')) return 'southern_africa';
    if (flags.includes('de') || flags.includes('fr') || flags.includes('es') || flags.includes('gb')) return 'europe';
    if (flags.includes('us') || flags.includes('ca') || flags.includes('mx')) return 'north_america';
    if (flags.includes('br') || flags.includes('ar')) return 'south_america';
    if (flags.includes('jp') || flags.includes('cn') || flags.includes('kr')) return 'east_asia';
    if (flags.includes('in')) return 'south_asia';
    if (flags.includes('qa') || flags.includes('sa') || flags.includes('ae')) return 'middle_east';
    if (flags.includes('au') || flags.includes('nz')) return 'oceania';

    return 'default';
}

export default function HeroWorldMap({ tournament, stadiums, currentSlide, className }) {
    const activeStadium = stadiums?.[currentSlide] || {};

    const region = useMemo(() => getTournamentRegion(tournament), [tournament?.id]);
    const zoom = REGION_ZOOM[region] || REGION_ZOOM.default;

    const activeCountry = useMemo(
        () => stadiumCountryCode(activeStadium.name, tournament),
        [activeStadium.name, tournament?.id]
    );

    const hostCountries = useMemo(() => {
        return (tournament?.host_flag_codes || []).map(c => c.toLowerCase());
    }, [tournament?.id, tournament?.host_flag_codes]);

    /* Compute CSS transform for zoom/pan */
    const viewBoxW = 1000;
    const viewBoxH = 450;

    const txPct = (500 - zoom.targetX) / viewBoxW * 100;
    const tyPct = (225 - zoom.targetY) / viewBoxH * 100;

    const mapTransform = `translate(${txPct}%, ${tyPct}%) scale(${zoom.scale})`;

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
            {/* Active country label */}
            {activeCountry && (
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
