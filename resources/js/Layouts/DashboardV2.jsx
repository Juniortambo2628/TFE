import React, { createContext, useContext, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * The Naoa-style dashboard (UX review, Nov 2026), switched on per person from
 * the account menu (`users.dashboard_v2`, DashboardVersionController).
 *
 * It is the SAME pages on the same routes with the same data: the shell
 * (BaseLayout, AppSidebar, DashboardHeader) and the page heading
 * (DashboardHero) each read `useDashboardV2()` and draw the Naoa shape —
 * sidebar with section titles, a slim header with quick links and the
 * account menu, every page opening with breadcrumbs + icon + title, summary
 * cards, then the content, and the page's actions in one floating toolbar
 * at the bottom. Everything else on a page is restyled by
 * resources/css/dashboard-v2.css under `.tfe-dv2`. So all four roles, and
 * any page added later, get it without being touched.
 *
 * Each of those components branches into a v1 and a v2 COMPONENT rather
 * than an if inside one: the two render different hooks, and flipping the
 * switch mid-session must not change a component's hook order.
 */
export function useDashboardV2() {
    return Boolean(usePage().props.auth?.user?.dashboard_v2);
}

/** Where a page's hero actions are portalled to (BaseLayout renders it). */
export const TOOLBAR_ID = 'tfe-dv2-toolbar';

/**
 * The sidebar item for the current page, published by the v2 sidebar so the
 * page heading can show its icon and the breadcrumb its section — the icon
 * a person just clicked is the one the page opens with, as in Naoa.
 */
const ActiveNavContext = createContext({ item: null, setItem: () => {} });

export function ActiveNavProvider({ children }) {
    const [item, setItem] = useState(null);
    const value = useMemo(() => ({ item, setItem }), [item]);
    return <ActiveNavContext.Provider value={value}>{children}</ActiveNavContext.Provider>;
}

export function useActiveNav() {
    return useContext(ActiveNavContext);
}
