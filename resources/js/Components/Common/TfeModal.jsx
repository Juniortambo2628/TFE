import React, { useEffect } from 'react';

/**
 * TfeModal — the one shared dashboard dialog. Centered glass panel with a
 * title bar + close button, scrollable body, Escape-to-close and
 * click-outside-to-close. Every create/edit form on the fan / partner / admin
 * dashboards renders through this so they read as one system.
 *
 * Usage:
 *   <TfeModal open={open} title="Edit profile" onClose={close}>
 *     <form>…</form>
 *   </TfeModal>
 *
 * The `size` prop widens the panel: 'sm' | 'md' (default) | 'lg'.
 */
export default function TfeModal({ open, title, onClose, children, size = 'md', footer }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="tfe-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
            <div className={`tfe-modal tfe-modal--${size}`} onClick={(e) => e.stopPropagation()}>
                <div className="tfe-modal__head">
                    <h3 className="tfe-modal__title">{title}</h3>
                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Close" onClick={onClose}>
                        <i className="fas fa-times" />
                    </button>
                </div>
                <div className="tfe-modal__body">{children}</div>
                {footer && <div className="tfe-modal__foot">{footer}</div>}
            </div>
        </div>
    );
}
