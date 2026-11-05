import React, { useRef } from 'react';
import { assetPath } from '@/lib/assets';
import LandingAction from '@/Components/Landing/V2/LandingAction';

/**
 * "Inside TFE" (plan C2.5): pick an area, see the screen that does it on a
 * laptop and on a phone. The screenshots are real screens from the seeded
 * demo (scripts/landing-v2-screens.mjs), not mock-ups.
 *
 * An ARIA tablist: arrow keys move between areas, and the panel is labelled
 * by its tab. `active` is owned by the page so the journey steps above can
 * open an area.
 */
export default function FeatureExplorer({ explorer, active, onChange, tournamentId }) {
    const areas = explorer.areas || [];
    const current = areas.find((a) => a.id === active) || areas[0];
    const tabRefs = useRef({});

    if (!current) return null;

    const onKeyDown = (e) => {
        const i = areas.findIndex((a) => a.id === current.id);
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        let next = null;
        if (step) next = areas[(i + step + areas.length) % areas.length];
        if (e.key === 'Home') next = areas[0];
        if (e.key === 'End') next = areas[areas.length - 1];
        if (!next) return;
        e.preventDefault();
        onChange(next.id);
        tabRefs.current[next.id]?.focus();
    };

    return (
        <section id="inside" className="v2-section v2-section--tinted">
            <div className="container">
                <div className="v2-head">
                    <p className="v2-eyebrow">{explorer.eyebrow}</p>
                    <h2 className="v2-head__title">{explorer.title}</h2>
                    <p className="v2-head__text">{explorer.text}</p>
                </div>

                <div className="v2-explorer">
                    <div className="v2-explorer__tabs" role="tablist" aria-label={explorer.title} onKeyDown={onKeyDown}>
                        {areas.map((a) => (
                            <button
                                key={a.id}
                                ref={(el) => { tabRefs.current[a.id] = el; }}
                                type="button"
                                role="tab"
                                id={`v2-tab-${a.id}`}
                                aria-selected={a.id === current.id}
                                aria-controls="v2-explorer-panel"
                                tabIndex={a.id === current.id ? 0 : -1}
                                className="v2-explorer__tab"
                                onClick={() => onChange(a.id)}
                            >
                                <i className={a.icon} aria-hidden="true"></i>
                                <span>{a.label}</span>
                            </button>
                        ))}
                    </div>

                    <div
                        className="v2-explorer__panel"
                        role="tabpanel"
                        id="v2-explorer-panel"
                        aria-labelledby={`v2-tab-${current.id}`}
                    >
                        <div className="v2-explorer__copy">
                            <h3 className="v2-explorer__title">{current.label}</h3>
                            <p className="v2-explorer__summary">{current.summary}</p>
                            <ul className="v2-explorer__points">
                                {(current.points || []).map((p) => (
                                    <li key={p}><i className="fas fa-check" aria-hidden="true"></i>{p}</li>
                                ))}
                            </ul>
                            <LandingAction action={current.action} label={current.cta_label} size="md" tournamentId={tournamentId} />
                        </div>

                        <figure className="v2-screens" key={current.id}>
                            <div className="v2-screens__laptop">
                                <span className="v2-screens__bar" aria-hidden="true"><i></i><i></i><i></i></span>
                                <img src={assetPath(current.desktop)} alt={`${current.label} on a laptop`} loading="lazy" decoding="async" />
                            </div>
                            {current.phone && (
                                <div className="v2-screens__phone">
                                    <img src={assetPath(current.phone)} alt={`${current.label} on a phone`} loading="lazy" decoding="async" />
                                </div>
                            )}
                            <figcaption className="v2-sr-only">The {current.label} screen, from TFE's demo data.</figcaption>
                        </figure>
                    </div>
                </div>
            </div>
        </section>
    );
}
