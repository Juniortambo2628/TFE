# CLAUDE.md

Orientation for future Claude sessions. Written cumulatively across Sprints 1–17;
last refreshed at Sprint 28. Prefer editing this file over adding parallel docs.

---

## What TFE is

**The Football Experience** (TFE) is a Laravel 12 + Inertia + React 19 platform
that helps fans plan football tournament trips — matches, hotels, flights, tickets —
and lets **partners** (travel agents, hotels, airlines, finance providers, clubs,
federations, event organisers, sponsors) publish inventory and service fans on it.

Originally built for the FIFA World Cup 2026, it was pivoted to a multi-tournament
model in Sprint 1 — tournaments live in `config/tournaments.php` (`wc_2026`,
`afcon_2027`, `euro_2024`, …) and every fan-facing resource is scoped to an
`active_tournament` in session.

## Stack + tooling

- **Backend**: PHP 8.3+, Laravel 12, SQLite (dev) / MySQL (WAMP prod). Pint for formatting.
- **Frontend**: Inertia.js v2, React 19, Vite 7. Tailwind + Bootstrap classes coexist.
  shadcn/ui + Recharts + Tremor for admin dashboards.
- **Tests**: PHPUnit 11 (149 tests / 277 assertions as of Sprint 17).
- **Playwright** via `/opt/pw-browsers/chromium` for smoke screenshots — see
  `scratchpad/shots.cjs` patterns.
- **Data feeds**: Wikipedia REST + Action APIs (parallelised with `Http::pool()`),
  Open-Meteo for weather, Paystack for payments.
- **Dev branch**: `claude/brave-newton-o8w4u0`. Never push elsewhere without asking.

## Common commands

```bash
# Boot
php artisan serve --host=127.0.0.1 --port=8000
npx vite build   # or `npm run dev` for HMR

# Data
php artisan migrate --force --seed  # demo data + credentials below

# Quality gate before every commit
./vendor/bin/pint --dirty
./vendor/bin/phpunit    # PHP: 170+ tests
npm run test:js         # JS unit tests (Node's built-in --test runner, no framework)
```

Windows/WAMP first-run: `start-dev.bat` (or `.ps1`) handles composer install +
npm install --legacy-peer-deps + migrate --seed.

## Dev credentials

Seeded by `DemoPartnerSeeder` + `DemoFinancePartnerSeeder`. **Dev only** — never
in production.

| Role            | Email               | Password | Notes                              |
|-----------------|---------------------|----------|------------------------------------|
| System admin    | `admin@tfe.com`     | password | Full admin surface                 |
| Travel partner  | `partner@tfe.com`   | password | Serengeti Sports Travel            |
| Finance partner | `finance@tfe.com`   | password | Ecobank Fan Finance, blue #0072CE  |
| Demo fan        | `fan@tfe.com`       | password | Seeded ad-hoc; use for shots       |

Public hubs to demo: `/partners/serengeti-sports-travel`,
`/partners/ecobank-fan-finance`, and the directory at `/partners`.

---

## Architecture

### Three roles, one layout stack

- `FanLayout` → `RoleLayout` → `BaseLayout` → shared `DashboardHeader` + `DashboardHero`.
- `AdminLayout` and `PartnerLayout` do the same — same CSS stack loaded on all three
  (`fan/_shared.css` + `fan/dashboard.css` + `fan/fan-dashboard-cards.css` +
  `fan/fan-dashboard-header.css` + `fan/dashboard-header-extras.css` +
  `fan/dashboard-hero.css`). Role differences ride on `data-role` CSS variables.
- The landing template stylesheet only loads on public pages — the blade gate is
  in `resources/views/app.blade.php`. Never lift that gate; dashboards inherit
  weird body backgrounds if you do.
- **No inline styles** on shared components (DashboardHero, DashboardHeader,
  PoweredByBadge). Colour lives in CSS variables scoped by `data-role` or
  `--partner-accent`.

### Multi-tournament scoping

- `config/tournaments.php` is the source of truth. There is no Tournament model.
- `TournamentService` resolves/enriches the payload from config + `SiteSetting`
  overrides and caches it 24h. Use `->get($id)`, `->all()`, `->clearCache($id)`.
- The `ResolvesTournament` trait picks the active tournament id from
  session `active_tournament_id`. Every fan controller should use it.
- Multi-tournament scoped tables: `budgets`, `bookings`, `favorite_matches`,
  `tribes`, `fixtures`, `listings`. Each has a `tournament_id` column and a
  `forTournament($id)` model scope.

### Partners

Shipped across Sprints 9–17. Full loop:

1. **User** row with `is_partner=true` + `partner_type` (`travel_agent`,
   `finance_partner`, `airline`, `hotel_provider`, `destination`, `club`,
   `federation`, `event_organiser`, `sponsor`) + `verification_status`
   (`unverified` / `pending` / `verified`).
2. **PartnerProfile** 1:1 with User: `slug`, `display_name`, `tagline`, `about`,
   `hero_image`, `logo_url`, `theme_accent` (drives `--partner-accent` in
   every branded surface), `stats`, `service_tags`, contact fields, `is_public`.
3. **Public hub** at `/partners/{slug}` (`PartnerHubController::show`).
4. **Public directory** at `/partners` with search + partner_type + tournament
   filters (`PartnerHubController::index`, Sprint 11).
5. **Admin directory** at `/admin/partners` — verify, feature, edit the branded
   profile (`Admin/PartnerController`, Sprint 9).
6. **Admin approval queue** at `/admin/listing-approvals` for partner-authored
   listings (`Admin/ListingApprovalController`, Sprint 10).

### Listings (was: Packages)

Renamed in Sprint 9. `Listing` model backs `type = package | offer | event | tour`
with polymorphic `publisher_type + publisher_id` so both admin curation and
partner-authored listings live in one table. The legacy `App\Models\Package`
alias is registered at the bottom of `Listing.php`.

`moderation_status` field (Sprint 10): `draft | pending | approved | rejected`.
Fan-facing surfaces (PartnerHub grid, BudgetCalculator picker) filter to
`approved + active`. Admin approve/reject fires `ListingModerationNotification`.

`publisherSummary()` returns the compact `{slug, display_name, logo_url,
theme_accent, verified}` block that `PoweredByBadge` renders. Null for
admin-authored rows. Always eager-load with
`->with('publisher.partnerProfile')` when calling in a loop — it's N+1
without it.

### Finance-partner archetype (Sprint 14–16)

`finance_partner` users behave differently — their Convert queue is
`LoanApplication`s routed to them, not `Budget`s. `LoanApplication` now has
a nullable `finance_partner_id` FK to `users.id` with a scope
`forPartner($id)`. Controllers branch on `partner_type`:

- `Partner/DashboardController::index` — swaps to `indexFinance()`.
- `Partner/AnalyticsController::index` — swaps to loan tiles.
- `Partner/LoanReviewController` (Sprint 14) — separate route
  `/partner/loans/{id}` for the review flow. Enforces ownership.

Fan side: `FinanceThisTrip` CTA on `BudgetCalculator` step 3 (Sprint 14),
polished `/fan/loan-applications` (Sprint 15), `ActiveLoanTile` on the fan
dashboard (Sprint 16).

### Partner-type labels (Sprint 23)

The dashboard header badge, sidebar caption, and public-hub eyebrow all
adapt to the logged-in partner's `partner_type`. The mapping lives in
two places (keep them in sync):

- `resources/js/Components/Common/DashboardHeader.jsx` — `PARTNER_TYPE_LABEL`
  map + `resolveRoleLabel(role, base, user)` helper.
- `resources/js/Components/Partner/Sidebar.jsx` — same map, keyed by
  `user.partner_type`.
- `resources/js/Pages/PartnerHub.jsx` — `formatPartnerType()` strips a
  trailing `_partner` before title-casing so the eyebrow
  `Official {type} Partner` doesn't produce `Official Finance Partner Partner`
  for `finance_partner`.

### Currency (Sprint 23 + Sprint 28)

Listings and loans are USD platform-wide. The default in
`resources/js/lib/utils.js`:

```js
export function formatMoney(amount, currency = 'USD') { … }
```

is the single source of truth — 74 downstream callers rely on it.
Guarded by `tests/JS/currency.test.mjs`.

**Sprint 28 — multicurrency budgets.** The Budget Calculator lets the fan
pick a display currency (USD, EUR, GBP, KES, ZAR, NGN, XOF). The
engine still computes in USD; `getRateForCurrency(pricing, code)` in
`resources/js/Data/BudgetPricingData.js` converts once at render (a
tournament may override any rate via `pricing.exchange_rates`).
Persisted on `budgets.currency` (default USD) and echoed back on the
Journey/Saved-plans surfaces so a fan reopening a plan sees the same
amount they saved. Guarded by `tests/Feature/Fan/BudgetCurrencyTest.php`
and `tests/JS/exchangeRate.test.mjs`.

### Notifications

All notifications use `via: ['database']` only (SMTP not configured; adding
`mail` fires errors in the approval flow). The approval-flow notifications
implement `ShouldQueue` (Sprint 21) so a bulk moderation of 200 listings
doesn't block the request on 200 sequential DB inserts.

- **Dev** (`.env.example`): `QUEUE_CONNECTION=sync` — notifications fire
  inline, no worker needed.
- **Prod**: `QUEUE_CONNECTION=database` + a running `php artisan queue:work`
  so the fan-out actually processes.

Shape read by `DashboardHeader.jsx`:

```php
[
    'title'      => '…',              // headline
    'body'       => '…',              // one-line description
    'icon'       => 'fas fa-…',       // FontAwesome class
    'action_url' => route('…'),       // clicking the row navigates here
    'type'       => 'domain_slug',    // for filtering later
    // … domain-specific payload
]
```

Current notifications:

- `ListingModerationNotification` → partner, on admin approve/reject.
- `BudgetResponseNotification` → fan, on travel partner budget response.
- `LoanStatusNotification` → fan, on finance partner loan decision.
- Legacy: `PaymentSuccessNotification`, `LoginAlertNotification`, etc.

`HandleInertiaRequests` exposes `auth.notifications` (last 5) + `auth.unreadNotificationsCount`
to every page as lazy Inertia props. The bell dropdown in `DashboardHeader.jsx`
reads them directly.

## Directory conventions

```
app/
  Http/Controllers/
    Fan/…      # /fan/* prefixed routes
    Admin/…    # /admin/* prefixed routes
    Partner/…  # /partner/* prefixed routes
  Models/…
  Notifications/…
  Services/…
  Traits/…     # ResolvesTournament, TournamentAware, …

resources/
  css/
    fan/       # ALL role dashboards load these (fan/admin/partner)
    admin-theme.css   # admin-only utility layer on top of fan CSS
    partner/  # partner-only overrides on top of fan CSS
  js/
    Components/
      Common/  # role-agnostic primitives (StatCard, DashboardHero,
               #   PoweredByBadge, MetricTile, CapacityBar, TournamentPill,
               #   TournamentSwitcher, DashboardHeader, HeaderDropdown)
      Fan/     # fan-only pieces (PackagePicker, FinanceThisTrip,
               #   ActiveLoanTile, ItineraryMap, StadiumSeatMap, …)
      Admin/   # admin sidebar, toolbar, category card
      Partner/ # partner sidebar, LoanReviewPanel
    Layouts/
      BaseLayout.jsx     # SidebarProvider + Toaster + CommandMenu
      RoleLayout.jsx     # factory used by FanLayout/AdminLayout/PartnerLayout
      FanLayout.jsx AdminLayout.jsx PartnerLayout.jsx GuestLayout.jsx
    Pages/     # Inertia components, named to match controller returns
              #   ('Fan/Dashboard', 'Admin/Settings', 'Partner/Listings', …)

database/
  factories/ListingFactory.php   # NOTE: renamed from PackageFactory in Sprint 13
                                  # — Listing::factory() resolves via HasFactory default.
  seeders/DatabaseSeeder.php     # picks up DemoPartnerSeeder + DemoFinancePartnerSeeder

tests/
  Feature/Fan/…  Partner/…  Admin/…  # role-scoped
  Feature/…                          # cross-role (PartnersDirectoryTest, PublisherSummaryTest,
                                     #   FinancePartnerTest, ApprovalNotificationsTest,
                                     #   SecurityHardeningTest)
  JS/currency.test.mjs               # Node --test runner, no framework
```

## Testing conventions

- `Illuminate\Foundation\Testing\RefreshDatabase` trait on every feature test —
  we run against SQLite in tests.
- `User::factory()->partner()->create(['partner_type' => 'finance_partner'])` is
  the standard partner setup. Add a `PartnerProfile` with `is_public => true` if
  the test hits `/partners` or public hubs.
- `Listing::factory()` (not `Package`) — the factory class was renamed in
  Sprint 13.
- Assertions on Inertia render: `->viewData('page')['props']`.
- `Notification::fake()` before controller calls, then
  `Notification::assertSentTo($user, X::class, fn ($n) => …)`.

## What NOT to do (learned the hard way)

- Never inline the accent colour into JSX on a shared component — put it on
  `data-role` or `--partner-accent` and let the CSS handle it.
- Never load `new-landing-template/assets/css/styles.css` on a dashboard —
  it clobbers header + body backgrounds.
- Never call `Listing::factory()` before `HasFactory` sees a
  `Database\Factories\ListingFactory` class — the file was renamed for a
  reason.
- Never add a `mail` channel to notifications without confirming SMTP is set
  up — the approval flow currently 500s if you do.
- Never bare-type `Package` in a controller — the legacy alias only helps
  route model binding, not PHP type resolution inside a namespaced file.
- Never accept SVG in an `image` file validator — Laravel's `image` rule
  includes SVG and same-origin storage makes it a stored-XSS vector.
  Explicit `mimes:jpg,jpeg,png,webp` on every uploader (Sprint 22).
- Never flip `formatMoney`'s default without a deliberate audit — 74 callers
  read the default currency, only one passes explicit `USD`/`KES`. The
  `tests/JS/currency.test.mjs` guard fails loudly if the default drifts.
- Never hard-code a partner label — a `finance_partner` account seeing
  "TRAVEL PARTNER" in the header is embarrassing on demo day. Read from
  `PARTNER_TYPE_LABEL` in both `DashboardHeader.jsx` and
  `Partner/Sidebar.jsx` (Sprint 23).

## Sprint log (very short)

| Sprint | Theme                                               |
|--------|-----------------------------------------------------|
| 1–2    | Multi-tournament scoping, caching, DRY consolidation |
| 3      | Prepacked packages (admin CRUD + fan picker)         |
| 4      | Signature features — seat map, cost chart, weather, compare widget |
| 5      | Multi-city itinerary map, per-tournament overrides   |
| 6      | Tribes per tournament, first-run scripts             |
| 7      | Package demo data, fan detail page, admin analytics  |
| 8      | Shared primitives (TournamentPill, CapacityBar, MetricTile) |
| 9      | Partner archetype: PartnerProfile, hubs, admin directory. Listing rename |
| 10     | Partner Publish/Convert/Measure tabs + admin approvals |
| 11     | Fan-side `/partners` directory                       |
| 12     | Powered-by cross-linking on listings                 |
| 13     | Feature tests for 10–12 (ListingFactory rename)      |
| 14     | Finance-partner archetype (Ecobank hub, loan queue)  |
| 15     | Fan "My Financing" surface                           |
| 16     | Active-loan tile on the fan dashboard                |
| 17     | Notifications on approvals + loan decisions          |
| 18     | CLAUDE.md + README refresh                           |
| 19     | Bulk approve/reject on admin listing queue           |
| 20     | Sprint-19 review fixes + KES → USD polish            |
| 21     | Queue notifications (ShouldQueue) + Financing empty state |
| 22     | Security review fixes (SVG upload + Fan/PackageController gate) |
| 23     | Currency default + partner_type labels + hub eyebrow polish |
| 24     | Node currency test + docs refresh                    |

Full detail in commit history on `claude/brave-newton-o8w4u0`.
