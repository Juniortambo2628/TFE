/**
 * modalTabs — the pure half of the unified tabbed dialog (`TfeModal`).
 *
 * Kept JSX- and React-free so `node --test` can load it directly (same reason
 * as `lib/pageSkeleton.js` and `lib/stadiumBowl.js`). Everything here is about
 * turning what a caller passed into a tab list the shell can render; the shell
 * itself is `Components/Common/TfeModal.jsx`.
 */

/** Fallback icon for a tab that did not name one. */
export const DEFAULT_TAB_ICON = 'fas fa-circle-info';

/**
 * Normalise whatever a caller passed as `tabs` into a usable list.
 *
 * Callers hand this three different things, and all three must work because
 * the dialog replaced four separate modal components with different APIs:
 *
 *   - a full list: `[{ id, label, icon, content, badge, disabled }]`
 *   - bare strings: `['Overview', 'Details']`
 *   - nothing at all, for a dialog with one section
 *
 * The last case is the important one. Every dialog on the platform shows the
 * rail, so a single-section dialog still needs exactly one tab — it is
 * synthesised from `title` rather than left empty, so the rail carries the
 * dialog's own name instead of a blank column.
 *
 * @param {Array|undefined} tabs
 * @param {string|undefined} fallbackLabel used when no tabs were given
 * @returns {Array<{id:string,label:string,icon:string,content:*,badge:*,disabled:boolean}>}
 */
export function normalizeTabs(tabs, fallbackLabel) {
    const list = Array.isArray(tabs) ? tabs.filter(Boolean) : [];

    if (list.length === 0) {
        return [{
            id: 'default',
            label: fallbackLabel || 'Details',
            icon: DEFAULT_TAB_ICON,
            content: undefined,
            badge: null,
            disabled: false,
        }];
    }

    return list.map((tab, i) => {
        if (typeof tab === 'string') {
            return {
                id: slugifyTabId(tab, i),
                label: tab,
                icon: DEFAULT_TAB_ICON,
                content: undefined,
                badge: null,
                disabled: false,
            };
        }

        const label = tab.label ?? tab.id ?? `Tab ${i + 1}`;

        return {
            id: String(tab.id ?? slugifyTabId(label, i)),
            label,
            icon: tab.icon || DEFAULT_TAB_ICON,
            content: tab.content,
            badge: tab.badge ?? null,
            disabled: Boolean(tab.disabled),
        };
    });
}

/**
 * A stable id from a label, for callers that passed bare strings.
 *
 * Falls back to the index when a label has no usable characters, so two tabs
 * called "…" and "—" cannot collide on an empty id.
 */
export function slugifyTabId(label, index) {
    const slug = String(label ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return slug || `tab-${index}`;
}

/**
 * Which tab should be showing.
 *
 * Resolution order: the caller's controlled/stored value, then their preferred
 * default, then the first tab that is not disabled, then the first tab.
 *
 * Guarding against a stale id matters because the tab list changes while the
 * dialog is open — a listing form swaps its "Trip" tab in and out with the
 * listing type, and a wizard adds a step. Without this the pane would render
 * nothing and the dialog would look broken.
 */
export function resolveActiveTab(list, requested, preferred) {
    if (!Array.isArray(list) || list.length === 0) return null;

    const usable = (id) => id != null && list.some((t) => t.id === id && !t.disabled);

    if (usable(requested)) return requested;
    if (usable(preferred)) return preferred;

    const firstEnabled = list.find((t) => !t.disabled);

    return (firstEnabled || list[0]).id;
}

/**
 * The tab to move to for a keyboard interaction on the rail.
 *
 * Arrow keys wrap and skip disabled tabs; Home/End jump to the ends. Returns
 * null for a key the rail does not handle, so the caller leaves the event
 * alone rather than swallowing it.
 */
export function tabForKey(list, currentId, key) {
    const enabled = (list || []).filter((t) => !t.disabled);

    if (enabled.length === 0) return null;

    const at = enabled.findIndex((t) => t.id === currentId);
    const step = (delta) => enabled[(((at < 0 ? 0 : at) + delta) % enabled.length + enabled.length) % enabled.length].id;

    switch (key) {
        case 'ArrowDown':
        case 'ArrowRight':
            return step(1);
        case 'ArrowUp':
        case 'ArrowLeft':
            return step(-1);
        case 'Home':
            return enabled[0].id;
        case 'End':
            return enabled[enabled.length - 1].id;
        default:
            return null;
    }
}

/**
 * Pick the body for the active tab.
 *
 * Three content styles, because the dialogs being migrated use all three:
 * content carried on the tab object, a render function that receives the
 * active id, or plain children for a single-section dialog.
 */
export function resolvePanelContent(tab, children, activeId) {
    if (tab && tab.content !== undefined && tab.content !== null) return tab.content;
    if (typeof children === 'function') return children(activeId);

    return children;
}
