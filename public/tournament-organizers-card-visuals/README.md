# Tournament organiser card visuals

These organiser brand images are used two ways:

1. the background watermark on the hero **tournament card** (the landing hero
   card), and
2. the hero background of each **tournament single-view page**
   (`/tournaments/{slug}`).

The path for each tournament is configured in `config/tournaments.php` under
`organizer_card_bg` and can be overridden per tournament in the admin CMS
(`SiteSetting` key `tournament_card_bg_{tournament_id}`).

| Tournament | File |
|------------|------|
| AFCON 2027 (`afcon_2027`) | `CAF-AFCON-visual-cardbg.png` |
| World Cup 2026 (`wc_2026`) | `FIFA-world-cup-visual-cardbg.png` |
| Euro 2024 (`euro_2024`) | `UEFA-euros-visual-cardbg.png` |

Filenames are **case-sensitive** on the server. Served publicly at
`/tournament-organizers-card-visuals/<file>`. A missing file is hidden
gracefully (the card/hero just shows no watermark). After changing the config
path, clear the `TournamentService` cache (`php artisan cache:clear` or the
admin **Settings → Refresh tournaments** button) — the payload is cached 24h.
