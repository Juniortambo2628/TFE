# Tournament organiser card visuals

These images are the background watermark on the hero **tournament card**
(the AFCON / World Cup / Euros card in the landing hero). The path for each
tournament is configured in `config/tournaments.php` under `organizer_card_bg`
and can be overridden per tournament in the admin CMS
(`SiteSetting` key `tournament_card_bg_{tournament_id}`).

Drop the PNGs here with **exactly** these names (the server filesystem is
case-sensitive, unlike Windows/WAMP):

| Tournament | File |
|------------|------|
| AFCON 2027 (`afcon_2027`) | `CAF-AFCON-visual-cardbg.png` |
| World Cup 2026 (`wc_2026`) | `FIFA-world-cup-visual-cardbg.png` |
| Euro 2024 (`euro_2024`) | `UEFA-euros-visual-cardbg.png` |

They must be **committed to the repo** (not just present on your local WAMP)
so they deploy — otherwise the card falls back to no watermark (the code hides
the image gracefully on a 404). Served publicly at
`/tournament-organizers-card-visuals/<file>`.
