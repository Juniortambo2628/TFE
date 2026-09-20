import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';
import IntroLoader from './Components/IntroLoader';

const appName = import.meta.env.VITE_APP_NAME || 'The Football Experience';

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        const AppWithLoader = () => {
            // Show the intro splash only ONCE per browser session. Every full
            // page load used to block behind a 2.5s red splash — including the
            // login page — which read as "the site is slow". We gate it on
            // sessionStorage so a returning navigation (or a hard refresh mid-
            // session) mounts the app immediately. Guarded in try/catch for
            // private-mode / blocked-storage browsers.
            const alreadyShown = (() => {
                try {
                    return sessionStorage.getItem('tfeIntroShown') === '1';
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
                                sessionStorage.setItem('tfeIntroShown', '1');
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
