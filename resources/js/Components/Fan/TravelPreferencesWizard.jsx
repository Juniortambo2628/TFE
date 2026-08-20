import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WorldMap from 'react-svg-worldmap';
import { REGIONS, ISO2_TO_ISO3, getCountryRegionColors } from '@/Data/travelRegions';
import { getFlightOrigins, getAccommodationFactors, getSpendingTiers, getInsuranceDaily, getMerchandisePerMatch } from '@/Data/BudgetPricingData';

const SLIDES = [
    { id: 'region', label: 'Region', icon: 'fa-globe-americas' },
    { id: 'country', label: 'Country', icon: 'fa-flag' },
    { id: 'flight', label: 'Flight', icon: 'fa-plane' },
    { id: 'hotel', label: 'Hotel', icon: 'fa-hotel' },
    { id: 'duration', label: 'Duration', icon: 'fa-clock' },
    { id: 'spending', label: 'Spending', icon: 'fa-wallet' },
    { id: 'group', label: 'Group', icon: 'fa-users' },
    { id: 'addons', label: 'Add-ons', icon: 'fa-plus-circle' },
    { id: 'summary', label: 'Summary', icon: 'fa-check-circle' },
];

const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

export default function TravelPreferencesWizard({
    tournamentPricing,
    onComplete,
    initialData = {},
}) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(1);

    // Preference state
    const [selectedRegion, setSelectedRegion] = useState(initialData.region || null);
    const [selectedCountry, setSelectedCountry] = useState(initialData.country || null);
    const [flightOrigin, setFlightOrigin] = useState(initialData.flightOrigin || null);
    const [flightClass, setFlightClass] = useState(initialData.flightClass || 'economy');
    const [accommodation, setAccommodation] = useState(initialData.accommodation || '3_star');
    const [nights, setNights] = useState(initialData.nights || 7);
    const [spendingTier, setSpendingTier] = useState(initialData.spendingTier || 'mid_range');
    const [travelGroupSize, setTravelGroupSize] = useState(initialData.travelGroupSize || 1);
    const [includeInsurance, setIncludeInsurance] = useState(initialData.includeInsurance ?? true);
    const [includeVisa, setIncludeVisa] = useState(initialData.includeVisa ?? true);
    const [includeMerchandise, setIncludeMerchandise] = useState(initialData.includeMerchandise ?? true);

    const regionColors = getCountryRegionColors();
    const flightOrigins = getFlightOrigins(tournamentPricing);
    const accFactors = getAccommodationFactors(tournamentPricing);
    const spendingTiers = getSpendingTiers(tournamentPricing);

    const canProceed = useCallback(() => {
        const slide = SLIDES[currentSlide];
        switch (slide.id) {
            case 'region': return selectedRegion !== null;
            case 'country': return selectedCountry !== null;
            case 'flight': return flightOrigin !== null;
            default: return true;
        }
    }, [currentSlide, selectedRegion, selectedCountry, flightOrigin]);

    const goNext = () => {
        if (!canProceed()) return;
        setDirection(1);
        setCurrentSlide(prev => Math.min(prev + 1, SLIDES.length - 1));
    };

    const goPrev = () => {
        setDirection(-1);
        setCurrentSlide(prev => Math.max(prev - 1, 0));
    };

    const goToSlide = (index) => {
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
    };

    const handleComplete = () => {
        onComplete({
            region: selectedRegion,
            country: selectedCountry,
            countryCode: selectedCountry ? ISO2_TO_ISO3[selectedCountry] : null,
            flightOrigin,
            flightClass,
            accommodation,
            nights,
            spendingTier,
            travelGroupSize,
            includeInsurance,
            includeVisa,
            includeMerchandise,
        });
    };

    const getSummaryLabel = () => {
        const regionName = selectedRegion ? REGIONS[selectedRegion]?.name : '—';
        const countryName = selectedCountry
            ? REGIONS[selectedRegion]?.countries.find(c => c.code === selectedCountry)?.name
            : '—';
        const originLabel = flightOrigins.find(o => o.id === flightOrigin)?.label || '—';
        return { regionName, countryName, originLabel };
    };

    const renderSlide = () => {
        const slide = SLIDES[currentSlide];
        switch (slide.id) {
            case 'region':
                return (
                    <RegionSlide
                        selectedRegion={selectedRegion}
                        onSelect={(r) => { setSelectedRegion(r); setSelectedCountry(null); }}
                        regionColors={regionColors}
                    />
                );
            case 'country':
                return (
                    <CountrySlide
                        region={selectedRegion}
                        selectedCountry={selectedCountry}
                        onSelect={setSelectedCountry}
                    />
                );
            case 'flight':
                return (
                    <FlightSlide
                        origins={flightOrigins}
                        selectedOrigin={flightOrigin}
                        onSelectOrigin={setFlightOrigin}
                        selectedClass={flightClass}
                        onSelectClass={setFlightClass}
                    />
                );
            case 'hotel':
                return (
                    <HotelSlide
                        factors={accFactors}
                        selected={accommodation}
                        onSelect={setAccommodation}
                    />
                );
            case 'duration':
                return <DurationSlide nights={nights} onChange={setNights} />;
            case 'spending':
                return (
                    <SpendingSlide
                        tiers={spendingTiers}
                        selected={spendingTier}
                        onSelect={setSpendingTier}
                    />
                );
            case 'group':
                return <GroupSlide selected={travelGroupSize} onSelect={setTravelGroupSize} />;
            case 'addons':
                return (
                    <AddonsSlide
                        insurance={includeInsurance}
                        visa={includeVisa}
                        merchandise={includeMerchandise}
                        onToggleInsurance={() => setIncludeInsurance(!includeInsurance)}
                        onToggleVisa={() => setIncludeVisa(!includeVisa)}
                        onToggleMerchandise={() => setIncludeMerchandise(!includeMerchandise)}
                    />
                );
            case 'summary':
                return (
                    <SummarySlide
                        labels={getSummaryLabel()}
                        flightClass={flightClass}
                        accommodation={accommodation}
                        nights={nights}
                        spendingTier={spendingTier}
                        travelGroupSize={travelGroupSize}
                        includeInsurance={includeInsurance}
                        includeVisa={includeVisa}
                        includeMerchandise={includeMerchandise}
                        onEdit={goToSlide}
                    />
                );
            default:
                return null;
        }
    };

    const slideIndex = currentSlide;
    const slide = SLIDES[slideIndex];

    return (
        <div className="pref-wizard">
            {/* Progress bar */}
            <div className="pref-wizard-progress">
                {SLIDES.map((s, i) => (
                    <button
                        key={s.id}
                        className={`pref-progress-step ${i === currentSlide ? 'active' : ''} ${i < currentSlide ? 'completed' : ''}`}
                        onClick={() => goToSlide(i)}
                        title={s.label}
                    >
                        <i className={`fas ${s.icon}`}></i>
                        <span className="step-label">{s.label}</span>
                    </button>
                ))}
            </div>

            {/* Slide content */}
            <div className="pref-wizard-body">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentSlide}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="pref-slide"
                    >
                        <div className="pref-slide-header">
                            <i className={`fas ${slide.icon} slide-icon`}></i>
                            <h3>{slide.label}</h3>
                        </div>
                        <div className="pref-slide-content">
                            {renderSlide()}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="pref-wizard-nav">
                <button
                    className="pref-nav-btn pref-nav-prev"
                    onClick={goPrev}
                    disabled={currentSlide === 0}
                >
                    <i className="fas fa-arrow-left me-2"></i>Back
                </button>
                <span className="pref-nav-step">{currentSlide + 1} of {SLIDES.length}</span>
                {currentSlide < SLIDES.length - 1 ? (
                    <button
                        className="pref-nav-btn pref-nav-next"
                        onClick={goNext}
                        disabled={!canProceed()}
                    >
                        Next<i className="fas fa-arrow-right ms-2"></i>
                    </button>
                ) : (
                    <button
                        className="pref-nav-btn pref-nav-finish"
                        onClick={handleComplete}
                    >
                        <i className="fas fa-check me-2"></i>Confirm
                    </button>
                )}
            </div>
        </div>
    );
}

/* ── Slide: Region ────────────────────────────────────────── */
function RegionSlide({ selectedRegion, onSelect, regionColors }) {
    return (
        <div>
            <p className="pref-instruction">Select the region you&apos;re traveling from</p>
            <div className="pref-map-container">
                <WorldMap
                    color="#374151"
                    tooltipBgColor="#1f2937"
                    tooltipTextColor="#e5e7eb"
                    size="lg"
                    data={Object.entries(regionColors).map(([code, color]) => ({
                        country: code,
                        color: selectedRegion && regionColors[code] === REGIONS[selectedRegion]?.color
                            ? REGIONS[selectedRegion].color
                            : color,
                        value: 1,
                    }))}
                />
            </div>
            <div className="pref-region-grid">
                {Object.entries(REGIONS).map(([key, region]) => (
                    <button
                        key={key}
                        className={`pref-region-btn ${selectedRegion === key ? 'selected' : ''}`}
                        onClick={() => onSelect(key)}
                        style={{ '--region-color': region.color }}
                    >
                        <span className="region-dot" style={{ background: region.color }}></span>
                        {region.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Slide: Country ───────────────────────────────────────── */
function CountrySlide({ region, selectedCountry, onSelect }) {
    if (!region) return <p className="pref-instruction">Please select a region first</p>;
    const countries = REGIONS[region]?.countries || [];

    return (
        <div>
            <p className="pref-instruction">Select your country of departure</p>
            <div className="pref-country-grid">
                {countries.map(country => (
                    <button
                        key={country.code}
                        className={`pref-country-btn ${selectedCountry === country.code ? 'selected' : ''}`}
                        onClick={() => onSelect(country.code)}
                    >
                        <span className="country-flag">{country.flag}</span>
                        <span className="country-name">{country.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Slide: Flight ────────────────────────────────────────── */
function FlightSlide({ origins, selectedOrigin, onSelectOrigin, selectedClass, onSelectClass }) {
    return (
        <div>
            <div className="pref-section">
                <h4 className="pref-section-title">Where are you flying from?</h4>
                <div className="pref-option-grid">
                    {origins.map(origin => (
                        <button
                            key={origin.id}
                            className={`pref-option-card ${selectedOrigin === origin.id ? 'selected' : ''}`}
                            onClick={() => onSelectOrigin(origin.id)}
                        >
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{origin.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="pref-section">
                <h4 className="pref-section-title">Flight class</h4>
                <div className="pref-option-grid two-col">
                    {[
                        { value: 'economy', icon: 'fa-plane', label: 'Economy', desc: 'Standard seating' },
                        { value: 'business', icon: 'fa-crown', label: 'Business', desc: 'Premium comfort' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            className={`pref-option-card ${selectedClass === opt.value ? 'selected' : ''}`}
                            onClick={() => onSelectClass(opt.value)}
                        >
                            <i className={`fas ${opt.icon}`}></i>
                            <span className="opt-label">{opt.label}</span>
                            <span className="opt-desc">{opt.desc}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ── Slide: Hotel ─────────────────────────────────────────── */
function HotelSlide({ factors, selected, onSelect }) {
    const options = [
        { value: 'hostel', icon: 'fa-bed', label: 'Hostel', desc: 'Budget' },
        { value: '3_star', icon: 'fa-hotel', label: '3-Star', desc: 'Comfortable' },
        { value: 'airbnb', icon: 'fa-home', label: 'Airbnb', desc: 'Local living' },
        { value: '5_star', icon: 'fa-concierge-bell', label: '5-Star', desc: 'Luxury' },
        { value: 'resort', icon: 'fa-umbrella-beach', label: 'Resort', desc: 'All-inclusive' },
    ];

    return (
        <div>
            <p className="pref-instruction">What type of accommodation do you prefer?</p>
            <div className="pref-option-grid three-col">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        className={`pref-option-card ${selected === opt.value ? 'selected' : ''}`}
                        onClick={() => onSelect(opt.value)}
                    >
                        <i className={`fas ${opt.icon}`}></i>
                        <span className="opt-label">{opt.label}</span>
                        <span className="opt-desc">{opt.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Slide: Duration ──────────────────────────────────────── */
function DurationSlide({ nights, onChange }) {
    return (
        <div>
            <p className="pref-instruction">How many days will you stay?</p>
            <div className="pref-duration">
                <input
                    type="range"
                    className="pref-range-slider"
                    min="3" max="30"
                    value={nights}
                    onChange={e => onChange(parseInt(e.target.value))}
                />
                <div className="pref-duration-value">
                    <span className="duration-num">{nights}</span>
                    <span className="duration-label">days</span>
                </div>
            </div>
            <div className="pref-duration-presets">
                {[5, 7, 10, 14, 21].map(d => (
                    <button
                        key={d}
                        className={`preset-btn ${nights === d ? 'active' : ''}`}
                        onClick={() => onChange(d)}
                    >
                        {d}d
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Slide: Spending ──────────────────────────────────────── */
function SpendingSlide({ tiers, selected, onSelect }) {
    const options = [
        { value: 'budget', icon: 'fa-piggy-bank', label: 'Budget', desc: 'Save on daily costs' },
        { value: 'mid_range', icon: 'fa-balance-scale', label: 'Mid-Range', desc: 'Comfortable' },
        { value: 'luxury', icon: 'fa-gem', label: 'Luxury', desc: 'Premium experience' },
    ];

    return (
        <div>
            <p className="pref-instruction">What&apos;s your spending style?</p>
            <div className="pref-option-grid three-col">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        className={`pref-option-card ${selected === opt.value ? 'selected' : ''}`}
                        onClick={() => onSelect(opt.value)}
                    >
                        <i className={`fas ${opt.icon}`}></i>
                        <span className="opt-label">{opt.label}</span>
                        <span className="opt-desc">{opt.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Slide: Group Size ────────────────────────────────────── */
function GroupSlide({ selected, onSelect }) {
    const options = [
        { value: 1, icon: 'fa-user', label: 'Solo', desc: '1 traveler' },
        { value: 2, icon: 'fa-user-friends', label: 'Couple', desc: '2 travelers' },
        { value: 4, icon: 'fa-users', label: 'Family', desc: '3-5 travelers' },
        { value: 6, icon: 'fa-users-cog', label: 'Group', desc: '6+ travelers' },
    ];

    return (
        <div>
            <p className="pref-instruction">How many people are traveling?</p>
            <div className="pref-option-grid two-col">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        className={`pref-option-card ${selected === opt.value ? 'selected' : ''}`}
                        onClick={() => onSelect(opt.value)}
                    >
                        <i className={`fas ${opt.icon}`}></i>
                        <span className="opt-label">{opt.label}</span>
                        <span className="opt-desc">{opt.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Slide: Add-ons ───────────────────────────────────────── */
function AddonsSlide({ insurance, visa, merchandise, onToggleInsurance, onToggleVisa, onToggleMerchandise }) {
    const options = [
        { key: 'insurance', icon: 'fa-shield-alt', label: 'Travel Insurance', active: insurance, onToggle: onToggleInsurance },
        { key: 'visa', icon: 'fa-passport', label: 'Visa Costs', active: visa, onToggle: onToggleVisa },
        { key: 'merchandise', icon: 'fa-shopping-bag', label: 'Merchandise', active: merchandise, onToggle: onToggleMerchandise },
    ];

    return (
        <div>
            <p className="pref-instruction">What extras would you like to include?</p>
            <div className="pref-addons-list">
                {options.map(opt => (
                    <button
                        key={opt.key}
                        className={`pref-addon-btn ${opt.active ? 'active' : ''}`}
                        onClick={opt.onToggle}
                    >
                        <i className={`fas ${opt.icon}`}></i>
                        <span>{opt.label}</span>
                        <span className={`addon-toggle ${opt.active ? 'on' : 'off'}`}>
                            {opt.active ? 'ON' : 'OFF'}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Slide: Summary ───────────────────────────────────────── */
function SummarySlide({ labels, flightClass, accommodation, nights, spendingTier, travelGroupSize, includeInsurance, includeVisa, includeMerchandise, onEdit }) {
    const items = [
        { slide: 0, label: 'Region', value: labels.regionName, icon: 'fa-globe-americas' },
        { slide: 1, label: 'Country', value: labels.countryName, icon: 'fa-flag' },
        { slide: 2, label: 'Flying from', value: labels.originLabel, icon: 'fa-map-marker-alt' },
        { slide: 2, label: 'Flight class', value: flightClass === 'economy' ? 'Economy' : 'Business', icon: 'fa-plane' },
        { slide: 3, label: 'Accommodation', value: accommodation.replace('_', '-').replace(/\b\w/g, l => l.toUpperCase()), icon: 'fa-hotel' },
        { slide: 4, label: 'Duration', value: `${nights} days`, icon: 'fa-clock' },
        { slide: 5, label: 'Spending', value: spendingTier.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), icon: 'fa-wallet' },
        { slide: 6, label: 'Group size', value: `${travelGroupSize} ${travelGroupSize === 1 ? 'person' : 'people'}`, icon: 'fa-users' },
        { slide: 7, label: 'Insurance', value: includeInsurance ? 'Included' : 'Not included', icon: 'fa-shield-alt' },
        { slide: 7, label: 'Visa', value: includeVisa ? 'Included' : 'Not included', icon: 'fa-passport' },
        { slide: 7, label: 'Merchandise', value: includeMerchandise ? 'Included' : 'Not included', icon: 'fa-shopping-bag' },
    ];

    return (
        <div>
            <p className="pref-instruction">Review your travel preferences</p>
            <div className="pref-summary-list">
                {items.map((item, i) => (
                    <div key={i} className="pref-summary-item" onClick={() => onEdit(item.slide)}>
                        <div className="summary-left">
                            <i className={`fas ${item.icon} summary-icon`}></i>
                            <span className="summary-label">{item.label}</span>
                        </div>
                        <div className="summary-right">
                            <span className="summary-value">{item.value}</span>
                            <i className="fas fa-pen summary-edit"></i>
                        </div>
                    </div>
                ))}
            </div>
            <p className="pref-hint"><i className="fas fa-info-circle me-1"></i>Click any item to go back and change it</p>
        </div>
    );
}
