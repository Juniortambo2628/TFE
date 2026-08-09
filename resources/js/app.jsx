import '../css/app.css';
import '../css/hero-enhancements.css';
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
            // Check session storage to only show loader once per session?
            // The prompt implies a "full screen intro loader" which usually happens on site visit.
            // For now, let's show it on every full reload (which this file handles).
            // Users navigating via Inertia Links won't trigger this again unless page refreshes.
            const [loading, setLoading] = useState(true);

            return (
                <>
                    {loading && (
                        <IntroLoader onFinish={() => {
                            setLoading(false);
                            window.tfeLoaderFinished = true;
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
