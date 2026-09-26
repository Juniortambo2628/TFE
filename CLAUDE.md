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

Seeded by `DemoPartnerSeeder` + `DemoFinancePartnerSeeder` +
`DemoExtraPartnersSeeder`; placeholder partner offerings by
`DemoPartnerOfferingsSeeder`. **Dev only** — never in production.

| Role            | Email               | Password | Notes                              |
|-----------------|---------------------|----------|------------------------------------|
| System admin    | `admin@tfe.com`     | password | Full admin surface                 |
| Travel partner  | `partner@tfe.com`   | password | Serengeti Sports Travel            |
| Finance partner | `finance@tfe.com`   | password | Ecobank Fan Finance, blue #0072CE  |
| Airline partner | `airline@tfe.com`   | password | Simba Air (`airline`), red #dc2626 |
| Betting partner | `betting@tfe.com`   | password | GoalBet (`sponsor`), green #16a34a |
| Ticketing partner | `ticketing@tfe.com` | password | MatchDay Africa (`ticketing_partner`), violet #8b5cf6 |
| Demo fan        | `fan@tfe.com`       | password | Seeded ad-hoc; use for shots       |

Public hubs to demo: `/partners/serengeti-sports-travel`,
`/partners/ecobank-fan-finance`, `/partners/simba-air`,
`/partners/goalbet`, and the directory at `/partners`.

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

**Sprint 42 — partner listings no longer go through review.** A partner saving
a listing (`Partner/ListingController::store`) publishes it immediately:
`moderation_status = approved`, and `is_active` (the Published/Hidden toggle,
route `partner.listings.toggle`) is the partner's own visibility switch. The
create/edit form (`Partner/Listings.jsx`, in a `TfeModal`) is contextual by
`type` — trip fields (nights/flight_class/accommodation) only show for
Package/Tour and are `required_if:type` server-side; the default type is
seeded from `partner_type` (`DEFAULT_TYPE` map). The admin approval queue
(`/admin/listing-approvals`) still exists and works, but partner-authored rows
no longer land there by default.

`publisherSummary()` returns the compact `{slug, display_name, logo_url,
theme_accent, verified}` block that `PoweredByBadge` renders. Null for
admin-authored rows. Always eager-load with
`->with('publisher.partnerProfile')` when calling in a loop — it's N+1
without it.

### Tribes (completed Sprint 48)

Fan communities, scoped per tournament (`tournament_id` nullable — NULL means
"open to fans of every tournament"). Models: `Tribe`, `TribeMember`,
`TribePost`, `TribePostReply`, `TribeJoinRequest`.

**Privacy is enforced, not decorative.** Until Sprint 48 `join()` added the
member regardless of privacy, so "Private (Approval required)" and "Invite
Only" let anyone straight in. Now:

| privacy       | read              | join                                   |
|---------------|-------------------|----------------------------------------|
| `public`      | anyone            | immediate                              |
| `private`     | members only      | `TribeJoinRequest` → admin approves    |
| `invite_only` | members only      | admin adds them; a fan cannot even ask |

A tribe the fan may not read renders `Fan/TribeLocked` (with the request form
where applicable) instead of `back()`, which used to dump anyone following a
shared link at the site root with no explanation.

Other things to know:

- **`syncCounts()` owns `member_count` + `posts_count`.** They are columns the
  tribe cards read directly, and they were maintained with `increment()` in one
  place and not at all in others — creating a discussion never touched
  `posts_count`, so every card read "0 posts" forever. Always go through
  `addMember` / `removeMember` / `syncCounts`, never `increment()` by hand.
- **The last admin cannot leave** — promote someone first, or the tribe becomes
  unmanageable. Platform admins (`user.is_admin`) can always manage a tribe.
- **The owner cannot be demoted or removed**, and only the owner (or a platform
  admin) can delete a tribe.
- **`view_count` is counted on `showPost`**, once per reader per session. It
  used to be incremented when someone *replied*, which measured nothing.
- `Fan/TribePost` is the full thread page — the tribe page shows the first
  three replies and links here for the rest.
- `TribeAlert` is the notification (database channel, queued). Its payload uses
  the `title`/`body`/`icon`/`action_url` shape `DashboardHeader.jsx` reads; the
  old one used a `message` key the bell never rendered.
- Do NOT reintroduce a `getRepliesCountAttribute()` accessor on `TribePost` — an
  accessor of that name shadows the column `withCount('replies')` adds, so every
  listing silently ran one COUNT per post despite eager-loading it.

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

**Sprint 28–30 — multicurrency, end-to-end.** The Budget Calculator
lets the fan pick a display currency (USD, EUR, GBP, KES, ZAR, NGN,
XOF); the engine still computes in USD;
`getRateForCurrency(pricing, code)` in `resources/js/Data/BudgetPricingData.js`
converts once at render (a tournament may override any rate via
`pricing.exchange_rates`). The pick is persisted on:

- `budgets.currency` (Sprint 28) — restored when the fan reopens a plan.
- `bookings.currency` (Sprint 29) — copied from the budget on
  `BudgetController::confirm`; Fan/Journey renders every row in it.
- `savings_goals.currency` (Sprint 30) — per-goal picker; Fan/SavingsGoals
  totals fall back to the primary goal's currency.

Loans stay USD platform-wide (the truth is one number in one currency);
`Fan/LoanApplications` still formats `loan.amount` explicitly as USD but
now formats `loan.budget.total_cost` in the attached budget's currency
so a EUR-built request reads correctly. Guarded by
`tests/Feature/Fan/BudgetCurrencyTest.php`,
`tests/Feature/Fan/BookingCurrencyTest.php`,
`tests/Feature/Fan/SavingsGoalCurrencyTest.php`, and
`tests/JS/exchangeRate.test.mjs`.

### Tournament management (Sprint 49)

Everything about a tournament lives under **Admin → Tournaments**
(`Admin/TournamentController`, `Admin/Tournaments.jsx` +
`Admin/TournamentEdit.jsx`), in the same index → edit shape as the partner
directory. It used to be split three ways: a tab of Site Settings (featured
pick, Wikipedia refresh, tagline, accent, trophy, hero background), a tab of
Content Management (stadium imagery), and — for the organiser card watermark —
nowhere at all, despite `TournamentService` reading it.

`TournamentController::FIELD_KEYS` is the single source of truth for the
override keys and **must stay in step with `TournamentService::loadOverrides()`**:

| field               | SiteSetting key              |
|---------------------|------------------------------|
| `tagline`           | `tournament_tagline_{id}`    |
| `accent`            | `tournament_accent_{id}`     |
| `trophy_image`      | `tournament_trophy_{id}`     |
| `hero_image`        | `hero_bg_{id}`               |
| `organizer_card_bg` | `tournament_card_bg_{id}`    |

An empty value means "fall back to config", which is how every reader treats
it. Saving clears both the tournament payload cache and the stadium-image
cache.

**`TournamentService::get()` falls back to the default tournament for an
unknown id**, so it can never double as an existence check — ask
`config("tournaments.tournaments.{$id}")` directly (the controller's
`exists()` helper).

### Notifications

All notifications use `via: ['database']` only (SMTP not configured; adding
`mail` fires errors in the approval flow). The approval-flow notifications
implement `ShouldQueue` (Sprint 21) so a bulk moderation of 200 listings
doesn't block the request on 200 sequential DB inserts.

- **Dev** (`.env.example`): `QUEUE_CONNECTION=sync` — notifications fire
  inline, no worker needed.
- **Prod**: `QUEUE_CONNECTION=database` + a running `php artisan queue:work`
  so the fan-out actually processes. See **Production queue worker** below
  for a supervisor recipe and its Windows equivalent.

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

## Passkey sign-in (WebAuthn)

`laragear/webauthn` v4. Both endpoints share the URI `webauthn/login` (GET =
challenge, POST = assertion), which is why a browser console only ever says
"webauthn/login" when either fails.

- **Laragear's assertion pipeline only catches `AssertionException`.** Anything
  else escaped as a bare 500 with nothing logged and nothing shown to the fan.
  The most reachable case: `webauthn_credentials.public_key` is an `encrypted`
  cast, so a credential stored under a different `APP_KEY` throws
  `DecryptException` on every attempt. `WebAuthnLoginController` now translates
  any unexpected throw into a 422 the client can render and logs the real cause
  to `storage/logs/laravel.log`; an undecryptable credential is disabled so it
  cannot 500 again, and the fan is told to re-register it.
- **Never answer a passkey login with `noContent()`.** Inertia cannot navigate
  on a 204, so the session was established and the fan stayed parked on the
  login screen. It returns `redirect()->intended(...)` like the password flow.
- **A passkey is one factor.** Both login paths share
  `App\Traits\HandlesPostLogin` (two-factor gate, login history,
  role-based landing) so they cannot drift apart again — the passkey route
  used to skip 2FA entirely.
- `webauthn_credentials.id` is **VARCHAR(510)**, matching Laragear's own
  migration. Ours capped it at 191, and a credential ID is authenticator-chosen
  and routinely longer once base64url-encoded — on MySQL that truncated or
  errored, after which the browser's full-length ID matched no stored row.

Regression coverage: `tests/Feature/Auth/WebAuthnLoginTest.php` builds real
ECDSA assertions rather than fixtures.

## Production queue worker

`QUEUE_CONNECTION=database` on prod means every `ShouldQueue`
notification (`ListingModerationNotification`, `BudgetResponseNotification`,
`LoanStatusNotification`, plus anything future) is pushed to the
`jobs` MySQL table and waits for a worker to drain it. Without a
worker the table grows forever and fans never see the in-app bell
update.

### Linux / production (supervisor)

Install supervisor once:

```bash
sudo apt-get install -y supervisor
```

Add `/etc/supervisor/conf.d/tfe-worker.conf`:

```ini
[program:tfe-queue-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/tfe/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/tfe/worker.log
stopwaitsecs=3600
```

Notes:
- `numprocs=2` — two workers is plenty for TFE's notification volume;
  bump only if bulk moderation of hundreds of listings backs up the queue.
- `--max-time=3600` and `stopwaitsecs=3600` — Laravel workers hold DB
  connections open; recycle every hour so long-running memory /
  connection leaks self-heal.
- Log path: create it (`sudo mkdir -p /var/log/tfe && sudo chown www-data:www-data /var/log/tfe`)
  before starting supervisor or it silently fails.

Then:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start tfe-queue-worker:*
sudo supervisorctl status
```

After every deploy that touches queued jobs, restart the workers so
they pick up new code:

```bash
php artisan queue:restart
```

### cPanel shared hosting (cron worker)

Shared cPanel plans can't run supervisor, but they always run cron.
Two entries in **cPanel → Cron Jobs** cover the scheduler and the
queue worker:

```
* * * * * cd $HOME/tfe && /usr/bin/php artisan schedule:run   >> /dev/null 2>&1
* * * * * cd $HOME/tfe && /usr/bin/php artisan queue:work --stop-when-empty --max-time=55 >> /dev/null 2>&1
```

- `--stop-when-empty` lets the worker exit cleanly once the queue is
  drained.
- `--max-time=55` guarantees it exits before the next minute-tick so
  we never overlap workers.
- `cron` respawns it in the following minute, so it feels like a
  daemon without needing one.

Deploy step is `bash deploy/cpanel-deploy.sh` in the cPanel Terminal —
it runs migrations, `config:cache`, `route:cache`, `view:cache`, and
`queue:restart`. Idempotent, safe to re-run.

**Do not run `php artisan storage:link` on cPanel.** cPanel disables
PHP's `exec()` in `disable_functions`, and Laravel's `storage:link`
shells out on some code paths — so it errors with `Call to undefined
function Illuminate\Filesystem\exec()`. Use `ln -s` directly instead;
the GitHub Actions `post-deploy.sh` already does this.

**The frontend docroot is the domain's OWN directory, NOT `public_html`.**
Each site on this cPanel is an addon domain with its own docroot, so
tfe.okjtech.co.ke serves from `~/tfe.okjtech.co.ke` (this is the
`FRONTEND_PATH` deploy secret), and `public_html` belongs to a *different*
site — never symlink tfe storage into `public_html`. The Laravel app root
is `~/tfe-core` (`BACKEND_PATH`). If you ever need to recreate the symlinks
manually (`ln -sfn` also repoints a stale/incorrect one; use your real
home path):

```bash
DOCROOT=~/tfe.okjtech.co.ke   # FRONTEND_PATH — the domain's docroot
APP=~/tfe-core                # BACKEND_PATH — the Laravel app root

# Frontend — this is what serves /storage/*.jpg to browsers.
ln -sfn "$APP/storage/app/public" "$DOCROOT/storage"

# Backend — public_path('storage/…') resolution for internal reads.
ln -sfn "$APP/storage/app/public" "$APP/public/storage"
```

If an old, incorrect `public_html/storage` symlink is lying around from a
previous setup, remove it: `rm -f ~/public_html/storage` (only if it's a
symlink and `public_html` isn't tfe's docroot).

Live-bell via Reverb is **not viable on shared hosting** — it needs a
persistent PHP process + WebSocket upgrade support, both of which
shared cPanel almost never allows. The Sprint 35 client code stays
harmless (empty `VITE_REVERB_APP_KEY` short-circuits Echo), so the
bell just fills on page navigation instead. For a live-bell on
cPanel, sign up for **hosted Pusher** (free tier: 100 concurrent
connections, 200k msgs/day) — the app already speaks the Pusher
protocol, so you only need to flip `BROADCAST_CONNECTION=pusher`
and fill the `PUSHER_*` block.

### Windows / WAMP prod (Task Scheduler)

WAMP hosts don't ship supervisor. Two options in order of preference:

1. **Winsw / NSSM** — wrap `php artisan queue:work` as a Windows
   service. Winsw is a single XML config; NSSM is a `nssm install`
   wizard. Either survives reboots and auto-restarts on crash.

2. **Task Scheduler** — create a task that runs at server startup:
   - Program: `C:\wamp64\bin\php\php8.3\php.exe`
   - Arguments: `artisan queue:work --sleep=3 --tries=3 --max-time=3600`
   - Start in: `C:\wamp64\www\TFE`
   - Trigger: **At startup**
   - Settings: **Restart if the task fails**, every 1 minute, up to 999 attempts.

   Add a second task on the same trigger for `queue:restart` — or a
   scheduled `php artisan queue:restart` after every deploy — so
   new code lands after each push.

### Health check

- `SELECT COUNT(*) FROM jobs WHERE reserved_at IS NULL` — should
  hover near 0. If it climbs, the worker's dead.
- `SELECT * FROM failed_jobs ORDER BY id DESC LIMIT 20` — reasons a
  job actually failed. `php artisan queue:retry all` re-queues them.

### If you can't run a worker at all

Flip the .env back to `QUEUE_CONNECTION=sync`. Notifications
serialize inside the request that triggered them; a bulk moderation
of 200 listings will take ~30s to submit but every fan gets the bell
update. This is what dev uses.

## Real-time broadcast (Sprint 35)

Live-bell notifications ship via **Laravel Reverb** (Pusher-protocol,
self-hosted, no third-party bill). All three approval notifications
(`ListingModerationNotification`, `BudgetResponseNotification`,
`LoanStatusNotification`) list `broadcast` alongside `database` in
their `via()` array; the client picks them up on the private user
channel and pushes them into the bell dropdown + fires a toast.

### Why Reverb, not Pusher

Reverb ships in the Laravel 11+ core, speaks the exact Pusher wire
protocol (`pusher-js` on the client is unchanged), and runs alongside
PHP-FPM on your own box — no per-connection quota, no monthly bill.
Swap to hosted Pusher by setting `BROADCAST_CONNECTION=pusher` and
supplying the `PUSHER_*` env vars; nothing else in the app changes.

### Fresh install / redeploy

1. **Server-side install** — done once:
   ```bash
   composer require laravel/reverb
   php artisan reverb:install    # publishes config/reverb.php + channels.php
   ```
2. **Client packages** — done once:
   ```bash
   npm install --legacy-peer-deps laravel-echo pusher-js
   ```
3. **Env vars** — set on the prod server:
   ```
   BROADCAST_CONNECTION=reverb
   REVERB_APP_ID=<generate uuid>
   REVERB_APP_KEY=<random 20+ chars>
   REVERB_APP_SECRET=<random 40+ chars>
   REVERB_HOST=tfe.okjtech.co.ke
   REVERB_PORT=443
   REVERB_SCHEME=https

   VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
   VITE_REVERB_HOST="${REVERB_HOST}"
   VITE_REVERB_PORT="${REVERB_PORT}"
   VITE_REVERB_SCHEME="${REVERB_SCHEME}"
   ```
   Empty `VITE_REVERB_APP_KEY` on the build short-circuits Echo, so
   dev + tests without a running Reverb server pay zero cost and
   never open a phantom WebSocket.

### Running the Reverb server

Reverb is a long-running PHP process. Same supervisor pattern as the
queue worker (see **Production queue worker** above):

```ini
[program:tfe-reverb]
process_name=%(program_name)s
command=php /var/www/tfe/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/tfe/reverb.log
stopwaitsecs=10
```

Numprocs stays at 1 — Reverb's whole model is one process holding
many sockets; scaling is horizontal (multiple boxes behind a
load-balancer with sticky sessions), not multi-process on one box.

### Nginx front (TLS termination + WebSocket upgrade)

Reverb listens plain HTTP on `:8080`; nginx handles TLS and proxies
`/app/**` (the WebSocket path pusher-js uses) into it:

```nginx
location /app/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 60m;
    proxy_send_timeout 60m;
}
```

Do NOT proxy anything else at `/app/` unless you rename Reverb's
prefix — it collides with any app route under the same segment.

### Channel auth

`routes/channels.php` ships one callback out of the box:

```php
Broadcast::channel('App.Models.User.{id}', fn ($user, $id) => (int) $user->id === (int) $id);
```

That's what Laravel's `Notifiable` trait broadcasts to when a
notification lists `broadcast` in `via()`, and it's exactly what
`DashboardHeader.jsx` subscribes to. Add channels here for anything
new (`Broadcast::channel('tribe.{id}', …)` for live tribe posts, etc.).

### Client side

`resources/js/bootstrap.js` wires `window.Echo` lazily — only when
`VITE_REVERB_APP_KEY` is set on the build. `DashboardHeader.jsx`
subscribes on mount and pushes each `notification` payload onto the
bell dropdown state; a sonner toast fires alongside the bell so the
user sees the update even when the dropdown is closed.

### Health check

- `curl https://tfe.okjtech.co.ke/app/<REVERB_APP_KEY>` should
  return a JSON handshake, not a 502.
- Browser devtools → Network → WS → the connection stays open with
  a green `101 Switching Protocols`.
- Send a fake notification from tinker:
  ```php
  $u = App\Models\User::find(1);
  $u->notify(new App\Notifications\ListingModerationNotification(
      App\Models\Listing::first(), 'approved'
  ));
  ```
  The bell on the fan's browser should update within ~200ms.

### If Reverb is down

`BROADCAST_CONNECTION=log` is the safe fallback — broadcasts land in
`storage/logs/laravel.log` instead of a WebSocket. Notifications
still hit the `database` channel so the bell dropdown fills on the
next page navigation. No user-visible break, just no live updates.

## Primitives (Sprint 33 + 39)

Hand-written CSS classes live in `resources/css/primitives.css`, tokens
in `resources/css/design-tokens.css`. Reach for these before writing
new card / table / list CSS:

- **`.tfe-tile`** — the stat tile with gradient wash + optional icon.
  Variants: `--red / --rose / --blue / --cyan / --teal / --amber /
  --violet / --graph`. Layout children: `.tfe-tile__head`,
  `.tfe-tile__icon`, `.tfe-tile__value`, `.tfe-tile__label`,
  `.tfe-tile__subtext`. Grid wrapper: `.tfe-stat-grid`.
- **`.tfe-slab`** — glass content card. Layout: `.tfe-slab__header`,
  `.tfe-slab__title`, `.tfe-slab__title-sub`, `.tfe-slab__body`
  (add `--flush` for zero padding).
- **`.tfe-pill`** — chip / badge. Variants: `--live / --upcoming /
  --concluded / --pending / --approved / --rejected / --info`.
  Use `a.tfe-pill` when it's a link.
- **`.tfe-sidebar-nav-item`** — sidebar link (used by AppSidebar). Heading
  buckets in `menuItems` (`{ heading: 'Content' }`) render as **collapsible
  groups** (`.tfe-sidebar-group*`, Sprint 50); open state persists per role in
  localStorage and the active group auto-opens. Items before the first heading
  stay ungrouped and always visible, so heading-less sidebars (fan/partner)
  render flat as before.
- **`.tfe-quick-action`** — Quick Actions grid tile (used by
  QuickActionsGrid). Wrapper: `.tfe-quick-actions-grid`.
- **`.tfe-table`** (Sprint 39) — the shared table treatment. Wrap
  in `.table-responsive` on mobile. Add `--compact` for
  dashboard-embedded tables.
- **`.tfe-empty`** (Sprint 39) — empty-state block: circular
  `.tfe-empty__icon`, `.tfe-empty__title`, `.tfe-empty__body`,
  optional `.tfe-empty__action`. Compact inline variant:
  `.tfe-empty--inline`.
- **`.tfe-btn`** (Sprint 40) — the ONE button pattern. Two variants
  only: default (dark glass pill with white ink) or `--filled`
  (solid white pill with black ink, reserved for the single
  strongest CTA per surface). Sizes: default / `--sm` / `--lg`.
  Icon-only round: `--icon`. Toggle-on: add `is-active` or
  `aria-pressed="true"` (inverts to filled). **No colourful button
  variants** — category colour belongs on `.tfe-pill`, not on
  buttons. Case is title-case at the callsite; the primitive
  never `text-transform`s.
- **`.tfe-input`, `.tfe-select`, `.tfe-textarea`** (Sprint 40) —
  the shared form field family. Same tokens as `.tfe-btn` so a
  form and its submit share visual weight. Size modifier `--sm`
  for inline filter rows. Helpers: `.tfe-form-label`,
  `.tfe-form-help`, `.tfe-form-error`, `.tfe-form-field` (vertical
  stack, standard 16px gap between fields), `.tfe-form-section`
  (a titled divider inside a form), `.tfe-color-swatch`, `.tfe-check`.
  A global `-webkit-autofill` guard (primitives.css) keeps Chrome/Safari
  from painting login-ish fields white over the dark fill.
- **`assetPath()`** (Sprint 49, `resources/js/lib/assets.js`) — normalises any
  stored image reference to a root-relative URL. `AccentCard`, `PageHero`,
  `LandingCard` and `DashboardHero` all run their `src` through it, so a
  relative path is corrected whoever passes it. See **Image paths** below.
- **`SettingField`** (Sprint 49, `Components/Admin/SettingField.jsx`) — the ONE
  self-saving SiteSetting editor (text / textarea / url / color / **image**).
  `type="image"` renders `ImageUpload` with a live preview and a reset. Never
  declare a setting-input closure inside a page body again — a component
  defined there is a new type every render, so React remounts it and the field
  loses its cursor mid-typing.
- **`ListingGrid`** (Sprint 45) — grid is the default view; pass `tableView`
  to get the Grid/Table toggle. Adopted by Partners, Listing safety, Tickets,
  Users, Events, Prizes, Announcements, Tribes, Tournaments and Content→Posts.
  Reach for it instead of hand-rolling a `<table>` or a bespoke card grid.
- **`.tfe-rank`** (Sprint 48) — circular position chip for standings rows.
  `data-medal="1|2|3"` paints gold / silver / bronze; anything else stays
  neutral glass. Used by the Predict leaderboard and the feed's Trending list.
  Companions: `.tfe-leaderboard*`, `.tfe-prize*`, `.predict-match`.
- **`.tfe-pill--standalone`** (Sprint 48) — add to any `.tfe-pill` that is a
  direct child of a flex-column container, or `align-items: stretch` turns it
  into a full-width colour bar.
- **`TfeModal`** (Sprint 42, `Components/Common/TfeModal.jsx`) — the ONE
  shared dashboard dialog. Centered glass panel (`.tfe-modal*`), Escape +
  click-outside to close, `size="sm|md|lg"`. Every create/edit form on the
  dashboards (partner listing form, partner Profile editor) renders through
  it — don't hand-roll a new overlay.
- **`ImageUpload`** (Sprint 42, `Components/Common/ImageUpload.jsx`) — file
  picker with live preview (`.tfe-image-upload*`), replacing bare "image URL"
  text fields. Accepts jpg/png/webp only (matches the server
  `mimes:jpg,jpeg,png,webp` rule). Parent posts the File with
  `forceFormData`; the controller stores it and keeps the string field as a
  fallback for existing URLs.

### Global form baseline (Sprint 48)

`@tailwindcss/forms` runs with **`strategy: 'class'`** (tailwind.config.js). In
its default "base" strategy it rewrote every `[type="text"]`, `<select>` and
`<textarea>` with a **solid white background**, so any field that had not opted
into `.tfe-input` rendered as a white box on the dark canvas. Adding
`.tfe-input` one field at a time only fixed the fields someone noticed.

`resources/css/form-baseline.css` (imported from `app.css` between the tokens
and the primitives) is now the platform default for every form control. It is
deliberately kept at **element specificity (0,0,1)**, so it is a floor and
never a ceiling — `.tfe-input` (0,1,1), `.admin-form-input` (0,1,0), the
landing template's own field classes and any Tailwind utility all still win.

**Do not raise the specificity in that file and do not reach for `!important`.**
If a field needs a different look, give it a class. There is an escape hatch
(`.tfe-field-native`) for the rare control that wants the browser widget.

### Image paths (Sprint 49)

**Every stored image path must be absolute or root-relative.** A bare
`assets/img/x.jpg` is resolved by the browser against the CURRENT directory,
so the moment it renders on a nested route it asks for the wrong URL:

```
on /                → /assets/img/backdrops/ball-on-field.jpg        ✓
on /admin/content   → /admin/assets/img/backdrops/ball-on-field.jpg  ✗ 404
```

That is exactly why the three tournament backdrops 404'd on admin pages and
nowhere else. `config/tournaments.php` and `config/site_sections.php` now
store leading-slash paths, and two tests guard the catalogues
(`TournamentManagementTest::test_config_tournament_images_are_root_relative`,
`ContentCmsTest::test_config_card_images_are_root_relative`).

Belt and braces: `assetPath()` (`resources/js/lib/assets.js`) corrects a
relative value at render time, and the shared image primitives all run their
`src` through it. Do NOT re-add per-component `toUrl` helpers or
`baseUrl + path` concatenation — `PageHero` and `LandingCard` each had their
own copy before this, and `assetUrl` (which is absolute) then produced `//`
double slashes once the config paths were fixed.

### Media library + global image pipeline (Sprint 50)

Every upload platform-wide funnels through **`App\Services\MediaLibraryService`**:

- **Compression is global, server-side.** `store()` reads raster images with
  Intervention Image (GD driver, `intervention/image` v3), scales them down to
  a 1920px longest edge and re-encodes at quality 82 before they touch disk.
  Optimization is wrapped in try/catch — if GD lacks an encoder (e.g. AVIF on
  some builds) it falls back to the original bytes rather than failing the
  upload. GIF and video are stored as-is (no re-encode, so animation survives).
- **Every stored file is recorded** as a `MediaAsset` row, so the same photo is
  re-pickable from the gallery instead of re-uploaded.
- **Accepted types live here once** — `IMAGE_MIMES`/`VIDEO_MIMES` +
  `imageRules()`/`mediaRules()`/`imageAccept()`/`mediaAccept()`. The client
  mirror is `resources/js/lib/media.js` (`MEDIA_ACCEPT`); keep the two in step.
  Raster set = jpg/jpeg/png/webp/gif/avif; media adds mp4/webm. **SVG stays
  excluded** (same-origin /storage → stored-XSS).
- **`Uploadable::uploadFile()` and `ContentController::updateSettings` both
  delegate here**, so optimization + the library come for free to every
  existing uploader. `uploadFile()` still returns the storage-relative path its
  callers persist.

**Admin → Media** (`Admin/MediaController`, `Admin/Media.jsx`) is the gallery:
multi-upload, ListingGrid of assets, delete. The **`MediaPicker`**
(`Components/Common/MediaPicker.jsx`) is the shared "choose from library"
dialog, wired into `ImageUpload` behind a `gallery` prop and enabled on every
CMS image field via `SettingField`. Picking an asset saves its URL as a plain
string value (no re-upload) — exactly the legacy stored-path behaviour, which
`assetPath()` already resolves at render. `admin.media.list` is the JSON feed
the picker reads (`kind=image` keeps a background picker from offering videos).

### Public section cards (Sprint 49)

The content cards under each public section hero (`/about`, `/features`,
`/services`, `/contact`) used to be hard-coded arrays inside the React
components, so an admin could edit a section's hero from the CMS but not the
cards beneath it. Defaults now live in `config/site_sections.php`;
`HomeController::sectionCards()` overlays SiteSetting overrides keyed
`section_card_{slug}_{index}_{field}` (field ∈ image, title, subtitle,
description) and passes them as the `cards` prop.

The components keep their constant as a **default prop value** so the landing
sections still render when no `cards` are passed — keep it in step with the
config if you change either.

### PurgeCSS safelist gotcha

`postcss.config.js` runs `@fullhuman/postcss-purgecss` in prod
builds only. Its default extractor mangles JSX template literals,
so any class used via ``` `foo-${bar}` ``` gets stripped from prod
CSS while surviving in dev. The safelist covers every custom class
prefix in `resources/css/` (see `postcss.config.js`). If you add a
new prefix, add it to the safelist — a class-name pattern that
only appears inside template literals will silently vanish on prod
otherwise.

## Public section pages + heroes (post-Sprint 30)

The landing page was split to stay light. `About`, `Features`, `Services`,
`News` and `Contact` are no longer rendered on `Home` — each lives on its
own public route (`/about`, `/features`, `/services`, `/news`, `/contact`,
`HomeController@{name}`) and the nav links point there. The news **JSON
API moved to `/api/news`** (route name kept as `news.index`, so
`route('news.index')` is unchanged) to free the `/news` URL for the page.

- **`SectionPageShell`** (`Components/Landing/`) is the shared chrome:
  header + `PageHero` + the section component + footer + cookie consent.
- **`PageHero`** (`Components/Common/`) reuses the partner-hub hero CSS
  (`.partner-hub-hero` + `.page-hero*` in `partner-hub.css`) — one hero
  layout for the section pages AND the partner hub.
- Hero content is **config + CMS**: defaults in `config/site_pages.php`
  keyed by slug (title/eyebrow/tagline/background/cta_label/cta_href);
  `HomeController::pageHero()` overlays admin overrides from `SiteSetting`
  keys `page_hero_{slug}_{field}`. Edit them under **Admin → Content →
  Page Heroes** (`Admin/Content.jsx`).
- The five section components (`About/Features/Services/News/Contact.jsx`)
  are now used ONLY on their dedicated pages; each card carries a `+`
  button + a `LandingModal` info dialog.

**Admin Content settings shape:** `ContentController::index` passes
`settings` as a **flat `key => value` map** (`SiteSetting::pluck`), which
is what every `SettingInput` reads (`settings['{group}_{key}']`) — don't
revert it to `groupBy('group')` or the editors stop pre-filling.

### Organiser card background (hero tournament card)

The hero tournament card's background watermark comes from
`config/tournaments.php` → `organizer_card_bg` per tournament, overridable
in the CMS via `SiteSetting` key `tournament_card_bg_{id}` (wired through
`TournamentService::loadOverrides` + `assemble`, exposed as
`tournament.organizer_card_bg`). Files live in
`public/tournament-organizers-card-visuals/` (see its README; the CAF/FIFA/UEFA
files are `.png`) and **must be committed** to deploy — a missing file is
hidden gracefully via `onError` on `AccentCard`'s `bgImage`, so it never shows
a broken image. Changing a tournament's config (e.g. this path) needs the
`TournamentService` cache cleared — `php artisan cache:clear` or the admin
**Settings → Refresh tournaments** button — since the payload is cached 24h.

### Stadium imagery (Sprint 44)

Venue photography is **ours, not Wikipedia's**. The hero slider used to render
whatever thumbnail the Wikipedia summary returned per venue — slow on a cold
cache, and the "thumbnail" was sometimes a crowd shot or a logo.

- **Catalogue**: `config/stadiums.php`, keyed by tournament id → slug → entry
  (`name`, `city`, `country`, `lat`, `lng`, `image`, `aliases`). A tournament
  with no set here keeps its old behaviour untouched.
- **Files**: `public/stadiums/<SET>/<slug>_hero.webp` — committed (see that
  directory's README). `/public/storage` is gitignored, so images must NOT
  live there or they never deploy.
- **Service**: `StadiumImageService` resolves a free-text venue name to a URL.
  Names arrive as Wikipedia wikitext ("Moi International Sports Centre",
  "Kasarani Stadium", …) and there is no stadium table to join on, hence the
  `aliases` list. `normalize()` + `matches()` are mirrored exactly by
  `resources/js/Data/stadiumImages.js`; **change both in the same commit** —
  `tests/JS/stadiumImages.test.mjs` and `tests/Feature/StadiumImageResolutionTest.php`
  assert shared fixtures against each side.
- **Matching is deliberately conservative**: a containment match needs a shared
  run of ≥2 words, so "Zanzibar Fumba Stadium" does *not* resolve to Amaan
  Stadium. Showing the wrong ground's photo is worse than showing none — a miss
  returns null and each surface uses its own placeholder.
- **The catalogue is the venue list (Sprint 45).** Wikipedia's "Venues" parse
  is free prose — names drift between edits, grounds go missing, and bare city
  names ("Nairobi") come back as if they were stadiums. So for a catalogued
  tournament `TournamentService::assemble` builds venues from
  `StadiumImageService::catalogueVenues()` and demotes Wikipedia to enrichment
  via `WikipediaService::enrichStadiums()`, looked up by the `wikipedia_title`
  **we** set per entry. Every venue row therefore has an image by construction.
  Config wins on name/city/country/coords/capacity/image; Wikipedia only fills
  `extract`, `opened`, `url`, and capacity where config left it null.
- `getAll($title, $ttl, $hydrateVenues)` — pass **false** for a catalogued
  tournament. Otherwise you pay for Wikipedia's per-venue round-trips *and*
  ours, and the first set is discarded. Getting this wrong tripled the test
  suite (3m → 10m) before it was caught.
- **Uncatalogued tournaments are unchanged**: Wikipedia supplies the list and
  `applyToVenues()` overlays imagery onto it exactly as before.
- **Shared prop**: `HandleInertiaRequests` exposes `stadiumImages`, a flat
  `normalized name => url` map, for surfaces that resolve by venue string rather
  than from the venue rows (`MatchCard`, the budget calculator's picker). The
  alias table stays server-side so there is no JS copy to drift.
- **Country highlight (Sprint 45)**: each entry carries `country_code`, so the
  hero tracks the slider — `HeroWorldMap` fills the active slide's host country
  in the tournament accent (others stay white, non-hosts stay blurred) and the
  matching `hosts` pill on the tournament card gets `is-active`. The pill is
  matched on **country name**, not array index: `hosts` and `host_flag_codes`
  are parallel by convention only, and a mis-pairing would light the wrong
  country. The map's blur pass keys off the non-host fill (`NON_HOST_FILL`),
  never "is it white?" — an accent-filled active country would otherwise blur.
- **Consumers**: `Hero.jsx` (active slide eager + `fetchPriority="high"`, next
  slide warmed via `preloadImage`, rest unfetched — a 12-venue tournament no
  longer pulls ~1.5MB on first paint), `Fan/BudgetCalculator.jsx`,
  `Fan/MatchCard.jsx` (falls back to the legacy WC2026 exact-name map),
  `Fan/ItineraryMap.jsx` (coordinates).
- **Admin**: **Content → Stadium Images** (`Admin/Content.jsx` +
  `Components/Admin/StadiumImageCard.jsx`). Uploading stores `SiteSetting`
  `stadium_image_{slug}`, which wins over the committed default; **Reset to
  Default** deletes that row (`admin.content.stadium-images.reset`) rather than
  saving an empty string, so the shipped image comes back without a redeploy.
  Both caches are invalidated on save — the service's 15min resolved map *and*
  the 24h tournament payload.

Every surface degrades gracefully on a 404 (`onError` → tournament backdrop,
generic stadium shot, or an inline empty state), so a slug mismatch can never
blank the hero.

### Tournament single-view pages

`/tournaments/{slug}` (`HomeController@tournament`, name `tournaments.show`)
renders `Pages/Tournaments/Show.jsx` through `SectionPageShell` + `PageHero`.
The hero background is the organiser visual (`organizer_card_bg`) with the
tournament's `trophy_image` floating large on the right (PageHero `media`
prop + `page-hero--split` horizontal gradient so the brand stays visible).

- **Concluded**: recap — stat tiles, highlights (champion / runner-up /
  `top_scorer` / `player_of_tournament`), participating teams (flags), and a
  closing CTA to the next upcoming tournament.
- **Upcoming**: sign-up + plan-your-trip CTAs, then offerings — approved
  active `Listing`s for that tournament as `AccentCard`s (same shape as the
  partner hub; falls back to curated Budget/Financing/Partners cards when a
  tournament has no listings), plus the teams grid.

`player_of_tournament` and `total_goals` are optional config fields
(`config/tournaments.php`). The landing `TournamentCompare` cards link here
(`/tournaments/{slug}`), not `/?tournament=`. `PageHero` now also takes
`ctas` (array), `media` and a `children` slot; `SectionPageShell` takes a
`heroSlot` for a fully custom hero.

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
- Never put stadium images under `public/storage/` — it's gitignored, so they
  look fine locally and 404 on prod. They belong in `public/stadiums/<SET>/`,
  committed (Sprint 44).
- Never store an image path without a leading slash. `assets/img/x.jpg`
  resolves against the current directory and 404s on every nested route —
  that is where the `/admin/assets/img/...` 404s came from (Sprint 49).
- Never write a per-component `toUrl` helper or `baseUrl + path` for images.
  Use `assetPath()`; the shared primitives already apply it (Sprint 49).
- Never call `->store()`/`storeAs()` on an upload directly, or add a raw
  `mimes:` allowlist, in a controller. Route through `MediaLibraryService`
  (directly, or via the `Uploadable` trait) so the file is compressed and
  recorded in the library, and use its `imageRules()`/`mediaRules()` and
  `IMAGE_MIMES`/`VIDEO_MIMES` so the accepted set stays in one place. Keep
  `resources/js/lib/media.js` in step with it (Sprint 50).
- Never re-add Prizes or Products to the admin — they were removed as
  partner/store concerns (Sprint 50). The `Prize` + `Product` models and their
  tables stay: the fan Predict flow (`Fan/PredictWinController`) and the fan
  Store (`Fan/FanStoreController`) still use them.
- Never declare a form-field component inside a page body. It becomes a new
  component type on every render, so React remounts it and the input loses
  its cursor mid-typing. Use `SettingField` (Sprint 49).
- Never add a tournament override key without adding it to
  `TournamentController::FIELD_KEYS` AND
  `TournamentService::loadOverrides()` — the organiser card watermark was
  readable by the service for two sprints with no way to set it (Sprint 49).
- Never use `TournamentService::get()` as an existence check — it falls back
  to the default tournament for an unknown id (Sprint 49).
- Never style a form field by adding `!important` or raising specificity in
  `resources/css/form-baseline.css` — it is an element-level floor on purpose so
  every component class still wins. Give the field a class instead (Sprint 48).
- Never use a Bootstrap utility (`badge bg-*`, `border-secondary`, `btn btn-*`,
  `d-inline-flex`) on a dashboard surface. The landing template stylesheet is
  gated to public pages, so those classes resolve to nothing and the element
  renders unstyled — that is where the bare "#1" on the Predict leaderboard and
  the colour-bar tournament pill came from (Sprint 48).
- Never answer an Inertia POST with `noContent()`/204 — the client has nothing
  to navigate to and silently stays put (Sprint 48, passkey login).
- Never pin the CSRF token once at module load. Logging in regenerates the
  session, Inertia never reloads the document, and the stale `X-CSRF-TOKEN`
  header beats the fresh `XSRF-TOKEN` cookie — every later axios POST 419s.
  `bootstrap.js` reads the cookie per request (Sprint 48).
- Never assume a FontAwesome name exists: the bundle is **FA 6.0.0**
  (`public/assets/libs/font-awesome.min.css`). `fa-ranking-star` and friends
  landed in 6.1 and render as blank squares.
- Never maintain `tribes.member_count` / `posts_count` by hand — go through
  `Tribe::syncCounts()` (Sprint 48).
- Never edit `StadiumImageService::normalize()`/`matches()` without editing
  their mirrors in `resources/js/Data/stadiumImages.js` in the same commit —
  the two sides index the same shared map, so a drift means the server
  resolves a venue the client can't.

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
| 25     | Admin loan applications: finance-partner column + filter |
| 26     | Admin `/admin/partners/{user}` live hub preview      |
| 27     | Fan onboarding hint on the Finance CTA               |
| 28     | Multicurrency Budget Calculator (USD, EUR, GBP, KES, ZAR, NGN, XOF) |
| 29     | Budget currency propagates to Booking + Journey render |
| 30     | Multicurrency reaches SavingsGoals + LoanApplications displays |
| 41     | Contact-form dialogs, gated header switcher, hero declutter, airline + betting partners & seeded offerings |
| 42     | Partner dashboard polish: 4-col partner grids, self-serve branding editor, publish-on-save + contextual listing form, TfeModal + ImageUpload primitives, Dribbble-inspired admin dashboard restructure |
| 43     | Fan financing surface rebuild: shoddy inline form removed, partner financing offerings surfaced as AccentCard grid, TfeModal wizard collects wallet + consent against a saved budget then redirects newcomers to the calculator |
| 44     | Locally-hosted stadium imagery: Wikipedia thumbnail fetch replaced by committed WebP catalogue + `StadiumImageService`, lazy hero slider, admin Stadium Images editor, reuse on budget calculator / match cards / itinerary map |
| 45     | Catalogue becomes the venue source (Wikipedia demoted to enrichment by our own titles), hero overlay lightened 30%, active slide highlights its host country on the world map + tournament card pill |
| 46     | Ticketing archetype (MatchDay Africa) w/ end-to-end fan purchase pipeline; Ecobank multicurrency virtual card demo; GoalBet listings on Fan Predict; shared `.tfe-menu-surface` dropdown |
| 48     | Passkey login hardening (+2FA parity), global form baseline, social feed + tribes rebuilt on primitives, tribes completed end-to-end (privacy, join requests, moderation) |
| 49     | Admin CMS unification: SettingField + assetPath primitives, section-card CMS, dedicated Tournament management, ListingGrid rollout |
| 50     | Global media library (MediaLibraryService: server-side compression, wider types incl. video, MediaAsset gallery + MediaPicker), collapsible sidebar groups, Content Page-Heroes sub-tabs, Events filter chips, Prizes/Products removed from admin |

Full detail in commit history on `claude/brave-newton-o8w4u0`.

### Sprint 43 notes

- **Fan financing (`/fan/loan-applications`)** — the old "Apply for financing"
  inline form is gone. The page now leads with a **Financing options** section
  that renders partner-published financing packages as `AccentCard`s (Listings
  whose publisher is a `finance_partner`, filtered `approved+active` and scoped
  to the active tournament), plus a **Request custom financing** row underneath
  that either opens the wizard (fan already has a saved `Budget`) or sends them
  to the budget calculator (fan has none yet). `Fan/LoanApplicationController`
  now hydrates `offerings` and `savedBudgets` on top of the existing loans /
  stats / financePartners payload.
- **Request-financing wizard** — a `TfeModal`-based 2-3 step flow. Step 1 picks
  the saved budget being financed; step 2 (only when >1 partner is public)
  picks the routing partner; the final step reviews the amount / partner and
  requires an explicit consent checkbox before it submits. On success the
  wizard swaps to a confirmation panel telling the fan the request is on the
  finance partner's portal and updates will land here. `store()` accepts a
  `nullable|boolean|accepted` `consent` field so the older Budget-calculator
  `FinanceThisTrip` CTA path still works untouched.

### Sprint 41 notes

- **Contact forms** — the Contact page (`Sections/Contact`) card dialogs now
  render a working contact form. `LandingModal` grows a `data.form` mode
  (Inertia `useForm` → `POST /contact`, `HomeController::contactStore`, stored
  as a `ContactMessage`); `Contact.jsx` cards pass `form: { subject }`. Public
  route name is `contact.store` (the fan-side one is `fan.contact.store`).
- **Header tournament switcher** — only renders on the landing page (`Home`,
  `variant="landing"`, switch active tournament) and single-view tournament
  pages (`Tournaments/Show`, `variant="tournament"`, which *navigates* to the
  picked tournament's `/tournaments/{slug}` page). Gated in `Header.jsx` by
  `usePage().component`. The fan dashboard's switcher is unchanged — it lives
  in `DashboardHeader`, not this public `Header`.
- **Landing hero** — the bottom horizontal Teams/Matches/Goals strip is gone;
  Row 1 (world map + tournament card) is the sole hero row and both enlarge on
  xl (`.hero-worldmap--xl` scale + taller `.tfe-acard--hero`). No backend/CMS
  change: the removed strip only re-displayed existing tournament payload
  fields (`num_teams`/`matches_played`/`total_goals`), still used on
  `Tournaments/Show`.
- **Demo partners + offerings** — `DemoExtraPartnersSeeder` adds Simba Air
  (`airline`) and GoalBet (`sponsor`); `DemoPartnerOfferingsSeeder` publishes
  two approved+active placeholder `Listing`s per partner (travel/finance/
  airline/betting) across every non-concluded tournament, so the "Plan your
  trip" feed on an upcoming tournament page features real partner listings.
  `HomeController::tournament` eager-loads `publisher.partnerProfile` and the
  offering `AccentCard`s show the partner eyebrow + theme accent.
