import React, { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import PageSkeleton, { skeletonVariantFor } from '@/lib/pageSkeleton';

/**
 * PageTransition — the global "page is changing" treatment (Sprint 53).
 *
 * Mounted once inside BaseLayout, between the persistent shell and the page,
 * so every dashboard route gets the same behaviour with nothing to wire up per
 * page:
 *
 *  1. **Skeleton while in flight.** On an Inertia visit it shows a placeholder
 *     shaped like the destination (see `lib/pageSkeleton`) instead of leaving
 *     stale content sitting there.
 *  2. **Only when the wait is real.** The skeleton waits GRACE_MS before it
 *     appears. A warm, cached route answers in well under that, and swapping
 *     straight to the new content beats flashing a placeholder at someone.
 *  3. **Cross-fade in.** The new page fades and lifts in, keyed on the Inertia
 *     component name, so a route change reads as a change of content rather
 *     than a reload.
 *
 * `prefers-reduced-motion` drops the movement (handled in CSS).
 */

/** How long a visit may take before it is worth showing a skeleton. */
const GRACE_MS = 220;

export default function PageTransition({ children, role = 'fan' }) {
    const { component } = usePage();
    const [pending, setPending] = useState(null);
    const timer = useRef(null);

    useEffect(() => {
        const clear = () => {
            if (timer.current) {
                clearTimeout(timer.current);
                timer.current = null;
            }
        };

        const offStart = router.on('start', (event) => {
            const visit = event.detail?.visit;
            // Partial reloads (a lazy prop refresh, a poll, a preserveState
            // form post) repaint in place — blanking the page for those would
            // be worse than the wait. Only a real page change gets a skeleton.
            if (!visit || visit.only?.length || visit.except?.length || visit.preserveState === true) {
                return;
            }
            if (visit.method && String(visit.method).toLowerCase() !== 'get') {
                return;
            }
            const variant = skeletonVariantFor(visit.url?.href ?? visit.url);
            clear();
            timer.current = setTimeout(() => setPending(variant), GRACE_MS);
        });

        const stop = () => {
            clear();
            setPending(null);
        };

        const offFinish = router.on('finish', stop);
        const offError = router.on('error', stop);
        const offInvalid = router.on('invalid', stop);
        const offException = router.on('exception', stop);

        return () => {
            clear();
            offStart();
            offFinish();
            offError();
            offInvalid();
            offException();
        };
    }, []);

    if (pending) {
        return (
            <div className="tfe-page tfe-page--loading" data-role={role} role="status" aria-busy="true">
                <span className="sr-only">Loading…</span>
                <PageSkeleton variant={pending} />
            </div>
        );
    }

    return (
        <div className="tfe-page" data-role={role} key={component}>
            {children}
        </div>
    );
}
