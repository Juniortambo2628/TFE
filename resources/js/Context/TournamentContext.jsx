import React, { createContext, useContext, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';

/**
 * TournamentContext — Provides the active tournament data to all
 * landing-page components. Reads from usePage().props (which is
 * populated by HandleInertiaRequests on the backend).
 *
 * Usage:
 *   import { useTournament } from '@/Context/TournamentContext';
 *   const { tournament, switchTournament } = useTournament();
 */

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
    const pageProps = usePage().props;
    const tournament = pageProps.tournament;
    const tournamentList = pageProps.tournament_list || [];

    const value = useMemo(function () {
        return {
            tournament: tournament,
            tournamentList: tournamentList,
            switchTournament: function (slug, basePath) {
                const base = basePath || '/';
                router.visit(base + '?tournament=' + slug, { preserveScroll: true, preserveState: false });
            },
            isActive: function (id) {
                return tournament && tournament.id === id;
            },
        };
    }, [tournament, tournamentList]);

    return React.createElement(TournamentContext.Provider, { value: value }, children);
}

export function useTournament() {
    const ctx = useContext(TournamentContext);
    if (ctx) return ctx;

    // Fallback when provider is missing — read directly from page props
    const pageProps = usePage().props;
    const tournament = pageProps.tournament;
    const tournamentList = pageProps.tournament_list || [];

    return {
        tournament,
        tournamentList,
        switchTournament: function (slug, basePath) {
            const base = basePath || '/';
            router.visit(base + '?tournament=' + slug, { preserveScroll: true, preserveState: false });
        },
        isActive: function (id) {
            return tournament && tournament.id === id;
        },
    };
}

export default TournamentContext;
