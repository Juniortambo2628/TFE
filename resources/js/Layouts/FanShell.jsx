import React, { lazy, Suspense } from 'react';
import { usePage } from '@inertiajs/react';
import FanLayout from './FanLayout';

// Only institutions load the kit's shell; a fan's pages never fetch it.
const InstitutionKitShell = lazy(() => import('./InstitutionKitShell'));

/**
 * The persistent layout for every Fan/ and Institution/ page (app.jsx).
 *
 * An institution plans its trips on fan pages (the Budget Calculator,
 * Itineraries, the Match Schedule), so the shell follows the ACCOUNT, not the
 * page: an institution gets the kit's shell on both, a fan TFE's own. Being
 * one layout component for both page groups is what keeps the shell mounted
 * when an institution moves between them.
 */
export default function FanShell({ children }) {
    const { auth } = usePage().props;
    if (auth?.user?.account_type === 'institution') {
        return (
            <Suspense fallback={null}>
                <InstitutionKitShell>{children}</InstitutionKitShell>
            </Suspense>
        );
    }
    return <FanLayout>{children}</FanLayout>;
}
