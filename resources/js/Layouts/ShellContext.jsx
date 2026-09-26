import { createContext, useContext } from 'react';

/**
 * ShellContext — marks that a persistent role shell (sidebar + header +
 * providers) is already mounted above the current page.
 *
 * Why this exists
 * ---------------
 * Every dashboard page renders its own `<AdminLayout>` / `<FanLayout>` /
 * `<PartnerLayout>` inside its JSX. With the layout living *inside* the page
 * component, an Inertia visit swaps the page component and React unmounts the
 * entire subtree — sidebar, header, providers and all — then mounts a fresh
 * one. Nothing is reused, so a sidebar click looked and felt exactly like a
 * full browser reload: the sidebar flashed, its open groups reset, scroll
 * jumped and every header query re-ran.
 *
 * The fix is Inertia's persistent layout (`Page.layout`), assigned centrally in
 * `app.jsx` from the page name, so no page file has to change. The shell then
 * renders once and only `{page}` swaps underneath it.
 *
 * That leaves the layout element the page itself still renders. Rather than
 * strip it from ~50 files (and re-strip it from every new page forever), the
 * role layouts read this context: when a shell is already above them they
 * render the page's `<Head title>` and children only, and let the mounted
 * shell own the chrome. Outside a shell — a page rendered directly, a test —
 * they behave exactly as before.
 */
const ShellContext = createContext(false);

export function ShellProvider({ children }) {
    return <ShellContext.Provider value={true}>{children}</ShellContext.Provider>;
}

/** True when a persistent role shell is already mounted above this component. */
export function useInShell() {
    return useContext(ShellContext);
}

export default ShellContext;
