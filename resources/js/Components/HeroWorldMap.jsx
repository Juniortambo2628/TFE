import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import WorldMap from 'react-svg-worldmap';

/*
 * Zoomable, animated world map for the Hero section.
 * Shows the tournament's host region zoomed in and highlights
 * the country where the currently-displayed stadium is located.
 *
 * The "zoom" effect is achieved by rendering the full WorldMap at a
 * large size, wrapping it in an overflow:hidden container, and using
 * framer-motion to animate CSS translate + scale transforms.
 */

/* ── Region zoom targets ──────────────────────────────────────
 * Each region has:
 *   - targetX, targetY: coordinates in the SVG's 1000×450 viewBox
 *     that should land in the center of the viewport after transform.
 *   - scale: how much to zoom in.
 *
 * SVG viewBox is approximately 1000 wide × 450 tall.  Centre of
 * the visible world is roughly (500, 225).
 */
const REGION_ZOOM = {
    east_africa:      { targetX: 550, targetY: 225, scale: 3.2 },
    west_africa:      { targetX: 470, targetY: 210, scale: 2.8 },
    southern_africa:  { targetX: 530, targetY: 280, scale: 2.8 },
    north_africa:     { targetX: 500, targetY: 170, scale: 2.5 },
    europe:           { targetX: 510, targetY: 140, scale: 2.6 },
    middle_east:      { targetX: 600, targetY: 180, scale: 2.8 },
    south_asia:       { targetX: 670, targetY: 200, scale: 2.8 },
    east_asia:        { targetX: 790, targetY: 180, scale: 2.4 },
    north_america:    { targetX: 230, targetY: 170, scale: 2.0 },
    south_america:    { targetX: 300, targetY: 300, scale: 2.2 },
    oceania:          { targetX: 870, targetY: 310, scale: 2.8 },
    default:          { targetX: 500, targetY: 225, scale: 1.0 },
};

/* Country name → ISO-2 (lowercase) for stadium→country mapping */
const COUNTRY_NAME_TO_ISO2 = {
    'usa': 'us', 'united states': 'us', 'us': 'us',
    'canada': 'ca', 'ca': 'ca',
    'mexico': 'mx', 'mx': 'mx',
    'germany': 'de', 'de': 'de',
    'kenya': 'ke', 'ke': 'ke',
    'tanzania': 'tz', 'tz': 'tz',
    'uganda': 'ug', 'ug': 'ug',
    'france': 'fr', 'spain': 'es', 'italy': 'it',
    'england': 'gb', 'united kingdom': 'gb', 'gb': 'gb',
    'brazil': 'br', 'argentina': 'ar', 'qatar': 'qa',
    'japan': 'jp', 'south korea': 'kr', 'korea': 'kr',
    'south africa': 'za', 'nigeria': 'ng', 'egypt': 'eg',
    'morocco': 'ma', 'australia': 'au', 'new zealand': 'nz',
    'china': 'cn', 'india': 'in', 'saudi arabia': 'sa',
    'uae': 'ae', 'united arab emirates': 'ae', 'russia': 'ru',
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

    /* 2. Heuristic: check stadium name + location against country names */
    const haystack = (stadiumName + ' ' + (stadiumName || '')).toLowerCase();
    for (const [name, code] of Object.entries(COUNTRY_NAME_TO_ISO2)) {
        if (haystack.includes(name)) return code;
    }

    /* 3. If single host, use the first (and only) host country */
    if (tournament.host_flag_codes?.length === 1) {
        return tournament.host_flag_codes[0].toLowerCase();
    }

    return null;
}

/**
 * Get the region key for a given tournament, used to look up zoom targets.
 */
function getTournamentRegion(tournament) {
    if (!tournament) return 'default';
    const id = tournament.id || '';
    const hosts = (tournament.hosts || []).map(h => h.toLowerCase());
    const flags = (tournament.host_flag_codes || []).map(f => f.toLowerCase());

    /* Direct mapping by tournament ID */
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

    /* Fallback: map by first host country */
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

    /* Determine which country the current stadium is in */
    const activeCountry = useMemo(
        () => stadiumCountryCode(activeStadium.name, tournament),
        [activeStadium.name, tournament?.id]
    );

    /* All host country codes (lowercase) */
    const hostCountries = useMemo(() => {
        return (tournament?.host_flag_codes || []).map(c => c.toLowerCase());
    }, [tournament?.id, tournament?.host_flag_codes]);

    /* Compute CSS transform for zoom/pan — target coords mapped to
     * percentage of the SVG viewBox so the result is container-width agnostic. */
    const viewBoxW = 1000;
    const viewBoxH = 450;
    const svgScale = 1.2;  /* extra scale on top of the map's own sizing */

    const txPct = (500 - zoom.targetX) / viewBoxW * 100;
    const tyPct = (225 - zoom.targetY) / viewBoxH * 100;
    const s = zoom.scale * svgScale;

    const mapTransform = `translate(${txPct}%, ${tyPct}%) scale(${s})`;

    /* Build map data — colour every known country */
    const mapData = useMemo(() => {
        const regionColors = {};
        /* Collect all countries in the map */
        const allCountries = [
            ...hostCountries,
            ...Object.keys(COUNTRY_NAME_TO_ISO2).map(k => COUNTRY_NAME_TO_ISO2[k]),
        ];
        /* Deduplicate */
        const unique = [...new Set(allCountries)];
        unique.forEach(code => {
            if (!code) return;
            regionColors[code] = hostCountries.includes(code)
                ? 'rgba(255,255,255,0.25)'
                : 'rgba(255,255,255,0.08)';
        });
        return regionColors;
    }, [hostCountries]);

    /* Style function for WorldMap — highlight host and active countries */
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
                fill: 'rgba(255,255,255,0.85)',
                stroke: 'rgba(255,255,255,0.4)',
                strokeWidth: 0.8,
                cursor: 'default',
            };
        }
        return {
            fill: 'rgba(255,255,255,0.06)',
            stroke: 'rgba(255,255,255,0.04)',
            strokeWidth: 0.3,
            cursor: 'default',
        };
    };

    /* Build data array for WorldMap (needs at least the host countries
     * so the component has something to render per-country) */
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
                        color="rgba(255,255,255,0.08)"
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
                        style={{ background: tournament?.color_accent || '#DC143C' }}
                    />
                    <span>{activeStadium.location?.split(',').pop()?.trim() || activeCountry.toUpperCase()}</span>
                </motion.div>
            )}
        </div>
    );
}
