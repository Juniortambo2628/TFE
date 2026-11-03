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

## B1 — hero tournament card (3 Nov 2026)

| Viewport | Card height before | Card height after | Stadium photo visible after |
|---|---|---|---|
| Phone 390×760 | ~620px (covers the photo) | 220px | 71% |
| iPhone SE 375×667 | ~640px (CTA near the fold) | 220px | 67% |
| Tablet 768×1024 | unchanged (full card) | 383px | 63% |
| Desktop 1280×800 | unchanged | unchanged | — |

On phones the card keeps the tournament, a one-line countdown and the two CTAs
side by side, pinned above the flag strip. The tagline, countdown dials and
host countries are one tap away behind the card's ⓘ. Guarded by
`tests/e2e/hero.spec.js`.

**Seen in `before/`, still open:** on phones the logo overlaps the stadium-name
badge (B3), and at 1280×800 the desktop card runs under the slider arrows and
past the bottom of the screen. That is unchanged by this work and is worth
fixing alongside B3.
