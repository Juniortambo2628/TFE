import React from 'react';
import { createPortal } from 'react-dom';
import '../../../css/mobile-action-bar.css';

/**
 * The page's one decisive action, pinned to the bottom of a phone screen
 * (Sprint 66) — on a long booking page the Pay button sat several screens
 * down. Hidden from 992px up, where the action is already in view.
 *
 * Portalled to <body>: `.tfe-page`'s enter animation makes it a containing
 * block for `position: fixed`, so a bar left in the page tree jumps on every
 * visit (the StepFlow precedent, Sprint 59).
 */
export default function MobileActionBar({ children, note = null }) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="tfe-mobile-actionbar" role="region" aria-label="Next step">
            {note && <div className="tfe-mobile-actionbar__note">{note}</div>}
            <div className="tfe-mobile-actionbar__actions">{children}</div>
        </div>,
        document.body,
    );
}
