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
                    /^partner/,        // partner-* AND partners-* (partners-index-hero, partners-index-chip, partner-card__*)
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
                    /^glow-/,          // gaming/premium accent glow — glow-red, glow-blue, glow-crimson (fan pages)
                    /^hero-/,          // hero-stat-*, hero-stat-box, hero-stat-item (dashboard heroes)
                    /^profile-/,       // profile-preview-*, profile-*
                    /^tribe-/,         // tribe cards, tribe detail, tribe-header
                    /^publisher/,      // publisherSummary rendered classes
                    /^avatar/,         // avatar classes
                    /^empty-/,         // empty-state variants
                    /^wizard-/,        // BudgetCalculator step wizard
                    /^map-/,           // ItineraryMap, StadiumSeatMap classes
                    /^seat-/,          // StadiumSeatMap seat blocks
                    /^weather-/,       // WeatherCard
                    /^compare-/,       // TournamentCompare widget
                    /^cost-/,          // CostScenarioChart
                    /^savings-/,       // SavingsGoals page
                    /^booking-/,       // Booking details/history
                    // ── Landing section system (landing-section.css) ──
                    // HorizontalCardSection builds its layout class via a
                    // template literal (`section-${variant}`), so the
                    // extractor mangles it and PurgeCSS was stripping the
                    // whole split/split-reverse/stacked layout — the reason
                    // the "cards left, info right" sections rendered with the
                    // wrong column ratio in prod. Safelist the families.
                    /^section-/,       // section-split, section-split-reverse, section-stacked, section-dark/light
                    /^landing-/,       // landing-section, landing-card*, landing-modal*
                    /^cards-/,         // cards-track, cards-track-reverse
                    /^badge-/,         // badge-number, badge-divider, badge-label
                    /^tc-/,            // tournament-compare cards (tc-card, tc-card__*)
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
