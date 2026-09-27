import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import {
    normalizeTabs,
    resolveActiveTab,
    resolvePanelContent,
    tabForKey,
} from '@/lib/modalTabs';

/**
 * TfeModal — the ONE dialog on the platform.
 *
 * A tabbed shell: a left rail carrying the dialog's identity and its section
 * nav, a right pane with the active section, and a footer for actions. Every
 * dialog renders through it — create/edit forms, detail views, pickers and
 * confirmations alike — so they read as one system.
 *
 * It replaced four parallel implementations (`DashboardModal`, the old
 * title-bar `TfeModal`, `LandingModal` and a dead `Modal`), which had drifted
 * to the point that `DashboardModal` restyled `.form-control` / `.btn-cancel`
 * privately instead of using the platform's own form and button primitives.
 *
 * ── Content ──────────────────────────────────────────────────────────────
 * Three styles, because the dialogs it absorbed use all three:
 *
 *   tabs={[{ id, label, icon, content: <X/> }]}   content on the tab
 *   {(activeId) => <X/>}                          render function
 *   <X/>                                          plain children
 *
 * ── The rail always shows ────────────────────────────────────────────────
 * Even for a one-section dialog. It is not an empty column in that case: it
 * carries `label` + `title`, which is the dialog's own name and context, plus
 * the single nav item. Pass `tabs` only when there is more than one section.
 *
 * Group content inside a pane with `ContentCard` and lay settings out with
 * `ModalRow` — do not hand-roll a card or a label/control row.
 *
 * Props:
 *   open, onClose            required
 *   label                    small eyebrow above the rail title
 *   title                    rail title, and the dialog's accessible name
 *   tabs                     see above; omit for a single section
 *   activeTab / onTabChange  optional controlled selection
 *   defaultTab               initial tab when uncontrolled
 *   heading / subheading     pane header; falls back to the active tab label
 *   media                    node rendered at the pane header's trailing edge
 *   railFooter               node pinned to the bottom of the rail
 *   footer                   action row; omit for a dialog with no actions
 *   size                     'sm' | 'md' (default) | 'lg' | 'xl'
 *   closeOnBackdrop          default true; pass false for destructive forms
 */
export default function TfeModal({
    open,
    onClose,
    label,
    title,
    tabs,
    activeTab,
    onTabChange,
    defaultTab,
    heading,
    subheading,
    media,
    railFooter,
    footer,
    size = 'md',
    closeOnBackdrop = true,
    className = '',
    children,
}) {
    const panelRef = useRef(null);
    const restoreFocusRef = useRef(null);
    const baseId = useId();

    const list = useMemo(() => normalizeTabs(tabs, title), [tabs, title]);

    const [internalTab, setInternalTab] = useState(defaultTab ?? null);
    const isControlled = activeTab !== undefined;
    const activeId = resolveActiveTab(list, isControlled ? activeTab : internalTab, defaultTab);
    const active = list.find((t) => t.id === activeId) || list[0];

    const selectTab = useCallback((id) => {
        if (!isControlled) setInternalTab(id);
        if (onTabChange) onTabChange(id);
    }, [isControlled, onTabChange]);

    // `onClose` is an inline arrow at almost every call site, so it is a new
    // function on every render. Keeping it in a ref is what lets the effect
    // below depend on `open` ALONE — with `onClose` in the dependency list the
    // effect tore down and re-ran on every render, and two things broke: the
    // saved `previousOverflow` captured its own 'hidden' on the second run, so
    // the page stayed unscrollable after the dialog closed; and the element to
    // restore focus to was overwritten with whatever inside the dialog had
    // focus at the time.
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Escape to close, and a focus trap so Tab cannot walk out of the dialog
    // into the page behind it.
    useEffect(() => {
        if (!open) return undefined;

        restoreFocusRef.current = document.activeElement;

        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onCloseRef.current();
                return;
            }

            if (e.key !== 'Tab' || !panelRef.current) return;

            const focusable = panelRef.current.querySelectorAll(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );

            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey, true);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKey, true);

            // Put focus back where it was, or the page loses its place
            // entirely for anyone navigating by keyboard.
            if (restoreFocusRef.current && restoreFocusRef.current.focus) {
                restoreFocusRef.current.focus();
            }
        };
    }, [open]);

    // Move focus into the dialog once it opens.
    useEffect(() => {
        if (!open || !panelRef.current) return;

        const target = panelRef.current.querySelector('[data-autofocus]')
            || panelRef.current.querySelector('.tfe-modal__navitem');

        if (target) target.focus({ preventScroll: true });
    }, [open]);

    if (!open) return null;

    const onRailKeyDown = (e) => {
        const next = tabForKey(list, activeId, e.key);

        if (!next) return;

        e.preventDefault();
        selectTab(next);
    };

    const paneHeading = heading !== undefined ? heading : active?.label;
    const single = list.length === 1;

    return (
        <div
            className="tfe-modal-overlay"
            onMouseDown={(e) => {
                // mousedown, not click: a click that STARTED inside the pane
                // and ended on the backdrop (a drag-select that overshoots, or
                // the avatar cropper's drag) would otherwise close the dialog
                // and throw the work away.
                if (closeOnBackdrop && e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={panelRef}
                className={`tfe-modal tfe-modal--${size} ${single ? 'tfe-modal--single' : ''} ${className}`.trim()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${baseId}-title`}
            >
                <aside className="tfe-modal__rail">
                    <div className="tfe-modal__ident">
                        {label && <div className="tfe-modal__label">{label}</div>}
                        <h2 id={`${baseId}-title`} className="tfe-modal__title">
                            {title || paneHeading || 'Details'}
                        </h2>
                    </div>

                    <div
                        className="tfe-modal__nav"
                        role="tablist"
                        aria-orientation="vertical"
                        onKeyDown={onRailKeyDown}
                    >
                        {list.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                id={`${baseId}-tab-${tab.id}`}
                                aria-selected={tab.id === activeId}
                                aria-controls={`${baseId}-panel-${tab.id}`}
                                tabIndex={tab.id === activeId ? 0 : -1}
                                disabled={tab.disabled}
                                className={`tfe-modal__navitem ${tab.id === activeId ? 'is-active' : ''}`}
                                onClick={() => selectTab(tab.id)}
                            >
                                <i className={tab.icon} aria-hidden="true" />
                                <span className="tfe-modal__navitem-label">{tab.label}</span>
                                {tab.badge != null && tab.badge !== '' && (
                                    <span className="tfe-modal__navitem-badge">{tab.badge}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {railFooter && <div className="tfe-modal__rail-foot">{railFooter}</div>}
                </aside>

                <section className="tfe-modal__pane">
                    <header className="tfe-modal__pane-head">
                        <div className="tfe-modal__pane-heading">
                            {paneHeading && <h3 className="tfe-modal__pane-title">{paneHeading}</h3>}
                            {subheading && <p className="tfe-modal__pane-sub">{subheading}</p>}
                        </div>

                        {media && <div className="tfe-modal__pane-media">{media}</div>}

                        <button
                            type="button"
                            className="tfe-btn tfe-btn--sm tfe-btn--icon tfe-modal__close"
                            aria-label="Close dialog"
                            onClick={onClose}
                        >
                            <i className="fas fa-times" aria-hidden="true" />
                        </button>
                    </header>

                    <div
                        className="tfe-modal__pane-body"
                        role="tabpanel"
                        id={`${baseId}-panel-${activeId}`}
                        aria-labelledby={`${baseId}-tab-${activeId}`}
                        tabIndex={0}
                    >
                        {resolvePanelContent(active, children, activeId)}
                    </div>

                    {footer && <footer className="tfe-modal__foot">{footer}</footer>}
                </section>
            </div>
        </div>
    );
}
