import React, { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';

import TfeModal from '@/Components/Common/TfeModal';
import StepFlow from '@/Components/Common/StepFlow';
import ContentCard from '@/Components/Common/ContentCard';
import ModalRow from '@/Components/Common/ModalRow';
import { formatMoney, titleCase } from '@/lib/utils';
import { estimateTrip } from '@/lib/tripEstimate';
import { OPEN_EVENT, findFixtureByHint, loadPlannerPrefs, monthlyFrom, packageTotal, rankPackages, savePlannerPrefs } from '@/lib/tripPlanner';
import {
    getAccommodationFactors,
    getFlightOrigins,
    SUPPORTED_CURRENCIES,
} from '@/Data/BudgetPricingData';
import '../../../css/trip-planner.css';

const STEPS = [
    { title: 'Matches', icon: 'fas fa-futbol' },
    { title: 'Trip', icon: 'fas fa-suitcase-rolling' },
    { title: 'Estimate', icon: 'fas fa-receipt' },
];

const BREAKDOWN_LABELS = {
    match_tickets: 'Match tickets',
    flights: 'Flights',
    accommodation: 'Accommodation',
    food_and_drink: 'Food & drink',
    local_transport: 'Local transport',
    insurance: 'Insurance',
    visa: 'Visa',
    merchandise: 'Merchandise',
    miscellaneous: 'Miscellaneous',
};

/**
 * The public "Plan my trip" dialog (Sprint 64).
 *
 * Three gated steps — matches, trip, estimate — so it uses StepFlow inline
 * rather than TfeModal's tab rail (you cannot be shown an estimate for a trip
 * you have not described). The arithmetic is `lib/tripEstimate`, the same
 * engine the fan Budget Calculator runs, so the number does not change when
 * the visitor signs in.
 *
 * The last step suggests the partner packages that can deliver the trip and
 * offers two ways on, both through `plan-trip.handoff`, which carries the
 * estimate across sign-in:
 *   - Finalize & pay  → a booking for the chosen package (or a saved plan)
 *   - Explore packages → the calculator's package step with the estimate
 *
 * Mounted once by the public Header; open it with `openTripPlanner()`.
 */
export default function TripPlannerDialog() {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(null);
    const loadedFor = useRef(null);
    const dataRef = useRef(null);

    // Trip inputs. Defaults are the calculator's own.
    // A returning visitor finds their last answers (Sprint 65).
    const prefs = useMemo(() => loadPlannerPrefs(), []);
    const [mode, setMode] = useState(prefs.mode || 'quick');
    const [matchCount, setMatchCount] = useState(prefs.matchCount || 3);
    const [matchIds, setMatchIds] = useState(Array.isArray(prefs.matchIds) ? prefs.matchIds : []);
    const [teamFilter, setTeamFilter] = useState('');
    const [origin, setOrigin] = useState(prefs.origin || '');
    const [groupSize, setGroupSize] = useState(prefs.groupSize || 1);
    const [nights, setNights] = useState(prefs.nights || 7);
    const [flightClass, setFlightClass] = useState(prefs.flightClass || 'economy');
    const [accommodation, setAccommodation] = useState(prefs.accommodation || '3_star');
    const [currency, setCurrency] = useState(prefs.currency || 'USD');
    const [packageId, setPackageId] = useState(null);

    useEffect(() => {
        const onOpen = (e) => {
            const detail = e.detail || {};
            setStep(1);
            setOpen(true);
            track('planner_open', { tournament: detail.tournamentId || null, match: detail.matchId || null });
            load(detail.tournamentId || '', detail.matchId, detail.matchHint);
        };
        window.addEventListener(OPEN_EVENT, onOpen);
        return () => window.removeEventListener(OPEN_EVENT, onOpen);
    }, []);

    function load(tournamentId, matchId, matchHint) {
        if (loadedFor.current === tournamentId && dataRef.current) {
            if (matchId) preselectMatch(matchId);
            if (matchHint) applyHint(dataRef.current.fixtures, matchHint);
            return;
        }
        setLoadError(false);
        axios.get(route('plan-trip.data'), { params: { tournament: tournamentId } })
            .then((res) => {
                loadedFor.current = tournamentId;
                setData(res.data);
                const origins = getFlightOrigins(res.data.pricing);
                setOrigin((o) => o || origins[0]?.id || '');
                const ids = new Set((res.data.fixtures || []).map((f) => f.id));
                setMatchIds((prev) => prev.filter((id) => ids.has(id)));
                setPackageId(null);
                dataRef.current = res.data;
                if (matchId) preselectMatch(matchId);
                if (matchHint) applyHint(res.data.fixtures, matchHint);
            })
            .catch(() => setLoadError(true));
    }

    // A hint from a surface without fixture ids: preselect the match if it
    // can be found, otherwise open the picker filtered to the first team.
    function applyHint(list, hint) {
        const found = findFixtureByHint(list || [], hint);
        setMode('pick');
        if (found) {
            setMatchIds([found.id]);
        } else {
            setTeamFilter(String(hint.teams?.[0] || ''));
        }
    }

    function preselectMatch(matchId) {
        setMode('pick');
        setMatchIds([Number(matchId)]);
    }

    useEffect(() => {
        savePlannerPrefs({
            mode, matchCount, matchIds, origin, groupSize, nights, flightClass, accommodation, currency,
            tournamentId: data?.tournament?.id || null,
        });
    }, [mode, matchCount, matchIds, origin, groupSize, nights, flightClass, accommodation, currency, data]);

    const pricing = data?.pricing || {};
    const fixtures = data?.fixtures || [];
    const origins = useMemo(() => getFlightOrigins(pricing), [pricing]);
    const stays = useMemo(() => Object.keys(getAccommodationFactors(pricing)), [pricing]);

    const visibleFixtures = useMemo(() => {
        const q = teamFilter.trim().toLowerCase();
        const rows = q
            ? fixtures.filter((f) => [f.homeTeam, f.awayTeam, f.venue, f.stage]
                .some((v) => String(v || '').toLowerCase().includes(q)))
            : fixtures;
        return rows.slice(0, 60);
    }, [fixtures, teamFilter]);

    const selectedFixtures = useMemo(
        () => fixtures.filter((f) => matchIds.includes(f.id)),
        [fixtures, matchIds],
    );

    const estimate = useMemo(() => {
        if (!data) return null;
        const quick = mode === 'quick' || selectedFixtures.length === 0;
        return estimateTrip(pricing, {
            matches: selectedFixtures,
            quickEstimate: quick,
            quickMatches: matchCount,
            flightOrigin: origin,
            flightClass,
            accommodation,
            nights,
            groupSize,
            hosts: data.tournament?.hosts || [],
            currency,
        });
    }, [data, pricing, mode, selectedFixtures, matchCount, origin, flightClass, accommodation, nights, groupSize, currency]);

    const packages = useMemo(
        () => rankPackages(data?.packages || [], { nights, matchIds }),
        [data, nights, matchIds],
    );
    const chosen = packages.find((p) => p.id === packageId) || null;

    const canAdvance = step === 1
        ? (mode === 'quick' ? matchCount > 0 : matchIds.length > 0)
        : true;

    function toggleMatch(id) {
        setMatchIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    }

    function next() {
        track('planner_step', { from: step, to: step + 1 });
        setStep(step + 1);
    }

    function handoff(intent) {
        if (!estimate || !data) return;
        track('planner_handoff', { intent, with_package: Boolean(packageId), total: Math.round(estimate.total), currency });
        setSubmitting(intent);
        router.post(route('plan-trip.handoff'), {
            intent,
            tournament_id: data.tournament.id,
            total_cost: Math.round(estimate.total * 100) / 100,
            currency,
            breakdown: estimate.breakdown,
            match_ids: mode === 'pick' ? matchIds : [],
            match_count: estimate.matchCount,
            nights,
            group_size: groupSize,
            flight_class: flightClass,
            flight_origin: origin,
            accommodation_level: accommodation,
            listing_id: intent === 'book' ? packageId : null,
        }, {
            onFinish: () => setSubmitting(null),
            onSuccess: () => setOpen(false),
        });
    }

    const signInNote = auth?.user
        ? null
        : "You'll create an account (or sign in) next — your estimate comes with you.";

    const footer = (
        <div className="tfe-planner-footer">
            {step > 1 && (
                <button type="button" className="tfe-btn" onClick={() => setStep(step - 1)}>
                    Back
                </button>
            )}
            <span className="tfe-planner-footer__spacer" />
            {step < 3 ? (
                <button
                    type="button"
                    className="tfe-btn tfe-btn--filled"
                    disabled={!data || !canAdvance}
                    onClick={next}
                >
                    {step === 2 ? 'See my estimate' : 'Next'}
                </button>
            ) : (
                <>
                    <button
                        type="button"
                        className="tfe-btn"
                        disabled={Boolean(submitting)}
                        onClick={() => handoff('explore')}
                    >
                        <i className="fas fa-compass" aria-hidden="true" /> Explore packages
                    </button>
                    <button
                        type="button"
                        className="tfe-btn tfe-btn--filled"
                        disabled={Boolean(submitting)}
                        onClick={() => handoff('book')}
                    >
                        <i className="fas fa-lock" aria-hidden="true" />
                        {chosen ? ' Finalize details & pay' : ' Save plan & continue'}
                    </button>
                </>
            )}
        </div>
    );

    return (
        <TfeModal
            open={open}
            onClose={() => setOpen(false)}
            label="Plan my trip"
            title={data?.tournament?.short_name || 'Your trip'}
            heading={STEPS[step - 1].title === 'Estimate' ? 'Your estimate' : STEPS[step - 1].title}
            subheading="Three steps, no account needed."
            size="lg"
            footer={footer}
        >
            <StepFlow variant="inline" className="mb-3" steps={STEPS} cursor={step} />

            {loadError && (
                <div className="tfe-empty tfe-empty--inline">
                    <div className="tfe-empty__title">We couldn't load this tournament's prices.</div>
                    <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => load(loadedFor.current || '')}>
                        Try again
                    </button>
                </div>
            )}

            {!data && !loadError && (
                <div className="tfe-skeleton tfe-planner-skeleton" aria-busy="true" />
            )}

            {data && step === 1 && (
                <ContentCard>
                    <div className="tfe-planner-toggle" role="group" aria-label="How to choose matches">
                        <button type="button" className="tfe-btn tfe-btn--sm" aria-pressed={mode === 'quick'} onClick={() => setMode('quick')}>
                            Just a number
                        </button>
                        <button
                            type="button"
                            className="tfe-btn tfe-btn--sm"
                            aria-pressed={mode === 'pick'}
                            disabled={!fixtures.length}
                            onClick={() => setMode('pick')}
                        >
                            Pick matches
                        </button>
                    </div>

                    {mode === 'quick' ? (
                        <ModalRow title="How many matches?" desc="We'll price a typical mix of group and knockout games.">
                            <Stepper value={matchCount} min={1} max={12} onChange={setMatchCount} />
                        </ModalRow>
                    ) : (
                        <>
                            <input
                                type="search"
                                className="tfe-input tfe-input--sm mb-2"
                                placeholder="Filter by team, venue or stage"
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                            />
                            <ul className="tfe-planner-matches">
                                {visibleFixtures.map((f) => (
                                    <li key={f.id}>
                                        <label className="tfe-check tfe-planner-match">
                                            <input
                                                type="checkbox"
                                                checked={matchIds.includes(f.id)}
                                                onChange={() => toggleMatch(f.id)}
                                            />
                                            <span>
                                                <strong>{f.homeTeam || 'TBD'} v {f.awayTeam || 'TBD'}</strong>
                                                <small>{[f.date, f.stage, f.venue].filter(Boolean).join(' · ')}</small>
                                            </span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                            <div className="tfe-form-help">{matchIds.length} selected</div>
                        </>
                    )}
                </ContentCard>
            )}

            {data && step === 2 && (
                <ContentCard>
                    <ModalRow title="Travelling from" htmlFor="planner-origin">
                        <select id="planner-origin" className="tfe-select tfe-select--sm" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                            {origins.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                    </ModalRow>
                    <ModalRow title="Travellers">
                        <Stepper value={groupSize} min={1} max={50} onChange={setGroupSize} />
                    </ModalRow>
                    <ModalRow title="Nights">
                        <Stepper value={nights} min={1} max={30} onChange={setNights} />
                    </ModalRow>
                    <ModalRow title="Flight">
                        <div className="tfe-planner-toggle">
                            {['economy', 'business'].map((c) => (
                                <button key={c} type="button" className="tfe-btn tfe-btn--sm" aria-pressed={flightClass === c} onClick={() => setFlightClass(c)}>
                                    {titleCase(c)}
                                </button>
                            ))}
                        </div>
                    </ModalRow>
                    <ModalRow title="Stay" htmlFor="planner-stay">
                        <select id="planner-stay" className="tfe-select tfe-select--sm" value={accommodation} onChange={(e) => setAccommodation(e.target.value)}>
                            {stays.map((s) => <option key={s} value={s}>{titleCase(s.replace('_', ' '))}</option>)}
                        </select>
                    </ModalRow>
                    <ModalRow title="Currency" htmlFor="planner-currency">
                        <select id="planner-currency" className="tfe-select tfe-select--sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                            {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.label}</option>)}
                        </select>
                    </ModalRow>
                </ContentCard>
            )}

            {data && step === 3 && estimate && (
                <>
                    <ContentCard>
                        <div className="tfe-planner-total">
                            <span className="tfe-form-help">Estimated total</span>
                            <strong>{formatMoney(estimate.total, currency)}</strong>
                            <span className="tfe-planner-monthly">
                                or about {formatMoney(monthlyFrom(estimate.total, 12), currency)}/month over 12 months
                                with a finance partner (before interest — they quote the terms)
                            </span>
                            <span className="tfe-form-help">
                                {groupSize} traveller{groupSize > 1 ? 's' : ''} · {estimate.matchCount} match{estimate.matchCount === 1 ? '' : 'es'} · {nights} nights
                            </span>
                        </div>
                        <dl className="tfe-planner-breakdown">
                            {Object.entries(estimate.breakdown)
                                .filter(([, v]) => v > 0)
                                .map(([k, v]) => (
                                    <div key={k}>
                                        <dt>{BREAKDOWN_LABELS[k] || titleCase(k)}</dt>
                                        <dd>{formatMoney(v, currency)}</dd>
                                    </div>
                                ))}
                        </dl>
                    </ContentCard>

                    <ContentCard
                        title="Partners who can deliver this trip"
                        subtitle={packages.length ? 'Pick one to book it at its published price.' : null}
                    >
                        {packages.length === 0 ? (
                            <p className="tfe-form-help mb-0">
                                No partner packages are live for this tournament yet. Save your plan and partners can quote on it.
                            </p>
                        ) : (
                            <div className="tfe-planner-packages" role="radiogroup">
                                {packages.slice(0, 4).map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={packageId === p.id}
                                        disabled={p.is_sold_out}
                                        className={'tfe-planner-pkg' + (packageId === p.id ? ' is-active' : '')}
                                        style={p.publisher?.theme_accent ? { '--partner-accent': p.publisher.theme_accent } : undefined}
                                        onClick={() => setPackageId(packageId === p.id ? null : p.id)}
                                    >
                                        <span className="tfe-planner-pkg__partner">{p.publisher?.display_name || 'TFE'}</span>
                                        <span className="tfe-planner-pkg__name">{p.name}</span>
                                        <span className="tfe-planner-pkg__meta">
                                            {p.is_sold_out
                                                ? 'Sold out'
                                                : `${formatMoney(packageTotal(p, groupSize), p.currency)} for ${groupSize}${p.nights ? ` · ${p.nights} nights` : ''}`}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ContentCard>

                    {signInNote && <p className="tfe-form-help mt-2 mb-0">{signInNote}</p>}
                </>
            )}
        </TfeModal>
    );
}

function Stepper({ value, min, max, onChange }) {
    return (
        <div className="tfe-planner-stepper">
            <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Fewer" disabled={value <= min} onClick={() => onChange(value - 1)}>
                <i className="fas fa-minus" aria-hidden="true" />
            </button>
            <output aria-live="polite">{value}</output>
            <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="More" disabled={value >= max} onClick={() => onChange(value + 1)}>
                <i className="fas fa-plus" aria-hidden="true" />
            </button>
        </div>
    );
}

// Funnel analytics (Sprint 65): which step loses people. Fire-and-forget —
// a failed beacon must never get in the visitor's way.
function track(event, data) {
    try {
        axios.post(route('analytics.track'), { event, data }).catch(() => {});
    } catch {
        // route() or axios unavailable — ignore.
    }
}
