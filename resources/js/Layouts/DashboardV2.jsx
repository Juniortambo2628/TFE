import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
    const { design, auth } = usePage().props;
    // v2 is the dashboard for everyone since the switch; the per-person
    // flag only matters under the v1 fallback (config app.design).
    return design === 'v2' || Boolean(auth?.user?.dashboard_v2);
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

/**
 * The page toolbar's slots (Naoa's floating toolbar: search, views, actions).
 * A page — or a shared component on it, like ListingGrid — registers what it
 * has; the toolbar (Components/Common/DashboardV2/PageToolbar) draws it. A
 * page that registers no search gets the toolbar's own "find on this page".
 *
 * Outside the v2 shell there is no provider and registering is a no-op, so
 * the same component works on the current dashboard unchanged.
 */
const ToolbarContext = createContext(null);

export function ToolbarProvider({ children }) {
    const [slots, setSlots] = useState({});
    const value = useMemo(() => ({ slots, setSlots }), [slots]);
    return <ToolbarContext.Provider value={value}>{children}</ToolbarContext.Provider>;
}

export function useToolbarSlots() {
    return useContext(ToolbarContext)?.slots || {};
}

/**
 * Put `value` in toolbar slot `name` while the caller is mounted. Returns
 * whether the caller holds the slot (the first to claim it does), so a
 * component can hide its own inline control only when the toolbar shows it.
 */
export function useToolbarSlot(name, value) {
    const ctx = useContext(ToolbarContext);
    const [token] = useState(() => Symbol(name));
    const setSlots = ctx?.setSlots;

    // Callers pass a fresh object every render. Re-registering on identity
    // would loop (registering re-renders the caller), so the slot is
    // re-registered only when its DATA changes, and its callbacks always call
    // the caller's latest ones through a ref.
    const latest = useRef(value);
    latest.current = value;
    const dataKey = value ? JSON.stringify(value, (k, v) => (typeof v === 'function' ? undefined : v)) : null;

    useEffect(() => {
        if (!setSlots || dataKey === null) return undefined;
        const data = JSON.parse(dataKey);
        const entry = { ...data, token };
        for (const [k, v] of Object.entries(latest.current)) {
            if (typeof v === 'function') entry[k] = (...args) => latest.current?.[k]?.(...args);
        }
        setSlots((s) => (s[name] && s[name].token !== token ? s : { ...s, [name]: entry }));
        return () => setSlots((s) => {
            if (s[name]?.token !== token) return s;
            const { [name]: _gone, ...rest } = s;
            return rest;
        });
    }, [setSlots, name, token, dataKey]);

    return Boolean(ctx && ctx.slots[name]?.token === token);
}
