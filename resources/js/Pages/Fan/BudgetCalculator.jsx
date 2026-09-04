import React, { useState, useEffect } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { getCityTiers, getFlightOrigins, getSurgeRates, getDailyCosts, getTicketPrices, getAccommodationFactors, getExchangeRate, getSpendingTiers, getVisaCosts, getInsuranceDaily, getMerchandisePerMatch } from '@/Data/BudgetPricingData';
import MatchCard from '@/Components/Fan/MatchCard';
import FlightSelector from '@/Components/Fan/FlightSelector';
import HotelSelector from '@/Components/Fan/HotelSelector';
import ItinerarySummary from '@/Components/Fan/ItinerarySummary';
import TravelPreferencesWizard from '@/Components/Fan/TravelPreferencesWizard';
import PackagePicker from '@/Components/Fan/PackagePicker';
import CostScenarioChart from '@/Components/Fan/CostScenarioChart';
import ItineraryMap from '@/Components/Fan/ItineraryMap';
import '../../../css/fan/travel-preferences-wizard.css';
import { Head, router, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import axios from 'axios';
import DashboardHero from '@/Components/Common/DashboardHero';
import '../../../css/fan/budget-calculator.css';
import { useTournament } from '@/Context/TournamentContext';
import { TEAM_FLAGS, countryFlagMap, TEAM_CODES } from '@/Data/countryFlags';

export default function BudgetCalculator({
    auth,
    savedBudgets: initialBudgets = [],
    budgetToEdit = null,
    tournamentPricing: rawPricing = {},
    tournamentId: initialTournamentId = '',
    packages = [],
    // Fixture bundle is deferred by the server — on first paint it's
    // undefined; Inertia fills it in via a background partial reload.
    fixtureBundle = null,
}) {
    // Package the fan picked at step 0. null = they're building custom.
    const [selectedPackage, setSelectedPackage] = useState(null);
    // Unpack the deferred bundle with sane defaults so the component
    // renders (in a loading state) before the fetch lands.
    const allFixtures = fixtureBundle?.allFixtures || [];
    const userFavorites = fixtureBundle?.userFavorites || [];
    const venues = fixtureBundle?.venues || [];
    const stages = fixtureBundle?.stages || [];
    const groups = fixtureBundle?.groups || [];
    const teams = fixtureBundle?.teams || [];
    const venueCountries = fixtureBundle?.venueCountries || {};
    const fixturesLoading = !fixtureBundle;
    const { tournament } = useTournament();
    const tournamentPricing = rawPricing;
    const [usdToKes, setUsdToKes] = useState(getExchangeRate(tournamentPricing));
    // Wizard State — start at step 0 (package picker) so fans see the
    // fast-path prepacked options before building custom. budgetToEdit
    // and the ?match= deep link skip past it (handled below).
    const [wizardStep, setWizardStep] = useState(0);
    
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
    const [flightOrigin, setFlightOrigin] = useState(() => {
        const origins = getFlightOrigins(tournamentPricing);
        return origins[0]?.id || 'north_america';
    });
    const [accommodation, setAccommodation] = useState('3_star');
    const [nights, setNights] = useState(7);
    const [spendingTier, setSpendingTier] = useState('mid_range');
    const [travelGroupSize, setTravelGroupSize] = useState(1);
    const [includeInsurance, setIncludeInsurance] = useState(true);
    const [includeVisa, setIncludeVisa] = useState(true);
    const [merchandisePerMatch, setMerchandisePerMatch] = useState(true);
    
    // Results
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [breakdown, setBreakdown] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Quick Estimate Mode (for tournaments without fixtures)
    const [quickEstimate, setQuickEstimate] = useState(false);
    const [quickEstimateMatches, setQuickEstimateMatches] = useState(3);
    const [quickEstimateKnockoutPct, setQuickEstimateKnockoutPct] = useState(30);
    
    // Saved Budgets
    const [savedBudgets, setSavedBudgets] = useState(initialBudgets);
    const [showSavedBudgets, setShowSavedBudgets] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState(null);

    // Custom UI States
    const [showNamingModal, setShowNamingModal] = useState(false);
    const [itineraryName, setItineraryName] = useState('');
    const [showItinerary, setShowItinerary] = useState(false);

    // Real flight/hotel selections from SerpAPI
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [realFlightPrice, setRealFlightPrice] = useState(null);
    const [realHotelPrice, setRealHotelPrice] = useState(null);

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

    // Package picker handlers — step-0 chooser wires into these.
    const handlePickPackage = (pkg) => {
        if (!pkg) return;
        setSelectedPackage(pkg);
        // Pre-fill wizard state from the package template. Fan can still
        // tweak in later steps; we track the origin via selectedPackage
        // so the save call carries package_id.
        setSelectedMatchIds(pkg.included_match_ids || []);
        setFlightClass(pkg.flight_class || 'economy');
        setAccommodation(pkg.accommodation_level || '3_star');
        setNights(pkg.nights || 7);
        // Populate filteredMatches so step 2 shows the package's matches.
        if (Array.isArray(pkg.included_match_ids) && pkg.included_match_ids.length > 0 && allFixtures.length > 0) {
            const matches = allFixtures.filter((m) => pkg.included_match_ids.includes(m.id));
            setFilteredMatches(matches);
        }
        setWizardStep(2);
    };

    const handleBuildCustom = () => {
        setSelectedPackage(null);
        setWizardStep(1);
    };

    // Skip step 0 automatically if the fan is editing an existing budget,
    // landed via a ?match=… deep link, or clicked "Use this package" on a
    // detail page (?package=<id>). Also skip if no packages exist for
    // this tournament — no point showing an empty picker.
    useEffect(() => {
        if (budgetToEdit) return; // handled in its own effect
        const params = new URLSearchParams(window.location.search);
        if (params.get('match')) return;

        // Deep-link from the package detail page.
        const pkgIdParam = params.get('package');
        if (pkgIdParam) {
            const pkg = (packages || []).find(p => String(p.id) === String(pkgIdParam));
            if (pkg) {
                handlePickPackage(pkg);
                return;
            }
        }

        if (!packages || packages.length === 0) {
            setWizardStep(1);
        }
    }, [budgetToEdit, packages]);

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

    // Stadium image lookup — resolves the Wikipedia thumbnail for a venue name
    // from the tournament payload. Any tournament that has Wikipedia venues
    // gets rich imagery for free; a missing lookup falls through to the
    // component's local placeholder.
    const wikipediaVenueImages = React.useMemo(function () {
        var map = {};
        var venuesList = (tournament && tournament.venues) || [];
        venuesList.forEach(function (v) {
            if (v && v.name) {
                map[v.name] = v.thumbnail || v.image || null;
            }
        });
        return map;
    }, [tournament]);

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
                const venueCountry = venueCountries[m.venue];
                return venueCountry && selectedCountries.includes(venueCountry);
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

    // Calculate Budget — tries API first, falls back to client-side
    const calculateBudget = () => {
        const hasMatches = quickEstimate || selectedMatchIds.length > 0;
        if (!hasMatches) {
            toast.warning("Please select at least one match or use Quick Estimate.");
            return;
        }
        setLoading(true);

        const FLIGHT_ORIGINS = getFlightOrigins(tournamentPricing);
        const originData = FLIGHT_ORIGINS.find(o => o.id === flightOrigin) || FLIGHT_ORIGINS[0];
        const originCode = originData?.code || 'NBO';

        const hosts = tournament?.hosts || [];
        const destCity = quickEstimate ? (hosts[0] || 'Nairobi') : (
            allFixtures.find(m => selectedMatchIds.includes(m.id))?.venue?.split(' Stadium')[0] || hosts[0] || 'Nairobi'
        );

        const now = new Date();
        const departDate = new Date(now);
        departDate.setMonth(departDate.getMonth() + 3);
        const returnDate = new Date(departDate);
        returnDate.setDate(returnDate.getDate() + nights);

        const apiParams = {
            tournament_id: initialTournamentId || tournament?.id || 'afcon_2027',
            origin_code: originCode,
            destination_city: destCity,
            departure_date: departDate.toISOString().split('T')[0],
            return_date: returnDate.toISOString().split('T')[0],
            nights,
            flight_class: flightClass,
            spending_tier: spendingTier,
            group_size: travelGroupSize,
            match_count: quickEstimate ? quickEstimateMatches : selectedMatchIds.length,
            knockout_pct: quickEstimate ? quickEstimateKnockoutPct : 30,
            passport_country: 'KEN',
            include_insurance: includeInsurance,
            include_visa: includeVisa,
            include_merchandise: merchandisePerMatch,
        };

        axios.post('/api/budget/estimate', apiParams, { timeout: 10000 })
            .then(res => {
                if (res.data?.success && res.data.data) {
                    const d = res.data.data;
                    setUsdToKes(d.summary.exchange_rate);
                    const kesBreakdown = {};
                    Object.entries(d.breakdown).forEach(([key, val]) => {
                        kesBreakdown[key] = val.kes;
                    });
                    setBreakdown(kesBreakdown);
                    setEstimatedCost(d.summary.total_kes);
                    setLoading(false);
                    setShowResults(true);
                    trackUsage(apiParams.match_count, d.summary.total_kes);
                } else {
                    throw new Error('API returned failure');
                }
            })
            .catch(() => {
                // Fallback to client-side calculation
                clientSideCalculate();
            });
    };

    const clientSideCalculate = () => {
        const CITY_TIERS = getCityTiers(tournamentPricing);
        const SURGE_RATES = getSurgeRates(tournamentPricing);
        const FLIGHT_ORIGINS = getFlightOrigins(tournamentPricing);
        const BASE_COSTS = getDailyCosts(tournamentPricing);
        const TICKET_PRICES = getTicketPrices(tournamentPricing);
        const ACCOMMODATION_FACTORS = getAccommodationFactors(tournamentPricing);
        const EXCHANGE_RATE = getExchangeRate(tournamentPricing);
        const SPENDING_TIERS = getSpendingTiers(tournamentPricing);
        const VISA_COSTS = getVisaCosts(tournamentPricing);
        const INSURANCE_DAILY = getInsuranceDaily(tournamentPricing);
        const MERCH_PER_MATCH = getMerchandisePerMatch(tournamentPricing);

        const tierMultiplier = SPENDING_TIERS[spendingTier] || 1.0;

        let totalTicketCost = 0;
        let avgMultiplier = 1.0;
        let avgBaseHotel = 160;
        let maxSurge = 1.0;
        let matchCount = 0;

        if (quickEstimate) {
            matchCount = quickEstimateMatches;
            const groupMatches = Math.round(matchCount * (1 - quickEstimateKnockoutPct / 100));
            const knockoutMatches = matchCount - groupMatches;
            totalTicketCost += groupMatches * (TICKET_PRICES['Group Stage'] || 150);
            totalTicketCost += knockoutMatches * (TICKET_PRICES['Quarter-finals'] || 350);
            maxSurge = quickEstimateKnockoutPct > 50 ? 1.4 : 1.15;
            const allTiers = Object.values(CITY_TIERS);
            if (allTiers.length > 0) {
                avgMultiplier = allTiers.reduce((s, t) => s + t.multiplier, 0) / allTiers.length;
                avgBaseHotel = allTiers.reduce((s, t) => s + t.avg_hotel_3star, 0) / allTiers.length;
            }
        } else {
            const selectedMatches = allFixtures.filter(m => selectedMatchIds.includes(m.id));
            matchCount = selectedMatches.length;
            const venues = selectedMatches.map(m => m.venue);
            const stages = selectedMatches.map(m => m.stage);
            let totalCityMultiplier = 0;
            let totalHotelCost = 0;
            venues.forEach(venue => {
                const cityData = CITY_TIERS[venue] || { multiplier: 1.0, avg_hotel_3star: 160 };
                totalCityMultiplier += cityData.multiplier;
                totalHotelCost += cityData.avg_hotel_3star;
            });
            avgMultiplier = venues.length > 0 ? (totalCityMultiplier / venues.length) : 1.0;
            avgBaseHotel = venues.length > 0 ? (totalHotelCost / venues.length) : 160;
            stages.forEach(stage => {
                const stageSurge = SURGE_RATES[stage] || 1.0;
                if (stageSurge > maxSurge) maxSurge = stageSurge;
            });
            selectedMatches.forEach(m => {
                totalTicketCost += TICKET_PRICES[m.stage] || TICKET_PRICES['Group Stage'] || 150;
            });
        }

        const originData = FLIGHT_ORIGINS.find(o => o.id === flightOrigin) || FLIGHT_ORIGINS[0];
        const baseFlightCost = originData[flightClass] || 1000;
        let flightCost = baseFlightCost * (1 + ((maxSurge - 1) * 0.5));
        const accFactor = ACCOMMODATION_FACTORS[accommodation] || 1.0;
        const sharedAccommodation = Math.max(1, Math.ceil(travelGroupSize / 2));
        let accommodationCost = (avgBaseHotel * accFactor * maxSurge * nights) / sharedAccommodation;

        // Override with real prices from SerpAPI selections if available
        if (realFlightPrice !== null) {
            flightCost = realFlightPrice;
        }
        if (realHotelPrice !== null) {
            accommodationCost = (realHotelPrice * nights) / sharedAccommodation;
        }
        const dailyFood = BASE_COSTS.food * avgMultiplier * maxSurge * tierMultiplier;
        const dailyTransport = BASE_COSTS.transport * avgMultiplier * tierMultiplier;
        const dailyMisc = BASE_COSTS.misc * avgMultiplier * tierMultiplier;
        const foodCost = dailyFood * nights;
        const transportCost = dailyTransport * nights;
        const miscCost = dailyMisc * nights;
        const insuranceCost = includeInsurance ? INSURANCE_DAILY * nights : 0;
        let visaCost = 0;
        if (includeVisa) {
            const hosts = tournament?.hosts || [];
            hosts.forEach(h => { visaCost += VISA_COSTS[h] || 0; });
        }
        const merchCost = MERCH_PER_MATCH * matchCount;
        const perPersonUSD = totalTicketCost + flightCost + accommodationCost + foodCost + transportCost + miscCost + insuranceCost + merchCost;
        const totalGroupUSD = (perPersonUSD * travelGroupSize) + visaCost;
        const totalKES = totalGroupUSD * EXCHANGE_RATE;

        setUsdToKes(EXCHANGE_RATE);
        setBreakdown({
            match_tickets: totalTicketCost * travelGroupSize * EXCHANGE_RATE,
            flights: flightCost * travelGroupSize * EXCHANGE_RATE,
            accommodation: accommodationCost * travelGroupSize * EXCHANGE_RATE,
            food_and_drink: foodCost * travelGroupSize * EXCHANGE_RATE,
            local_transport: transportCost * travelGroupSize * EXCHANGE_RATE,
            insurance: insuranceCost * travelGroupSize * EXCHANGE_RATE,
            visa: visaCost * EXCHANGE_RATE,
            merchandise: merchCost * travelGroupSize * EXCHANGE_RATE,
            miscellaneous: miscCost * travelGroupSize * EXCHANGE_RATE,
        });
        setEstimatedCost(totalKES);
        setLoading(false);
        setShowResults(true);
        trackUsage(matchCount, totalKES);
    };

    const trackUsage = (matchCount, costKes) => {
        axios.post(route('analytics.track'), {
            event: 'calculator_use_v2',
            data: {
                match_count: matchCount,
                nights,
                origin: flightOrigin,
                group_size: travelGroupSize,
                spending_tier: spendingTier,
                cost_kes: costKes,
            }
        }).catch(() => {});
    };

    const saveBudget = () => {
        if (budgetToEdit) {
            setItineraryName(budgetToEdit.name);
            submitSave(budgetToEdit.name);
        } else {
            setItineraryName(`My ${tournament?.short_name || 'Tournament'} Trip`);
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
            nights: nights,
            tournament_id: initialTournamentId || tournament?.id || null,
            // Carry the package origin so bookings + sold_count can be
            // tracked when the fan confirms this itinerary later.
            package_id: selectedPackage?.id || null,
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
        const FLIGHT_ORIGINS = getFlightOrigins(tournamentPricing);
        const originLabel = FLIGHT_ORIGINS.find(o => o.id === flightOrigin)?.label || 'Origin';
        const TICKET_PRICES = getTicketPrices(tournamentPricing);
        const ticketStages = Object.entries(TICKET_PRICES).map(([s, p]) => `${s}: $${p}`).join(', ');
        const matchCount = quickEstimate ? quickEstimateMatches : selectedMatchIds.length;
        
        switch (key) {
            case 'match_tickets':
                return `Estimated for ${matchCount} match(es). Prices by stage — ${ticketStages}.`;
            case 'flights':
                if (selectedFlight) {
                    return `Real price from Google Flights: ${selectedFlight.segments?.[0]?.airline || 'Airline'} (${selectedFlight.segments?.[0]?.flight_number || ''}), ${selectedFlight.stops === 0 ? 'Non-stop' : selectedFlight.stops + ' stop(s)'}, ${selectedFlight.total_duration_minutes} min flight time.`;
                }
                return `Round-trip ${flightClass.replace('_', ' ')} class flight from ${originLabel}. Includes event-time demand adjustments.`;
            case 'accommodation':
                if (selectedHotel) {
                    return `${selectedHotel.name} (${selectedHotel.rating?.toFixed(1)}★, ${selectedHotel.reviews?.toLocaleString()} reviews) — $${realHotelPrice}/night × ${nights} nights${travelGroupSize > 1 ? ` shared by ${travelGroupSize} travelers` : ''}.`;
                }
                return `${nights} nights of ${accommodation.replace('_', '-')} accommodation for ${travelGroupSize > 1 ? `${travelGroupSize} travelers (shared)` : '1 traveler'}. Adjusted for city cost tiers and demand surge.`;
            case 'food_and_drink':
                return `Daily food and drink allowance adjusted for local cost of living and spending tier.`;
            case 'local_transport':
                return `Local transportation (rideshare, metro) estimated per day.`;
            case 'insurance':
                return `Travel insurance at $${getInsuranceDaily(tournamentPricing)}/day for ${nights} days.`;
            case 'visa':
                return `Visa costs for host country entry (if applicable).`;
            case 'merchandise':
                return `Estimated merchandise and souvenirs at $${getMerchandisePerMatch(tournamentPricing)}/match.`;
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
        setQuickEstimate(false);
        setSelectedFlight(null);
        setSelectedHotel(null);
        setRealFlightPrice(null);
        setRealHotelPrice(null);
    };

    // Get country flag code for image path
    const getCountryFlagCode = (country) => {
        const lower = country.toLowerCase();
        return countryFlagMap[lower] || TEAM_CODES[country] || null;
    };

    const getCountryFlagImg = (country) => {
        const code = getCountryFlagCode(country);
        if (!code || code === 'TBD') return null;
        const basePath = window.location.pathname.includes('/TFE/') ? '/TFE/public' : '';
        return `${basePath}/assets/Flags/${code}.png`;
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
                    subtitle={`Plan your ${tournament?.short_name || 'tournament'} journey with AI-powered cost estimates`}
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

                {/* Wizard Step 0: Package picker — fast-path prepacked options.
                    Only rendered when packages exist for this tournament and the
                    fan isn't editing an existing budget / arriving via ?match=. */}
                {!showResults && wizardStep === 0 && packages && packages.length > 0 && (
                    <div className="section-card">
                        <div className="section-header">
                            <div className="section-icon">
                                <i className="fas fa-gift"></i>
                            </div>
                            <div>
                                <h3>Start with a package or build your own</h3>
                                <p className="section-subtitle">
                                    Pick a fixed-price package we've curated, or build a fully custom itinerary from scratch.
                                </p>
                            </div>
                        </div>
                        <div className="p-3">
                            <PackagePicker
                                packages={packages}
                                onPickPackage={handlePickPackage}
                                onBuildCustom={handleBuildCustom}
                            />
                        </div>
                    </div>
                )}

                {/* Package origin banner — shows in later steps so the fan
                    knows they can revisit the picker. */}
                {!showResults && selectedPackage && wizardStep > 0 && (
                    <div
                        className="mb-3 p-3 rounded d-flex align-items-center justify-content-between"
                        style={{
                            background: 'linear-gradient(135deg, rgba(220,20,60,0.10), rgba(59,130,246,0.10))',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        <div>
                            <div className="text-white fw-semibold">
                                <i className="fas fa-gift me-2 text-danger"></i>
                                Based on package: {selectedPackage.name}
                            </div>
                            <div className="text-white-50 small">
                                Fixed price {selectedPackage.currency} {Number(selectedPackage.base_price).toLocaleString()} — customize anything you like.
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-light"
                            onClick={() => { setSelectedPackage(null); setWizardStep(0); }}
                        >
                            Change starting point
                        </button>
                    </div>
                )}

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

                            <button
                                type="button"
                                className="btn-calculate"
                                style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}
                                onClick={() => {
                                    setQuickEstimate(true);
                                    setWizardStep(3);
                                }}
                            >
                                <i className="fas fa-bolt me-2"></i>
                                Quick Estimate
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
                        </div>

                        {quickEstimate && (
                            <div style={{ marginBottom: '16px' }}>
                                <div className="preference-group full-width">
                                    <label><i className="fas fa-futbol"></i> Expected Matches</label>
                                    <div className="range-slider-container">
                                        <input
                                            type="range"
                                            className="range-slider"
                                            min="1" max="15"
                                            value={quickEstimateMatches}
                                            onChange={(e) => setQuickEstimateMatches(parseInt(e.target.value))}
                                        />
                                        <span className="range-value">{quickEstimateMatches} Matches</span>
                                    </div>
                                    <label className="mt-2" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                        <i className="fas fa-percentage me-1"></i>
                                        Knockout stage %: {quickEstimateKnockoutPct}%
                                    </label>
                                    <div className="range-slider-container">
                                        <input
                                            type="range"
                                            className="range-slider"
                                            min="0" max="100" step="10"
                                            value={quickEstimateKnockoutPct}
                                            onChange={(e) => setQuickEstimateKnockoutPct(parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <TravelPreferencesWizard
                            tournamentPricing={tournamentPricing}
                            initialData={{
                                region: null,
                                country: null,
                                flightOrigin: flightOrigin,
                                flightClass,
                                accommodation,
                                nights,
                                spendingTier,
                                travelGroupSize,
                                includeInsurance,
                                includeVisa,
                                includeMerchandise: merchandisePerMatch,
                            }}
                            onComplete={(prefs) => {
                                setFlightOrigin(prefs.flightOrigin || flightOrigin);
                                setFlightClass(prefs.flightClass);
                                setAccommodation(prefs.accommodation);
                                setNights(prefs.nights);
                                setSpendingTier(prefs.spendingTier);
                                setTravelGroupSize(prefs.travelGroupSize);
                                setIncludeInsurance(prefs.includeInsurance);
                                setIncludeVisa(prefs.includeVisa);
                                setMerchandisePerMatch(prefs.includeMerchandise);
                                setWizardStep(4);
                            }}
                        />
                    </div>
                )}

                {/* Wizard Step 4: Real Flight & Hotel Selection */}
                {!showResults && wizardStep === 4 && (
                    <div className="section-card">
                        <div className="section-header">
                            <button className="btn-back" onClick={() => setWizardStep(3)}>
                                <i className="fas fa-arrow-left me-1"></i> Back
                            </button>
                            <div>
                                <h3>Real Flights & Hotels</h3>
                                <p className="section-subtitle">Search live prices from Google Flights & Hotels</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Flight Selection */}
                            <div>
                                <FlightSelector
                                    departureId={(() => {
                                        const origins = getFlightOrigins(tournamentPricing);
                                        const originData = origins.find(o => o.id === flightOrigin) || origins[0];
                                        return originData?.code || 'NBO';
                                    })()}
                                    arrivalId={(() => {
                                        const hosts = tournament?.hosts || [];
                                        return 'JFK'; // Default — will be refined by venue
                                    })()}
                                    outboundDate={(() => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() + 3);
                                        return d.toISOString().split('T')[0];
                                    })()}
                                    returnDate={(() => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() + 3);
                                        d.setDate(d.getDate() + nights);
                                        return d.toISOString().split('T')[0];
                                    })()}
                                    adults={travelGroupSize}
                                    onFlightSelected={(flight) => {
                                        setSelectedFlight(flight);
                                        setRealFlightPrice(flight.price_usd);
                                    }}
                                    selectedFlight={selectedFlight}
                                />
                            </div>

                            {/* Hotel Selection */}
                            <div>
                                <HotelSelector
                                    city={tournament?.hosts?.[0] || 'Nairobi'}
                                    checkIn={(() => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() + 3);
                                        return d.toISOString().split('T')[0];
                                    })()}
                                    checkOut={(() => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() + 3);
                                        d.setDate(d.getDate() + nights);
                                        return d.toISOString().split('T')[0];
                                    })()}
                                    adults={travelGroupSize}
                                    onHotelSelected={(hotel) => {
                                        setSelectedHotel(hotel);
                                        setRealHotelPrice(hotel.price_per_night_usd);
                                    }}
                                    selectedHotel={selectedHotel}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid #2d3748' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                                    {selectedFlight && (
                                        <span style={{ marginRight: '16px' }}>
                                            <i className="fas fa-plane me-1 text-success"></i>
                                            Flight: <strong style={{ color: '#e5e7eb' }}>${realFlightPrice}</strong>/person
                                        </span>
                                    )}
                                    {selectedHotel && (
                                        <span>
                                            <i className="fas fa-hotel me-1 text-success"></i>
                                            Hotel: <strong style={{ color: '#e5e7eb' }}>${realHotelPrice}</strong>/night
                                        </span>
                                    )}
                                    {!selectedFlight && !selectedHotel && (
                                        <span style={{ color: '#6b7280' }}>
                                            <i className="fas fa-info-circle me-1"></i>
                                            Search and select options above, or skip to use estimates
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn-calculate" onClick={calculateBudget} disabled={loading}>
                                        {loading ? (
                                            <><i className="fas fa-spinner fa-spin me-2"></i>Calculating...</>
                                        ) : (
                                            <><i className="fas fa-calculator me-2"></i>Calculate with Selections</>
                                        )}
                                    </button>
                                </div>
                            </div>
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
                            {(selectedFlight || selectedHotel) && (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                                    {selectedFlight && (
                                        <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                                            <i className="fas fa-plane me-1"></i>Real flight: ${realFlightPrice}/person
                                        </span>
                                    )}
                                    {selectedHotel && (
                                        <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                                            <i className="fas fa-hotel me-1"></i>Real hotel: ${realHotelPrice}/night
                                        </span>
                                    )}
                                </div>
                            )}
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
                                    { label: 'Insurance', value: breakdown.insurance || 0 },
                                    { label: 'Visa', value: breakdown.visa || 0 },
                                    { label: 'Merchandise', value: breakdown.merchandise || 0 },
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
                                { key: 'insurance', label: 'Travel Insurance', icon: 'fa-shield-alt' },
                                { key: 'visa', label: 'Visa', icon: 'fa-passport' },
                                { key: 'merchandise', label: 'Merchandise', icon: 'fa-shopping-bag' },
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

                        <CostScenarioChart
                            currentTotalKes={estimatedCost}
                            matchCount={selectedMatchIds.length || 1}
                            nights={nights}
                            accommodation={accommodation}
                            pricing={tournamentPricing}
                        />

                        {/* Multi-city venue map — pins every tournament venue,
                            highlights the fan's selected matches, and draws
                            distance chips between consecutive stops. */}
                        <div className="mt-4">
                            <ItineraryMap
                                venues={(tournament && tournament.venues) || []}
                                selectedMatches={allFixtures.filter((m) => selectedMatchIds.includes(m.id))}
                            />
                        </div>

                        <div className="d-flex gap-3 mt-4">
                            <button className="btn btn-outline-secondary flex-fill" onClick={resetWizard}>
                                <i className="fas fa-redo me-2"></i>Start Over
                            </button>
                            <button className="btn btn-outline-info flex-fill" onClick={() => setShowItinerary(true)}
                                style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                                <i className="fas fa-file-alt me-2"></i>View Itinerary
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
                                    {(tournament?.hosts || ['USA', 'Mexico', 'Canada']).map(country => {
                                        const flagImg = getCountryFlagImg(country);
                                        return (
                                            <div 
                                                key={country}
                                                className={`selection-card country-card ${selectedCountries.includes(country) ? 'selected' : ''}`}
                                                onClick={() => toggleCountry(country)}
                                                style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                                            >
                                                {flagImg ? (
                                                    <img src={flagImg} alt={country} style={{ width: '4rem', height: '3rem', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />
                                                ) : (
                                                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{country.charAt(0)}</div>
                                                )}
                                                <div className="card-label" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{country}</div>
                                            </div>
                                        );
                                    })}
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
                                        // Prefer the Wikipedia thumbnail resolved from the active
                                        // tournament; fall back to a generic backdrop.
                                        const imgSrc = wikipediaVenueImages[venue]
                                            || `${basePath}/assets/img/backdrops/stadium-sideview.jpg`;

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
                                placeholder={`e.g., My ${tournament?.short_name || 'Tournament'} Trip`}
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

            {/* Itinerary Print Modal */}
            {showItinerary && (
                <div className="filter-modal-overlay" style={{ zIndex: 1200, overflow: 'auto' }}>
                    <div style={{ position: 'absolute', top: '10px', right: '20px', zIndex: 1201, display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => window.print()}
                            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            <i className="fas fa-print me-1"></i>Print
                        </button>
                        <button
                            onClick={() => setShowItinerary(false)}
                            style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            <i className="fas fa-times me-1"></i>Close
                        </button>
                    </div>
                    <div style={{ marginTop: '50px', paddingBottom: '40px' }}>
                        <ItinerarySummary
                            tournament={tournament}
                            selectedMatches={allFixtures.filter(m => selectedMatchIds.includes(m.id))}
                            selectedFlight={selectedFlight}
                            selectedHotel={selectedHotel}
                            breakdown={breakdown}
                            estimatedCost={estimatedCost}
                            nights={nights}
                            travelGroupSize={travelGroupSize}
                            spendingTier={spendingTier}
                            flightOrigin={flightOrigin}
                            tournamentPricing={tournamentPricing}
                        />
                    </div>
                </div>
            )}

        </FanLayout>
    );
}
