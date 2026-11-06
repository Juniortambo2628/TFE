import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';
import IntroLoader from './Components/IntroLoader';
import { installErrorReporter } from './lib/errorReporter';
import { installNavHistory } from './lib/navHistory';

// Uncaught errors and failed same-origin asset loads reach the server log
// instead of only a tester's devtools (Sprint 69).
installErrorReporter();

// Records the visits made in this tab, so a public page's Back button
// (Components/Common/BackNav) can go back one step without ever leaving the
// site for wherever the visitor came from.
installNavHistory(router);

// Installable website (docs/proposals/mobile-app.md, phase 0): the service
// worker gives an installed TFE its offline page and keeps the built assets
// and images warm. Production builds only — in dev it would serve Vite's
// modules from a cache. After load, so it never competes with first paint.
if (import.meta.env.PROD && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
            // Not supported here (private mode, an old WebView): the site
            // works exactly as before without it.
        });
    });
}

const appName = import.meta.env.VITE_APP_NAME || 'The Football Experience';

// Page-name prefix -> the persistent role shell that wraps it. Every page
// under these directories uses the matching layout, so the mapping is the
// whole rule. Public pages have no prefix here and render unwrapped.
const SHELLS = {
    Admin: () => import('./Layouts/AdminLayout'),
    Fan: () => import('./Layouts/FanLayout'),
    Institution: () => import('./Layouts/InstitutionLayout'),
    Partner: () => import('./Layouts/PartnerLayout'),
};

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    // Persistent layouts, assigned centrally from the page name.
    //
    // Every dashboard page renders its own <AdminLayout>/<FanLayout>/
    // <PartnerLayout> inside its JSX. With the layout inside the page, an
    // Inertia visit swapped the page component and React tore the whole
    // subtree down — sidebar, header, providers — and built a new one, which
    // is why clicking a sidebar link looked exactly like a full browser
    // reload. Attaching the layout here instead keeps the shell mounted and
    // swaps only the page under it. The role layouts detect the shell above
    // them and stand down to a passthrough (see Layouts/ShellContext), so not
    // one page file has to change — including pages added later.
    //
    // Imported lazily so a visitor on a public page never pays for a role's
    // layout or its CSS stack; the page itself imports the same module, so
    // this resolves to a chunk that is being fetched anyway.
    resolve: async (name) => {
        const page = await resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        );

        const loadShell = SHELLS[name.split('/')[0]];
        // `=== undefined` and not a falsy check: a page can opt out of the
        // shell entirely by exporting `layout = null`.
        if (loadShell && page.default && page.default.layout === undefined) {
            const Shell = (await loadShell()).default;
            page.default.layout = (pageEl) => <Shell>{pageEl}</Shell>;
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        const AppWithLoader = () => {
            // Show the intro splash only once. Every full
            // page load used to block behind a 2.5s red splash — including the
            // login page — which read as "the site is slow". We gate it on
            // sessionStorage so a returning navigation (or a hard refresh mid-
            // session) mounts the app immediately. Guarded in try/catch for
            // private-mode / blocked-storage browsers.
            // Once per DEVICE since Nov 2026 (localStorage), not once per
            // session: a returning visitor has seen it.
            const alreadyShown = (() => {
                try {
                    return localStorage.getItem('tfeIntroShown') === '1' || sessionStorage.getItem('tfeIntroShown') === '1';
                } catch (e) {
                    return false;
                }
            })();

            const [loading, setLoading] = useState(!alreadyShown);

            if (alreadyShown) {
                window.tfeLoaderFinished = true;
            }

            return (
                <>
                    {loading && (
                        <IntroLoader onFinish={() => {
                            setLoading(false);
                            window.tfeLoaderFinished = true;
                            try {
                                localStorage.setItem('tfeIntroShown', '1');
                            } catch (e) {
                                // storage blocked (private mode) — splash just
                                // shows again on the next full load, no crash.
                            }
                            window.dispatchEvent(new CustomEvent('tfeLoaderFinished'));
                        }} />
                    )}
                    {/* 
                      We can choose to render the App hidden behind the loader 
                      or only mount it after loading. 
                      Mounting it immediately allows it to fetch/hydrate while loader is showing.
                    */}
                    <div className={loading ? 'fixed inset-0 overflow-hidden' : ''}>
                         <App {...props} />
                    </div>
                </>
            );
        };

        root.render(<AppWithLoader />);
    },
    progress: {
        color: '#4B5563',
    },
});
