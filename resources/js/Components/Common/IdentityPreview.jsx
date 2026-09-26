import React from 'react';

/**
 * IdentityPreview — a compact identity card for the sticky preview pane of an
 * account/settings form (see SplitEditorLayout). Shows an avatar (image or the
 * name's initial), a name, a sub-line and optional contact rows, re-branded by
 * `accent`. Used by the admin profile + site-settings editors so the admin sees
 * their identity update as they type.
 */
export default function IdentityPreview({ name, sub, avatar, accent = '#3b82f6', badge, rows = [] }) {
    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
    return (
        <div className="tfe-identity" style={{ '--identity-accent': accent }}>
            <div className="tfe-identity__avatar">
                {avatar ? <img src={avatar} alt="" /> : initial}
            </div>
            <div className="tfe-identity__name">{name || '—'}</div>
            {sub && <div className="tfe-identity__sub">{sub}</div>}
            {badge && <span className="tfe-pill tfe-pill--info tfe-identity__badge">{badge}</span>}
            {rows.length > 0 && (
                <div className="tfe-identity__rows">
                    {rows.map((r, i) => (
                        <div className="tfe-identity__row" key={i}>
                            <i className={r.icon} aria-hidden="true" />
                            <span>{r.value || '—'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
