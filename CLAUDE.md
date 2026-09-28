# CLAUDE.md

Orientation for future Claude sessions. Written cumulatively across Sprints 1–17;
last refreshed at Sprint 56. Prefer editing this file over adding parallel docs.

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
| Demo fan        | `fan@tfe.com`       | password | `DemoFanActivitySeeder`; use for shots |
| Schools partner | `schools@tfe.com`   | password | East Africa Schools Sports (`school_community`), green #15803d |
| Other demo fans | `amina@` `joseph@` `fatima@` `tunde@` `grace@` `samir@` `tfe.com` | password | Cohort behind the tribes, queues and sales |

### Demo data (Sprint 59)

`php artisan migrate:fresh --force --seed` now produces a platform with
something on every surface. Two seeders do it, and both are **deterministic
on purpose** — no Faker, so a screenshot is reproducible and two runs are
comparable.

- **`DemoAfconFixturesSeeder`** — 52 AFCON 2027 fixtures (6 groups of 4, then
  a 16-team bracket). Before it, all 104 seeded fixtures belonged to
  `wc_2026`, which is `concluded` and so cannot be the active tournament
  (Sprint 53) — while the DEFAULT tournament is `afcon_2027`, which had
  none. The Budget Calculator's match step, the Match Schedule and the
  Itinerary Map were all empty out of the box.
  Venues are stored by NAME (what `Fixture::venue` holds and what
  `StadiumImageService` alias-matches); all 11 resolve to both an image and a
  bowl slug. **Kipchoge Keino is never scheduled** — it is catalogued
  `is_alternate`, a 15,000-seat training ground.
- **`DemoFanActivitySeeder`** — 7 fans, 8 budgets, 4 bookings, 4 savings
  goals, 5 loan applications, 16 ticket purchases, 4 tribes (one per privacy
  mode) with members and posts. This is also what fills the PARTNER
  dashboards, since a Convert queue *is* the budgets whose fan picked that
  partner's listing.

Both are idempotent, and both route through the methods that own
denormalized counts — `Tribe::addMember()`/`syncCounts()`, and the tier
increment plus `Ticket::syncTierTotals()` that the real purchase flow uses.
Ticket purchases are guarded on `reference` so a re-run cannot double-count
seats sold.

**A seeder that writes fixtures MUST call `FixtureService::clearCache()`.**
`getFixtures()` caches an empty list as readily as a full one, so without it
the install you just seeded still reads "No matches found" until the TTL
lapses. `FixtureService::cacheKey()` is the one place that key is built.

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

### Persistent layouts (Sprint 53)

**The role shell is mounted once and never remounts.** Pages still render
their own `<AdminLayout title="…">` wrapper, but `app.jsx`'s `resolve()`
attaches the layout as an Inertia **persistent layout** from the page-name
prefix (`Admin/` → AdminLayout, `Fan/` → FanLayout, `Partner/` →
PartnerLayout, imported lazily so public pages pay nothing). The role layouts
then read `Layouts/ShellContext`: with a shell above them they render
`<Head title>` + children only and let the mounted shell own the chrome.

Before this, the layout lived *inside* the page component, so every Inertia
visit unmounted the sidebar, header and providers and built new ones — a
sidebar click looked and behaved exactly like a full browser reload.

- **Add a page under `Pages/{Admin,Fan,Partner}/` and it is covered** — no
  wiring. Opt out with `export const layout = null` (the check is
  `=== undefined`, not falsy).
- Never move the `<Head title>` into the shell: two live `<Head>` titles
  fight over `document.title`. `BaseLayout` only renders one when the shell
  itself was given a title, which the persistent wrapper never is.

### Skeletons + page transitions (Sprint 53)

`PageTransition` is mounted once inside `BaseLayout`, between the shell and
the page. It keys the page wrapper on the Inertia component name (so each
route change replays a cross-fade) and, when a visit outlasts a **220ms
grace period**, swaps in a skeleton shaped like the destination. Nothing is
wired per page.

- **`Components/Common/Skeleton.jsx`** is the ONE shimmer primitive
  (`.tfe-skeleton*` in primitives.css). Never hand-roll a shimmer gradient.
  Layout shapes: `SkeletonHero / SkeletonTiles / SkeletonSlab /
  SkeletonCards / SkeletonTable / SkeletonSplitEditor`.
- **`resources/js/lib/pageSkeleton.js`** maps a URL → variant
  (`split | table | cards | dashboard`). A visit only knows its destination
  URL, not the component, so the match is on the path. Add a pattern there
  rather than a skeleton to a page. Kept JSX-free so `node --test` can load
  it; the renderer is `Components/Common/PageSkeleton.jsx`. Guarded by
  `tests/JS/pageSkeleton.test.mjs`.
- Partial reloads (`only`/`except`/`preserveState`) and non-GET visits are
  skipped — blanking the page for a lazy prop refresh is worse than the wait.

### Multi-tournament scoping

- `config/tournaments.php` is the source of truth. There is no Tournament model.
- `TournamentService` resolves/enriches the payload from config + `SiteSetting`
  overrides and caches it 24h. Use `->get($id)`, `->all()`, `->clearCache($id)`.
- The `ResolvesTournament` trait picks the active tournament id from
  session `active_tournament_id`. Every fan controller should use it.
- **The active context is ongoing/upcoming only (Sprint 53).**
  `TournamentService::switchable()` (filtered from `all()`, so there is no
  second list to drift) is shared as `tournament_switch_list` and is what the
  switcher offers; `all()` still returns everything for TournamentCompare,
  which deep-links to each tournament's own page. `ResolveTournament` refuses
  a concluded id from `?tournament=` *and* corrects one left in the session.
  A concluded tournament also skips per-venue Wikipedia hydration in
  `assemble()` — the only surface that renders it is `/tournaments/{slug}`,
  a recap that never draws a venue. Guarded by
  `tests/Feature/TournamentContextScopeTest.php`.
- Multi-tournament scoped tables: `budgets`, `bookings`, `favorite_matches`,
  `tribes`, `fixtures`, `listings`. Each has a `tournament_id` column and a
  `forTournament($id)` model scope.

### Partners

Shipped across Sprints 9–17. Full loop:

1. **User** row with `is_partner=true` + `partner_type` (`travel_agent`,
   `finance_partner`, `airline`, `hotel_provider`, `destination`, `club`,
   `federation`, `event_organiser`, `sponsor`, `ticketing_partner`,
   `school_community`) + `verification_status`
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

### Partner Convert queue scoping (Sprint 10 → 56)

A partner's Convert queue is **the budgets whose fan picked one of that
partner's listings** — `Partner\DashboardController::scopeForPartner()`.
`show()` / `update()` authorize against the same scope
(`authorizeBudget()`, 403 otherwise), exactly as `LoanReviewController` does
for loans.

Sprint 10 added a fallback: a partner with **no** listings saw every active
budget on the platform, so nothing went dark mid-pivot. Sprint 56 removed it.
By then the seeded ticketing partner published no listings, so signing in as
one showed every fan's travel brief, with platform-wide pending/approved
counts and revenue on the dashboard tiles presented as that partner's own —
and `show()`/`update()` had no ownership check at all, so any partner could
open a competitor's brief and overwrite its quote (which notifies the fan).
A partner with no listings now gets an empty queue and an empty state that
says how to fill it (`hasListings` prop). Guarded by
`tests/Feature/Partner/RequestQueueScopeTest.php`.

### Partner dashboard variants

`Partner/Dashboard.jsx` is one component with three `variant`s, chosen by
`partner_type` in `DashboardController::index()`:

| variant     | who                  | tiles + queue                          |
|-------------|----------------------|----------------------------------------|
| `travel`    | everyone else        | budget briefs scoped to their listings |
| `finance`   | `finance_partner`    | `LoanApplication`s routed to them (Sprint 14) |
| `ticketing` | `ticketing_partner`  | seats sold / orders / sell-through / revenue (Sprint 56) |

The ticketing figures come from **`TicketController::statsFor()`**, which the
Tickets page uses too — keep it that way, since `seats_sold` (seats bought
through TFE) and `sellthrough` (against each fixture's own `sold` column)
are measured differently and two copies of that would drift. A ticketing
partner's quick actions mirror `Partner/Sidebar`'s own ticketing branch
(Tickets / Sales, not Publish / Convert).

### The unified dialog (Sprint 58)

`Components/Common/TfeModal` is the ONE dialog. A **tabbed shell**: identity +
section rail on the left, the active section on the right, actions along the
bottom. Forms, detail views, pickers and confirmations all render through it.

It replaced **six** parallel implementations — `TfeModal`'s own title-bar
layout, `DashboardModal` (which already had a rail, and its own stylesheet),
`LandingModal` (the public "+ info" card dialogs), a dead `Modal.jsx`, and the
shadcn `Dialog` behind `ConfirmationDialog` / `StatusDialog` / `ShareModal` /
the 2FA setup. `DashboardModal` is the cautionary one: it restyled
`.form-control`, `.form-select`, `.btn-cancel` and `.btn-submit-modal`
privately, so the same form looked different inside a dialog than on a page.

**The rail always shows**, even for a one-section dialog — it carries `label`
+ `title`, which is the dialog's own name and context, plus the single nav
item. Below 760px it becomes a horizontal chip strip, and a single-section
dialog hides the strip (one chip repeating the title above it is noise).

Content comes in three shapes, because the dialogs it absorbed use all three:

```jsx
tabs={[{ id, label, icon, content: <X/> }]}   // content on the tab
{(activeId) => <X/>}                          // render function
<X/>                                          // plain children
```

- **`ModalRow`** (`Components/Common/ModalRow.jsx`) is the labelled-setting
  row — title + description left, control right, hairline between. Use it
  instead of a hand-rolled flex row so every dialog aligns its controls on the
  same axis. `stacked` puts the control on its own line; `ModalFact` is the
  read-only variant. Group rows with **`ContentCard`**.
- **A form lives in the pane; its submit lives in the footer.** They are not
  nested, so the button reaches the form by `form="the-form-id"`. Give every
  dialog form an id.
- **The footer must follow the active tab.** A submit button for a form that
  is not currently rendered does nothing — the landing dialog offered "Send
  message" from its Overview tab before this was caught.
- `tabs` may be omitted (one tab is synthesised from `title`), passed as bare
  strings, or as full objects with `badge` / `disabled`. A tab list that
  changes while the dialog is open (the partner listing form adds and removes
  its "Trip" tab with the listing type) re-resolves rather than blanking the
  pane. The pure half is `resources/js/lib/modalTabs.js`, guarded by
  `tests/JS/modalTabs.test.mjs`.
- Escape, backdrop click (on `mousedown`, so a drag that ends outside does not
  close), focus trap, focus restore and scroll lock are all handled. Pass
  `closeOnBackdrop={false}` for a destructive form; `ConfirmationDialog` does.
- `ConfirmationDialog` and `StatusDialog` keep their previous props exactly —
  twenty call sites use the first, and none of them moved.

### School groups: the school declares, TFE holds no pupil data (Sprint 61)

**TFE's engagement for a school trip is with the SCHOOL, through an
appointed official — not with each child's guardian.** The school already
runs parental consent, safeguarding, supervision ratios and duty of care.
Rebuilding any of that here would be a worse copy of a process that works,
and would make TFE a controller for children's data it has no need to hold.

A scoped `dependants` + per-child-consent + age-verification model was
designed and then **deliberately dropped** for this one. Do not revive it:
data never collected cannot be breached, misused or subpoenaed.

`school_group_declarations` (one per `Budget`, unique FK) stores:

- the school, and a **named official with a role** at an official school
  address — "the school agreed" cannot be resolved against in a dispute;
- `travellers_adults` / `travellers_minors` **split**, because "40
  travellers" drives nothing while the split drives supervision ratios, room
  configuration and an airline's own minor policy;
- `youngest_traveller_age`, which decides whether unaccompanied-minor
  handling applies — and is still nobody's identity;
- the two warranties (`channels_confirmed`, `information_accurate`) and
  `declared_at`.

`tests/Feature/Partner/SchoolGroupDeclarationTest.php` asserts the table
carries **no** `pupil` / `child` / `date_of_birth` column, so adding one
later fails the suite rather than passing unnoticed.

**One duty does not transfer with the declaration.** If TFE knows minors are
travelling and fails to tell the partner booking the flights, that is TFE's
failure, not the school's. So:

- **`involvesMinors()` is DERIVED from the counts**, never a stored boolean.
  A stored flag can disagree with the numbers rendered beside it, and then
  one of them is lying.
- **`MinorsBadge` (`Components/Common/MinorsBadge.jsx`) is the ONE way a
  surface says it**, reading a structural field. Never a sentence typed into
  a notes box — a note is something nobody is obliged to read. It renders on
  the Convert queue row AND the brief; `.tfe-pill--minors` is deliberately
  louder than the status pills beside it.
- It renders **nothing** when no minors travel. An "0 minors" chip on every
  ordinary trip trains people to ignore the badge that matters.
- `SchoolDeclarationPanel` says plainly when a declaration is **incomplete**
  — one warranty ticked is not a partial warranty, and must not read as
  though a school stood behind the trip.

**The form is `SchoolGroupWizard`** (`Components/Fan/`), opened from a plan
on `/fan/itineraries` and posting to
`fan.budgets.school-group.store` (`Fan\SchoolGroupDeclarationController`).
Three gated steps — school + official, travelling party, warranties — so it
uses `StepFlow variant="inline"`, not `TfeModal`'s tab rail: you cannot
warrant a party you have not yet described.

- **`declared_at` is server-stamped, always**, and **re-stamped on an
  amendment**. The warranty given for 20 minors does not cover the 40 that
  replaced them, which is also why the two checkboxes start clear every time
  the form reopens.
- **Both warranties are `accepted`** server-side. `isComplete()` still guards
  the render, because a record can reach a partner by routes other than this
  form, but nothing incomplete starts here.
- **At least one adult** (`travellers_adults` min 1) — a party of minors with
  nobody supervising is not a school group. `youngest_traveller_age` is
  `Rule::requiredIf` on minors > 0 and **forced to null** otherwise; a stored
  value nothing renders is one that can later contradict the numbers beside it.
- The wizard renders the real `MinorsBadge` in its "What the partner will
  see" panel rather than describing it, and shows the counts as separate
  facts — `partySummary()` is the server's to format (one label, one source).
- `toPayload()` (was `toPartnerPayload()`) is the ONE shape, read by the
  partner's queue, the partner's brief and the school's own editor. It omits
  the warranty booleans on purpose, per the re-declaring rule above.
- Mount the wizard conditionally and `key` it on the plan — `useForm` reads
  its initial values on first mount only.
- Withdrawal (`…school-group.destroy`) exists because a declaration can land
  on the wrong itinerary; it clears the minors flag, which is correct — with
  no declaration, nobody has warranted anything.

**Not yet wired: the Budget Calculator's save step.** A plan reaches a
partner's Convert queue the moment it is saved against their listing, so a
school that declares afterwards leaves a window where the brief carries no
flag. Offering the declaration at save time is the next slice.

This works **because the school is the controller**. If TFE ever sells a
child's place directly to a parent, none of it applies and that flow must
not be merged into this one.

### Listing schedule + Learning Hub (Sprint 60)

**`listings` now knows when and where a listing runs** — `starts_at`,
`ends_at`, `location`, all nullable, with an index on `starts_at`. A trip
package got away without them (its dates come from the matches it includes);
a schools programme could not. Three plain columns, not a sessions table: a
single run is what every current type needs, and a many-session programme is
a real modelling question that should get its own table when something asks.

`resources/js/lib/schedule.js` is the pure half (14 tests):

- **`toLocalInput()`** — `<input type="datetime-local">` accepts ONLY a naive
  `YYYY-MM-DDTHH:mm` and renders blank for anything else with no error. Never
  feed it `toISOString()`: that converts to UTC and silently shifts the time
  the partner typed.
- **`formatDateRange()` does not use `toLocaleDateString`** — its output
  varies with the host locale and ICU build, so the same listing would read
  differently on two machines and no test could pin it.
- **`formatSchedule()` returns null when there is nothing to say.** A listing
  with no schedule is legitimate (a grant open all season shows its region
  alone), and a caller must not render an empty chip.
- The hub orders `starts_at IS NULL, starts_at ASC` so undated rows sort
  after dated ones rather than to the front, where a bare NULL lands.

**The Learning Hub** is `/learn` (`LearningHubController`, `Pages/Learn/`).
`LearningResource` is a separate model from `Listing` on purpose: the Coaches
Education Programme is a `Listing type=program` you enrol in (capacity,
price, dates); its four modules are resources you read. Putting modules in
`listings` would give each one a capacity and a sell-through bar that mean
nothing. `listing_id` is nullable, so a resource either stands alone or is a
module of a programme.

- **`LearningResource::CATEGORIES` / `AUDIENCES` / `LEVELS` are the ONE
  taxonomy** — the controller validates against them, the index renders its
  chips from them, the seeder picks from them. `audience` is what makes the
  same library useful to a parent as well as a coach.
- **It is open, not gated.** Gating to registered schools would couple the
  library to an enrolment model that does not exist yet, and a safeguarding
  policy is worth more the more widely it is read.
- **An unknown `?category=` shows everything, not nothing.** An empty grid
  reads as "we have no resources", a different and wrong claim.
- Filters are a server round-trip into the URL, so a coach can send "the
  safeguarding ones" to a colleague as a link.
- The body renders as TEXT, never `dangerouslySetInnerHTML` — it is
  partner-authored, and that is the same stored-XSS reasoning that keeps SVG
  out of the uploaders.
- `HomeController::pageHero()` is now **public static** so the Learning Hub
  reads the same config-then-CMS hero rather than growing a second copy.

Guarded by `tests/Feature/LearningHubTest.php` and
`tests/JS/schedule.test.mjs`.

### Schools & Communities archetype (Sprint 59)

`school_community` is the stakeholder between the platform and the next
generation of fans, players and coaches — modelled on the ASE ecosystem
reference (Watch / Play / Learn / Develop, with Schools & Universities as a
first-class stakeholder alongside Fans, Airlines and Clubs).

**It needed new copy and new data, not a new page.** The public hub, the
listings grid, the docked StepFlow and the AccentCard layout all carried it
unchanged. What is archetype-specific lives server-side:

- **`stepsFor('school_community')`** — the five-step schools journey
  (Register → Discover → Join & participate → Develop & learn → Compete &
  grow). The only archetype whose journey belongs to an INSTITUTION rather
  than a fan: a school registers once and returns season after season.
- **`pillarsFor($partnerType)`** (new) — the "how we support you" trio.
  Same bug class the steps had, same fix: every hub rendered
  Publish / Convert / Measure in travel-agent copy ("Package experiences
  fans actually want — matches, stays, transfers"), which a betting sponsor
  was already being shown. Schools get Programs / Pathways / Outcomes;
  finance and ticketing get their own; unmapped types keep the default,
  which is accurate for the partners whose dashboard has those tabs.
- **`type = 'program'`** on `Listing` — schools publish leagues, festivals,
  coaching courses, grants and community projects, none of which is a
  package, offer, event or tour. `listings.type` is `string(32)`, so no
  migration; add it to `ListingController`'s `in:` rule, the form's option
  list and `DEFAULT_TYPE` together.
- **A zero price means Free, not "USD 0".** Most of the schools catalogue is
  free to enter, and that is a claim worth making rather than something that
  reads as a missing value (`priceFact()` in `PartnerHub.jsx`).

**The hub eyebrow now uses the server's label.** It used to title-case the
raw key client-side, which rendered `school_community` as "School Community"
while the directory showed "Schools & Communities" from `partnerTypes()` —
two sources for one label. `partnerEyebrow()` only trims a trailing
"Partner" so `finance_partner` does not read "Official Finance Partner
Partner". Seeded by `DemoSchoolsPartnerSeeder` (6 programmes). Guarded by
`tests/Feature/PartnerHubStepsTest.php`.

### StepFlow (Sprint 59)

`Components/Common/StepFlow` is the ONE step-sequence indicator. A numbered
run of steps with chevrons between them, in **two variants that are the same
component**:

| variant  | where | behaviour |
|----------|-------|-----------|
| `docked` | public partner hub | glass pill fixed bottom-centre, reveals on scroll, retracts before the footer |
| `inline` | wizards (Budget Calculator) | sits in flow, with a slim completion fill |

A docked "how it works" bar and a wizard's progress rail are one widget in two
positions. It replaced **four** parallel implementations, all migrated:

| was | now |
|-----|-----|
| `PartnerHub`'s private `HowItWorksBar` | `docked`, steps from the server |
| `Auth/Register`'s `.progress-steps` / `.progress-fill` | `inline`, and the CSS is deleted |
| `RequestFinancingWizard`'s bare "Step {n} of {total}" | `inline` in the dialog pane |
| *nothing at all* on the five-step Budget Calculator | `inline` |

**A dialog whose sections are freely navigable uses `TfeModal`'s own tab rail,
not StepFlow** — the ticket purchase modal is the example. Reach for StepFlow
in a dialog only when the steps are *gated*, as the financing wizard's are: a
tab rail implies you may jump, and that wizard will not let you.

- **Progress is opt-in.** A step with no `state` is `unstated`: the bar draws
  no fill and marks nothing current. That is the honest rendering for the
  public hub, where it explains a flow that has no instance behind it. Pass
  `cursor` (a 1-based position) or per-step `state` to turn it into a
  tracker — `budgets.partner_status`, `loan_applications.status` and
  `bookings.status` are all real enums it can read.
- **The pure half is `resources/js/lib/stepFlow.js`** — JSX-free so
  `node --test` loads it; guarded by `tests/JS/stepFlow.test.mjs`. `cursor: 0`
  means "not started" (every step `todo`), which is NOT the same as
  `unstated`. A `current` step counts as HALF in `completionPct` — rendering
  it as 0 or 100 misreports the flow.
- **The docked variant portals to `document.body`.** `position: fixed` is
  measured against the nearest transformed ancestor, and `.tfe-page` runs a
  `translateY` page-enter animation — so a docked bar left in the page tree
  visibly jumps for 220ms on every Inertia visit. Same containing-block trap
  documented under Sprint 54.
- **Under 640px it shows the current step, not a row of numerals.** The bar
  this replaced hid both the label and every step title below that width,
  leaving four bare numbers and three chevrons that conveyed nothing.
- Step counts other than four are fine — the sponsor pipeline is three, and
  the financing wizard is two or three depending on whether more than one
  finance partner is public.
- `register-dark.css`'s `.progress-steps` / `.progress-bar` / `.progress-fill`
  are **gone**. Note `.progress-steps .step.completed` was styled but never
  applied — Register only ever set `active`, and `currentStep >= 1` is always
  true, so step 1 read as active from the start and nothing distinguished a
  finished step from the current one. StepFlow draws all three states.

**The partner hub's steps come from the server.**
`PartnerHubController::stepsFor($partnerType)` returns the pipeline that
archetype actually runs, next to `featuresFor()` for the same reason. The
hardcoded four steps it replaced told an airline and a betting sponsor alike
that the fan would receive a "Trip delivered". Unmapped types
(`club`, `federation`, `destination`, `event_organiser`) fall back to the
travel pipeline by design. Guarded by `tests/Feature/PartnerHubStepsTest.php`.

### 3D stadium seat map (Sprint 57)

`Components/Common/StadiumBowl` is the ONE seat map. A parametric Three.js
bowl — four concentric tiers on a real rounded-rectangle footprint, per-venue
roof, per-tier occupancy. It replaced the procedural SVG `Fan/StadiumSeatMap`
**everywhere** — that component is deleted, not deprecated. Mounted on:

| surface | payload | occupancy |
|---------|---------|-----------|
| `Fan/Tickets/Index` purchase modal | one fixture (`forTicket`) | real, and **it is the tier picker** |
| `Fan/BudgetCalculator` results | every venue (`forTournament`, deferred) | real, aggregated |
| `Fan/PackageDetail` | the package's venues | real, aggregated |
| **Landing hero** venue dialog | every venue (`forTournament`, deferred) | real, aggregated |

**The bowl is a GENERIC parametric shape, not an architectural replica.**
Public blueprints do not exist for most AFCON 2027 grounds (several are still
under construction). That is a known, accepted limitation — do not chase it.
A photoreal GLB per venue would be a separate asset for a showcase surface; a
fused mesh cannot do per-tier data binding, which is this component's whole job.

Files:

- `resources/js/lib/stadiumBowl.js` — pure geometry (tier radii, the
  discorectangle solver, `resolveTiers`). JSX- and three-free so `node --test`
  loads it; guarded by `tests/JS/stadiumBowl.test.mjs`.
- `resources/js/lib/stadiumBowlGeometry.js` + `stadiumBowlScene.js` — the
  three.js half (meshes; camera/pointer/lifecycle). Only these import `three`.
- `Components/Common/StadiumBowl.jsx` — public entry: chrome, legend, venue
  switcher, and the `React.lazy` boundary.
- `Components/Common/StadiumBowlCanvas.jsx` — lazily imported, so `three`
  (~578KB, 149KB gzip) lands in its own Rollup chunk. **Every surface imports
  `StadiumBowl`, never the canvas** — that is what keeps the lazy boundary from
  being forgotten. Verified: `three` appears in exactly one built chunk.
- `App\Services\StadiumBowlService` — the ONE payload. `forTicket()` /
  `forVenue()` / `forName()` / `forTournament()` all return the same shape.

**Venue geometry lives in `config/stadiums.php`, not a migration** —
`roof_style`, `partial_bowl`, `corner_ratio`, `is_alternate`, `formerly`.
There is no stadium table; the catalogue IS the venue list (Sprint 45). Note
`corner_ratio` is the corner RADIUS as a fraction of half-width, so a SMALLER
value is a boxier, football-only ground; null/1 is the full discorectangle an
athletics track forces.

**`has_inventory` is the honesty flag.** A ground with no ticket rows returns
`source: 'catalogue'` with null occupancy, and the component shows a seating
layout with capacities and no percentages. This replaced surfaces that invented
a figure when they had none: PackageDetail passed the package's own
availability as if it were the ground's, and `Hero.jsx` hashed the stadium NAME
into a 20-85% "urgency signal" presented as a "Live indicative view".

**The landing hero draws it too** (Sprint 58). Sprint 57 left the hero on the
old SVG map to keep `three` off the landing bundle — that reasoning was wrong:
`StadiumBowl` owns the `React.lazy` boundary, so the 578KB canvas chunk only
downloads when the venue dialog's Seat Map tab is actually opened. The landing
page's initial bundle gains the ~6KB wrapper and nothing else (verified: the
`Home` chunk contains zero `three` symbols and the canvas chunk is not
requested on load).

`HomeController::index` defers `venueBowls` from `StadiumBowlService::forTournament()`
and `Hero` matches a slide to its payload on the **resolved image url** — the
shared `stadiumImages` map already indexes every alias to the same url a bowl
payload carries, so this reuses the server's alias table rather than growing a
second copy. A venue with no payload renders an empty state, never a guess.

### Tiered ticket inventory (Sprint 57)

`tickets` carried one flat `price`/`capacity`/`sold` per fixture, so there was
exactly ONE real occupancy number per match and every four-tier seat map was
showing invented figures. Inventory now lives in **`ticket_tiers`** (one row per
tier per fixture: `key`, `name`, `price`, `capacity`, `sold`), with
`ticket_purchases.ticket_tier_id` + a `tier_name` snapshot for receipts.

- **`Ticket::syncTierTotals()` owns `tickets.capacity` + `tickets.sold`.** They
  are denormalized totals the ticket cards and `Partner\TicketController::statsFor`
  read directly. Never `increment('sold')` by hand — same rule, and the same
  bug, as `Tribe::syncCounts()`.
- **`TicketTier::BLUEPRINT`'s seat shares are the bowl's ring AREAS**, derived
  from the tier radii in `lib/stadiumBowl.js`, so a tier that looks like half
  the bowl holds half the seats. `tests/Unit/TicketTierBlueprintTest.php` and
  `tests/JS/stadiumBowl.test.mjs` assert the same numbers from both sides —
  change a radius and both fail until the blueprint moves with it.
- `seedDefaultTiers()` is idempotent and never clobbers edited prices.
- The migration's backfill carries a deliberately FROZEN copy of the blueprint:
  a migration describes what happened when it ran, so it must not follow a
  constant that can be edited later.

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
- **`SplitEditorLayout`** (Sprint 51, `Components/Common/SplitEditorLayout.jsx`) —
  the shared edit-page layout: form on the left, a sticky **live preview** on the
  right, using the full width (`.tfe-split-grid` 2fr/1fr, `.tfe-split-preview`
  sticky pane, `.tfe-editor-stack` for the left column). Reach for it on any
  "edit one thing and watch it update" surface. **Sprint 53 moved that CSS out
  of the admin-only sheets into primitives**, which is what let the fan +
  partner account pages adopt it; `.partner-edit-grid` / `.admin-split-preview`
  / `.admin-editor-stack` remain valid aliases. Passing no `preview` renders a
  single column rather than a 2/3-width form beside empty space.
  Tournament edit and the Content CMS (Page Heroes → live `PageHero`, Section
  Cards → live `LandingCard`) both render through it. For a live-as-you-type
  preview, pass `SettingField` an `onChange` and resolve
  `draft ?? saved ?? default` in the preview (image fields update on save).
  The admin Profile + Settings (Site Identity) forms also use it, with
  **`IdentityPreview`** (Sprint 52, `Components/Common/IdentityPreview.jsx`,
  `.tfe-identity*`) — an avatar/name/contact card for the preview pane.
  **Sprint 53 finished the job**: fan + partner Profile and all three Security
  pages render through it too, so every account surface on the platform is the
  same form-left / preview-right shape. (Sprint 52 had left them as-is on the
  grounds that they were already grids or modal editors — the modal was
  exactly the problem: you could not see your changes land.)
- **`AccountSecurity`** (Sprint 53, `Components/Common/AccountSecurity.jsx`) —
  the ONE account-security surface. `Pages/{Fan,Partner,Admin}/Security.jsx`
  are ten-line wrappers that hand it their role's route names; passkeys use
  the global `webauthn.*` routes directly. The backend was already shared
  (one `SecurityService`); only the pages had drifted. Never fork it per role
  again — the partner copy that did ended up with browser `confirm()`
  prompts, a password form posting to the PROFILE endpoint, and 2FA/passkey
  buttons bound to route names that were never registered.
- **`TeamAvatar`** (Sprint 54, `Components/Common/TeamAvatar.jsx`) — a fan's
  photo ringed in the colours of the team they support, with their flag as a
  badge. Replaced the Ready Player Me 3D avatar: on a football platform the
  identity signal is the team you back (`users.team_support`), so it rides on
  the frame rather than a generic 3D humanoid — no third party, no `.glb`
  pipeline, no `model-viewer` script. `--avatar-size` scales it from a 28px
  row to a 140px header. Pass `src={null}` and it draws the name's initial.
  **The ring colour is sampled from the flag PNG itself**
  (`resources/js/lib/flagAccent.js`) — do NOT add a hand-written national
  colour table; ~90 nations written from memory is a wrong-colour bug waiting
  to happen, and the artwork is already committed and same-origin. The pure
  reduction (`pickAccentFromPixels`) is guarded by
  `tests/JS/flagAccent.test.mjs`; results are memoised per session.
- **`AvatarCropper`** (Sprint 54, `Components/Common/AvatarCropper.jsx`) — a
  `TfeModal` with drag-to-reposition + zoom onto a square canvas, exporting
  WebP (JPEG fallback). Hand-rolled on pointer events rather than a cropper
  package. Its preview is the real `TeamAvatar`, so the fan frames what they
  will actually get. **Transparency is preserved** (Sprint 55): `detectAlpha()`
  samples the source, and a transparent one skips the backing fill, previews
  as PNG and falls back to PNG rather than JPEG — JPEG has no alpha channel
  and would flatten a cut-out avatar to a black square inside the ring.
- **`TeamPickerDialog`** (Sprint 56, `Components/Common/TeamPickerDialog.jsx`) —
  the "which nation do you support" picker: a searchable flag grid in a
  `TfeModal`, with `.tfe-team-field` as the one-line trigger that sits in the
  form. It replaced ~28 flag tiles rendered inline in the fan profile, which
  pushed that page's only Save button into the middle of the layout. A
  `<select>` would not do — the flag is what frames the fan's avatar, so
  picking one has to show the artwork.
- **`.summary-cards-grid`** — the dashboard tile row, defined ONCE in
  `fan/dashboard.css` as a wrapping flex row (`flex: 1 1 200px`). It was also
  redeclared in `fan-dashboard-cards.css` as `repeat(4, 1fr)` plus five
  breakpoint overrides, and since that sheet loads later it was the rule that
  actually applied — so a five-tile page dropped its fifth tile into a 240px
  box beside a screenful of void. Flex needs no breakpoints and lets a
  leftover tile stretch across the row it lands on (Sprint 56).
- **`.tfe-card-grid`** (Sprint 56) — equal content columns, `--2` / `--3`,
  stacking below 992px. `.tfe-split-grid` is the 2fr/1fr editor shape; this
  is for panels of equal weight (the admin dashboard's charts and activity
  tables, the fan profile's tribes + activity).
- **`.tfe-form-grid`** (Sprint 56) — multi-column field rows, `--2` / `--3`,
  collapsing to one column below 768px, with `.tfe-form-field--wide` for a
  field that spans. Prefer it over Bootstrap's `row` / `col-md-*`: those DO
  work on a dashboard (see the utilities/grid note below) but they are a
  parallel layout system with their own breakpoints and gutters. It also
  zeroes the `.tfe-form-field + .tfe-form-field` top margin for its children
  — inside a grid that margin stepped each column down the page.
- **`ImageUpload variant="avatar"`** (Sprint 56) — round 96px thumbnail
  beside its control, for a field whose subject is a face or a logo. Note
  `compact` is NOT that: it shrinks the empty-state control but makes the
  preview *larger* (320px, for the feed composer), which is why the partner
  profile's default silhouette filled half the form.
- **`.tfe-form-actions--sticky`** (Sprint 56) — the save bar variant that
  sticks to the bottom of the viewport while a long form scrolls, with a
  `.tfe-form-actions__note` saying whether anything is unsaved. Reach for it
  on any form long enough that its submit scrolls out of sight.
- **`HubPreview`** (moved to `Components/Common/` in Sprint 53) — the live
  partner-hub preview. Used by `/admin/partners/{user}` AND the partner's own
  `/partner/profile`. It imports its own stylesheet, so it looks right
  wherever it is mounted. Accepts `service_tags`/`stats_text` as newline text
  (the admin form) or as arrays (the partner form).
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
- **`TfeModal`** (Sprint 42, redesigned Sprint 58) — the ONE dialog on the
  platform. See **The unified dialog** below. Never hand-roll an overlay, and
  never add a second dialog component.
- **`ImageUpload`** (Sprint 42, `Components/Common/ImageUpload.jsx`) — file
  picker with live preview (`.tfe-image-upload*`), replacing bare "image URL"
  text fields. Accepts jpg/png/webp only (matches the server
  `mimes:jpg,jpeg,png,webp` rule). Parent posts the File with
  `forceFormData`; the controller stores it and keeps the string field as a
  fallback for existing URLs.
- **`StepFlow`** (Sprint 59, `Components/Common/StepFlow.jsx`) — the ONE
  step-sequence indicator. See **StepFlow** below. Never hand-roll a
  progress bar or a "Step X of Y" caption.

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

### Tremor chart colours (Sprint 56)

`@tremor/react` builds its class names at runtime — `fill-${color}-500`,
`stroke-${color}-500` — so they appear in no file any extractor scans, not
even inside the package. Tailwind emitted none of them and the charts drew
**black bars on a black card**, on the admin dashboard and on Admin →
Analytics alike.

Both configs need the colours:

- `tailwind.config.js` → `safelist` pattern (so Tailwind emits them at all);
- `postcss.config.js` → PurgeCSS safelist (so the prod build keeps them).

Only the colours our charts pass are listed (`emerald`, `cyan`). Pass a new
one to a Tremor chart and add it to both, or it is invisible again — and if
you only forget PurgeCSS, it works in dev and breaks in prod.

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
               #   ActiveLoanTile, ItineraryMap, MatchCard, …)
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
- Never use a Bootstrap **component** class (`badge bg-*`, `btn btn-*`,
  `spinner-border`, `border-secondary`) on a dashboard surface. Dashboards load
  `bootstrap-utilities.css` + `bootstrap-grid.css` only (the blade gate in
  `app.blade.php`, Sprint 32), so layout utilities — `d-flex`, `gap-*`, `p-*`,
  `row`, `col-md-*` — DO resolve, but component styles do not and the element
  renders unstyled. That is the bare "#1" on the Predict leaderboard and the
  colour-bar tournament pill (Sprint 48), and the invisible passkey spinner on
  the security page (Sprint 56).
- Never use an `admin-*` class in a shared component. `admin-theme.css` is
  loaded by AdminLayout alone, so the 2FA dialog's `admin-card-dark` panel was
  a no-op on the fan and partner security pages and the QR dialog came up in
  shadcn's navy instead of the platform's near-black. The house dialog classes
  are the ones StatusDialog / ConfirmationDialog use (Sprint 56).
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
- Never render a role layout *inside* a page as the only layout. The page's
  own `<AdminLayout>` wrapper is fine — it stands down to a passthrough — but
  the mounted shell comes from `app.jsx`'s persistent-layout assignment. Break
  that and every sidebar click remounts the whole shell again (Sprint 53).
- Never fork the security page per role, or hand-roll a shimmer placeholder.
  Use `Components/Common/AccountSecurity` and `Components/Common/Skeleton`.
- **Never give `.tfe-page` (or any ancestor of page content) `animation-fill-mode:
  both` on a keyframe that mentions `transform`.** The final frame's
  `transform: none` computes to `matrix(1,0,0,1,0,0)` — an identity transform
  is still a transform, so the element becomes a containing block for
  `position: fixed`, and every modal/dialog/overlay rendered inside a page is
  then positioned against the page wrapper instead of the viewport (they hang
  off the bottom of tall pages). Use `backwards` (Sprint 54). Same trap
  applies to the standalone `translate`/`scale`/`rotate` properties, `filter`
  and `will-change: transform`.
- Never hand-write a national colour table for team framing — sample the flag
  (`lib/flagAccent`), which cannot drift from the artwork (Sprint 54).
- Never encode an avatar as JPEG without checking for alpha first. A cut-out
  avatar (a Peeps export, a background-removed photo) loses its transparency
  and lands as a black square inside the team ring (Sprint 55).
- **Never embed UI8 Peeps — or any UI8 asset library — as source layers in a
  TFE builder.** UI8's terms exclude "a UI Kit, theme, or template that allows
  users to extract or edit UI8 assets" and anything that "competes with UI8"
  (Peeps *is* a UI8 avatar builder), and §7 forbids sharing their files with
  "anyone else". We link out to their hosted builder instead: the fan is the
  licensee of the Peep they make, and TFE only ever receives an ordinary
  uploaded PNG. Changing that needs written permission from support@ui8.net
  (Sprint 55).
- Never reference a `route()` name from a role page without checking it is
  registered — `route()` throws at click time, not render time, so the
  partner security page shipped four dead buttons for two sprints (Sprint 53).
- Never let a concluded tournament become the active context. Read
  `tournament_switch_list` (or `switchableTournaments` from the context), not
  `tournament_list`, anywhere the pick CHANGES the session (Sprint 53).
- Never label a tile from a count that means something else. "Registered
  fans" read `User::count()` — every account — so it said 8 while the Fans
  bar in the chart directly beneath it said 2, and "Active tribes" filtered
  on an `active` column `tribes` does not have. If the label and the query
  disagree, one of them is a bug (Sprint 56).
- Never chart a grouped-by-date query without zero-filling it. `GROUP BY
  DATE(created_at)` returns only the days that had rows, so the chart closes
  the gaps and a quiet week reads as a busy one (Sprint 56).
- Never leave a partner surface unscoped "for now". The Sprint 10 global-queue
  fallback was a deliberate transition measure and still shipped six sprints
  later, by which time it meant any partner without listings read every fan's
  travel brief. Scope it, and give the empty case an empty state that explains
  itself (Sprint 56).
- Never rely on route-model binding as an authorization check. `show(Budget
  $budget)` served whatever id it was handed, so a partner could open and
  re-quote a competitor's brief. Authorize against the same scope the list
  query uses (Sprint 56).
- Never read a form field with `$validated['x'] ?? $model->x`. Laravel's
  `ConvertEmptyStringsToNull` turns a cleared field into null *before*
  validation, so `??` cannot tell "emptied" from "not submitted" and writes
  the old value straight back — a partner deleted their tagline, saved, and
  watched it reappear. Check `array_key_exists()` on the validated set
  (`Partner\ProfileController::submitted()`) (Sprint 56).
- Never leave a second surface for something the shared one owns. The admin
  profile carried its own Change Password form (and an `admin.profile.password`
  route) after Sprint 53 gave every role the shared `AccountSecurity` page —
  two password endpoints is exactly how the partner security page drifted into
  four dead buttons. Link to the shared page instead (Sprint 56).
- Never add a form field without checking it has somewhere to land. The fan
  profile's Bio was validated and passed to `$user->update()` for three
  sprints with no `users.bio` column and no `$fillable` key, so every bio was
  silently dropped; the admin profile's "Phone Number" had neither a column
  nor a line in its controller. Type, save, gone — with no error either time
  (Sprint 56).
- Never give an ancestor of page content `overflow` other than `visible` or
  `clip` unless it is genuinely the scroll container. A scroll container that
  never scrolls is what `position: sticky` inside it measures against, so
  every sticky descendant stops sticking — that is how the shell's `<main>`
  silently disabled the sticky live-preview pane on every SplitEditorLayout
  page. `overflow-x-clip` + `min-w-0` contains a wide child without becoming
  one (Sprint 56).
- Never feed `tournament.teams` to a picker unfiltered. That array is every
  wikilink in Wikipedia's "Qualified teams" **table**, so it carries previous
  appearance years, column headers and citation sites — AFCON 2027 offered
  `1962`, `WR`, `FIFA ranking` and `Legit.ng` as teams. Both sides sanitise:
  `WikipediaService::isLikelyTeamName()` at parse time and `isLikelyTeamName()`
  in `resources/js/lib/teamOptions.js` at render; the two mirror each other
  and `tests/Unit/TeamNameSanitationTest.php` +
  `tests/JS/teamOptions.test.mjs` assert the same fixtures against each, so
  change them in the same commit (Sprint 56).
- Never reverse-look-up a flag code through `TEAM_CODES` alone. It is a
  hand-written map of ~50 nations, so 14 of AFCON's 27 configured
  `team_flag_codes` resolved to nothing and silently vanished from the fan's
  team list. Fall back to `Data/countries.js`, which has an ISO code for all
  235 (Sprint 56).
- Never assume a missing image announces itself. `DashboardHero` lands its
  `bgImage` as a CSS `background-image`, so a 404 draws no broken-image icon
  — the hero just loses its backdrop, which is invisible without devtools.
  `payments_hero.png` was referenced by the Wallet and Savings Goals heroes
  and had **never been committed**. Both now use `finance_hero.png`, the
  money-themed backdrop the Budget Calculator already uses, and
  `tests/JS/assetLiterals.test.mjs` asserts every committed image path in
  the client exists on disk (Sprint 59).
- Never write to `fixtures` without calling `FixtureService::clearCache()`.
  `getFixtures()` caches an EMPTY list as readily as a full one, so the
  install you just seeded reads "No matches found" until the TTL lapses —
  and the seeder looks like it did nothing (Sprint 59).
- Never seed a `LoanApplication` status in lowercase. The app writes
  `'PENDING'` and the review endpoint validates
  `in:APPROVED,REJECTED,DISBURSED`, so the finance dashboard counts
  UPPERCASE — lowercase gives a queue full of rows above tiles that all
  read zero (Sprint 59).
- Never use Faker in a demo seeder. A demo you screenshot must look the same
  on every machine and every re-seed, or visual regressions hide in the noise
  and no two screenshots can be compared. Fixed data, `updateOrCreate`
  (Sprint 59).
- Never seed a denormalized count by writing the column. Go through
  `Tribe::addMember()`/`syncCounts()` and the tier increment +
  `Ticket::syncTierTotals()` that the real flows use, or the seeder
  reintroduces exactly the drift those methods exist to prevent (Sprint 59).
- Never hand-roll a progress bar, a numbered step run, or a "Step X of Y"
  caption. Use `StepFlow` (`inline` in a wizard, `docked` for a pinned
  explanatory bar). Four parallel versions is what Sprint 59 had to unpick,
  and the five-step Budget Calculator had none of them (Sprint 59).
- Never put a StepFlow in a dialog whose sections are freely navigable —
  that is what `TfeModal`'s tab rail is for, and two indicators for one
  progression is the duplication this primitive exists to remove. StepFlow
  belongs in a dialog only when the steps are gated (Sprint 59).
- Never render a step sequence as complete by default. A bar with no
  instance behind it is `unstated` — it explains a flow, it does not claim
  the reader is partway through one. Same honesty rule as the seat map's
  `has_inventory` (Sprint 59).
- Never build a consent system a stakeholder already runs. TFE scoped a
  `dependants` table with per-child consent and an age-verification ladder
  before recognising the school holds all of it already. Leaning on a
  stakeholder means leaning on their responsibility, not just their
  inventory (Sprint 61).
- Never store a flag that can disagree with the numbers beside it.
  `involvesMinors()` is derived from `travellers_minors`, so a partner
  cannot read "MINORS INVOLVED" above a party of six adults (Sprint 61).
- Never let a client supply the date on a warranty, and never leave an
  amended declaration wearing the original's timestamp. The consent given
  for a party of 20 minors does not cover the 40 that replaced them
  (Sprint 61).
- Never put a safety-critical fact in a free-text notes field. A note is
  something nobody is obliged to read; the minors flag is a field, rendered
  by `MinorsBadge` on every surface that shows the request (Sprint 61).
- Never have a seeder depend on a user another seeder creates LATER. The
  school group request borrowed `joseph@tfe.com` from `DemoFanActivitySeeder`
  and silently skipped on every fresh install, warning into a log nobody
  reads (Sprint 61).
- Never feed `toISOString()` to an `<input type="datetime-local">`. It wants
  a naive `YYYY-MM-DDTHH:mm`; an ISO string renders the field blank with no
  error, and the UTC conversion shifts the time that was typed. Use
  `toLocalInput()` (Sprint 60).
- Never format a date with `toLocaleDateString` in something a test must
  pin. Its output varies with the host's locale and ICU build, so the same
  row reads differently on two machines (Sprint 60).
- Never `text-transform: capitalize` a chip that renders arbitrary text. It
  exists to prettify a raw slug, and it re-cased every written label handed
  to it — a category of "Running a club" rendered "Running A Club". Case at
  the callsite (`titleCase()` in `lib/utils`), as `.tfe-btn` already
  requires (Sprint 60).
- Never render partner-authored prose with `dangerouslySetInnerHTML`. Same
  stored-XSS reasoning that keeps SVG out of every uploader (Sprint 60).
- Never `ORDER BY` a nullable date without saying where NULL goes. `ORDER BY
  starts_at ASC` puts every undated row FIRST, so the listings with no
  schedule lead a list meant to show what is coming up. `starts_at IS NULL,
  starts_at ASC` (Sprint 60).
- Never add a `partner_type` without adding its label to BOTH
  `DashboardHeader.jsx`'s and `Partner/Sidebar.jsx`'s maps AND
  `PartnerController::partnerTypes()`. A missing entry falls back to a
  generic "Partner" in the chrome while the directory shows the real name
  (Sprint 59).
- Never derive a display label client-side that the server already computes.
  The hub title-cased `partner_type` into "School Community" while the
  directory rendered "Schools & Communities" from `partnerTypes()` — one
  label, two sources, guaranteed to disagree (Sprint 59).
- Never hardcode partner-facing copy that differs by archetype. The hub's
  "how it works" steps told an airline its fan would receive a "Trip
  delivered" for nine sprints; they come from
  `PartnerHubController::stepsFor()` now, beside `featuresFor()` (Sprint 59).
- Never leave a `position: fixed` element inside the page tree when a
  dashboard could mount it. `.tfe-page`'s enter animation makes it a
  containing block for those 220ms and the element visibly jumps on every
  visit — portal it to `document.body` (Sprint 59).
- Never add a second dialog component, and never restyle a form control or a
  button inside one. Everything goes through `TfeModal` + `ModalRow` +
  `ContentCard`, using `.tfe-input` / `.tfe-select` / `.tfe-btn`. Six parallel
  dialogs is what Sprint 58 had to unpick (Sprint 58).
- Never put a dialog's submit button inside the footer expecting it to submit a
  nested form — the footer is a sibling of the pane. Use `form="<id>"` on the
  button and give the form that id (Sprint 58).
- Never render a footer action for a form that the active tab does not show.
  The button silently does nothing (Sprint 58).
- Never close a dialog on a backdrop `click`. A drag that starts inside the
  pane and ends on the backdrop — a text selection that overshoots, the avatar
  cropper's drag — fires one, and the work is thrown away. Close on
  `mousedown` with `e.target === e.currentTarget` (Sprint 58).
- Never put an inline `onClose` arrow in a dialog effect's dependency list.
  It is a new function every render, so the effect re-runs, the saved
  `previousOverflow` captures its own `hidden`, and **the page stays
  unscrollable after the dialog closes**; the focus-restore target is
  clobbered too. Keep the callback in a ref and depend on `open` alone
  (Sprint 58).
- Never nest a scroll container inside a dialog pane. The pane already scrolls,
  and the inner one is what any sticky descendant measures against — the same
  trap as the shell's `<main>` (Sprint 56/58).
- Never import `StadiumBowlCanvas` (or `three`) from a page. Import
  `Components/Common/StadiumBowl`, which owns the `React.lazy` boundary — a
  direct import drags 578KB of WebGL into that page's bundle (Sprint 57).
- Never join a ticket row to the stadium catalogue on `venue_slug`. It is
  partner-supplied and need not match a catalogue key — the seeded Kasarani
  fixture carried `moi-international-sports-centre` against a key of
  `moi-kasarani`, and its `hero_image` named a file that does not exist. Resolve
  by NAME through `StadiumImageService::entryFor()` / `StadiumBowlService::slugFor()`,
  which alias-matches (Sprint 57).
- Never show an occupancy percentage for a venue with no ticket rows. Read
  `has_inventory` and render capacities instead. Inventing one is what
  `Hero.jsx`'s `deriveSoldPct()` did — it hashed the stadium NAME into a
  20-85% "urgency signal" and labelled it "Live". Deleted in Sprint 58, along
  with the SVG `StadiumSeatMap` it fed — the landing hero draws the real
  `StadiumBowl` on real `venueBowls` now. Where occupancy is genuinely unknown
  pass null, never 0: an empty stadium is a claim too (Sprint 57/58).
- Never keep a second, lesser version of a component "for bundle reasons"
  without checking the bundle. The landing hero was left on the old SVG seat
  map to keep `three` off the landing page, but `StadiumBowl` already lazy-loads
  its canvas — the cost was ~6KB, not 578KB, and the platform carried two seat
  maps and two visual languages for a sprint over an assumption nobody measured
  (Sprint 58).
- Never leave a default prop value to drift from the config it mirrors. The
  four landing section components and `Home.jsx` kept bare `assets/img/…`
  constants after Sprint 49 rooted `config/site_sections.php`, because those
  defaults only render when no `cards` prop is passed. Guarded now by
  `tests/JS/assetLiterals.test.mjs`, which scans every client file (Sprint 58).
- Never `increment('sold')` on a `Ticket`. Tier rows own the count;
  `Ticket::syncTierTotals()` derives the parent totals from them (Sprint 57).
- Never trust a client-supplied `ticket_tier_id` without scoping it to the
  fixture in the URL — otherwise a fan can pay a cheap fixture's tier price
  into a dear one. `$ticket->tiers()->whereKey(...)`, never
  `TicketTier::find(...)` (Sprint 57).
- Never quote `tickets.price` as a "from" price once a fixture has tiers. That
  column is the BASE (Standard) price; the cheapest seat is the Upper tier at
  0.6x, and the cheapest *available* one may be dearer still (Sprint 57).
- Never let a component emit two different shapes for the same thing. The seat
  map's legend rendered raw payload rows (`tier_id`) while its 3D canvas
  hit-tested resolved geometry (`tierId`), so picking a tier in the legend
  silently carried no tier id and the fan was charged the base price. Both now
  render `resolveTiers()` output (Sprint 57).
- Never initialise a `useForm` inside a modal that is mounted before its subject
  exists. `useForm` reads its initial values on FIRST mount only, so a
  `<PurchaseModal ticket={null}>` kept a null default tier for the life of the
  page. Mount it conditionally and `key` it (Sprint 57).
- Never position a component's own overlay with `position: fixed`. A transformed
  ancestor — routine inside a modal — becomes its containing block, and the
  tooltip lands somewhere else entirely. Anchor to the component's own stage
  (Sprint 57).
- Never carry a full-viewport camera-framing constant into a panel-sized canvas.
  Fit each footprint axis against the field of view it actually spans (length →
  horizontal, width → vertical) and re-frame on resize, or the bowl sits small
  in a lot of sky (Sprint 57).
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
| 51     | Shared SplitEditorLayout (form-left / sticky-live-preview-right) extracted from the tournament edit page and applied to the Content CMS (Page Heroes + Section Cards) with live previews; SettingField gains an onChange for live-as-you-type |
| 52     | SplitEditorLayout + IdentityPreview rolled onto the admin Profile and Settings (Site Identity) forms; other account forms left as-is (already grids/modals) |
| 53     | Persistent role shells (sidebar clicks stop remounting the world) + global skeletons/page transitions; tournament context restricted to ongoing/upcoming with concluded payloads trimmed; fan avatar off the dead Ready Player Me embed onto MediaLibraryService; fan + partner profiles on SplitEditorLayout; ONE AccountSecurity page for all three roles (admin gains one) |
| 54     | Team-framed photo avatars (TeamAvatar + AvatarCropper, ring colour sampled from the flag artwork) replacing the dead 3D avatar builder; fixed the `animation-fill-mode: both` containing-block trap that mispositioned every in-page modal |
| 55     | Peeps link-out for 3D avatars (UI8's hosted builder, kept out-of-product for licence reasons) + alpha preserved end-to-end through the cropper so a cut-out avatar shows the team ring through it |
| 56     | Account-surface cleanup across all three roles (fan, partner, admin): avatar first, one sticky save bar at the end of the form, read-only panels out of the editor column; supporting team picked in `TeamPickerDialog` instead of an inline 28-tile grid; team option list sanitised (Wikipedia table furniture out) and every configured `team_flag_codes` entry resolved; partner + admin forms regrouped onto `.tfe-form-grid` with a round avatar field; the shared AccountSecurity page gained its own Password card, real sign-in/failure counts and a dialog that is not admin-only-styled; partner dashboard tiles fit one row, its Convert queue stopped showing other partners' briefs (and show/update stopped serving them), and ticketing partners got a dashboard of their own numbers; admin dashboard onto the same primitives with tiles that agree with the chart beneath them, the dead `userGrowth` query turned into a zero-filled chart, and Tremor's colours safelisted so the bars are not black; the admin profile's duplicate password form gave way to a link to the one AccountSecurity page and it can finally set an avatar; sticky panes fixed platform-wide (the shell's `<main>` was a scroll container) and three silent save bugs (fan bio had no column, partner fields could not be cleared, admin phone had neither column nor controller) |
| 57     | 3D stadium seat map ported from prototype to `Components/Common/StadiumBowl` (parametric Three.js bowl, per-venue roofs + footprints from `config/stadiums.php`, lazy-chunked so `three` never reaches another page) on the fan ticket modal, budget-calculator results and package detail; tiered ticket inventory (`ticket_tiers`) so the four tiers are real data rather than placeholders, with the tier picker wired THROUGH the map; `StadiumBowlService` as the one payload; a `has_inventory` flag so a ground with no fixtures stops inventing an occupancy figure; Talanta renamed to Raila Odinga International Stadium; fixed the seeded Kasarani fixture's wrong catalogue slug and non-existent hero image |
| 58     | Landing hero stopped fabricating seat availability (`deriveSoldPct` deleted) and then moved onto the real 3D `StadiumBowl` like every other surface — the SVG `StadiumSeatMap` is gone entirely, and the lazy canvas boundary means the landing bundle pays ~6KB rather than the 578KB that had been assumed and every bare `assets/…` constant in the client got its leading slash back with a test that scans for regressions. One dialog for the whole platform: `TfeModal` redesigned as a tabbed shell (identity + section rail left, active section right, actions bottom) after the Dribbble settings-modal reference, with `ModalRow` for labelled settings and `ContentCard` for grouping; six parallel implementations folded into it (`DashboardModal` + its private stylesheet, `LandingModal`, a dead `Modal.jsx`, and the shadcn `Dialog` behind ConfirmationDialog / StatusDialog / ShareModal / 2FA setup) across ~30 call sites; the partner listing form, ticket purchase and landing card dialogs gained real tabs; found and fixed a scroll-lock leak that left the page unscrollable after closing, a ShareModal with no imports at all (Share crashed on three pages), and a footer button targeting a form its tab did not render |
| 59     | `StepFlow` extracted from the partner hub's docked "how it works" bar into the ONE step-sequence primitive (docked + inline variants, opt-in progress, portalled out of the page tree, a compact rendering that replaces a row of bare numerals below 640px); the hub's steps became per-archetype server-side copy via `PartnerHubController::stepsFor()` instead of one hardcoded pipeline shown to airlines and betting sponsors alike; the five-step Budget Calculator wizard gained the progress indicator it never had; then all four parallel indicators migrated onto it — Register's hand-rolled progress bar (whose `completed` style was dead CSS, so a finished step looked like the current one) and the financing wizard's bare "Step X of Y", with the ticket purchase modal deliberately left on `TfeModal`'s tab rail; then demo data so every surface has something on it — 52 AFCON 2027 fixtures (the default tournament had none, since all 104 seeded fixtures belonged to the concluded wc_2026) and a fan cohort whose budgets, loans, ticket purchases and tribes are also what fill the three partner dashboards; and the Schools & Communities archetype (`school_community`) landed on that same machinery — a five-step institutional journey through StepFlow, archetype-aware hub pillars replacing the travel-agent copy every partner was shown, a `program` listing type, and a seeded East Africa Schools Sports partner with six programmes |

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
