/**
 * The dashboard's bottom tab bar (phones, dashboard v2): which of a role's
 * sidebar items become tabs, and which one is current. JSX-free so
 * `node --test` loads it (tests/JS/dashboardTabs.test.mjs).
 *
 * Tabs are PICKED from the sidebar menu by route name, never written out a
 * second time, so a tab's label and icon cannot drift from the sidebar item
 * it stands for — the same rule as INSTITUTION_MENU being one constant.
 */

/** The menu item for a path: the longest matching item path wins. */
export function activeMenuItem(menuItems = [], url = '') {
    const path = String(url).split(/[?#]/)[0];
    return menuItems
        .filter((it) => !it.heading && it.path && (path === it.path || path.startsWith(`${it.path}/`)))
        .sort((a, b) => b.path.length - a.path.length)[0] || null;
}

/**
 * The tabs for a role: `tabs` is a list of route names (or { route, primary })
 * in tab order. A route that is not in this user's menu is skipped rather
 * than rendered as a dead tab — a ticketing partner has no "Convert".
 */
export function dashboardTabs(menuItems = [], tabs = [], url = '') {
    const current = activeMenuItem(menuItems, url);
    return tabs
        .map((t) => (typeof t === 'string' ? { route: t } : t))
        .map((t) => {
            const item = menuItems.find((it) => !it.heading && it.route === t.route);
            if (!item) return null;
            return {
                route: item.route,
                label: t.label || item.label,
                icon: item.icon,
                primary: Boolean(t.primary),
                current: current?.route === item.route,
            };
        })
        .filter(Boolean);
}
