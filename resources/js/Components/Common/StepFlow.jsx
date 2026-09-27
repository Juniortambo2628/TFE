import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
    completionPct,
    hasProgress,
    normalizeSteps,
    primaryStep,
} from '@/lib/stepFlow';

/**
 * StepFlow — the ONE step-sequence indicator on the platform.
 *
 * A numbered run of steps with chevrons between them. It started life as
 * `HowItWorksBar`, a private function inside `Pages/PartnerHub.jsx` with a
 * hardcoded four-step array; the layout was the good one, so it was lifted
 * out rather than re-invented.
 *
 * ── Two variants, one component ───────────────────────────────────────────
 * `docked`  — a glass pill fixed to the bottom-centre of the viewport that
 *             reveals on scroll and slides away before the footer. The
 *             public partner hub uses this.
 * `inline`  — the same run of steps sitting in normal flow, with a slim
 *             completion fill. This is a wizard's progress header.
 *
 * They are deliberately the same component: a docked "how it works" bar and
 * a wizard's progress rail are one widget in two positions, and the platform
 * had grown four separate implementations of it (this bar, `Auth/Register`'s
 * hand-rolled `.progress-steps`, `RequestFinancingWizard`'s bare "Step X of
 * Y" text, and nothing at all on the five-step Budget Calculator).
 *
 * ── Progress is optional ──────────────────────────────────────────────────
 * A step with no `state` is `unstated`, and a bar of them draws no
 * completion fill and marks nothing current — which is the honest rendering
 * for the public hub, where the bar explains a flow that has no instance
 * behind it. Pass `cursor` (or per-step `state`) to turn it into a tracker.
 * See `lib/stepFlow.js`.
 *
 * ── Why `docked` portals to the body ─────────────────────────────────────
 * `position: fixed` is measured against the nearest transformed ancestor,
 * and `.tfe-page` runs a `translateY` page-enter animation — so a docked bar
 * left inside the page tree visibly jumps for the animation's 220ms on every
 * Inertia visit. Portalling to `document.body` sidesteps that entirely (see
 * the containing-block note in CLAUDE.md).
 */
export default function StepFlow({
    steps,
    label = null,
    cursor = null,
    variant = 'docked',
    accent = null,
    revealAfter = 320,
    className = '',
}) {
    const resolved = applyCursor(steps, cursor);
    const docked = variant === 'docked';
    const visible = useScrollReveal(docked, revealAfter);

    if (!resolved.length) return null;

    const progress = hasProgress(resolved);
    const lead = primaryStep(resolved);
    const pct = progress ? completionPct(resolved) : 0;

    const classes = [
        'tfe-stepflow',
        `tfe-stepflow--${docked ? 'docked' : 'inline'}`,
        progress ? 'has-progress' : '',
        docked && visible ? 'is-visible' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const style = accent ? { '--partner-accent': accent } : undefined;

    const bar = (
        <div className={classes} style={style} aria-hidden={docked && !visible ? 'true' : undefined}>
            <div className="tfe-stepflow__inner">
                {label && <span className="tfe-stepflow__label">{label}</span>}

                <ol className="tfe-stepflow__steps">
                    {resolved.map((step, i) => (
                        <li
                            key={step.n}
                            className="tfe-stepflow__step"
                            data-state={step.state}
                            aria-current={step.state === 'current' ? 'step' : undefined}
                        >
                            <span className="tfe-stepflow__num">
                                {step.state === 'done' ? <i className="fas fa-check" aria-hidden="true"></i> : step.n}
                            </span>
                            <span className="tfe-stepflow__title">
                                {step.icon && <i className={step.icon} aria-hidden="true"></i>}
                                {step.title}
                            </span>
                            {i < resolved.length - 1 && (
                                <i className="fas fa-chevron-right tfe-stepflow__sep" aria-hidden="true"></i>
                            )}
                        </li>
                    ))}
                </ol>

                {/* The compact fallback. Under 640px the full run does not
                    fit, and the bar it replaced hid every label — leaving a
                    row of bare numerals that said nothing at all. */}
                {lead && (
                    <span className="tfe-stepflow__compact" data-state={lead.state}>
                        <span className="tfe-stepflow__num">
                            {lead.state === 'done' ? <i className="fas fa-check" aria-hidden="true"></i> : lead.n}
                        </span>
                        <span className="tfe-stepflow__compact-text">
                            <span className="tfe-stepflow__compact-title">{lead.title}</span>
                            <span className="tfe-stepflow__compact-meta">
                                Step {lead.n} of {resolved.length}
                            </span>
                        </span>
                    </span>
                )}
            </div>

            {progress && !docked && (
                <div className="tfe-stepflow__track" role="presentation">
                    <div className="tfe-stepflow__fill" style={{ width: `${pct}%` }}></div>
                </div>
            )}
        </div>
    );

    if (!docked) return bar;

    // Render nothing server-side / before hydration rather than guessing at
    // a portal target that does not exist yet.
    if (typeof document === 'undefined') return null;

    return createPortal(bar, document.body);
}

/** Apply a cursor without importing the transform into the render path
 *  twice — `stepsWithCursor` already no-ops on a null cursor, but going
 *  through `normalizeSteps` directly keeps the intent obvious here. */
function applyCursor(steps, cursor) {
    const list = normalizeSteps(steps);
    if (cursor === null || cursor === undefined) return list;

    const at = Number(cursor);
    if (!Number.isFinite(at)) return list;

    return list.map((step) => {
        if (step.n < at) return { ...step, state: 'done' };
        if (step.n === at) return { ...step, state: 'current' };

        return { ...step, state: 'todo' };
    });
}

/**
 * Reveal the docked bar once the hero is behind us, and retract it before
 * the footer so it never covers one. Only wired for the docked variant —
 * an inline bar has no scroll behaviour to pay for.
 */
function useScrollReveal(enabled, revealAfter) {
    const [visible, setVisible] = useState(false);
    const footerVisible = useRef(false);

    useEffect(() => {
        if (!enabled) {
            setVisible(false);

            return undefined;
        }

        const update = () => {
            setVisible(window.scrollY > revealAfter && !footerVisible.current);
        };

        const footer = document.querySelector('.tfe-footer, .footer, footer');
        const io = footer
            ? new IntersectionObserver(
                ([entry]) => {
                    footerVisible.current = entry.isIntersecting;
                    update();
                },
                { threshold: 0 },
            )
            : null;
        if (io && footer) io.observe(footer);

        const onScroll = () => window.requestAnimationFrame(update);
        window.addEventListener('scroll', onScroll, { passive: true });
        update();

        return () => {
            window.removeEventListener('scroll', onScroll);
            if (io) io.disconnect();
        };
    }, [enabled, revealAfter]);

    return visible;
}
