# Stadium hero imagery

Locally-hosted venue photography for the hero slider, the budget calculator's
stadium picker and the fan match cards. These replaced a runtime Wikipedia
thumbnail fetch, which was slow (one summary request per venue before the hero
could paint) and unpredictable (the thumbnail is whatever the article's lead
image happens to be that week).

Files are grouped per set: `public/stadiums/<SET>/<slug>_hero.webp`, served
publicly at `/stadiums/<SET>/<slug>_hero.webp`.

`<slug>` **must** match the catalogue key in `config/stadiums.php` — that is the
join between a venue name and its image, and there is no stadium table to fall
back on. The slug is shown next to each venue in the admin editor for exactly
this reason.

| Set     | Tournament            | Venues |
|---------|-----------------------|--------|
| `AFCON` | AFCON 2027 (`afcon_2027`) | 12 |

## Rules

- **Commit the files.** Same rule as `public/tournament-organizers-card-visuals`
  — the deploy workflow rsyncs `public/` to the docroot, so an uncommitted image
  simply never ships. `public/storage` is gitignored; don't put them there.
- **WebP, ~1920px wide, 90–220KB.** Already optimized — don't re-compress.
- **Filenames are case-sensitive** on the server.
- A missing file degrades gracefully: the hero falls back to the tournament
  backdrop, the budget calculator to its generic stadium shot, and the admin
  editor shows a "failed to load" note rather than a torn-image icon.

## Overriding an image

Admins replace any single image from **Admin → Content → Stadium Images**. The
upload is stored as `SiteSetting` key `stadium_image_{slug}` and wins over the
committed default, which stays on disk — so **Reset to Default** always works
and a bad upload never needs a redeploy to undo.

Editing `config/stadiums.php` directly needs the caches cleared
(`php artisan cache:clear`, or the admin **Settings → Refresh tournaments**
button): the resolved catalogue is cached 15 minutes and the assembled
tournament payload 24 hours.
