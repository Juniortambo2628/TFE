import React from 'react';
import { Link, router } from '@inertiajs/react';
import { openTripPlanner } from '@/lib/tripPlanner';
import { parseAction } from '@/lib/landingV2';

/** Smooth-scroll to a section, clear of the fixed header and the section bar. */
export function scrollToSection(id) {
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (!el) return false;
    // scroll-margin-top on the section (landing-v2.css) keeps it clear of the
    // header + bar; scrollIntoView honours it.
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    return true;
}

/**
 * Perform a config action (see lib/landingV2.parseAction). A section that is
 * not on the page (no packages, say) falls back to the planner rather than
 * doing nothing.
 */
export function runAction(action, { tournamentId } = {}) {
    const a = parseAction(action);
    if (a.kind === 'section' && scrollToSection(a.target)) return;
    if (a.kind === 'link') return router.visit(a.target);
    if (a.kind === 'route') return router.visit(route(a.target));
    openTripPlanner(tournamentId ? { tournamentId } : {});
}

/**
 * A CTA bound to a config action: a real link when it goes to another page
 * (so it can be opened in a new tab and reads as a link), a button otherwise.
 */
export default function LandingAction({ action, label, icon, filled = false, size = 'lg', className = '', tournamentId }) {
    const cls = ['tfe-btn', size === 'lg' ? 'tfe-btn--lg' : '', filled ? 'tfe-btn--filled' : '', className].filter(Boolean).join(' ');
    const a = parseAction(action);
    const content = (
        <>
            {icon && <i className={icon} aria-hidden="true"></i>}
            <span>{label}</span>
        </>
    );

    if (a.kind === 'link' || a.kind === 'route') {
        return <Link href={a.kind === 'link' ? a.target : route(a.target)} className={cls}>{content}</Link>;
    }

    return (
        <button type="button" className={cls} onClick={() => runAction(action, { tournamentId })}>
            {icon && <i className={icon} aria-hidden="true"></i>}
            <span>{label}</span>
        </button>
    );
}
