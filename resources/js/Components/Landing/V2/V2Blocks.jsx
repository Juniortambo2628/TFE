import React from 'react';
import LandingAction from '@/Components/Landing/V2/LandingAction';

/**
 * Small building blocks the v2 inner pages share, so every page's sections
 * open, list and number things the same way the /v2 landing page does.
 */

/** A section: an anchor for the section bar, an eyebrow + heading, content. */
export function V2Section({ id, eyebrow, title, text, actions, tinted = false, children }) {
    return (
        <section id={id} className={'v2-section' + (tinted ? ' v2-section--tinted' : '')}>
            <div className="container">
                {(eyebrow || title) && (
                    <div className={'v2-head' + (actions ? ' v2-head--row' : '')}>
                        <div>
                            {eyebrow && <p className="v2-eyebrow">{eyebrow}</p>}
                            {title && <h2 className="v2-head__title">{title}</h2>}
                            {text && <p className="v2-head__text">{text}</p>}
                        </div>
                        {actions && <div className="v2-head__actions">{actions}</div>}
                    </div>
                )}
                {children}
            </div>
        </section>
    );
}

/** Icon cards in a grid: principles, features, quicker routes. */
export function V2IconCards({ items = [], tournamentId }) {
    return (
        <div className="v2-icards">
            {items.map((it) => (
                <article key={it.title} className="v2-icard">
                    {it.icon && <span className="v2-icard__icon" aria-hidden="true"><i className={it.icon}></i></span>}
                    <h3 className="v2-icard__title">{it.title}</h3>
                    {it.text && <p className="v2-icard__text">{it.text}</p>}
                    {it.action && it.label && (
                        <div className="v2-icard__action">
                            <LandingAction action={it.action} label={it.label} size="sm" icon="fas fa-arrow-right" tournamentId={tournamentId} />
                        </div>
                    )}
                </article>
            ))}
        </div>
    );
}

/** A numbered run of steps, in the /v2 journey's style but static. */
export function V2Steps({ steps = [] }) {
    return (
        <ol className="v2-journey v2-journey--static">
            {steps.map((step, i) => (
                <li key={step.title} className="v2-journey__step">
                    <span className="v2-journey__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="v2-journey__title">{step.title}</h3>
                    {step.text && <p className="v2-journey__text">{step.text}</p>}
                </li>
            ))}
        </ol>
    );
}

/** Ticked points (the explorer's list style). */
export function V2Points({ points = [] }) {
    if (!points.length) return null;
    return (
        <ul className="v2-explorer__points">
            {points.map((p) => <li key={p}><i className="fas fa-check" aria-hidden="true"></i>{p}</li>)}
        </ul>
    );
}

/** `{name}` in a configured line, filled in. */
export function fill(text, name) {
    return String(text ?? '').replaceAll('{name}', name ?? '');
}

/** The closing CTA props from a page's `closing` copy. */
export function closingProps(copy, { primary, secondary, tournamentId, image } = {}) {
    if (!copy) return undefined;
    return {
        title: copy.title,
        text: copy.text,
        image,
        tournamentId,
        primary: primary && { label: copy.primary, icon: 'fas fa-arrow-right', ...primary },
        secondary: secondary && copy.secondary ? { label: copy.secondary, ...secondary } : undefined,
    };
}
