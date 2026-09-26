import React, { createContext, useContext, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';

/**
 * TournamentContext — Provides the active tournament data to all
 * landing-page components. Reads from usePage().props (which is
 * populated by HandleInertiaRequests on the backend).
 *
 * Two lists, deliberately:
 *
 *  - `tournamentList` — every tournament, past included. For surfaces that
 *    legitimately show history (the landing TournamentCompare cards, which
 *    deep-link to each tournament's own page).
 *  - `switchableTournaments` — ongoing + upcoming only. What the context
 *    SWITCHER offers (Sprint 53). Making a concluded tournament the active
 *    context rebuilt every context-aware surface — hero, venue slider,
 *    stadium photography, fan dashboard — around an event nobody can travel
 *    to. Past tournaments stay fully browsable on `/tournaments/{slug}`.
 *
 * Usage:
 *   import { useTournament } from '@/Context/TournamentContext';
 *   const { tournament, switchTournament } = useTournament();
 */

const TournamentContext = createContext(null);

/** Shared by the provider and its no-provider fallback — one implementation. */
function buildValue(pageProps) {
    const tournament = pageProps.tournament;
    const tournamentList = pageProps.tournament_list || [];
    // Older payloads (and any render without the shared prop) fall back to
    // filtering the full list client-side rather than offering the past.
    const switchableTournaments = pageProps.tournament_switch_list
        || tournamentList.filter((t) => t.status === 'ongoing' || t.status === 'upcoming');

    return {
        tournament,
        tournamentList,
        switchableTournaments,
        switchTournament(slug, basePath) {
            const base = basePath || '/';
            router.visit(base + '?tournament=' + slug, { preserveScroll: true, preserveState: false });
        },
        isActive(id) {
            return !!tournament && tournament.id === id;
        },
    };
}

export function TournamentProvider({ children }) {
    const pageProps = usePage().props;

    const value = useMemo(
        () => buildValue(pageProps),
        [pageProps.tournament, pageProps.tournament_list, pageProps.tournament_switch_list],
    );

    return React.createElement(TournamentContext.Provider, { value }, children);
}

export function useTournament() {
    const pageProps = usePage().props;
    const ctx = useContext(TournamentContext);

    // Fallback when the provider is missing — read directly from page props.
    return ctx || buildValue(pageProps);
}

export default TournamentContext;
