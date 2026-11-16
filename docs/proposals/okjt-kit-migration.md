# Moving TFE onto the OKJT kit

Status: **approved** (2026-11-16): all seven decisions in section 6 taken as
recommended. Progress is logged in section 7.

Read at: TFE `509f2ea` (+ PR #90), OKJT `packages/` 0.8.0
(`SPEC.md`, `CONSOLIDATION_PLAN.md`, `UPGRADING.md`).

## 1. Where things stand

**TFE uses none of the kit.** There is no `@okjt/*` package and no
`okjt/laravel-kit` in TFE. Its dashboard (sidebar, header, side panel,
floating toolbar, phone tab bar) and its public v2 pages were built by hand
inside TFE, modelled on Naoa and Najenga, because the kit could not be
installed here. So kit releases never reach TFE, and TFE's dashboard drifts
from the projects that do use the kit.

The kit's own plan already says this and why
(`CONSOLIDATION_PLAN.md` §1 and §4b, approved 2026-11-15):

| What the kit needs | TFE today |
|---|---|
| Tailwind **4** (`@theme`, `@source`) | Tailwind **3** + Bootstrap utilities + PurgeCSS |
| `react-router-dom` (imported in 22 kit modules) | **Inertia** v2 (server-rendered page props, no client router) |
| `@tanstack/react-query`, `react-hook-form`, `framer-motion`, `lucide-react`, `react-hot-toast` | Inertia `useForm`/`usePage`, Font Awesome 6.0, `sonner` |
| `okjt/laravel-kit` API (auth, workspaces + roles, notifications, presence) | TFE's own: session auth with passkeys + 2FA + Google, four roles (fan, partner, admin, institution), its own notifications |

The kit's decision was: support Inertia through a small `@okjt/inertia`
package (release **R3**, not built yet), and **not** support Tailwind 3 —
"moving TFE's styles to Tailwind 4 is a separate TFE project, scheduled on
its own". This document is that project.

### Size of TFE's front end

| | Count |
|---|---|
| Inertia pages | 88 (Fan 29, Admin 21, Partner 10, Institution 2, public and auth 26) |
| Hand-written CSS | ~26,400 lines in `resources/css` (`dashboard-v2.css` alone 640) |
| Files using Bootstrap layout utilities (`d-flex`, `row`, `col-md-*`, `mb-3`, …) | 79 |
| shadcn/ui components on Tailwind 3 syntax | 6 (`Components/ui`, incl. the sidebar) |
| Tremor charts (`@tremor/react` 3.x, a Tailwind 3 library) | 2 files |

## 2. What TFE should NOT do

* **Move off Inertia.** The kit's spec moves Najenga off Inertia, but TFE has
  88 server-rendered pages, deferred props and a session-based auth stack;
  rewriting them as an API + SPA is months of work for no user-visible gain.
  The kit's own recommendation (§4a) is `@okjt/inertia`. Use it.
* **Copy kit code into TFE.** Every piece comes in as a package import, or not
  at all (TFE's CLAUDE.md, "The OKJT kit").
* **Throw away what TFE built better.** The kit plan already lists TFE pieces
  to lift *into* the kit (F2 dialog, F5 tab bar, F7 undo, F8 StepFlow, F9
  skeletons, F11 formats, S3 shadowed cookies, S4 error log, S5 media
  library, S9 PWA + push, S10 fresh-password check, and TFE's tests). Those go
  upstream first, then TFE consumes them back, so nothing is lost.

## 3. The plan, in phases

Each phase is its own set of pull requests, merged and deployed before the
next starts. Each has a visible "done when".

### Phase 0: use what already works with Inertia and Tailwind 3 (~3 days)

No dependency on Tailwind 4 or R3.

* `@okjt/ui/helpers` (kit 0.6+, no React, no toasts): `installChunkReload()`
  in `app.jsx`; compare the kit's format helpers with TFE's `lib/utils`
  (`formatMoney`, `formatNumber`, `formatDateTime`, `statusLabel`) and switch
  where they match.
* `okjt/laravel-kit` server pieces that do not touch auth: `SecurityHeaders`
  (S1, CSP from config). **Needs Kevin** (security headers).
* Add TFE to the kit's consumers check (`packages-consumers.yml`), JS tests
  and build only for now, so a kit change that breaks TFE is caught.
* Done when: TFE builds and its suites pass with the kit installed; nothing on
  screen changes (screenshots identical).

### Phase 1: give TFE's pieces to the kit (kit-side, ~1–2 weeks, can run beside Phase 2)

Kit PRs in OKJT, following its "every change to the kit" rules (one change
per commit, tests, style snapshot showing no change for Naoa/Najenga, version
bump, `UPGRADING.md`). In this order, because Phase 4 needs them:

1. **F2** `Modal` v2 from `TfeModal` (tabs, footer that follows the tab,
   fixed height, phone bottom sheet).
2. **F5** phone tab bar from `TabBar` + `lib/dashboardTabs.js`
   (`shell.tabBar`, off by default).
3. **F9** skeletons + page cross-fade from `PageTransition` +
   `lib/pageSkeleton.js` (a `DashboardShell` option).
4. **F8** `StepFlow`, **F7** `undoable()`, **F11** format helpers.
5. TFE's checks into the kit's CI: axe, grid overflow, asset paths, bundle
   boundaries, and the new no-coloured-card-borders scan.

### Phase 2: TFE onto Tailwind 4 (~2–3 weeks; the bulk of the risk)

TFE-only. Nothing should look different at the end; this phase changes the
build, not the design.

1. **Baseline.** Screenshot every route for every role at 1440 and 390 px
   (scripted from the seeded demo, like `scripts/landing-v2-screens.mjs`), and
   capture computed styles with the kit's `style-snapshot.mjs`. This is the
   comparison every later step is checked against.
2. **Upgrade** with `npx @tailwindcss/upgrade`: config to CSS (`@theme`),
   `@tailwind` directives to `@import "tailwindcss"`, renamed utilities,
   arbitrary-value syntax in the shadcn components (`w-[--sidebar-width]` →
   `w-(--sidebar-width)`), `@tailwindcss/forms` strategy kept as `class`.
3. **Drop PurgeCSS.** Tailwind 4 only generates what it finds; the
   PurgeCSS safelist (and the template-literal class trap it exists for)
   goes. Hand-written CSS is no longer purged at all — check the bundle size.
4. **Replace Tremor** (Tailwind 3 only) on the two admin chart pages with
   Recharts, which TFE already ships behind a lazy boundary.
5. **Bootstrap utilities.** Tailwind 4 and Bootstrap both define `.hidden`,
   `.flex`, `.border`, `.row`-adjacent spacing, with different values.
   Either (a) convert the 79 files to Tailwind utilities in this phase, or
   (b) keep `bootstrap-utilities.css` + `bootstrap-grid.css` loaded in a
   CSS layer below Tailwind and convert page by page in Phase 4. **(b) is
   safer**; (a) is cleaner. Decision 3.
6. Done when: every screenshot matches the baseline (or each difference is
   listed and accepted), PHP/JS/e2e/axe suites green, deployed.

### Phase 3: Inertia support in the kit (kit release R3, ~1 week)

Already planned and approved in the kit (`CONSOLIDATION_PLAN.md` R3): a
`navigation` setting on `SiteProvider` / `DashboardProvider`
(`{ Link, NavLink, useLocation, navigate }`, react-router by default), and
`@okjt/inertia` generalised from Tena-host's bridge. TFE adds to it:

* **Auth from page props.** `AuthProvider` already takes `initialUser` and a
  `mode`; TFE needs a mode that reads the signed-in user from Inertia's shared
  `auth` prop and never calls `/api/user`.
* **Roles without workspaces.** TFE's roles are per account (fan, partner,
  admin, institution), not per workspace. The shell must run with
  `features.history/presence/sharing` off and no workspace, choosing the
  sidebar from the account's role. Check what the shell needs at that point
  and add options in the kit if it does not already allow it.
* **Notifications** through `NotificationsBell`'s `listPath` / `markAllPath`
  / `map` (G6, built) pointed at TFE's existing routes, and the per-section
  activity badges TFE has (`ActivityBadges`) as an option.
* Done when: Tena-host and a TFE spike page both run the kit dashboard shell
  under Inertia.

### Phase 4: TFE's dashboard on the kit shell (~2–3 weeks)

One PR per role, smallest first: **institution → partner → admin → fan**.

* `DashboardProvider` config per role: brand, theme (TFE red, role accents
  as tokens), the sidebar groups from TFE's existing menu constants, tab bar
  on, tutorial from `FanTutorial`'s steps.
* Replace TFE's `BaseLayout`/`RoleLayout` shell pieces (`AppSidebar`,
  `DashboardHeader` dashboard variant, `DashboardV2/PageToolbar`,
  `DashboardV2/SidePanel`, `TabBar`) with `DashboardShell`. Persistent layout
  in `app.jsx` stays; it mounts the kit shell instead.
* Page content stays as it is at first. Then, page by page: `DashboardHero` →
  `AdminPageHero`, `.tfe-tile` rows → `AdminSummaryCards`, `ListingGrid` →
  `AdminListPanel` (after F6 lands), `TfeModal` → kit `Modal` v2.
* Delete what the kit now provides: most of `dashboard-v2.css`, the
  `fan/dashboard*.css` shell rules, `Components/DashboardV2/*`.
* Done when: each role's pages match the agreed look at 1440/390 px, the
  footer and Back behaviour are kept, axe is clean, and the deleted files are
  gone.

### Phase 5: public pages on `@okjt/site` (~2 weeks, after kit S6)

TFE's public pages already follow the kit's site structure (they were built
from Najenga's). Move them to `@okjt/site` sections and templates once the
kit's editable content (S6, release R4) exists, because TFE's
`LandingContent` CMS overrides must keep working. Until then they stay.

### Phase 6: server pieces (with kit R4/R5)

Take `okjt/laravel-kit`'s S3 (stale cookies, from TFE), S4 (error log, from
TFE), S5 (media library, from TFE) as each is released, deleting TFE's copy.
**Auth stays TFE's own** unless the kit's auth gains everything TFE has
(passkeys with 2FA parity, Google without the fixed-password bug, fresh
password for savings); compare first, decide then.

## 4. Order and timing

```
Phase 0  ███                                    (now)
Phase 1     ██████                              (kit; beside Phase 2)
Phase 2     ████████████                        (TFE Tailwind 4)
Phase 3              █████                      (kit R3)
Phase 4                   ████████████          (shell swap, per role)
Phase 5                               ████████  (after kit S6)
```

Roughly **8–11 weeks** to the dashboard on the kit (Phases 0–4); the public
pages follow when the kit's content editing exists.

## 5. Risks

* **Tailwind 4 changes look subtly** (default border colour, ring width,
  placeholder colour, preflight). The baseline comparison in Phase 2 is what
  catches them; do not skip it.
* **The kit's look differs from TFE's in places** (dialog chrome, field
  styles, focus rings). Najenga hit the same thing and the kit added style
  options (its "Option B"). Expect the same here; Decision 4.
* **Bundle size.** Without PurgeCSS, all hand-written CSS ships. Most of it
  is deleted in Phase 4; until then measure it.
* **Two moving targets.** The kit is mid-consolidation (R2 in progress). Pin
  exact kit versions in TFE until 1.0.

## 6. Decisions needed

| # | Question | Recommendation |
|---|---|---|
| 1 | Start the Tailwind 4 project now (Phase 2), as the kit plan's §4b left it to be scheduled? | Yes |
| 2 | Stay on Inertia and use `@okjt/inertia` (rather than rewrite TFE as an API + SPA)? | Stay on Inertia |
| 3 | Bootstrap utilities: convert all 79 files in Phase 2, or keep them in a lower CSS layer and convert page by page? | Keep, convert page by page |
| 4 | Dashboard look: take the kit's look where it differs, or add style options to the kit so TFE looks the same as now? | Take the kit's look; the point is one look across products |
| 5 | Replace Tremor with Recharts on the two admin chart pages? | Yes |
| 6 | Auth: keep TFE's own for now? | Yes, until the kit's matches it |
| 7 | Who reviews the security-header and auth-adjacent PRs? | Kevin, as the kit already requires |

**Decided 2026-11-16:** the owner took every recommendation above.

## 7. Progress

### Phase 0 (TFE PR, "Needs Kevin")

- [x] `@okjt/ui` 0.4.0 (exact): `installChunkReload()` from
  `@okjt/ui/helpers` in `app.jsx`. TFE had nothing for this: a tab left open
  across a deploy failed on its next lazily loaded page.
- [x] `okjt/laravel-kit` 0.8.0 (exact): `SecurityHeaders` on every response
  (TFE sent none). The content-security policy is **report-only**, with
  Bunny Fonts added; switch to enforcing once reports show nothing missing.
- [x] **Found on the way:** the kit's service provider replaces the
  password-reset link with `config('app.frontend_url')`, which Laravel 12
  defaults to `http://localhost:3000`. Installed as-is, every TFE reset email
  would have linked to localhost. TFE sets its own link back in
  `AppServiceProvider` (`ResetLinkUrlTest`, which fails without it). Kit fix
  to propose: only override the link when the project sets a front-end URL,
  or behind `okjt.auth.password_reset.override`.
- [ ] The kit's format helpers (F11) do not exist yet; they come from TFE in
  phase 1.
- [ ] TFE in the kit's consumers check (an OKJT PR, phase 1).
