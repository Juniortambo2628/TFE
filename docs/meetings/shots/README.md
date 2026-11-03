# UX round screenshots

Taken with `scripts/ux-shots.mjs` against a freshly seeded local app
(`php artisan migrate:fresh --seed`), so every round shows the same demo data.

```bash
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/ux-shots.mjs <label>
```

| Folder | What |
|---|---|
| `before/` | The site as reviewed on 2 Nov 2026: home (full page, hero, mobile menu), trip planner, partners directory, a partner hub, tribes, and the fan dashboard / itineraries / budget calculator, at phone 390×760, tablet 768×1024 and desktop 1280×800. Full-page captures are 1×; viewport captures are 2×. |
| `after-hero/` | Plan item B1, the compact tournament card on phones. |
| `after-tabbar/` | Plan item B4, the bottom tab bar: home (guest with cookie banner, and after consent), menu open, planner open, end of page, partner hub — phone, iPhone SE, tablet; desktop shows no bar. |
| `after-backnav/` | Plan item B5, Back + breadcrumb: about, partner hub, listing, tribes (phone + desktop), tournament (phone). |
| `after-stadium/` | Plan item B2, stadium-aware hero CTAs: phone, iPhone SE, tablet, desktop, 1280×800, 1366×768; the planner opened from "Trip to Nairobi"; the phone details dialog. |
| `booking-path/` | Plan item B6, the booking path on a phone, screen by screen: `before/`, `after/` (390×760), `after-se/` (375×667), `after-production-like/` (with email verification and no Paystack key, as production may run). Rerun with `scripts/booking-path-walk.mjs`. |
| `after-logo/` | Plan item B3, the larger logo (home, home scrolled, partners, a partner hub; phone + desktop). |

## B1 — hero tournament card (3 Nov 2026)

| Viewport | Card height before | Card height after | Stadium photo visible after |
|---|---|---|---|
| Phone 390×760 | ~620px (covers the photo) | 220px | 71% |
| iPhone SE 375×667 | ~640px (CTA near the fold) | 220px | 67% |
| Tablet 768×1024 | unchanged (full card) | 383px | 63% |
| Desktop 1280×800 | unchanged | unchanged | — |

On phones the card keeps the tournament, a one-line countdown and the two CTAs
side by side. It sits at the TOP of the hero, under the stadium badge (moved there
from the bottom on 3 Nov: every stadium photo has the ground in its lower half,
so a bottom card still covered it; up top it covers sky). Same placement below
1200px, where the map is hidden. See `after-stadium/home-hero-top--*.jpg`. The tagline, countdown dials and
host countries are one tap away behind the card's ⓘ. Guarded by
`tests/e2e/hero.spec.js`.

## B3 — logo (3 Nov 2026)

| Width | Logo before | Logo after | Scrolled header |
|---|---|---|---|
| Desktop (≥992px) | 70px | **88px** | 72px |
| Tablet / phone | 70px | **80px** | 64px |

The header's own padding shrank by what the logo gained, so the header is
still 126px / 110px tall and no page moved. Two overlaps under the logo,
both visible in `before/`, are fixed: the phone hero's stadium badge (now
below the header) and the partners directory's eyebrow, at every width.
Guarded by `tests/e2e/hero.spec.js`.

## B4 — bottom tab bar (3 Nov 2026)

Phones and tablets (below 992px), every public page: **Plan a trip · My trips ·
Partners · {tournament, e.g. AFCON 2027} · Menu**, always visible and labelled.

- *Plan a trip* opens the trip planner. *My trips* goes to the fan's
  itineraries; a guest is sent to sign in and lands there afterwards (checked).
  Admins and partners get *Dashboard* instead. *Menu* opens the existing site
  menu and turns into *Close*.
- The hero is now the screen minus the bar (the flag strip and the tournament
  card end where the bar begins); the cookie banner and the partner hub's
  docked steps bar sit above it; page content is padded so the footer clears it.
- Hidden from 992px up. Guarded by `tests/e2e/tabbar.spec.js`.

## B5 — Back button + breadcrumb (3 Nov 2026)

Every public page except Home: **← Back**, then the trail —
Home › Partners › Serengeti Sports Travel › Matchday Transfers & Local Guide.
On phones the trail is the Home icon and the parent only (all levels at 390px
truncated to "H… › Par… › Serengeti Spo…").

- **Back retraces the visit but never leaves the site.** Moving around TFE,
  it is the browser's back. A page opened from outside (a shared link,
  search) goes up to its parent instead, and keeps climbing: partner page →
  Partners → Home. `lib/navHistory.js` keeps the record of this tab's visits.
- The trip planner already had Back between its steps; unchanged.
- Guarded by `tests/JS/navHistory.test.mjs` and `tests/e2e/backnav.spec.js`.

## B2 — stadium buttons (3 Nov 2026)

The hero card now says which stadium its buttons act on: **Now showing:
Raila Odinga International Stadium · Nairobi**, following the carousel, with
**Matches here** (that stadium's schedule) and **Trip to Nairobi**, which
opens the planner on that stadium's matches (its name in the filter box, so
the short list explains itself). A ground with no fixtures (Kipchoge Keino)
opens the full list rather than an empty one. The details dialog repeats the
same two buttons.

**Laptop overflow fixed with it.** At 1280×800 the desktop card ran past the
bottom of the screen and under the slider arrows (seen in `before/`), and the
new line made it worse. On wide screens the four countdown dials now fit one
row, the title takes the card's width, the tagline is capped at three lines,
the slider arrows sit bottom-left under the map, and short screens (≤820px
tall) trade top padding for bottom. Measured with no overlap and the CTAs on
screen at 1200×800, 1280×800, 1366×768, 1440×900, 1536×864 and 1920×1080.

Phone card: 263px (56–62% of the photo visible), up from 220px for the new
line. Guarded by `tests/e2e/hero.spec.js` and `tests/JS/tripPlanner.test.mjs`.
