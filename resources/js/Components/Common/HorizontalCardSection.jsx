﻿import React from 'react';
import { Link } from '@inertiajs/react';
import '../../../css/landing-section.css';

/**
 * HorizontalCardSection — Reusable 100vh landing page section.
 *
 * Three layouts:
 *  - "split"        : badge+title+description on the LEFT, cards track on the RIGHT
 *  - "split-reverse": badge+title+description on the RIGHT, cards track on the LEFT
 *  - "stacked"      : header row spanning the full width, then cards track below
 *
 * Props:
 *  - id (string): section anchor id
 *  - number (string): badge number (e.g. "01")
 *  - badge (string): badge label (e.g. "About TFE")
 *  - title (string, required): section title
 *  - description (string|ReactNode): optional descriptive paragraph
 *  - action (object|null): { label, href, icon } — primary action button on the header
 *  - headerAction (object|null): { label, href } — secondary action button shown
 *      on the right of the title row (used in "stacked" variant, e.g. "See all tours")
 *  - variant ("split"|"split-reverse"|"stacked"): layout variant, default "split"
 *  - theme ("dark"|"light"): background variant, default "dark"
 *  - children (ReactNode): LandingCard components
 */
export default function HorizontalCardSection({
    id,
    number,
    badge,
    title,
    description,
    action,
    headerAction,
    variant = 'split',
    theme = 'dark',
    children,
}) {
    const sectionClasses = [
        'landing-section',
        `section-${variant}`,
        `section-${theme}`,
    ].join(' ');

    const renderHeader = (extraClass = '') => (
        <div className={'section-header ' + extraClass}>
            {(number || badge) && (
                <div className="section-badge">
                    {number && <span className="badge-number">{number}</span>}
                    {number && badge && <hr className="badge-divider" />}
                    {badge && <span className="badge-label">{badge}</span>}
               </div>
            )}
            <h2 className="section-title">{title}</h2>
            {description && (
                <p className="section-description">{description}</p>
            )}
            {action && (
                <Link href={action.href} className="section-action">
                    <span>{action.label}</span>
                    <iconify-icon icon={action.icon || 'lucide:arrow-up-right'} className="btn-icon" />
               </Link>
            )}
       </div>
    );

    const renderCards = (extraClass = '') => (
        <div className={'cards-track ' + extraClass}>
            {children}
       </div>
    );

    const isSplitReverse = variant === 'split-reverse';
    const isSplit = variant === 'split' || isSplitReverse;

    return (
        <section id={id} className={sectionClasses}>
            <div className="landing-section-inner">
                {isSplit ? (
                    <>
                        {isSplitReverse ? (
                            <>
                                {renderCards('cards-track-reverse')}
                                {renderHeader('section-header-reverse')}
                            </>
                        ) : (
                            <>
                                {renderHeader()}
                                {renderCards()}
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <div className="section-header-row">
                            {(number || badge) && (
                                <div className="section-badge">
                                    {number && <span className="badge-number">{number}</span>}
                                    {number && badge && <hr className="badge-divider" />}
                                    {badge && <span className="badge-label">{badge}</span>}
                               </div>
                            )}
                            <h2 className="section-title">{title}</h2>
                            {headerAction && (
                                <Link href={headerAction.href} className="section-action">
                                    <span>{headerAction.label}</span>
                                    <iconify-icon icon={headerAction.icon || 'lucide:arrow-up-right'} className="btn-icon" />
                               </Link>
                            )}
                       </div>
                        {description && (
                            <p className="section-description" style={{ maxWidth: '720px', padding: '0 0.5rem' }}>{description}</p>
                        )}
                        {renderCards()}
                    </>
                )}
           </div>
       </section>
    );
}
