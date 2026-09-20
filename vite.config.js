import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: '127.0.0.1',
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                // Pull ONLY the React ecosystem into a shared chunk: it's
                // needed on every page, so caching it once beats baking it
                // into each route bundle, and keeping the whole ecosystem in
                // one chunk avoids cross-chunk hook/context mismatches.
                //
                // Everything else (Recharts/d3, FilePond, etc.) is left to
                // Rollup's default per-import-graph splitting. Hand-grouping
                // those into named chunks backfired: because a named chunk is
                // emitted as a unit, one small statically-reachable module in
                // it promotes the WHOLE chunk to a static import of the entry
                // — which dragged the 1.1MB chart bundle onto the login page.
                // Rollup's default correctly keeps a dynamic-only lib out of
                // the entry and in a chunk that loads only with its page.
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;

                    if (
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/react-is/') ||
                        id.includes('node_modules/scheduler/') ||
                        id.includes('node_modules/@inertiajs/')
                    ) {
                        return 'react-vendor';
                    }
                },
            },
        },
    },
});
