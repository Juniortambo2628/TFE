import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import DashboardModal from '@/Components/Common/DashboardModal';
import { useTournament } from '@/Context/TournamentContext';
import { TEAM_CODES, TEAM_NAMES, TEAM_NAME_VARIATIONS } from '@/Data/countryFlags';
import HeroWorldMap from '@/Components/HeroWorldMap';
import StadiumSeatMap from '@/Components/Fan/StadiumSeatMap';
import GlassPill from '@/Components/Common/GlassPill';
import AccentCard from '@/Components/Common/AccentCard';
import { resolveStadiumImage, preloadImage } from '@/Data/stadiumImages';

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



// Parse a capacity value that arrived as either a number or a string like
// "82,500" or "~68,000 (expandable)". Falls back to `fallback` on unparsable input.
function parseCapacity(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
    var digits = String(raw).replace(/[^\d]/g, '');
    var n = parseInt(digits, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Capacity for display. The catalogue stores a plain integer (60000) while
// Wikipedia used to hand us a pre-formatted string ("60,000"), so normalise to
// the grouped form here. parseCapacity() reads either shape, so the numeric
// consumers (the seat map) are unaffected.
function formatCapacity(raw) {
    if (raw === null || raw === undefined || raw === '') return 'TBD';
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw.toLocaleString('en-US');
    return String(raw);
}

// Deterministic pseudo-sold-percentage per stadium so the preview reads
// as "live-ish" without hitting a booking backend. Replaced by real
// package aggregate once we surface it into the Hero payload.
function deriveSoldPct(stadiumName) {
    if (!stadiumName) return 40;
    var h = 0;
    for (var i = 0; i < stadiumName.length; i++) {
        h = (h * 31 + stadiumName.charCodeAt(i)) >>> 0;
    }
    // 20..85 range — never sold out, never empty, gives urgency signal.
    return 20 + (h % 66);
}

// Map Wikipedia / free-source team names to flag codes.
function teamNameToCode(name) {
    if (!name) return null;
    var n = name.toLowerCase().trim();
    // Direct lookup first
    if (TEAM_CODES[name]) return TEAM_CODES[name];
    // Common Wikipedia variations
    if (TEAM_NAME_VARIATIONS[n]) return TEAM_NAME_VARIATIONS[n];
    // Fallback: try lowercase as flag code (works for "mexico" -> "mx"? No, need 2-letter)
    return null;
}

const DEFAULT_MATCHES = [
    { id: 101, home: 'br', away: 'fr', date: 'June 2026', time: 'TBD', type: 'Group Stage' },
    { id: 102, home: 'ng', away: 'kr', date: 'June 2026', time: 'TBD', type: 'Group Stage' },
    { id: 103, home: 'mx', away: 'de', date: 'June 2026', time: 'TBD', type: 'Group Stage' },
    { id: 104, home: 'gb-eng', away: 'jp', date: 'June 2026', time: 'TBD', type: 'Group Stage' },
];

export default function Hero({ stadiums: stadiumsProp }) {
    const { assetUrl, stadiumImages } = usePage().props;
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

    // Accent + trophy artwork for the hero tournament card (AccentCard).
    var heroAccent = (tournament && tournament.color_accent) || '#DC143C';
    // Per-tournament organiser visual (the hero card's background watermark)
    // comes from config/tournaments.php `organizer_card_bg`, overridable in the
    // admin CMS (SiteSetting `tournament_card_bg_{id}`). Files live under
    // public/tournament-organizers-card-visuals/.
    var heroBgImage = (tournament && tournament.organizer_card_bg) ? baseUrl + tournament.organizer_card_bg : null;
    var heroTrophy = (function () {
        var trophyPath = tournament && tournament.trophy_image;
        if (trophyPath) {
            return { src: baseUrl + trophyPath, alt: (tournament.short_name || 'Tournament') + ' trophy' };
        }
        if (wikipediaLogo) {
            return { src: wikipediaLogo, alt: '' };
        }
        return { icon: 'fas fa-trophy' };
    })();

    // Stadiums come from the resolved tournament's venue rows. Imagery is
    // locally hosted: StadiumImageService has already overlaid the committed
    // WebP (or an admin override) onto `image`/`thumbnail` server-side, so
    // there is no runtime Wikipedia image fetch here any more. `stadiumImages`
    // is the name-keyed fallback for a venue the overlay didn't match — and
    // heroImage remains the last resort, so a slug mismatch degrades to the
    // tournament backdrop rather than an empty slide.
    var stadiums = useMemo(function () {
        if (wikipediaVenues.length > 0) {
            return wikipediaVenues.map(function (v) {
                var localImage = v.image
                    || v.thumbnail
                    || resolveStadiumImage(v.name, stadiumImages);

                return {
                    name: v.name || v.extract?.substring(0, 40) || 'Unknown Venue',
                    location: v.location || 'Tournament venue',
                    capacity: formatCapacity(v.capacity),
                    history: v.opened || '',
                    fun_fact: v.extract || '',
                    image: localImage || heroImage,
                    matches: [],
                    attribution: 'Data from Wikipedia',
                    url: v.url || '',
                    // Which host this ground belongs to — drives the map
                    // highlight and the host pill on the tournament card.
                    country: v.country || '',
                    country_code: v.country_code || '',
                };
            });
        }
        if (stadiumsProp && stadiumsProp.length > 0) {
            return stadiumsProp;
        }
        return [{
            name: tournament ? (tournament.short_name || tournament.name) : 'Tournament Venue',
            location: (tournament && tournament.hosts) ? tournament.hosts.join(', ') : '',
            capacity: 'TBD',
            history: '',
            fun_fact: tournament && tournament.wikipedia_extract ? tournament.wikipedia_extract.substring(0, 160) : '',
            image: heroImage,
            matches: [],
            attribution: '',
        }];
    }, [tournament?.id, wikipediaVenues, stadiumsProp, heroImage, tournament, stadiumImages]);

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

    // Loading strategy: only one slide is ever mounted (AnimatePresence swaps
    // on `currentSlide`), so the active image is inherently eager — it is the
    // hero's LCP element. The slide *after* it gets warmed here so the 0.8s
    // crossfade has a decoded bitmap instead of kicking off a request at the
    // moment it becomes visible. Everything beyond next stays unfetched until
    // the carousel reaches it, which is what keeps a 12-venue tournament from
    // pulling ~1.5MB of WebP on first paint.
    useEffect(() => {
        if (stadiums.length < 2) return;

        const next = stadiums[(currentSlide + 1) % stadiums.length];
        preloadImage(next?.image);
    }, [currentSlide, stadiums]);

    // A stadium image that 404s (a slug typo, a deleted admin upload) must not
    // leave a blank hero. Failures are recorded here and the render falls back
    // to the tournament backdrop for that slide only.
    const [failedImages, setFailedImages] = useState({});
    const activeImage = (activeStadium.image && !failedImages[activeStadium.image])
        ? activeStadium.image
        : heroImage;

    // Team flags come from (in order): config team_flag_codes → Wikipedia teams
    // → host country flags. No stadium-fixture hardcoding.
    var configFlags = (tournament && tournament.team_flag_codes) || [];
    var wikiTeams = (tournament && tournament.teams) || [];

    // Filter the tournament's fixture set to only matches at the active stadium.
    // Memoized on the stadium name — recomputes only when the carousel
    // advances to a new stadium, not on every render.
    var activeStadiumLower = (activeStadium.name || '').toLowerCase();
    var allMatches = useMemo(function () {
        if (wikipediaMatches.length === 0) return [];
        var stadiumMatches = wikipediaMatches.filter(function (m) {
            if (!m.stadium || !activeStadiumLower) return false;
            var s = m.stadium.toLowerCase();
            return s.includes(activeStadiumLower) || activeStadiumLower.includes(s);
        });
        var matchesToUse = stadiumMatches.length > 0 ? stadiumMatches : wikipediaMatches;
        return matchesToUse.map(function (m, idx) {
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
    }, [wikipediaMatches, activeStadiumLower]);
    var matches = allMatches;

    // Flag track derives only from the tournament — memoize to stop the
    // infinite scroll animation from re-creating the array 60x/sec.
    var flagTrack = useMemo(function () {
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
        return flagCodes.concat(flagCodes);
    }, [tournament?.id, configFlags, wikiTeams, matches, tournament]);

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

    const filteredMatches = useMemo(function () {
        return selectedTeam
            ? matches.filter(function (m) { return m.home === selectedTeam || m.away === selectedTeam; })
            : matches;
    }, [selectedTeam, matches]);

    return (
        <section className="banner-section position-relative d-flex flex-column justify-content-center min-vh-100 tfe-hero-slider" id="hero">
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
                    >
                        <img
                            className="hero-stadium-img"
                            src={activeImage}
                            alt=""
                            aria-hidden="true"
                            // The active slide is the hero's LCP element, so it
                            // is always eager + high priority. The next slide is
                            // warmed separately in an effect; the rest are never
                            // requested until the carousel reaches them.
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                            draggable="false"
                            onError={() => {
                                if (activeStadium.image) {
                                    setFailedImages((prev) => (
                                        prev[activeStadium.image]
                                            ? prev
                                            : { ...prev, [activeStadium.image]: true }
                                    ));
                                }
                            }}
                        />
                    </motion.div>
                </AnimatePresence>
                <div className="stadium-slide-overlay hero-overlay-gradient"></div>
            </div>

            {/* Top Center: Stadium Badge.
                Rendered independently of the flag carousel — it used to share
                the carousel's `flagTrack.length > 0` guard, which meant a
                tournament with no flag data silently lost its stadium label
                too. */}
            <div className="hero-top-bar position-absolute top-0 start-0 w-100 z-1">
                <div className="d-flex align-items-center justify-content-center gap-3 py-2 px-3 hero-top-bar-inner">
                    <motion.div
                        key={`badge-top-${currentSlide}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="hero-stadium-badge hero-stadium-badge-sm"
                    >
                        <div className="badge-dot"></div>
                        <span className="text-white fw-bold tracking-wider">{activeStadium.name}</span>
                        <span className="text-white text-opacity-50"> — {activeStadium.location.split(',').pop().trim()}</span>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Center: Flag Carousel — CSS-animated marquee.
                Previously a framer-motion infinite x:[0,-50%] tween that
                repainted every frame on the main thread and made the hero
                janky; now a GPU-composited CSS keyframe (see
                .hero-flag-track-auto), paused on hover via the is-paused
                class. */}
            {/* The bar itself is unconditional: it also hosts the attribution,
                which must not disappear just because a tournament has no flag
                data. Only the carousel inside is gated. */}
            <div className="hero-bottom-bar position-absolute bottom-0 start-0 w-100 z-1">
                {flagTrack.length > 0 && (
                    <div className="d-flex align-items-center justify-content-center px-3 hero-bottom-bar-inner">
                        <div
                            className="flag-carousel-container flag-carousel-compact mb-0 hero-flag-carousel-pointer"
                            ref={carouselRef}
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => {
                                if (!showMatchModal) setIsPaused(false);
                            }}
                        >
                            <div className={'flag-track hero-flag-track-auto hero-flag-track-pointer' + (isPaused ? ' is-paused' : '')}>
                                {flagTrack.map((f, i) => (
                                    <div
                                        key={`${f}-${i}`}
                                        className="flag-item flag-item-sm hero-flag-item-pointer"
                                        onClick={() => openModal(f)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(f); } }}
                                    >
                                        <img
                                            src={`${assetUrl}assets/Flags/${f}.png`}
                                            alt={f}
                                            draggable="false"
                                            loading="lazy"
                                            onError={function(e) {
                                                if (wikipediaFlags[f]) {
                                                    e.target.src = wikipediaFlags[f];
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Attribution — a child of the bottom bar, not pinned to the
                    section corner, which is what lets it change layout per
                    breakpoint (see .stadium-attribution). On phones it flows
                    centred under the flags; from sm up it is positioned into
                    the bar's bottom-right, where it has always appeared.
                    Skipped when empty so the fallback slide doesn't render a
                    blank glass pill. */}
                {activeStadium.attribution ? (
                    <motion.div
                        key={`attr-${currentSlide}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="stadium-attribution"
                    >
                        <small className="text-white text-opacity-60">{activeStadium.attribution}</small>
                    </motion.div>
                ) : null}
            </div>

            {/* Content Layer - Persistent across slide changes */}
            <div className="container flex-grow-1 d-flex flex-column position-relative z-1">
                <div className="hero-content-stack hero-content-stack--roomy d-flex flex-column gap-5 position-relative flex-grow-1 justify-content-center pb-5">
                    {/* Row 1: World Map + Countdown — now the sole hero row, so
                        both the map and the tournament card take more room. */}
                    <div className="row align-items-center gx-0 hero-primary-row">
                        {/* Left: World Map — host countries highlighted */}
                        <div className="col-xl-8 hero-map-col d-none d-xl-block">
                            <HeroWorldMap
                                tournament={tournament}
                                className="hero-worldmap--xl"
                                activeCountry={activeStadium.country_code}
                                accent={heroAccent}
                            />
                        </div>

                        {/* Right Content: the active tournament, countdown + CTAs
                            wrapped in the shared tournament card (AccentCard),
                            echoing the AFCON compare card. */}
                        <div className="col-xl-4 hero-card-col">
                            <motion.div
                                key={`countdown-${tournament ? tournament.id : 'default'}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <AccentCard
                                    LinkComponent="div"
                                    accent={heroAccent}
                                    className="tfe-acard--hero"
                                    bgImage={heroBgImage}
                                    artwork={heroTrophy}
                                    eyebrow={isConcluded ? 'Champions crowned' : 'Kicks off in'}
                                    title={tournament?.name || 'Tournament'}
                                    desc={tournament?.tagline || (tournament?.wikipedia_extract ? tournament.wikipedia_extract.substring(0, 110) : '')}
                                >
                                    {isConcluded ? (
                                        <div className="d-flex flex-column gap-3">
                                            {tournament.winner && (
                                                <div className="d-flex align-items-center gap-3">
                                                    {teamNameToCode(tournament.winner) && (
                                                        <img src={`${assetUrl}assets/Flags/${teamNameToCode(tournament.winner)}.png`} alt="" className="hero-flag-sm" onError={function(e) { if (wikipediaFlags[tournament.winner]) { e.target.src = wikipediaFlags[tournament.winner]; } }} />
                                                    )}
                                                    <span className="hero-pill-red">{tournament.winner}</span>
                                                    <span className="text-white-50 hero-concluded-label">champion</span>
                                                </div>
                                            )}
                                            {tournament.runner_up && (
                                                <div className="d-flex align-items-center gap-3">
                                                    {teamNameToCode(tournament.runner_up) && (
                                                        <img src={`${assetUrl}assets/Flags/${teamNameToCode(tournament.runner_up)}.png`} alt="" className="hero-flag-xs" onError={function(e) { if (wikipediaFlags[tournament.runner_up]) { e.target.src = wikipediaFlags[tournament.runner_up]; } }} />
                                                    )}
                                                    <span className="hero-pill-red">{tournament.runner_up}</span>
                                                    <span className="text-white-50 hero-concluded-runner-label">runner-up</span>
                                                </div>
                                            )}
                                            {tournament.final_score && (
                                                <div className="mt-1">
                                                    <span className="hero-pill-red">{tournament.final_score}</span>
                                                </div>
                                            )}
                                            {tournament.top_scorer && tournament.top_scorer.name && (
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="fas fa-shoe-prints text-danger hero-scorer-shoe-icon"></i>
                                                    <span className="text-white hero-scorer-name-inline">{tournament.top_scorer.name}</span>
                                                    {tournament.top_scorer.goals && <span className="hero-pill-red">{tournament.top_scorer.goals} goals</span>}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="hero-countdown-row d-flex gap-3 align-items-center">
                                            {[
                                                { label: 'days', value: timeLeft.days || 0, max: 1000 },
                                                { label: 'hrs', value: timeLeft.hours || 0, max: 24 },
                                                { label: 'min', value: timeLeft.minutes || 0, max: 60 },
                                                { label: 'sec', value: timeLeft.seconds || 0, max: 60 }
                                            ].map((item, idx) => {
                                                const size = 56;
                                                const radius = 24;
                                                const center = size / 2;
                                                const circumference = 2 * Math.PI * radius;
                                                const strokeDashoffset = circumference - (item.value / item.max) * circumference;
                                                return (
                                                    <div key={idx} className="hero-countdown-item d-flex flex-column align-items-center gap-1">
                                                        {/* Sized in CSS, not inline, so the dial can grow on
                                                            narrow screens. The circle maths below stays in the
                                                            56-unit space and viewBox scales it — no second set
                                                            of radii to keep in sync. */}
                                                        <div className="position-relative hero-countdown-dial">
                                                            <svg viewBox={`0 0 ${size} ${size}`} className="hero-countdown-svg">
                                                                <circle cx={center} cy={center} r={radius} fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                                                                <circle cx={center} cy={center} r={radius} fill="transparent" stroke={heroAccent} strokeWidth="2.5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                                                            </svg>
                                                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                                                                <div className="text-white fw-bold font-monospace hero-countdown-value">{String(item.value).padStart(2, '0')}</div>
                                                            </div>
                                                        </div>
                                                        <span className="hero-pill-red hero-countdown-label">{item.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Host Countries */}
                                    {tournament?.hosts && tournament.hosts.length > 0 && (
                                        <div className="d-flex align-items-center gap-2 flex-wrap mt-3">
                                            <i className="fas fa-map-marker-alt text-danger"></i>
                                            {tournament.hosts.map((host, idx) => {
                                                // Matched on the country name rather than on
                                                // array position: `hosts` and `host_flag_codes`
                                                // happen to be parallel today, but nothing
                                                // enforces that, and a silent mis-pairing here
                                                // would light up the wrong country.
                                                const isActive = !!activeStadium.country
                                                    && host.trim().toLowerCase()
                                                        === activeStadium.country.trim().toLowerCase();

                                                return (
                                                    <GlassPill
                                                        key={idx}
                                                        size="sm"
                                                        className={isActive ? 'is-active' : ''}
                                                        aria-current={isActive ? 'true' : undefined}
                                                    >
                                                        {host}
                                                    </GlassPill>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* CTA Buttons */}
                                    <div className="hero-cta-buttons d-flex flex-row flex-wrap gap-2 mt-4">
                                        <button type="button" onClick={() => openModal()} className="btn-glass-pill hero-view-matches-btn">
                                            <i className="fas fa-calendar-alt me-2"></i>View Matches
                                        </button>
                                        <a href="/register" className="btn-glass-pill hero-view-matches-btn">
                                            <i className="fas fa-plane me-2"></i>Plan My Trip
                                        </a>
                                    </div>
                                </AccentCard>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Stadium Slider Controls */}
                <div className="stadium-controls-arrows d-flex align-items-center gap-3 position-absolute end-0 bottom-0 mb-5 me-5 d-none d-md-flex hero-stadium-controls">
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


            {/* Bottom section removed — flag carousel & stadium badge moved to top-center */}

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
                            { id: 'seats', label: 'Seat Map', icon: 'fas fa-chair' },
                            { id: 'details', label: 'Stadium Details', icon: 'fas fa-map-marker-alt' },
                            { id: 'stats', label: 'Stats & Awards', icon: 'fas fa-trophy' }
                          ]
                }
            >
                <div className="modal-body p-0">
                    {activeModalTab === 'matches' && (
                        <div className="match-modal-card">
                            <div className="match-modal-list overflow-y-auto custom-scrollbar pr-2 hero-modal-matches">
                                {filteredMatches.length > 0 ? (
                                    filteredMatches.map((match) => (
                                        <div key={match.id} className="match-item p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                                                {/* Match Info */}
                                                <div className="d-flex flex-column gap-1 hero-match-info">
                                                    <span className={`fw-bold text-uppercase ${match.type.includes('FINAL') ? 'text-warning' : 'text-danger'} hero-match-type`}>
                                                        {match.type}
                                                    </span>
                                                    <span className="text-white text-opacity-50 hero-match-date">{match.date}{match.time ? ' \u2013 ' + match.time : ''}</span>
                                                </div>
                                                
                                                {/* Teams VS Layout */}
                                                <div className="d-flex align-items-center justify-content-center gap-3 flex-grow-1">
                                                    {/* Home Team */}
                                                    <div className="d-flex align-items-center justify-content-end gap-3 hero-match-team">
                                                        <span className="text-white fw-bold text-truncate d-none d-md-inline hero-match-team-name">
                                                            {TEAM_NAMES[match.home] || (match.home !== 'TBD' ? match.home.toUpperCase() : 'TBD')}
                                                        </span>
                                                        {match.home === 'TBD' ? (
                                                            <div className="tbd-flag-placeholder"><i className="fas fa-question text-white text-opacity-20 hero-match-tbd-icon"></i></div>
                                                        ) : (
                                                             <img src={`${assetUrl}assets/Flags/${match.home}.png`} alt={match.home} className="match-list-flag" onError={function(e) { if (wikipediaFlags[match.home]) { e.target.src = wikipediaFlags[match.home]; } }} />
                                                        )}
                                                    </div>
                                                    
                                                    {/* VS or Score */}
                                                    <div className="vs-badge">{match.score || 'VS'}</div>
                                                    
                                                    {/* Away Team */}
                                                    <div className="d-flex align-items-center justify-content-start gap-3 hero-match-team">
                                                        {match.away === 'TBD' ? (
                                                            <div className="tbd-flag-placeholder"><i className="fas fa-question text-white text-opacity-20 hero-match-tbd-icon"></i></div>
                                                        ) : (
                                                             <img src={`${assetUrl}assets/Flags/${match.away}.png`} alt={match.away} className="match-list-flag" onError={function(e) { if (wikipediaFlags[match.away]) { e.target.src = wikipediaFlags[match.away]; } }} />
                                                        )}
                                                        <span className="text-white fw-bold text-truncate d-none d-md-inline hero-match-team-name">
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
                                <p className="text-white text-opacity-50 mb-0 hero-modal-info-text">
                                    <i className="fas fa-info-circle me-2 text-danger"></i>
                                    Final match schedules and pairings will be confirmed after the official draw. Tickets not yet available for purchase.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeModalTab === 'seats' && !selectedTeam && (
                        <div className="p-4">
                            <div className="mb-3">
                                <h5 className="text-white fs-6 mb-1">
                                    <i className="fas fa-chair text-warning me-2"></i>
                                    Seat availability preview
                                </h5>
                                <p className="text-white text-opacity-50 small mb-0">
                                    Live indicative view of how sections fill up — hover a block for tier, price and seat count.
                                </p>
                            </div>
                            <StadiumSeatMap
                                stadiumName={activeStadium.name || 'Stadium'}
                                capacity={parseCapacity(activeStadium.capacity, 60000)}
                                soldPct={deriveSoldPct(activeStadium.name)}
                                currency={tournament?.pricing?.currency || 'USD'}
                                basePrice={tournament?.pricing?.ticket_prices?.['Group Stage'] || 150}
                            />
                            <p className="text-white text-opacity-40 small mt-3 mb-0">
                                <i className="fas fa-info-circle me-1"></i>
                                Availability updates as fans confirm packages. Actual section allocation is confirmed on booking.
                            </p>
                        </div>
                    )}

                    {activeModalTab === 'details' && (
                        <div className="p-4">
                            {selectedTeam ? (
                                <div className="team-details-content">
                                    <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-b border-white/10">
                                         <img src={`${assetUrl}assets/Flags/${selectedTeam}.png`} alt={selectedTeam} className="hero-modal-team-flag" onError={function(e) { if (wikipediaFlags[selectedTeam]) { e.target.src = wikipediaFlags[selectedTeam]; } }} />
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
                                        {/* Modal only opens on the active slide, whose
                                            image is already decoded — but it shares the
                                            same failure fallback so a broken file can't
                                            leave a torn-image icon in the dialog. */}
                                        <img
                                            src={activeImage}
                                            alt={activeStadium.name}
                                            className="hero-modal-stadium-img"
                                            loading="lazy"
                                            decoding="async"
                                        />
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
                                    <div className="overflow-y-auto custom-scrollbar hero-modal-all-matches">
                                        {allMatches.map(function(m, idx) {
                                            return (
                                                <div key={idx} className="d-flex align-items-center justify-content-between py-2 border-bottom border-white/5 hero-match-list-item">
                                                    <span className="text-white text-opacity-40 hero-match-date-col">{m.date}</span>
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
