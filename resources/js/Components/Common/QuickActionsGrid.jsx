import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * QuickActionsGrid — shared shortcut-tile grid used across fan, admin
 * and partner dashboards (Sprint 32).
 *
 * Tiles wear the premium glass card look with a red glow, matching the
 * fan dashboard vibe. Every tile is red on purpose — cross-role
 * consistency was one of the Sprint 32 asks.
 *
 * Actions shape:
 *   [{ id, label, icon, href, external?, onClick? }]
 *   - href is preferred; external:true uses a plain <a> for absolute URLs.
 *   - onClick makes it a <button> if href is missing.
 */
export default function QuickActionsGrid({ actions = [] }) {
    if (!actions?.length) return null;

    return (
        <div className="quick-actions-grid p-2">
            {actions.map((action) => {
                const inner = (
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming accent-fan">
                            <i className={`fas ${action.icon}`}></i>
                        </div>
                        <span className="card-title-gaming">{action.label}</span>
                    </div>
                );

                const className = 'fan-card-premium glow-red dash-quick-action-card';

                if (action.href && action.external) {
                    return (
                        <a key={action.id} href={action.href} className={className} target="_blank" rel="noopener noreferrer">
                            {inner}
                        </a>
                    );
                }
                if (action.href) {
                    return (
                        <Link key={action.id} id={action.id} href={action.href} className={className}>
                            {inner}
                        </Link>
                    );
                }
                return (
                    <button key={action.id} type="button" onClick={action.onClick} className={className}>
                        {inner}
                    </button>
                );
            })}
        </div>
    );
}
