import React from 'react';

/**
 * HeaderDropdown — shared popover for the notifications + messages bells
 * on every dashboard. Renders through the .tfe-menu-surface primitive
 * so it matches the tournament-switcher menu exactly.
 */
export default function HeaderDropdown({ isOpen, title, badge, children, footer, wide = true }) {
    if (!isOpen) return null;

    const badgeIsButton = React.isValidElement(badge) && badge.type === 'button';

    return (
        <div className={`tfe-menu-surface${wide ? ' tfe-menu-surface--wide' : ''}`} role="menu">
            <div className="tfe-menu-surface__head">
                <h6 className="tfe-menu-surface__title">{title}</h6>
                {badge && (
                    badgeIsButton
                        ? React.cloneElement(badge, { className: 'tfe-menu-surface__badge' })
                        : <span className="tfe-menu-surface__badge">{badge}</span>
                )}
            </div>
            <div className="tfe-menu-surface__body">
                {children}
            </div>
            {footer && (
                <div className="tfe-menu-surface__foot">
                    {footer}
                </div>
            )}
        </div>
    );
}
