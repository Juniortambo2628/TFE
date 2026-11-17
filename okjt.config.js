/**
 * TFE's theme for the OKJT kit (@okjt/ui, @okjt/dashboard). Generates
 * resources/css/okjt-theme.css: `npm run theme` (CI: `npm run theme:check`).
 *
 * Only the dashboard uses the kit so far (kit migration phase 4,
 * docs/proposals/okjt-kit-migration.md), so `theme.dashboard` is what shows:
 * it applies while the kit's shell is mounted (`admin-theme` on <html>). Its
 * values are the ones TFE's dashboard already uses (dashboard-v2.css): the
 * #08080a page, #131316 cards, white text at falling strengths, TFE red.
 *
 * The base colours below apply everywhere else. Two of the kit's names are
 * also shadcn's (`accent`, `muted`, from tailwind.config.js), and a Tailwind
 * theme has one variable per name, so those two are set to shadcn's own
 * values: outside the kit shell, `bg-accent` and `text-muted` stay as they
 * were. The rest are used by nothing outside the shell yet.
 */
export default {
  theme: {
    colors: {
      ink: '#0b0b0d',
      inkDeep: '#000000',
      body: '#1f2937',
      soft: '#4b5563',
      muted: 'hsl(var(--muted))',
      faint: '#9ca3af',
      accent: 'hsl(var(--accent))',
      accentStrong: '#c8161d',
      accentDark: '#a51219',
      accentSoft: '#f4b4b7',
      line: '#e5e7eb',
      lineStrong: '#d1d5db',
      tint: '#f3f4f6',
      paper: '#ffffff',
      paperWarm: '#fafafa',
      positive: '#16a34a',
      positiveDark: '#15803d',
      tone: 'neutral',
    },
    dashboard: {
      colorScheme: 'dark',
      colors: {
        ink: '#ffffff',
        inkDeep: '#000000',
        body: '#f2f2f3',
        soft: 'rgb(255 255 255 / 0.72)',
        muted: 'rgb(255 255 255 / 0.58)',
        faint: 'rgb(255 255 255 / 0.45)',
        accent: '#e31b23',
        // Red as TEXT on the dark surfaces is #ff4b52: #e31b23 measures
        // 3.9:1 on a card (CLAUDE.md, UX plan PRs J + K).
        accentStrong: '#ff4b52',
        accentDark: '#ff4b52',
        accentSoft: 'rgb(227 27 35 / 0.14)',
        line: 'rgb(255 255 255 / 0.07)',
        lineStrong: 'rgb(255 255 255 / 0.14)',
        tint: 'rgb(255 255 255 / 0.05)',
        paper: '#08080a',
        paperWarm: '#0f0f12',
        surface: '#131316',
        contrast: '#ffffff',
        action: '#e31b23',
        positive: '#34d399',
        positiveDark: '#6ee7b7',
        tone: {
          50: 'rgb(255 255 255 / 0.04)',
          100: 'rgb(255 255 255 / 0.07)',
          200: 'rgb(255 255 255 / 0.14)',
          300: 'rgb(255 255 255 / 0.2)',
          400: 'rgb(255 255 255 / 0.38)',
          500: 'rgb(255 255 255 / 0.5)',
          600: 'rgb(255 255 255 / 0.58)',
          700: 'rgb(255 255 255 / 0.72)',
          800: 'rgb(255 255 255 / 0.85)',
          900: 'rgb(255 255 255 / 0.95)',
          950: '#ffffff',
        },
      },
    },
    fonts: {
      sans: "Figtree, ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"",
      display: "Figtree, ui-sans-serif, system-ui, sans-serif",
    },
  },
};
