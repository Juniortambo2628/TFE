import React, { useState, useEffect } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { CITY_TIERS, FLIGHT_ORIGINS, SURGE_RATES, BASE_COSTS } from '@/Data/BudgetPricingData';
import MatchCard from '@/Components/Fan/MatchCard';
import { Head, router, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import axios from 'axios';
import DashboardHero from '@/Components/Common/DashboardHero';
import '../../../css/fan/budget-calculator.css';

const USD_TO_KES = 130;

export default function BudgetCalculator({ auth, savedBudgets: initialBudgets = [], userFavorites = [], budgetToEdit = null, allFixtures = [], venues = [], stages = [], groups = [], teams = [] }) {
    // Wizard State
    const [wizardStep, setWizardStep] = useState(1);
    
    // Filter State
    const [selectedStadiums, setSelectedStadiums] = useState([]);
    const [selectedStages, setSelectedStages] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterTab, setFilterTab] = useState('stadium');
    
    // Match Selection
    const [filteredMatches, setFilteredMatches] = useState([]);
    const [selectedMatchIds, setSelectedMatchIds] = useState([]);
    
    // Travel Preferences
    const [flightClass, setFlightClass] = useState('economy');
    const [flightOrigin, setFlightOrigin] = useState('north_america'); // New State
    const [accommodation, setAccommodation] = useState('3_star');
    const [nights, setNights] = useState(7);
    
    // Results
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [breakdown, setBreakdown] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Saved Budgets
    const [savedBudgets, setSavedBudgets] = useState(initialBudgets);
    const [showSavedBudgets, setShowSavedBudgets] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState(null);

    // Custom UI States
    const [showNamingModal, setShowNamingModal] = useState(false);
    const [itineraryName, setItineraryName] = useState('');

    // Initialize from budgetToEdit
    useEffect(() => {
        if (budgetToEdit) {
            setSelectedMatchIds(budgetToEdit.match_ids || []);
            setFlightClass(budgetToEdit.flight_class || 'economy');
            setAccommodation(budgetToEdit.accommodation_level || '3_star');
            setNights(budgetToEdit.nights || 7);
            
            // Populate filteredMatches with the selected matches so step 2 isn't empty
            const selectedMatches = allFixtures.filter(m => 
                (budgetToEdit.match_ids || []).includes(m.id)
            );
            setFilteredMatches(selectedMatches);

            // If already calculated or has breakdown, we can skip to results
            if (budgetToEdit.breakdown) {
                setBreakdown(budgetToEdit.breakdown);
                setEstimatedCost(budgetToEdit.total_cost);
                setShowResults(true);
                setWizardStep(3); 
            } else {
                setWizardStep(2); 
            }
        }
    }, [budgetToEdit]);

    // Initialize from URL query parameter (e.g., ?match=19 from Plan Trip CTA)
    useEffect(() => {
        if (budgetToEdit) return; // Don't override budgetToEdit
        const params = new URLSearchParams(window.location.search);
        const matchIdParam = params.get('match');
        if (matchIdParam) {
            const matchId = parseInt(matchIdParam, 10);
            const match = allFixtures.find(m => m.id === matchId);
            if (match) {
                setFilteredMatches([match]);
                setSelectedMatchIds([matchId]);
                setWizardStep(2);
            }
        }
    }, []);

    // Sync savedBudgets state when props change
    useEffect(() => {
        setSavedBudgets(initialBudgets);
    }, [initialBudgets]);



    // Get unique values from props (passed from controller)
    const allVenues = venues;
    const allStages = stages;
    const allGroups = groups;

    // Stadium image mapping - use available images
    const stadiumImages = {
        'Mexico City Stadium': 'Estadio_Azteca_desde_el_aire_1.webp',
        'Estadio Guadalajara': 'Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho.webp',
        'Estadio Monterrey': 'Estadio_BBVA.webp',
        'Toronto Stadium': 'BMO_Field.webp',
        'BC Place Vancouver': 'BC_Place_Opening_Day_2011-09-30.webp',
        'Los Angeles Stadium': 'Levis_Stadium.webp', // Fallback - no SoFi image available
        'New York New Jersey Stadium': 'Metlife_stadium.webp',
        'Dallas Stadium': 'Cowboys_stadium_inside_view_3.webp',
        'Atlanta Stadium': 'NRG_Stadium,_LEAGUES_CUP_2024_TIGRES_INTER_MIAMI.jnp.webp', // Fallback
        'Houston Stadium': 'Nrgstadium0.webp',
        'Philadelphia Stadium': 'Lincoln_Financial_Field.webp',
        'Miami Stadium': 'Hard_Rock_Stadium_2017.webp',
        'Seattle Stadium': 'CenturyLink_Field_&_Safeco_Field.webp',
        'San Francisco Bay Area Stadium': 'Levis_Stadium.webp',
        'Boston Stadium': 'Gillette_Stadium_entrance_and_lighthouse.webp',
        'Kansas City Stadium': 'Arrowhead_Stadium_(October_27,_2019_-_2).webp'
    };

    // Favorite matches based on fixture_id
    const favoriteMatches = allFixtures.filter(match => {
        if (!Array.isArray(userFavorites) || userFavorites.length === 0) {
            return false;
        }
        return userFavorites.some(fav => fav.fixture_id === match.id);
    });

    const startWithFavorites = () => {
        if (!favoriteMatches.length) {
            toast.error('You have no favorite matches yet. Go to Match Schedule to add some.');
            return;
        }
        const favIds = favoriteMatches.map(m => m.id);
        setFilteredMatches(favoriteMatches);
        setSelectedMatchIds(favIds);
        setWizardStep(2);
    };

    // Open filter modal
    const openFilterModal = () => {
        setShowFilterModal(true);
        document.body.style.overflow = 'hidden';
    };

    // Close filter modal
    const closeFilterModal = () => {
        setShowFilterModal(false);
        document.body.style.overflow = '';
    };

    // Toggle stadium selection
    const toggleStadium = (stadium) => {
        setSelectedStadiums(prev => 
            prev.includes(stadium) ? prev.filter(s => s !== stadium) : [...prev, stadium]
        );
    };

    // Toggle stage selection
    const toggleStage = (stage) => {
        setSelectedStages(prev => 
            prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
        );
    };

    // Toggle team selection
    const toggleTeam = (team) => {
        setSelectedTeams(prev => 
            prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
        );
    };

    // Apply filters and show matches
    const applyFilters = () => {
        let matches = allFixtures;
        
        if (selectedCountries.length > 0) {
            matches = matches.filter(m => {
                // Extract country from venue or use venue name for filtering
                const venueLower = (m.venue || '').toLowerCase();
                return selectedCountries.some(country => 
                    venueLower.includes(country.toLowerCase())
                );
            });
        }
        if (selectedStadiums.length > 0) {
            matches = matches.filter(m => selectedStadiums.includes(m.venue));
        }
        if (selectedStages.length > 0) {
            matches = matches.filter(m => selectedStages.includes(m.stage));
        }
        if (selectedTeams.length > 0) {
            matches = matches.filter(m => 
                selectedTeams.includes(m.homeTeam) || selectedTeams.includes(m.awayTeam)
            );
        }
        
        setFilteredMatches(matches);
        closeFilterModal();
        setWizardStep(2);
    };

    // Toggle country selection
    const toggleCountry = (country) => {
        setSelectedCountries(prev => 
            prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
        );
    };

    // Check for match time/location conflicts
    const getMatchConflict = (matchId) => {
        const currentMatch = allFixtures.find(m => m.id === matchId);
        if (!currentMatch) return null;

        const otherSelected = allFixtures.filter(m => 
            selectedMatchIds.includes(m.id) && m.id !== matchId
        );

        const conflict = otherSelected.find(m => 
            m.date === currentMatch.date && 
            m.time === currentMatch.time && 
            m.venue !== currentMatch.venue
        );

        return conflict;
    };

    // Toggle Match Selection
    const toggleMatch = (matchId) => {
        setSelectedMatchIds(prev => 
            prev.includes(matchId) 
                ? prev.filter(id => id !== matchId)
                : [...prev, matchId]
        );
    };

    // Calculate Budget
    const calculateBudget = () => {
        if (selectedMatchIds.length === 0) {
            toast.warning("Please select at least one match.");
            return;
        }
        setLoading(true);

        setTimeout(() => {
            // 1. Identify Venues and Stages from selection
            const selectedMatches = allFixtures.filter(m => selectedMatchIds.includes(m.id));
            const venues = selectedMatches.map(m => m.venue);
            const stages = selectedMatches.map(m => m.stage);

            // 2. Average City Multiplier (Cost of Living)
            let totalCityMultiplier = 0;
            let avgHotelBaseCost = 0; // Average 3-star cost across selected cities
            
            venues.forEach(venue => {
                const cityData = CITY_TIERS[venue] || { multiplier: 1.0, avg_hotel_3star: 160 }; // Default
                totalCityMultiplier += cityData.multiplier;
                avgHotelBaseCost += cityData.avg_hotel_3star;
            });

            const avgMultiplier = venues.length > 0 ? (totalCityMultiplier / venues.length) : 1.0;
            const avgBaseHotel = venues.length > 0 ? (avgHotelBaseCost / venues.length) : 160;

            // 3. Surge Pricing Priority (Max surge of selected matches)
            let maxSurge = 1.0;
            stages.forEach(stage => {
                const stageSurge = SURGE_RATES[stage] || 1.0;
                if (stageSurge > maxSurge) maxSurge = stageSurge;
            });

            // 4. Calculate Flight Cost (Origin based)
            const originData = FLIGHT_ORIGINS.find(o => o.id === flightOrigin) || FLIGHT_ORIGINS[0];
            const baseFlightCost = originData[flightClass] || 1000;
            // Flight cost is mostly static per origin, but maybe slight bump for peak dates
            const flightCost = baseFlightCost * (1 + ((maxSurge - 1) * 0.5)); // Apply 50% of surge to flights

            // 5. Calculate Accommodation Cost
            // Factor based on accommodation type selected vs 3-star base
            const accommodationFactors = { 
                hostel: 0.4, 
                airbnb: 0.8, 
                '3_star': 1.0, 
                '4_star': 1.6, 
                '5_star': 2.5, 
                'resort': 3.5 
            };
            const accFactor = accommodationFactors[accommodation] || 1.0;
            // Base * Factor * Surge * Nights
            const accommodationCost = avgBaseHotel * accFactor * maxSurge * nights;

            // 6. Tickets (Approximate based on stage)
            // Group: 150, R32/16: 250, QF: 350, SF: 600, Final: 1500
            let totalTicketCost = 0;
            selectedMatches.forEach(m => {
                let ticketPrice = 150; // Group default
                if (m.stage === 'Round of 32' || m.stage === 'Round of 16') ticketPrice = 250;
                if (m.stage === 'Quarter-finals') ticketPrice = 350;
                if (m.stage === 'Semi-finals') ticketPrice = 600;
                if (m.stage === 'Third Place') ticketPrice = 300;
                if (m.stage === 'Final') ticketPrice = 1500;
                totalTicketCost += ticketPrice;
            });

            // 7. Daily Expenses (Food, Transport, Misc)
            // Adjusted by City Multiplier (Cost of Living in that city)
            const dailyFood = BASE_COSTS.food_drink_daily * avgMultiplier * maxSurge;
            const dailyTransport = BASE_COSTS.transport_daily * avgMultiplier; // Transport less affected by surge? Maybe.
            const dailyMisc = BASE_COSTS.misc_daily * avgMultiplier;

            const foodCost = dailyFood * nights;
            const transportCost = dailyTransport * nights;
            const miscCost = dailyMisc * nights;

            // 8. Total
            const totalUSD = totalTicketCost + flightCost + accommodationCost + foodCost + transportCost + miscCost;
            const totalKES = totalUSD * USD_TO_KES;

            // Set Breakdown
            setBreakdown({
                match_tickets: totalTicketCost * USD_TO_KES,
                flights: flightCost * USD_TO_KES,
                accommodation: accommodationCost * USD_TO_KES,
                food_and_drink: foodCost * USD_TO_KES,
                local_transport: transportCost * USD_TO_KES,
                miscellaneous: miscCost * USD_TO_KES
            });

            setEstimatedCost(totalKES);
            setLoading(false);
            setShowResults(true);

            // Track usage
            axios.post(route('analytics.track'), {
                event: 'calculator_use_v2',
                data: {
                    match_count: selectedMatches.length,
                    nights,
                    origin: flightOrigin,
                    cost_kes: totalKES
                }
            });
        }, 800);
    };

    const saveBudget = () => {
        if (budgetToEdit) {
            setItineraryName(budgetToEdit.name);
            submitSave(budgetToEdit.name);
        } else {
            setItineraryName('My World Cup Trip');
            setShowNamingModal(true);
        }
    };

    const submitSave = (name) => {
        setSaving(true);
        
        const data = {
            id: budgetToEdit ? budgetToEdit.id : null,
            name: name,
            total_cost: estimatedCost,
            match_ids: selectedMatchIds,
            accommodation_level: accommodation,
            flight_class: flightClass,
            breakdown: breakdown,
            nights: nights
        };

        router.post(route('fan.budget.save'), data, {
            onSuccess: () => {
                setSaving(false);
                setShowNamingModal(false);
                toast.success(budgetToEdit ? 'Itinerary updated successfully!' : 'Itinerary saved successfully! You will receive an official budget and confirmation from our partners shortly.');
            },
            onError: (errors) => {
                setSaving(false);
                console.error(errors);
                toast.error('Failed to save budget. Please try again.');
            }
        });
    };

    // Toggle accordion
    const toggleAccordion = (key) => {
        setActiveAccordion(activeAccordion === key ? null : key);
    };

    // Get breakdown details
    const getBreakdownDetails = (key) => {
        const originLabel = FLIGHT_ORIGINS.find(o => o.id === flightOrigin)?.label || 'North America';
        
        switch (key) {
            case 'match_tickets':
                return `Estimated for ${selectedMatchIds.length} match(es). Prices vary by stage (Group: $150, Final: $1500).`;
            case 'flights':
                return `Round-trip ${flightClass.replace('_', ' ')} class flight from ${originLabel}. Includes event-time demand adjustments.`;
            case 'accommodation':
                return `${nights} nights of ${accommodation.replace('_', '-')} accommodation. Adjusted for city cost tiers and demand surge.`;
            case 'food_and_drink':
                return `Daily food and drink allowance (approx $60-90/day depending on city).`;
            case 'local_transport':
                return `Local transportation (rideshare, metro) estimated at $30/day base.`;
            case 'miscellaneous':
                return `Entertainment, souvenirs, and other expenses.`;
            default:
                return '';
        }
    };

    // Reset wizard
    const resetWizard = () => {
        setWizardStep(1);
        setSelectedMatchIds([]);
        setSelectedStadiums([]);
        setSelectedStages([]);
        setSelectedTeams([]);
        setSelectedCountries([]);
        setFilteredMatches([]);
        setShowResults(false);
        setBreakdown({});
    };

    // Get country flag
    const getCountryFlag = (country) => {
        const flags = { 'USA': '🇺🇸', 'Mexico': '🇲🇽', 'Canada': '🇨🇦' };
        return flags[country] || '🏟️';
    };

    // Load saved budget
    const loadBudget = (budget) => {
        setEstimatedCost(Number(budget.total_cost));
        setSelectedMatchIds(budget.match_ids || []);
        setAccommodation(budget.accommodation_level);
        setFlightClass(budget.flight_class);
        setFlightOrigin(budget.flight_origin || 'north_america'); // Load origin
        setBreakdown(budget.breakdown || {});
        setNights(budget.nights || 7);
        
        setShowResults(true);
        setWizardStep(3); // Go to results/final step
        setShowSavedBudgets(false); // Close dropdown
    };

    // Format number
    const formatNumber = (num) => new Intl.NumberFormat().format(num);

    // Simple Donut Chart Component
    const DonutChart = ({ data }) => {
        const total = data.reduce((acc, item) => acc + item.value, 0);
        let currentAngle = 0;
        const colors = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a'];
        
        return (
            <div className="budget-chart-container">
                <svg viewBox="0 0 100 100" className="donut-chart">
                    {data.map((item, i) => {
                        const percentage = item.value / total;
                        const angle = percentage * 360;
                        const largeArc = angle > 180 ? 1 : 0;
                        
                        const x1 = 50 + 40 * Math.cos((currentAngle - 90) * Math.PI / 180);
                        const y1 = 50 + 40 * Math.sin((currentAngle - 90) * Math.PI / 180);
                        
                        currentAngle += angle;
                        
                        const x2 = 50 + 40 * Math.cos((currentAngle - 90) * Math.PI / 180);
                        const y2 = 50 + 40 * Math.sin((currentAngle - 90) * Math.PI / 180);
                        
                        const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                        
                        return (
                            <path 
                                key={i}
                                d={pathData} 
                                fill={colors[i % colors.length]} 
                                stroke="#111" 
                                strokeWidth="1"
                            />
                        );
                    })}
                    <circle cx="50" cy="50" r="25" fill="#111" />
                </svg>
                <div className="chart-legend">
                    {data.map((item, i) => (
                        <div key={i} className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: colors[i % colors.length] }}></span>
                            <span className="legend-label">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <FanLayout title="Budget Calculator">
            <Head title="Budget Calculator" />
            
            <div className="calculator-container">
                
                <DashboardHero role="fan" 
                    title="Smart Budget Calculator"
                    subtitle="Plan your World Cup 2026 journey with AI-powered cost estimates"
                    bgImage="/assets/img/fan/backgrounds/finance_hero.png"
                    actions={
                        savedBudgets.length > 0 && (
                            <div className="saved-budgets-dropdown">
                                <button 
                                    className="btn-fan-custom"
                                    onClick={() => setShowSavedBudgets(!showSavedBudgets)}
                                >
                                    <i className="fas fa-folder-open me-2"></i> 
                                    Saved Itineraries ({savedBudgets.length})
                                    <i className={`fas fa-chevron-down ms-2 ${showSavedBudgets ? 'rotated' : ''}`}></i>
                                </button>
                                
                                {showSavedBudgets && (
                                    <div className="dropdown-menu show" style={{ right: 0, left: 'auto' }}>
                                        {savedBudgets.map(budget => (
                                            <div 
                                                key={budget.id} 
                                                className="dropdown-item d-flex justify-content-between align-items-center"
                                                onClick={() => loadBudget(budget)}
                                            >
                                                <div>
                                                    <div className="item-title">{budget.name}</div>
                                                    <div className="item-meta">
                                                        KES {formatNumber(budget.total_cost)} • {budget.nights} Nights
                                                    </div>
                                                </div>
                                                <span className={`badge ${
                                                    budget.partner_status === 'approved' ? 'bg-success' : 
                                                    budget.partner_status === 'modified' ? 'bg-warning text-dark' : 
                                                    'bg-secondary'
                                                }`} style={{ fontSize: '0.65rem' }}>
                                                    {budget.partner_status || 'Pending'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }
                >
                    <div className="hero-content" style={{ flex: '1' }}>
                        {/* Partner Status Display - NEW */}
                        {savedBudgets.find(b => b.is_active)?.partner_status && (
                            <div className="partner-status-box mb-3" style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <h4 className="m-0 text-white" style={{ fontSize: '1rem' }}><i className="fas fa-handshake me-2 text-warning"></i>Travel Partner Update</h4>
                                    <span className={`badge ${savedBudgets.find(b => b.is_active).partner_status === 'approved' ? 'bg-success' : 'bg-primary'}`}>
                                        {savedBudgets.find(b => b.is_active).partner_status.toUpperCase()}
                                    </span>
                                </div>
                                <p className="mb-0 text-gray-300 text-sm">
                                    {savedBudgets.find(b => b.is_active).partner_status === 'approved' 
                                        ? 'Your itinerary has been approved!' 
                                        : 'A partner has proposed a revised budget.'}
                                </p>
                                {savedBudgets.find(b => b.is_active).partner_cost && (
                                    <div className="mt-2 text-warning font-bold">
                                        Partner Estimate: KES {formatNumber(savedBudgets.find(b => b.is_active).partner_cost)}
                                    </div>
                                )}
                            </div>
                        )}

                        {showResults && (
                            <div className="hero-actions">
                                <button className="btn-hero-action" onClick={resetWizard}>
                                    <i className="fas fa-redo me-2"></i>Start Over
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="hero-stats dash-flex dash-gap-xl">
                        <div className="hero-stat-item">
                            <span className="stat-label">Estimated Cost</span>
                            <span className="stat-value">KES {formatNumber(estimatedCost)}</span>
                        </div>
                        <div className="hero-stat-item">
                            <span className="stat-label">Matches</span>
                            <span className="stat-value">{selectedMatchIds.length}</span>
                        </div>
                        <div className="hero-stat-item">
                            <span className="stat-label">Days</span>
                            <span className="stat-value">{nights}</span>
                        </div>
                    </div>
                </DashboardHero>

                {/* Wizard Step 1: Method Selection */}
                {!showResults && wizardStep === 1 && (
                    <div className="section-card">
                        <div className="section-header">
                            <div className="section-icon">
                                <i className="fas fa-futbol"></i>
                            </div>
                            <div>
                                <h3>Select Matches to Attend</h3>
                                <p className="section-subtitle">Filter matches by stadium, stage, or team</p>
                            </div>
                        </div>
                        
                        {/* Selection Summary */}
                        <div className="selection-summary">
                            {selectedStadiums.length === 0 && selectedStages.length === 0 && selectedTeams.length === 0 ? (
                                <p>No filters selected (showing all matches)</p>
                            ) : (
                                <div className="selection-tags">
                                    {selectedCountries.length > 0 && (
                                        <span className="selection-tag">{selectedCountries.length} Countries</span>
                                    )}
                                    {selectedStadiums.length > 0 && (
                                        <span className="selection-tag">{selectedStadiums.length} Stadiums</span>
                                    )}
                                    {selectedStages.length > 0 && (
                                        <span className="selection-tag">{selectedStages.length} Stages</span>
                                    )}
                                    {selectedTeams.length > 0 && (
                                        <span className="selection-tag">{selectedTeams.length} Teams</span>
                                    )}
                                </div>
                            )}
                            {favoriteMatches.length > 0 && (
                                <p className="mt-2 small text-muted">
                                    You have <strong>{favoriteMatches.length}</strong> favorite matches saved from your Match Schedule.
                                </p>
                            )}
                        </div>
                        
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            <button className="btn-open-modal" onClick={openFilterModal}>
                                <i className="fas fa-filter me-2"></i>Choose Filters
                            </button>
                            
                            <button 
                                className="btn-calculate"
                                onClick={() => {
                                    setFilteredMatches(allFixtures);
                                    setWizardStep(2);
                                }}
                            >
                                Show All Matches ({allFixtures.length})
                            </button>
                            
                            <button
                                type="button"
                                className="btn-calculate"
                                onClick={startWithFavorites}
                                disabled={!favoriteMatches.length}
                                title={favoriteMatches.length ? 'Use your favorite matches to start the plan' : 'Add favorites in Match Schedule first'}
                            >
                                <i className="fas fa-star me-2"></i>
                                Start from Favorites
                            </button>
                        </div>
                    </div>
                )}

                {/* Wizard Step 2: Match Selection */}
                {!showResults && wizardStep === 2 && (
                    <div className="section-card">
                        <div className="section-header">
                            <button className="btn-back" onClick={() => setWizardStep(1)}>
                                <i className="fas fa-arrow-left me-1"></i> Back
                            </button>
                            <div>
                                <h3>Available Matches</h3>
                                <p className="section-subtitle">{filteredMatches.length} matches found · {selectedMatchIds.length} selected</p>
                            </div>
                        </div>
                        
                        <div className="matches-grid">
                            {filteredMatches.map(match => (
                                <MatchCard 
                                    key={match.id}
                                    match={match}
                                    isSelected={selectedMatchIds.includes(match.id)}
                                    onToggleSelect={() => toggleMatch(match.id)}
                                    mode="calculator"
                                    conflictLabel={selectedMatchIds.includes(match.id) && getMatchConflict(match.id) ? "Schedule Conflict" : null}
                                />
                            ))}
                        </div>
                        
                        {selectedMatchIds.length > 0 && (
                            <div className="text-center mt-4">
                                <button className="btn-calculate" onClick={() => setWizardStep(3)}>
                                    Continue with {selectedMatchIds.length} matches <i className="fas fa-arrow-right ms-2"></i>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Wizard Step 3: Travel Preferences */}
                {!showResults && wizardStep === 3 && (
                    <div className="section-card">
                        <div className="section-header">
                            <button className="btn-back" onClick={() => setWizardStep(2)}>
                                <i className="fas fa-arrow-left me-1"></i> Back
                            </button>
                            <div>
                                <h3>Travel Preferences</h3>
                                <p className="section-subtitle">Customize your journey</p>
                            </div>
                        </div>

                        <div className="preferences-grid">
                            {/* Travel Origin - NEW */}
                            <div className="preference-group full-width">
                                <label><i className="fas fa-globe-americas"></i> Traveling From</label>
                                <div className="origin-selector d-flex gap-2 flex-wrap">
                                    {FLIGHT_ORIGINS.map(origin => (
                                        <button
                                            key={origin.id}
                                            className={`btn-fan-filter ${flightOrigin === origin.id ? 'active' : ''}`}
                                            onClick={() => setFlightOrigin(origin.id)}
                                            style={{ flex: '1 1 auto', minWidth: '150px' }}
                                        >
                                            {origin.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Flight Class */}
                            <div className="preference-group">
                                <label><i className="fas fa-plane-departure"></i> Flight Class</label>
                                <div className="option-cards">
                                    {[
                                        { value: 'economy', icon: 'fa-plane', label: 'Economy', desc: 'Standard seating' },
                                        { value: 'business', icon: 'fa-crown', label: 'Business', desc: 'Premium comfort' }
                                    ].map(opt => (
                                        <div 
                                            key={opt.value}
                                            className={`option-card ${flightClass === opt.value ? 'active' : ''}`}
                                            onClick={() => setFlightClass(opt.value)}
                                        >
                                            <div className="option-icon"><i className={`fas ${opt.icon}`}></i></div>
                                            <div className="option-details">
                                                <h4>{opt.label}</h4>
                                                <p>{opt.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Accommodation */}
                            <div className="preference-group">
                                <label><i className="fas fa-hotel"></i> Accommodation</label>
                                <div className="option-cards">
                                    {[
                                        { value: 'hostel', icon: 'fa-bed', label: 'Hostel', desc: 'Budget' },
                                        { value: '3_star', icon: 'fa-hotel', label: '3-Star', desc: 'Comfortable' },
                                        { value: 'airbnb', icon: 'fa-home', label: 'Airbnb', desc: 'Local living' },
                                        { value: '5_star', icon: 'fa-concierge-bell', label: '5-Star', desc: 'Luxury' },
                                        { value: 'resort', icon: 'fa-umbrella-beach', label: 'Resort', desc: 'All-inclusive' }
                                    ].map(opt => (
                                        <div 
                                            key={opt.value}
                                            className={`option-card ${accommodation === opt.value ? 'active' : ''}`}
                                            onClick={() => setAccommodation(opt.value)}
                                        >
                                            <div className="option-icon"><i className={`fas ${opt.icon}`}></i></div>
                                            <div className="option-details">
                                                <h4>{opt.label}</h4>
                                                <p>{opt.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="preference-group full-width">
                                <label><i className="fas fa-clock"></i> Duration (Days)</label>
                                <div className="range-slider-container">
                                    <input 
                                        type="range" 
                                        className="range-slider"
                                        min="3" max="30" 
                                        value={nights}
                                        onChange={(e) => setNights(parseInt(e.target.value))}
                                    />
                                    <span className="range-value">{nights} Days</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-4">
                            <button className="btn-calculate" onClick={calculateBudget} disabled={loading}>
                                {loading ? (
                                    <><i className="fas fa-spinner fa-spin me-2"></i>Calculating...</>
                                ) : (
                                    <><i className="fas fa-calculator me-2"></i>Calculate Budget</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                {showResults && (
                    <div className="section-card result-card">
                        <div className="section-header">
                            <div className="section-icon">
                                <i className="fas fa-chart-pie"></i>
                            </div>
                            <div>
                                <h3>Estimated Breakdown</h3>
                                <p className="section-subtitle">Detailed cost analysis</p>
                            </div>
                        </div>
                        
                        <div className="result-total">
                            {budgetToEdit?.partner_cost > 0 && budgetToEdit.partner_status === 'modified' ? (
                                <div className="partner-revised-cost mb-3">
                                    <div className="badge bg-warning text-dark mb-2 px-3 py-2" style={{ fontSize: '0.8rem', borderRadius: '20px' }}>
                                        <i className="fas fa-certificate me-2"></i>PARTNER REVISED PROPOSAL
                                    </div>
                                    <h2 className="text-yellow-500 mb-1" style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                                        KES {formatNumber(budgetToEdit.partner_cost)}
                                    </h2>
                                    <p className="text-white-50 small">
                                        Your Estimate: <span className="text-decoration-line-through">KES {formatNumber(estimatedCost)}</span>
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h2>KES {formatNumber(estimatedCost)}</h2>
                                    <p>Estimated total for {selectedMatchIds.length} matches, {nights} days</p>
                                </>
                            )}
                        </div>

                        {/* Chart */}
                        <div className="result-chart-section">
                            <DonutChart 
                                data={[
                                    { label: 'Tickets', value: breakdown.match_tickets || 0 },
                                    { label: 'Flights', value: breakdown.flights || 0 },
                                    { label: 'Accommodation', value: breakdown.accommodation || 0 },
                                    { label: 'Food & Drink', value: breakdown.food_and_drink || 0 },
                                    { label: 'Transport', value: breakdown.local_transport || 0 },
                                    { label: 'Misc', value: breakdown.miscellaneous || 0 }
                                ].filter(d => d.value > 0)} 
                            />
                        </div>

                        <div className="breakdown-accordion">
                            {[
                                { key: 'match_tickets', label: 'Match Tickets', icon: 'fa-ticket-alt' },
                                { key: 'flights', label: 'Flights', icon: 'fa-plane' },
                                { key: 'accommodation', label: 'Accommodation', icon: 'fa-hotel' },
                                { key: 'food_and_drink', label: 'Food & Drink', icon: 'fa-utensils' },
                                { key: 'local_transport', label: 'Local Transport', icon: 'fa-bus' },
                                { key: 'miscellaneous', label: 'Miscellaneous', icon: 'fa-ellipsis-h' }
                            ].map(cat => (
                                <div key={cat.key} className={`accordion-item ${activeAccordion === cat.key ? 'active' : ''}`}>
                                    <div className="accordion-header" onClick={() => toggleAccordion(cat.key)}>
                                        <div className="accordion-title">
                                            <i className={`fas ${cat.icon}`}></i> {cat.label}
                                        </div>
                                        <div className="accordion-right">
                                            <div className="accordion-cost">KES {formatNumber(breakdown[cat.key] || 0)}</div>
                                            <i className={`fas fa-chevron-down accordion-icon ${activeAccordion === cat.key ? 'rotated' : ''}`}></i>
                                        </div>
                                    </div>
                                    {activeAccordion === cat.key && (
                                        <div className="accordion-body">
                                            <p className="detail-text">{getBreakdownDetails(cat.key)}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="d-flex gap-3 mt-4">
                            <button className="btn btn-outline-secondary flex-fill" onClick={resetWizard}>
                                <i className="fas fa-redo me-2"></i>Start Over
                            </button>
                             <button className="btn-fan-custom flex-fill" onClick={saveBudget} disabled={saving}>
                                {saving ? (
                                    <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</>
                                ) : (
                                    <><i className="fas fa-save me-2"></i>Save Itinerary</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="filter-modal-overlay" onClick={closeFilterModal}>
                    <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="filter-tabs">
                                <button 
                                    className={`filter-tab ${filterTab === 'country' ? 'active' : ''}`}
                                    onClick={() => setFilterTab('country')}
                                >
                                    Countries {selectedCountries.length > 0 && <span className="badge">{selectedCountries.length}</span>}
                                </button>
                                <button 
                                    className={`filter-tab ${filterTab === 'stadium' ? 'active' : ''}`}
                                    onClick={() => setFilterTab('stadium')}
                                >
                                    Stadiums {selectedStadiums.length > 0 && <span className="badge">{selectedStadiums.length}</span>}
                                </button>
                                <button 
                                    className={`filter-tab ${filterTab === 'stage' ? 'active' : ''}`}
                                    onClick={() => setFilterTab('stage')}
                                >
                                    Stages {selectedStages.length > 0 && <span className="badge">{selectedStages.length}</span>}
                                </button>
                                <button 
                                    className={`filter-tab ${filterTab === 'group' ? 'active' : ''}`}
                                    onClick={() => setFilterTab('group')}
                                >
                                    Teams {selectedTeams.length > 0 && <span className="badge">{selectedTeams.length}</span>}
                                </button>
                                <button 
                                    className={`filter-tab ${filterTab === 'favorites' ? 'active' : ''}`}
                                    onClick={() => setFilterTab('favorites')}
                                >
                                    Favorites {favoriteMatches.length > 0 && <span className="badge">{favoriteMatches.length}</span>}
                                </button>
                            </div>
                            <button className="close-modal" onClick={closeFilterModal}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            {/* Country Grid */}
                            {filterTab === 'country' && (
                                <div className="selection-grid country-grid">
                                    {['USA', 'Mexico', 'Canada'].map(country => (
                                        <div 
                                            key={country}
                                            className={`selection-card country-card ${selectedCountries.includes(country) ? 'selected' : ''}`}
                                            onClick={() => toggleCountry(country)}
                                            style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                                        >
                                            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{getCountryFlag(country)}</div>
                                            <div className="card-label" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{country}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Stadium Grid */}
                            {filterTab === 'stadium' && (
                                <div className="selection-grid stadium-grid">
                                    {allVenues.map(venue => {
                                        // Dynamic base path for WAMP compatibility
                                        const basePath = window.location.pathname.includes('/TFE/') 
                                            ? '/TFE/public' 
                                            : '';
                                        const imgSrc = stadiumImages[venue] 
                                            ? `${basePath}/assets/stadium_selection_modal/${stadiumImages[venue]}`
                                            : `${basePath}/assets/img/backdrops/stadium-sideview.jpg`;
                                        
                                        return (
                                            <div 
                                                key={venue}
                                                className={`selection-card stadium-card ${selectedStadiums.includes(venue) ? 'selected' : ''}`}
                                                onClick={() => toggleStadium(venue)}
                                            >
                                                <img src={imgSrc} className="card-image" alt={venue} />
                                                <div className="card-label">{venue}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Stage Grid */}
                            {filterTab === 'stage' && (
                                <div className="selection-grid stage-grid">
                                    {allStages.map(stage => {
                                        let icon = 'fa-trophy';
                                        if (stage.includes('Group')) icon = 'fa-users';
                                        if (stage.includes('Final')) icon = 'fa-medal';
                                        if (stage.includes('Round')) icon = 'fa-futbol';
                                        
                                        return (
                                            <div 
                                                key={stage}
                                                className={`selection-card ${selectedStages.includes(stage) ? 'selected' : ''}`}
                                                onClick={() => toggleStage(stage)}
                                            >
                                                <div className="card-icon"><i className={`fas ${icon}`}></i></div>
                                                <div className="card-label">{stage}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Group/Team Grid */}
                            {filterTab === 'group' && (
                                <div className="selection-grid group-grid">
                                    {/* Teams from props - flat list for selection */}
                                    <div className="selection-card group-card">
                                        <div className="group-card-header">
                                            <span className="group-letter">All Teams</span>
                                        </div>
                                        <ul className="group-team-list">
                                            {teams.map(team => (
                                                <li 
                                                    key={team}
                                                    className={`team-item ${selectedTeams.includes(team) ? 'selected' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleTeam(team);
                                                    }}
                                                >
                                                    {team}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Favorites Grid */}
                            {filterTab === 'favorites' && (
                                <div className="selection-grid favorites-grid px-3">
                                    {favoriteMatches.length > 0 ? (
                                        favoriteMatches.map(match => (
                                            <MatchCard 
                                                key={match.id}
                                                match={match}
                                                isSelected={selectedMatchIds.includes(match.id)}
                                                onToggleSelect={() => toggleMatch(match.id)}
                                                mode="calculator"
                                            />
                                        ))
                                    ) : (
                                        <div className="empty-state-inline">
                                            <i className="fas fa-star"></i>
                                            <p>You haven&apos;t added any favorite matches yet. Mark favorites on the Match Schedule page.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="modal-footer">
                            <button
                                className="btn-apply"
                                onClick={() => {
                                    if (filterTab === 'favorites') {
                                        if (favoriteMatches.length === 0) {
                                            alert('You have no favorite matches yet. Go to Match Schedule to add some.');
                                            return;
                                        }
                                        const favIds = favoriteMatches.map(m => m.id);
                                        setFilteredMatches(favoriteMatches);
                                        setSelectedMatchIds(favIds);
                                        closeFilterModal();
                                        setWizardStep(2);
                                    } else {
                                        applyFilters();
                                    }
                                }}
                            >
                                <i className="fas fa-check me-2"></i>
                                {filterTab === 'favorites' ? 'Use Favorite Matches' : 'Show Matches'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Naming Modal */}
            {showNamingModal && (
                <div className="filter-modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="filter-modal" style={{ maxWidth: '450px', top: '50%', transform: 'translateY(-50%)' }}>
                        <div className="modal-header border-0 pb-0">
                            <h3 className="m-0 text-white" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>Name Your Itinerary</h3>
                            <button className="close-modal" onClick={() => setShowNamingModal(false)}>×</button>
                        </div>
                        <div className="modal-body py-4">
                            <p className="text-white-50 mb-3 small">Please provide a name to identify this travel plan in your itineraries.</p>
                            <input 
                                type="text"
                                className="form-control bg-dark border-white/10 text-white p-3"
                                style={{ borderRadius: '12px', fontSize: '1rem' }}
                                value={itineraryName}
                                onChange={(e) => setItineraryName(e.target.value)}
                                placeholder="e.g., My World Cup Finals Trip"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && itineraryName.trim() && submitSave(itineraryName)}
                            />
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button 
                                className="btn btn-link text-white-50 text-decoration-none me-3" 
                                onClick={() => setShowNamingModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-calculate m-0" 
                                style={{ padding: '12px 30px' }}
                                onClick={() => itineraryName.trim() && submitSave(itineraryName)}
                                disabled={!itineraryName.trim() || saving}
                            >
                                {saving ? <i className="fas fa-spinner fa-spin"></i> : 'Confirm & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </FanLayout>
    );
}
