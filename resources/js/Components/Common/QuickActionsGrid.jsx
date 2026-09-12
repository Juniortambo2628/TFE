import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * QuickActionsGrid — shortcut tiles used on fan / admin / partner
 * dashboards (Sprint 33 restyle).
 *
 * Each action renders as a pill-shaped `.tfe-quick-action` tile with
 * an icon chip and a label. Everything visual comes from
 * primitives.css + design-tokens.css.
 *
 * Actions shape:
 *   [{ id, label, icon, href, external?, onClick? }]
 *   - href: preferred; external:true uses <a> for absolute URLs.
 *   - onClick: makes it a <button> if href is missing.
 */
export default function QuickActionsGrid({ actions = [] }) {
    if (!actions?.length) return null;

    return (
        <div className="tfe-quick-actions-grid">
            {actions.map((action) => {
                const iconClass = action.icon?.startsWith('fa') ? action.icon : `fa-${action.icon}`;
                const inner = (
                    <>
                        <span className="tfe-quick-action__icon">
                            <i className={`fas ${iconClass}`}></i>
                        </span>
                        <span className="tfe-quick-action__label">{action.label}</span>
                    </>
                );

                const cls = 'tfe-quick-action';

                if (action.href && action.external) {
                    return (
                        <a key={action.id} href={action.href} className={cls} target="_blank" rel="noopener noreferrer">
                            {inner}
                        </a>
                    );
                }
                if (action.href) {
                    return (
                        <Link key={action.id} id={action.id} href={action.href} className={cls}>
                            {inner}
                        </Link>
                    );
                }
                return (
                    <button key={action.id} type="button" onClick={action.onClick} className={cls}>
                        {inner}
                    </button>
                );
            })}
        </div>
    );
}
