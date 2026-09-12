import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import purgecss from '@fullhuman/postcss-purgecss';

const plugins = [tailwindcss(), autoprefixer()];

if (process.env.NODE_ENV === 'production') {
    plugins.push(
        purgecss({
            content: [
                './resources/js/**/*.{js,jsx}',
                './resources/views/**/*.blade.php',
                './app/**/*.php',
            ],
            defaultExtractor: (content) => {
                const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
                const innerMatches = content.match(/[^=>\/\s'"\x60]+(?=\s*?=)/g) || [];
                return broadMatches.concat(innerMatches);
            },
            safelist: {
                standard: [
                    /^text-bg-/,
                    /^bg-/,
                    /^text-/,
                    /^border-/,
                    /^opacity-/,
                    /^shadow-/,
                    /^rounded/,
                    /^flex/,
                    /^grid/,
                    /^col-/,
                    /^row/,
                    /^gap-/,
                    /^p[trblxy]?-/,
                    /^m[trblxy]?-/,
                    /^w-/,
                    /^h-/,
                    /^min-/,
                    /^max-/,
                    /^font-/,
                    /^leading-/,
                    /^tracking-/,
                    /^align-/,
                    /^justify-/,
                    /^order-/,
                    /^z-/,
                    /^overflow-/,
                    /^position-/,
                    /^top-/,
                    /^bottom-/,
                    /^left-/,
                    /^right-/,
                    /^translate-/,
                    /^scale-/,
                    /^rotate-/,
                    /^skew-/,
                    /^cursor-/,
                    /^select-/,
                    /^pointer-events/,
                    /^appearance-/,
                    /^outline-/,
                    /^ring/,
                    /^divide-/,
                    /^decoration-/,
                    /^border-collapse/,
                    /^table-/,
                    /^animate-/,
                    /^from-/,
                    /^via-/,
                    /^to-/,
                    /^fill-/,
                    /^stroke-/,
                    // ── TFE custom class prefixes ────────────────────
                    // The default extractor mangles template literals
                    // like `tfe-sidebar-nav-item${active ? ' is-active'
                    // : ''}` into `tfe-sidebar-nav-item${active`, which
                    // means our `.tfe-*` CSS gets stripped from prod
                    // builds while surviving in dev. Whitelist every
                    // prefix used by hand-written CSS in resources/css/.
                    /^tfe-/,           // primitives.css (.tfe-tile, .tfe-slab, .tfe-pill, .tfe-sidebar-nav-item, .tfe-quick-action*)
                    /^is-/,            // state modifiers (is-active, is-open)
                    /^dash-/,          // dashboard-header-extras.css (.dash-btn-icon, .dash-badge, .dash-avatar, .dash-activity-*, .dash-empty)
                    /^dashboard-/,     // dashboard-header, dashboard-hero, dashboard-user-profile, dashboard-dropdown-*, dashboard-title
                    /^user-/,          // user-avatar, user-name, user-info, user-email
                    /^partner-/,       // partner-summary-cards, partner-stat-card, partner-*
                    /^admin-/,         // admin-theme, admin-approvals, admin-hub-preview classes
                    /^fan-/,           // fan-* utility classes across resources/css/fan/
                    /^content-/,       // content-card, content-card--*
                    /^stat-/,          // stat-value, stat-label, stat-card, stat-*
                    /^card-/,          // card-header, card-body, card-title
                    /^logo/,           // logo, logo-white, logo-dark, tfe-logo-*
                    /^btn-/,           // btn-glass-pill, btn-pill-crimson, btn-warning, btn-outline-*
                    /^manage-/,        // manage-btn (header dropdowns)
                    /^tournament-/,    // tournament-switcher, tournament-*
                    /^financing-/,     // financing-empty, financing-empty--pitch
                    /^loan-/,          // loan-application-*, ActiveLoanTile classes
                    /^powered-by/,     // PoweredByBadge classes
                    /^chevron/,        // chevron helper on dropdowns
                ],
                deep: [
                    /-(enter|leave)(-(active|from|to))?$/,
                    /^(dark|light):/,
                ],
            },
        })
    );
}

export default { plugins };
