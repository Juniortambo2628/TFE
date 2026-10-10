import React, { useState, useEffect, lazy, Suspense } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { getFlightOrigins, getRateForCurrency, SUPPORTED_CURRENCIES } from '@/Data/BudgetPricingData';
import { formatMoney } from '@/lib/utils';
import { estimateTrip } from '@/lib/tripEstimate';
import MatchCard from '@/Components/Fan/MatchCard';
import FlightSelector from '@/Components/Fan/FlightSelector';
import HotelSelector from '@/Components/Fan/HotelSelector';
import TravelPreferencesWizard from '@/Components/Fan/TravelPreferencesWizard';
import PackagePicker from '@/Components/Fan/PackagePicker';
import StepFlow from '@/Components/Common/StepFlow';
import TripPlannerDialog from '@/Components/Common/TripPlannerDialog';
import { openTripPlanner, findFixtureById } from '@/lib/tripPlanner';
import SchoolGroupWizard from '@/Components/Fan/SchoolGroupWizard';
import '../../../css/fan/travel-preferences-wizard.css';
import { Head, router, Link, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import axios from 'axios';
import DashboardHero from '@/Components/Common/DashboardHero';
import TfeModal from '@/Components/Common/TfeModal';
import '../../../css/fan/budget-calculator.css';
import { useTournament } from '@/Context/TournamentContext';
import { countryFlagMap, TEAM_CODES } from '@/Data/countryFlags';
import { iataForOrigin, iataForDestination, destinationCityForHotel } from '@/Data/airports';
import { resolveStadiumImage } from '@/Data/stadiumImages';
import { SkeletonSlab } from '@/Components/Common/Skeleton';
import MatchFilterDialog from '@/Components/Fan/Calculator/MatchFilterDialog';
import CalculatorRecap from '@/Components/Fan/Calculator/CalculatorRecap';
import { saveErrorStep, saveErrorMessage } from '@/lib/calculatorErrors';

// Only needed once there is a result / once the fan asks to print, so they
// load on demand rather than with step 1 (Sprint 69).
const CalculatorResults = lazy(() => import('@/Components/Fan/Calculator/CalculatorResults'));
const ItineraryPrintView = lazy(() => import('@/Components/Fan/Calculator/ItineraryPrintView'));

export default function BudgetCalculator({
    auth,
    // Null for an individual account, so the declaration prompt below can
    // never fire for one (Sprint 62).
    institution = null,
    savedBudgets: initialBudgets = [],
    financePartners = [],
    budgetToEdit = null,
    tournamentPricing: rawPricing = {},
    tournamentId: initialTournamentId = '',
    packages = [],
    // Fixture bundle is deferred by the server — on first paint it's
    // undefined; Inertia fills it in via a background partial reload.
    fixtureBundle = null,
    // Bowl payloads for every catalogued venue, also deferred. Empty until
    // the partial reload lands, which is why the seat map section guards on
    // length rather than assuming it is there.
    venueBowls = [],
    // The public "Plan my trip" estimate, carried through sign-in (Sprint 64).
    plannerEstimate = null,
}) {
    // Shared, name-keyed stadium imagery (see HandleInertiaRequests).
    const { stadiumImages, flash } = usePage().props;

    // A plan reaches a partner's Convert queue the moment it is saved
    // against their listing, so an institution that declares its group
    // afterwards leaves a window in which the partner reads the brief with
    // no minors flag on it. The server flashes the id of a just-saved plan
    // that has no declaration, and the wizard opens on it (Sprint 62).
    const [declareFor, setDeclareFor] = useState(null);
    const pendingDeclaration = flash?.declare_group ?? null;

    useEffect(() => {
        if (!pendingDeclaration || !institution) return;
        setDeclareFor({ id: pendingDeclaration, reference_id: null, school_group: null });
    }, [pendingDeclaration, institution]);
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
    // Sprint 28 — fan-selected display currency. USD is the platform
    // baseline and the currency the calculator engine computes in;
    // `estimatedCost` and every `breakdown` value are stored in
    // whatever `currency` says. Change the picker → recompute.
    const [currency, setCurrency] = useState(budgetToEdit?.currency || 'USD');
    const rate = getRateForCurrency(tournamentPricing, currency);
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

    // Wizard progress — the labelled run for the StepFlow bar, plus the
    // 1-based cursor into it. Step 0 (the package picker) only exists when
    // this tournament has packages, so both the list and the cursor shift
    // by one with it; `showResults` is the last position, since the summary
    // is somewhere the fan arrives rather than a state outside the flow.
    const hasPackageStep = Boolean(packages && packages.length > 0);
    const wizardStepLabels = [
        hasPackageStep ? { title: 'Start', icon: 'fas fa-layer-group' } : null,
        { title: 'Approach', icon: 'fas fa-futbol' },
        { title: 'Matches', icon: 'fas fa-calendar-check' },
        { title: 'Travel', icon: 'fas fa-suitcase-rolling' },
        { title: 'Flights + stay', icon: 'fas fa-plane' },
        { title: 'Summary', icon: 'fas fa-receipt' },
    ].filter(Boolean);
    // Clamped because a tournament with no packages starts at wizardStep 0
    // for the one frame before the skip effect moves it to 1 — position 0
    // is not a step in that list, and reading as "not started" would be a
    // visible flicker on every load.
    const wizardCursor = showResults
        ? wizardStepLabels.length
        : Math.min(
            Math.max(wizardStep + (hasPackageStep ? 1 : 0), 1),
            wizardStepLabels.length,
        );
    
    // Quick Estimate Mode (for tournaments without fixtures)
    const [quickEstimate, setQuickEstimate] = useState(false);
    const [quickEstimateMatches, setQuickEstimateMatches] = useState(3);
    const [quickEstimateKnockoutPct, setQuickEstimateKnockoutPct] = useState(30);
    
    // Saved Budgets
    const [savedBudgets, setSavedBudgets] = useState(initialBudgets);
    const [showSavedBudgets, setShowSavedBudgets] = useState(false);

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

    // Carry the public planner's choices in, so nothing the visitor already
    // answered is asked again. The wizard stays on the package step — that is
    // what "Explore packages" promised — with the estimate beside it.
    useEffect(() => {
        if (!plannerEstimate || budgetToEdit) return;
        if (plannerEstimate.currency) setCurrency(plannerEstimate.currency);
        if (plannerEstimate.nights) setNights(plannerEstimate.nights);
        if (plannerEstimate.flight_class) setFlightClass(plannerEstimate.flight_class);
        if (plannerEstimate.flight_origin) setFlightOrigin(plannerEstimate.flight_origin);
        if (plannerEstimate.accommodation_level) setAccommodation(plannerEstimate.accommodation_level);
        if (plannerEstimate.group_size) setTravelGroupSize(plannerEstimate.group_size);
        const ids = plannerEstimate.match_ids || [];
        if (ids.length) {
            setSelectedMatchIds(ids);
        } else if (plannerEstimate.match_count) {
            setQuickEstimate(true);
            setQuickEstimateMatches(plannerEstimate.match_count);
        }
    }, [plannerEstimate]);

    // Fixtures arrive deferred; fill step 2's list once they land.
    useEffect(() => {
        const ids = plannerEstimate?.match_ids || [];
        if (!ids.length || !allFixtures.length) return;
        setFilteredMatches(allFixtures.filter((m) => ids.includes(m.id)));
    }, [plannerEstimate, allFixtures.length]);

    const applyPlannerEstimate = () => {
        setBreakdown(plannerEstimate.breakdown || {});
        setEstimatedCost(Number(plannerEstimate.total_cost) || 0);
        setShowResults(true);
    };

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
            // Ids are strings ("db_105"); parseInt made them NaN, so this deep
            // link never found its match. Fixtures also arrive deferred, so
            // wait for them rather than running once against an empty list.
            const match = findFixtureById(allFixtures, matchIdParam);
            if (match) {
                setFilteredMatches([match]);
                setSelectedMatchIds([match.id]);
                setWizardStep(2);
            }
        }
    }, [allFixtures.length]);

    // Sync savedBudgets state when props change
    useEffect(() => {
        setSavedBudgets(initialBudgets);
    }, [initialBudgets]);



    // Get unique values from props (passed from controller)
    const allVenues = venues;
    const allStages = stages;
    const allGroups = groups;

    // Stadium image lookup for a venue name. The tournament's venue rows come
    // first (StadiumImageService has already overlaid the locally-hosted WebP
    // onto them server-side), then the shared name-keyed map catches venues
    // that appear on a fixture but not in the venue list — fixture venue
    // strings and Wikipedia venue titles don't always agree. A miss falls
    // through to the component's existing placeholder, unchanged.
    const venueImages = React.useMemo(function () {
        var map = {};
        var venuesList = (tournament && tournament.venues) || [];
        venuesList.forEach(function (v) {
            if (v && v.name) {
                map[v.name] = v.image || v.thumbnail || null;
            }
        });
        return map;
    }, [tournament]);

    const venueImageFor = React.useCallback(function (venueName) {
        if (!venueName) return null;

        return venueImages[venueName] || resolveStadiumImage(venueName, stadiumImages);
    }, [venueImages, stadiumImages]);

    // Seat-map venues, the fan's own first.
    //
    // A fixture's venue string and a catalogue venue's canonical name do not
    // reliably match ("Kasarani Stadium" vs "Moi International Sports Centre,
    // Kasarani"), so they are joined on the resolved IMAGE url instead — the
    // shared `stadiumImages` map already indexes every alias to the same url a
    // bowl payload carries, so this reuses the alias table rather than growing
    // a second client-side copy of it. No match just leaves config order.
    const orderedVenueBowls = React.useMemo(function () {
        var bowls = venueBowls || [];
        if (!bowls.length) return [];

        var selected = allFixtures.filter(function (m) { return selectedMatchIds.includes(m.id); });
        if (!selected.length) return bowls;

        var wanted = [];
        selected.forEach(function (m) {
            var url = venueImageFor(m.venue);
            if (url && wanted.indexOf(url) === -1) wanted.push(url);
        });

        var mine = [];
        var rest = bowls.slice();

        wanted.forEach(function (url) {
            var i = rest.findIndex(function (b) { return b.image === url; });
            if (i !== -1) mine.push(rest.splice(i, 1)[0]);
        });

        return mine.concat(rest);
    }, [venueBowls, allFixtures, selectedMatchIds, venueImageFor]);

    const selectedMatches = React.useMemo(
        () => allFixtures.filter((m) => selectedMatchIds.includes(m.id)),
        [allFixtures, selectedMatchIds],
    );

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
    };

    // Close filter modal
    const closeFilterModal = () => {
        setShowFilterModal(false);
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
        const originCode = iataForOrigin(originData);

        const firstSelectedVenue = quickEstimate ? null : (
            allFixtures.find(m => selectedMatchIds.includes(m.id))?.venue || null
        );
        const destCity = destinationCityForHotel(tournament, firstSelectedVenue);

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

        // Real URL is /fan/api/budget/estimate — the route sits inside the fan
        // group in routes/web.php. Named-route lookup so a group rename doesn't
        // resurrect the old 404. (Sprint 44 follow-up.)
        axios.post(route('fan.api.budget.estimate'), apiParams, { timeout: 10000 })
            .then(res => {
                if (res.data?.success && res.data.data) {
                    const d = res.data.data;
                    // The server still speaks KES. Round-trip through USD so
                    // the fan's currency pick controls the display —
                    // usd = kes_value / server_kes_rate; display = usd * our_rate.
                    const serverKesRate = d.summary.exchange_rate || 1;
                    const targetRate = getRateForCurrency(tournamentPricing, currency);
                    const convert = (kes) => (kes / serverKesRate) * targetRate;
                    const displayBreakdown = {};
                    Object.entries(d.breakdown).forEach(([key, val]) => {
                        displayBreakdown[key] = convert(val.kes);
                    });
                    const displayTotal = convert(d.summary.total_kes);
                    setBreakdown(displayBreakdown);
                    setEstimatedCost(displayTotal);
                    setLoading(false);
                    setShowResults(true);
                    trackUsage(apiParams.match_count, displayTotal);
                } else {
                    throw new Error('API returned failure');
                }
            })
            .catch(() => {
                // Fallback to client-side calculation
                clientSideCalculate();
            });
    };

    // The arithmetic lives in lib/tripEstimate so the public "Plan my trip"
    // dialog computes the same number from the same inputs.
    const clientSideCalculate = () => {
        const result = estimateTrip(tournamentPricing, {
            matches: allFixtures.filter(m => selectedMatchIds.includes(m.id)),
            quickEstimate,
            quickMatches: quickEstimateMatches,
            quickKnockoutPct: quickEstimateKnockoutPct,
            flightOrigin,
            flightClass,
            accommodation,
            nights,
            spendingTier,
            groupSize: travelGroupSize,
            includeInsurance,
            includeVisa,
            includeMerchandise: merchandisePerMatch,
            hosts: tournament?.hosts || [],
            currency,
            realFlightPrice,
            realHotelPrice,
        });

        setBreakdown(result.breakdown);
        setEstimatedCost(result.total);
        setLoading(false);
        setShowResults(true);
        trackUsage(result.matchCount, result.total);
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
            // Sprint 28 — everything in `breakdown` and `total_cost` is
            // expressed in this currency, so downstream surfaces (saved
            // itineraries, loan applications, admin queue) can display
            // the same amount the fan saw at Save time.
            currency: currency,
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
                // Say what was wrong and take the fan to the step that sets
                // it, rather than a generic failure (Sprint 69).
                setSaving(false);
                setShowNamingModal(false);
                toast.error(saveErrorMessage(errors));
                const step = saveErrorStep(errors);
                if (step !== null) {
                    setShowResults(false);
                    setWizardStep(step);
                }
            }
        });
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
        // Sprint 28 — restore the currency the saved budget was built in
        // so the reopened plan matches the amount the fan saved.
        if (budget.currency) setCurrency(budget.currency);
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
                                    className="tfe-btn"
                                    onClick={() => setShowSavedBudgets(!showSavedBudgets)}
                                >
                                    <i className="fas fa-folder-open me-2"></i>
                                    Saved Itineraries ({savedBudgets.length})
                                    <i className={`fas fa-chevron-down ms-2 ${showSavedBudgets ? 'rotated' : ''}`}></i>
                                </button>
                                
                                {showSavedBudgets && (
                                    <div className="dropdown-menu show dropdown-menu--end">
                                        {savedBudgets.map(budget => (
                                            <div 
                                                key={budget.id} 
                                                className="dropdown-item d-flex justify-content-between align-items-center"
                                                onClick={() => loadBudget(budget)}
                                            >
                                                <div>
                                                    <div className="item-title">{budget.name}</div>
                                                    <div className="item-meta">
                                                        {formatMoney(budget.total_cost, budget.currency || 'USD')} • {budget.nights} Nights
                                                    </div>
                                                </div>
                                                <span className={`tfe-pill tfe-pill--${
                                                    budget.partner_status === 'approved' ? 'approved' :
                                                    budget.partner_status === 'modified' ? 'pending' :
                                                    'info'
                                                }`}>
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
                    <div className="hero-content flex-grow-1">
                        {/* Partner Status Display - NEW */}
                        {savedBudgets.find(b => b.is_active)?.partner_status && (
                            <div className="partner-status-box mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <h4 className="partner-status-box__title"><i className="fas fa-handshake me-2 text-warning"></i>Travel Partner Update</h4>
                                    <span className={`tfe-pill tfe-pill--${savedBudgets.find(b => b.is_active).partner_status === 'approved' ? 'approved' : 'info'}`}>
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
                                        Partner Estimate: {formatMoney(savedBudgets.find(b => b.is_active).partner_cost, savedBudgets.find(b => b.is_active).currency || currency)}
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
                            <span className="stat-value">{formatMoney(estimatedCost, currency)}</span>
                        </div>
                        <div className="hero-stat-item">
                            <span className="stat-label">Matches</span>
                            <span className="stat-value">{selectedMatchIds.length}</span>
                        </div>
                        <div className="hero-stat-item">
                            <span className="stat-label">Days</span>
                            <span className="stat-value">{nights}</span>
                        </div>
                        <div className="hero-stat-item currency-picker">
                            <label htmlFor="calc-currency" className="stat-label">Currency</label>
                            <select
                                id="calc-currency"
                                className="calc-currency-select"
                                value={currency}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    const oldRate = getRateForCurrency(tournamentPricing, currency) || 1;
                                    const newRate = getRateForCurrency(tournamentPricing, next);
                                    // Re-scale the already-computed total + breakdown so switching
                                    // currency updates the display without re-running the wizard.
                                    // (Recalculate() only runs when the fan hits Calculate; the
                                    // picker should stay live between calculations too.)
                                    const scale = newRate / oldRate;
                                    setEstimatedCost((c) => c * scale);
                                    setBreakdown((b) => {
                                        const out = {};
                                        for (const k of Object.keys(b || {})) out[k] = (b[k] || 0) * scale;
                                        return out;
                                    });
                                    setCurrency(next);
                                }}
                            >
                                {SUPPORTED_CURRENCIES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} — {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </DashboardHero>

                {/* The short road (Sprint 65): the same three-step planner the
                    public site uses, for a fan who wants a number and a booking
                    rather than every lever below. Same engine, same result. */}
                {!budgetToEdit && !showResults && !plannerEstimate && (
                    <div className="tfe-slab mb-4">
                        <div className="tfe-slab__body d-flex flex-wrap align-items-center gap-3">
                            <div className="flex-grow-1">
                                <div className="fw-bold text-white">In a hurry?</div>
                                <div className="tfe-form-help">Three questions, an estimate, and the partner packages that fit — book in one more tap.</div>
                            </div>
                            <button
                                type="button"
                                className="tfe-btn tfe-btn--filled"
                                onClick={() => openTripPlanner({ tournamentId: initialTournamentId || tournament?.id })}
                            >
                                <i className="fas fa-bolt" aria-hidden="true"></i> Quick plan
                            </button>
                        </div>
                    </div>
                )}
                <TripPlannerDialog />

                {plannerEstimate && !budgetToEdit && !showResults && (
                    <div className="tfe-slab mb-4 planner-carry">
                        <div className="tfe-slab__body d-flex flex-wrap align-items-center gap-3">
                            <div className="flex-grow-1">
                                <div className="tfe-form-help mb-1">Your estimate from Plan my trip</div>
                                <div className="fs-4 fw-bold text-white">
                                    {formatMoney(plannerEstimate.total_cost, plannerEstimate.currency || 'USD')}
                                </div>
                                <div className="tfe-form-help">
                                    {plannerEstimate.group_size} traveller{plannerEstimate.group_size > 1 ? 's' : ''} · {plannerEstimate.nights} nights · compare it with the partner packages below.
                                </div>
                            </div>
                            <button type="button" className="tfe-btn" onClick={applyPlannerEstimate}>
                                Save my estimate as a plan
                            </button>
                        </div>
                    </div>
                )}

                {/* Wizard progress. The package picker (step 0) is only
                    reachable when this tournament has packages, so it joins
                    the run conditionally and the cursor shifts with it —
                    numbering a step the fan can never visit would misreport
                    how far along they are. */}
                <StepFlow
                    variant="inline"
                    className="mb-4"
                    steps={wizardStepLabels}
                    cursor={wizardCursor}
                />

                {!showResults && wizardStep >= 2 && (
                    <CalculatorRecap
                        packageName={selectedPackage?.name}
                        matchCount={quickEstimate ? quickEstimateMatches : selectedMatchIds.length}
                        quickEstimate={quickEstimate}
                        nights={nights}
                        travellers={travelGroupSize}
                        estimate={estimatedCost}
                        currency={currency}
                        onJump={(step) => setWizardStep(step === 2 && quickEstimate ? 3 : step)}
                    />
                )}

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
                    <div className="calc-package-banner">
                        <div>
                            <div className="text-white fw-semibold">
                                <i className="fas fa-gift me-2 text-danger"></i>
                                Based on package: {selectedPackage.name}
                            </div>
                            <div className="text-white-50 small">
                                Fixed price {formatMoney(selectedPackage.base_price, selectedPackage.currency || 'USD')} — customize anything you like.
                            </div>
                        </div>
                        <button
                            type="button"
                            className="tfe-btn tfe-btn--sm"
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
                                className="tfe-btn tfe-btn--filled tfe-btn--lg"
                                onClick={() => {
                                    setFilteredMatches(allFixtures);
                                    setWizardStep(2);
                                }}
                            >
                                Show All Matches ({allFixtures.length})
                            </button>
                            
                            <button
                                type="button"
                                className="tfe-btn tfe-btn--filled tfe-btn--lg"
                                onClick={startWithFavorites}
                                disabled={!favoriteMatches.length}
                                title={favoriteMatches.length ? 'Use your favorite matches to start the plan' : 'Add favorites in Match Schedule first'}
                            >
                                <i className="fas fa-star me-2"></i>
                                Start from Favorites
                            </button>

                            <button
                                type="button"
                                className="tfe-btn tfe-btn--lg"
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
                                <button className="tfe-btn tfe-btn--filled tfe-btn--lg" onClick={() => setWizardStep(3)}>
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
                            <div className="mb-3">
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
                                    <label className="mt-2 calc-sublabel">
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

                        {(() => {
                            // Derive both sides of the flight/hotel search from the active
                            // tournament (Sprint 44). Departure = the picked flight-origin's
                            // IATA (config now ships `code`); arrival = the first selected
                            // match's venue city, falling back to the tournament's first
                            // host country. Same city drives the hotel search.
                            const origins = getFlightOrigins(tournamentPricing);
                            const originData = origins.find(o => o.id === flightOrigin) || origins[0];
                            const departureIata = iataForOrigin(originData);
                            const firstSelectedVenue = allFixtures.find(m => selectedMatchIds.includes(m.id))?.venue || null;
                            const arrivalIata = iataForDestination(tournament, firstSelectedVenue);
                            const destinationCity = destinationCityForHotel(tournament, firstSelectedVenue);
                            const now = new Date();
                            const outbound = new Date(now);
                            outbound.setMonth(outbound.getMonth() + 3);
                            const inbound = new Date(outbound);
                            inbound.setDate(inbound.getDate() + nights);
                            const outboundDate = outbound.toISOString().split('T')[0];
                            const returnDate = inbound.toISOString().split('T')[0];

                            return (
                                <div className="picker-grid">
                                    <div>
                                        <FlightSelector
                                            departureId={departureIata}
                                            arrivalId={arrivalIata}
                                            outboundDate={outboundDate}
                                            returnDate={returnDate}
                                            adults={travelGroupSize}
                                            onFlightSelected={(flight) => {
                                                setSelectedFlight(flight);
                                                setRealFlightPrice(flight.price_usd);
                                            }}
                                            selectedFlight={selectedFlight}
                                        />
                                    </div>

                                    <div>
                                        <HotelSelector
                                            city={destinationCity}
                                            checkIn={outboundDate}
                                            checkOut={returnDate}
                                            adults={travelGroupSize}
                                            onHotelSelected={(hotel) => {
                                                setSelectedHotel(hotel);
                                                setRealHotelPrice(hotel.price_per_night_usd);
                                            }}
                                            selectedHotel={selectedHotel}
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="picker-footer">
                            <div className={`picker-footer__facts ${!selectedFlight && !selectedHotel ? 'picker-footer__facts--empty' : ''}`}>
                                {selectedFlight && (
                                    <span>
                                        <i className="fas fa-plane"></i>
                                        Flight: <strong>${realFlightPrice}</strong>/person
                                    </span>
                                )}
                                {selectedHotel && (
                                    <span>
                                        <i className="fas fa-hotel"></i>
                                        Hotel: <strong>${realHotelPrice}</strong>/night
                                    </span>
                                )}
                                {!selectedFlight && !selectedHotel && (
                                    <span>
                                        <i className="fas fa-info-circle"></i>
                                        Search and select options above, or skip to use estimates
                                    </span>
                                )}
                            </div>
                            <button className="tfe-btn tfe-btn--filled tfe-btn--lg" onClick={calculateBudget} disabled={loading}>
                                {loading ? (
                                    <><i className="fas fa-spinner fa-spin me-2"></i>Calculating…</>
                                ) : (
                                    <><i className="fas fa-calculator me-2"></i>Calculate with Selections</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Results — lazily loaded, so recharts, the route map and the
                    seat-map wrapper stay out of the first download (Sprint 69). */}
                {showResults && (
                    <Suspense fallback={<SkeletonSlab />}>
                        <CalculatorResults
                            estimatedCost={estimatedCost}
                            currency={currency}
                            rate={rate}
                            breakdown={breakdown}
                            budgetToEdit={budgetToEdit}
                            selectedMatches={selectedMatches}
                            matchCount={quickEstimate ? quickEstimateMatches : selectedMatchIds.length}
                            nights={nights}
                            accommodation={accommodation}
                            flightOrigin={flightOrigin}
                            flightClass={flightClass}
                            travelGroupSize={travelGroupSize}
                            selectedFlight={selectedFlight}
                            selectedHotel={selectedHotel}
                            realFlightPrice={realFlightPrice}
                            realHotelPrice={realHotelPrice}
                            pricing={tournamentPricing}
                            tournament={tournament}
                            venueImageFor={venueImageFor}
                            venueBowls={orderedVenueBowls}
                            financePartners={financePartners}
                            savedBudgets={savedBudgets}
                            saving={saving}
                            onReset={resetWizard}
                            onViewItinerary={() => setShowItinerary(true)}
                            onSave={saveBudget}
                        />
                    </Suspense>
                )}

            </div>

            <MatchFilterDialog
                open={showFilterModal}
                onClose={closeFilterModal}
                tab={filterTab}
                onTabChange={setFilterTab}
                hosts={tournament?.hosts || []}
                flagFor={getCountryFlagImg}
                venues={allVenues}
                venueImageFor={venueImageFor}
                stages={allStages}
                teams={teams}
                favoriteMatches={favoriteMatches}
                selectedCountries={selectedCountries}
                selectedStadiums={selectedStadiums}
                selectedStages={selectedStages}
                selectedTeams={selectedTeams}
                selectedMatchIds={selectedMatchIds}
                onToggleCountry={toggleCountry}
                onToggleStadium={toggleStadium}
                onToggleStage={toggleStage}
                onToggleTeam={toggleTeam}
                onToggleMatch={toggleMatch}
                onApply={applyFilters}
                onUseFavorites={() => { closeFilterModal(); startWithFavorites(); }}
            />

            {/* Save-itinerary dialog — Sprint 44 rewrite. The old hand-rolled
                overlay had an unstyled name input and inconsistent buttons; this
                one runs on TfeModal + the shared tfe-input primitive so it reads
                as one system with the rest of the dashboard's dialogs. */}
            <TfeModal
                open={showNamingModal}
                title="Save this itinerary"
                onClose={() => setShowNamingModal(false)}
                size="sm"
                footer={
                    <div className="d-flex justify-content-end gap-2 w-100">
                        <button
                            type="button"
                            className="tfe-btn"
                            onClick={() => setShowNamingModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="tfe-btn tfe-btn--filled"
                            onClick={() => itineraryName.trim() && submitSave(itineraryName)}
                            disabled={!itineraryName.trim() || saving}
                        >
                            {saving ? (
                                <><i className="fas fa-spinner fa-spin"></i>Saving…</>
                            ) : (
                                <><i className="fas fa-save"></i>Save itinerary</>
                            )}
                        </button>
                    </div>
                }
            >
                <div className="tfe-form-field">
                    <label className="tfe-form-label" htmlFor="itinerary-name">Itinerary name</label>
                    <input
                        id="itinerary-name"
                        type="text"
                        className="tfe-input"
                        value={itineraryName}
                        onChange={(e) => setItineraryName(e.target.value)}
                        placeholder={`e.g., My ${tournament?.short_name || 'tournament'} trip`}
                        autoFocus
                        maxLength={80}
                        onKeyDown={(e) => e.key === 'Enter' && itineraryName.trim() && submitSave(itineraryName)}
                    />
                    <p className="tfe-form-help">
                        This label shows up on your saved-itineraries list and any partner
                        proposals routed against this plan.
                    </p>
                </div>
                <div className="tfe-slab tfe-slab--flush mt-3 calc-save-summary">
                    <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                        <div className="d-flex flex-column">
                            <span className="calc-save-summary__label">Total</span>
                            <span className="calc-save-summary__value">
                                {formatMoney(estimatedCost, currency)}
                            </span>
                        </div>
                        <div className="text-end text-white-50 small">
                            {selectedMatchIds.length} {selectedMatchIds.length === 1 ? 'match' : 'matches'}
                            {' · '}{nights} {nights === 1 ? 'night' : 'nights'}
                            <br />
                            {tournament?.short_name || 'Tournament'}
                        </div>
                    </div>
                </div>
            </TfeModal>

            {showItinerary && (
                <Suspense fallback={null}>
                <ItineraryPrintView
                    onClose={() => setShowItinerary(false)}
                    tournament={tournament}
                    selectedMatches={selectedMatches}
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
                </Suspense>
            )}

            {/* Mounted conditionally and keyed — useForm reads its initial
                values on FIRST mount only (Sprint 57). */}
            {declareFor && institution && (
                <SchoolGroupWizard
                    key={declareFor.id}
                    open
                    itinerary={declareFor}
                    institution={institution}
                    onClose={() => setDeclareFor(null)}
                />
            )}

        </FanLayout>
    );
}
