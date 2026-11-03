# Plan: deliverables from the 2 Nov UX review

Source: [`2026-11-02-ux-review.md`](./2026-11-02-ux-review.md). Drafted 3 Nov 2026.

**The goal.** Give the tester group two versions of the landing page to compare, both of them good on a phone, before TFE goes back to Ecobank:

- **v1:** the current site, with the mobile problems from the review fixed.
- **v2:** a new landing page built on the Najenga/Naoa structure.

Everything below is grouped into tracks that can run side by side.

---

## Two findings that shape the plan

1. **We can't install `@okjt/site` in TFE; we rebuild its structure natively.**
   The kit expects Tailwind **v4** (`@import "tailwindcss"` / `@source`) and imports
   `Link`/`NavLink`/`useLocation` from **react-router-dom** in 8 of its modules.
   TFE runs Tailwind **v3** with PurgeCSS and Bootstrap utilities, on **Inertia**.
   Getting the kit in would mean either a Tailwind upgrade across every dashboard
   or a react-router shim around Inertia, and neither is worth it for one page.
   TFE already has most of the parts:

   | Najenga/Naoa kit piece | TFE equivalent today |
   |---|---|
   | `PhotoHero` + hero panel | `PageHero` (+ `media`, `ctas`, `children`) / `Hero.jsx` |
   | `ImageCard` | `AccentCard`, `LandingCard` |
   | Numbered journey | `StepFlow` (`inline`), steps from the server like `stepsFor()` |
   | `SectionNav` (scroll-spy bar) | **missing**: build `Components/Landing/SectionNav.jsx` |
   | `FeatureExplorer` (tabbed area + screen) | **missing**: build `Components/Landing/FeatureExplorer.jsx` |
   | Facts strip | `.tfe-stat-grid` / `.tfe-tile` |
   | `FaqSection` | **missing**: small `Components/Landing/Faq.jsx` |
   | Per-audience `Journey` page | `SectionPageShell` + new pages |

   So **v2 means three new components plus a new page**, not a new design system.

2. **Some deliverables are already partly built.** The partner type `hotel_provider`
   exists, as do `school_community` and institution accounts. Paystack checkout is
   opt-in via `PAYSTACK_SECRET_KEY`. The Ecobank virtual card is a demo on a
   separate route (`fan.virtual-card`) and is **not** connected to Paystack. Nothing
   records commission or which partner a booking was discovered through. Admin
   analytics only counts referrals per partner.

---

## Timeline (proposed, for you to post on the group)

| Week | Dates | What ships | Who |
|---|---|---|---|
| 0 | Tue 3 – Thu 5 Nov | Timeline posted, tester group + protocol out, mobile baseline screenshots, partner categories requested | Kevin, Steven |
| 1 | Thu 5 – Wed 11 Nov | **v1 mobile fixes** live on the current site; pitch fact sheet (Paystack, card, domain) | Kevin |
| 2 | Thu 12 – Fri 20 Nov | **v2 landing** live at `/v2`, plus the walkthrough pages | Kevin |
| 3 | Mon 23 – Fri 27 Nov | **Test round 1** on v1 and v2, with feedback collected in one sheet | Testers |
| — | ~Mon 30 Nov | **Review meeting**: pick a direction, then plan the merge and the next round | All |

In parallel, Kevin writes the hotel partner proposal (week 1–2) and Steven and Tony do the schools/academies groundwork. The Ecobank date depends on the Turkey contact; whichever version wins the test should be live by then.

---

## Track A: set up testing (Week 0, about 1 day)

- [ ] **A1. Post the timeline** above on the group.
- [ ] **A2. Tester group.** Five to eight people: Steven, Eric, Tony, and three to five trusted outsiders who are *not* football fans or tech-savvy (Steven's "idiot-proof" test). Cover iPhone, Android, Windows and Mac.
- [ ] **A3. Testing protocol** (one page, sent with each round):
  - Tasks, timed and click-counted:
    1. Find a trip to a match in Nairobi and get a price.
    2. Book a featured package.
    3. Find a hotel or airline partner.
    4. Join a tribe.
    5. Get back to the home page from three screens deep.
  - Run each task on **v1** (`/`) and **v2** (`/v2`), alternating which version goes first.
  - Record device, OS and browser, time taken, where they got stuck, and a 1–5 rating.
- [ ] **A4. Feedback sheet.** One Google Sheet (the connector is available) with a row per tester × task × version, so the round can be summarised in one place.
- [x] **A5. Baseline.** *(Done 3 Nov: `docs/meetings/shots/before/`, via `scripts/ux-shots.mjs`.)* Before changing anything, take Playwright screenshots of the landing page, planner, partner hub, booking page and fan dashboard at 390px, 768px and 1280px. These are the "before" images for the review. `playwright.config.js` already has `desktop` and `phone` projects.
- [ ] **A6. Ask Steven for the partner categories** (blocks B5 and C2). Until he replies, use the current `partner_type` set, grouped as Travel & stays (travel agent, hotel provider, airline), Money (finance partner), Tickets & events (ticketing, event organiser), and Football (club, federation, school/community, sponsor).

## Track B: v1 mobile fixes (Week 1, about 4 days)

These go to the current site directly, so even v1 is fair to test on a phone.

- [x] **B1. Hero widget on mobile** *(Done 3 Nov: compact card, 71% of the photo visible at 390×760; see `docs/meetings/shots/README.md`.)* (`Components/Hero.jsx` ~L439–581, hero CSS).
  - Below 768px, the tournament `AccentCard` turns into a **compact bottom strip** over the carousel: tournament name, a single-line countdown (`12d 04h`) instead of four SVG dials, and the two CTAs as pills.
  - Details (hosts, dates) move behind an ⓘ that opens a `TfeModal`.
  - Done when the stadium photo is visible on at least 60% of a 390×760 viewport.
- [ ] **B2. Clearer stadium CTAs.** Change the labels to "Matches at {stadium}" / "Plan a trip to {city}", and put a small "Now showing: {stadium}" chip on the slide. `openTripPlanner` already accepts a match hint; pass the venue too.
- [ ] **B3. Bigger logo.**
  - Move the inline `maxHeight: 70px` on `Header.jsx` L62 into CSS. The house rule is no inline styles on shared components.
  - Raise it: around 88px on desktop, and as large as the bar allows on mobile.
- [ ] **B4. Labelled mobile navigation.**
  - Add a **bottom tab bar** on public pages below 992px with labelled icons: **Plan a trip · My trips · Partners · Tournaments · Menu**.
  - Portal it to `<body>`, like `MobileActionBar` and `StepFlow` docked (the `.tfe-page` containing-block trap).
  - "My trips" goes to `fan.itineraries`, which sends guests to sign-in.
  - Keep the hamburger for everything else, but label it "Menu".
- [ ] **B5. Home/Back everywhere.**
  - Add a back button and breadcrumb to `SectionPageShell` / `PageHero`, covering the partner hub, listing page, tournament page, tribes and learning hub.
  - Add a "← Back" step control in `TripPlannerDialog`.
  - Inside dashboards, the sidebar and header already provide this; check the booking page on a phone.
- [ ] **B6. Mobile pass on the booking path.** Planner → sign-up → booking → pay at 390px. Fix anything that overflows or hides the Pay button.
- [ ] **B7.** Extend `tests/e2e` with a phone check that the hero CTAs and the tab bar are visible and tappable.

## Track C: v2 landing on the Najenga/Naoa structure (Week 2, about 6–7 days)

- [ ] **C1. Routing.** Add `/v2` (`HomeController@homeV2` → `Pages/HomeV2.jsx`) with `noindex`, reachable but unlinked. Both versions stay live for the test. The shared header gets no switcher, so testers compare clean pages.
- [ ] **C2. Page structure** (each section is its own component in `Components/Landing/V2/`):
  1. **Hero:** the stadium carousel stays full-bleed, with only a headline and two CTAs (Plan my trip / See how it works). Below it, a **hero panel** in the shape of Najenga's `HeroPanel`: "About TFE" plus audience cards for **Fans, Partners, Schools & Academies**.
  2. **Facts strip:** tournaments, host cities, matches, verified partners. These are real counts from the server, never typed in.
  3. **`SectionNav`** (new): sticky, scroll-spy, chips on mobile.
  4. **Fan journey:** pick a match → get an estimate → book → pay → travel. Each step links to the feature that does it.
  5. **`FeatureExplorer`** (new):
     - Areas: Plan & budget, Book & pay, Tickets & seat map, Financing & savings, Tribes & community.
     - Each area shows a desktop screenshot **and** a phone screenshot (the "interactive preview" Kevin described).
     - Screenshots come from Playwright against the seeded demo, so they stay reproducible (the Sprint 59 rule).
  6. **Featured packages:** reuse `FeaturedPackages`, rendered as a carousel in v2 and a grid in v1, which answers Steven's scroll-vs-static question in the same test.
  7. **Partners:** categories from A6. Each one links to `/partners?type=…` and to its walkthrough.
  8. **Community preview:** reuse `CommunityPreview`.
  9. **FAQ** (new `Faq.jsx`): include "Do I need an account?", "Can I pay with M-Pesa?", "Does it work on my phone?" and "How do partners join?".
  10. **Closing CTA.**
- [ ] **C3. Walkthrough pages:** `/for-fans`, `/for-partners`, `/for-schools`, on `SectionPageShell`. Each is a step-by-step chapter page in the shape of Najenga's `Journey.jsx`, ending in the right CTA:
  - Fans: Plan my trip.
  - Partners: become a partner (contact form → admin).
  - Schools: `/register/institution`.
- [ ] **C4. Copy in config, not JSX:** add `config/landing_v2.php` with CMS overrides through the existing `SiteSetting` pattern, so the team can edit the wording without a deploy.
- [ ] **C5.** Run the quality gate (`pint`, `phpunit`, `test:js`, e2e), and add `/v2` and the walkthrough pages to the phone smoke test.

## Track D: pitch readiness (Week 1, about 1 day, Kevin)

- [ ] **D1. Paystack status.** Check whether `PAYSTACK_SECRET_KEY` is set on the VPS (`shared/.env`). If it isn't, the site runs the partner-checkout fallback. Decide whether to switch on Paystack test mode for the pitch.
- [ ] **D2. Card story.** Write a short paragraph for the deck:
  - Paystack (card and M-Pesa) is how a fan *pays* TFE or a partner.
  - The Ecobank virtual card is what the *bank* issues. The demo shows it, but it is not issued through Paystack.
  - With a real integration, the card would be the bank's product, and TFE would link to it the way it links to savings (`App\Savings\SavingsProvider`).
- [ ] **D3. Domain.** Quote registration and transfer costs for TFE's own domain, plus the DNS and certificate change on the Hestia VPS. Add the steps to `docs/deploy/vps.md`.
  - **Note:** moving domains changes the session cookie domain. `ForgetShadowedCookies` handles the 419s, but plan the cut-over.

## Track E: hotel partner model (Weeks 1–2, write-up first, Kevin)

A proposal at `docs/proposals/hotel-partners.md`, in the shape of `bank-partner-savings.md`, to review before building anything:

- [ ] **E1. Onboarding.** A "Become a partner" form → admin verification → a `hotel_provider` account with a hub. The type already exists; check its `stepsFor()`/`pillarsFor()` copy is hotel-specific rather than the travel-agent copy.
- [ ] **E2. Attribution.** How a booking records the partner a fan discovered it through: `bookings.source_partner_id` plus a referral parameter on hub and listing links. This data is what commission is calculated from.
- [ ] **E3. Commission.** A rate per partner agreement, a monthly statement in the partner dashboard, and an admin report. Recommend that the rate lives on the partner profile, set by admin only.
- [ ] **E4. Interest report.** For hotels with no listings yet: "N fans looking at stays in {city} for {dates}". This uses the Convert-queue scoping rules, so it shows aggregates only and never another partner's briefs (Sprint 56).
- [ ] **E5. Rates.** Tony's point: hotels negotiate on bed-nights × dates. Can the planner's saved budgets give that aggregate demand number? That number is what makes the first conversation easy.

## Track F: schools & academies (Steven and Tony lead; Kevin supports)

- [ ] **F1.** Steven and Tony collect the schools/academies to approach and what each would publish.
- [ ] **F2. Kevin:** make sure the `school_community` hub shows a link to the school's own website (a `website` field on `PartnerProfile`, if one isn't there already). Add academies to the "who it's for" panel in C2.
- [ ] **F3.** The Turkey amputee-football tournament: when the details arrive, add it as a tournament in `config/tournaments.php` (or as an `event` listing if it doesn't need a full tournament), so it can be shown to Ecobank.

---

## Order of work, starting now

1. **Today:** A1, A6, A5 (baseline screenshots), then B1. B1 is the most visible fix and the one Steven raised first.
2. **This week:** the rest of Track B and D1–D3.
3. **Next week:** Track C, with the E write-up shared on the group.
4. **Week of 23 Nov:** the test round; Kevin consolidates and brings it to the review.

## Open decisions (defaults assumed above)

- **A/B mechanism:** a separate `/v2` route (assumed), or a toggle in admin settings? `/v2` lets a tester open both versions side by side.
- **Mobile nav pattern:** bottom tab bar (assumed), or a labelled menu at the top?
- **Guest sign-up before booking:** keep it for this round (assumed). Moving it to checkout is a bigger change; revisit after testing.
- **Native app:** not in this round. If the mobile test goes well, the next step is installable web (PWA), not a native build.
