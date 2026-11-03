// In-app navigation history, for the public pages' Back button (BackNav).
//
// "Back" should behave like the browser's back button while the visitor is
// moving around TFE, but must never take them OFF the site: someone who
// opened a partner's page from a WhatsApp link and taps Back expects the
// partners directory, not WhatsApp. The browser will not say whether the
// previous history entry is ours, so we keep our own record of the visits
// made in this tab and only call history.back() when there is one of ours
// to go back to; otherwise BackNav visits the page's parent.
//
// JSX- and Inertia-free so `node --test` can load it
// (tests/JS/navHistory.test.mjs). Installed once in app.jsx.

/**
 * A stack of the URLs visited in this tab. `record()` is fed every
 * navigation, forward or back, and tells the two apart by URL: arriving at
 * the entry just below the top is a step back (pop); anything else is a new
 * visit (push). Repeats of the current URL — partial reloads, a re-render —
 * are ignored.
 */
export function createNavStack(max = 50) {
    const stack = [];
    return {
        record(url) {
            if (!url) return;
            const top = stack[stack.length - 1];
            if (url === top) return;
            if (stack.length > 1 && url === stack[stack.length - 2]) {
                stack.pop();
                return;
            }
            stack.push(url);
            if (stack.length > max) stack.shift();
        },
        /**
         * The current page is being REPLACED by `url` (BackNav going to a
         * parent with nothing of ours behind it). Without this the parent is
         * recorded as a step forward, and the next Back returns to the page
         * the visitor just left instead of continuing up the hierarchy.
         */
        replaceTop(url) {
            if (!url) return;
            if (stack.length === 0) stack.push(url);
            else stack[stack.length - 1] = url;
        },
        /** Is there a page of ours behind the current one? */
        canGoBack() {
            return stack.length > 1;
        },
        snapshot() {
            return stack.slice();
        },
    };
}

/** Path + query of a URL or Inertia page url, without origin or hash. */
export function normalizeUrl(url) {
    if (!url) return '';
    const noHash = String(url).split('#')[0];
    return noHash.replace(/^https?:\/\/[^/]+/i, '') || '/';
}

export const navStack = createNavStack();

/**
 * Feed every Inertia navigation into `navStack`. `router` is Inertia's; the
 * current location is recorded first so the landing page counts even if the
 * initial `navigate` event has already fired.
 */
export function installNavHistory(router, location = typeof window !== 'undefined' ? window.location : null) {
    if (location) navStack.record(normalizeUrl(location.pathname + location.search));
    return router.on('navigate', (event) => {
        navStack.record(normalizeUrl(event?.detail?.page?.url));
    });
}
