/*
 * Tailwind 4 (kit migration phase 2). Its PostCSS plugin also adds vendor
 * prefixes, so autoprefixer is gone. PurgeCSS is gone too: Tailwind only
 * generates the utilities it finds, and PurgeCSS's extractor mangled class
 * names built in template literals, which needed a long safelist and still
 * dropped classes in production only.
 */
export default {
    plugins: {
        '@tailwindcss/postcss': {},
    },
};
