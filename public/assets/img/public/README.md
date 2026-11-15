# Public-page photography

Generated images for the public pages (not the landing page). The prompts,
file names and shapes are in the "TFE public-page image prompts (Gemini)"
Google Doc — one tab per placement (H01–H13 heroes, C01–C20 cards).

A placement switches to its photo only once its file is committed here
(`App\Support\PublicImages::photo()`), so a missing file keeps the current
image rather than rendering broken. Use the exact file names from the doc,
WebP, ~1920px on the long edge for heroes and ~1200px for cards.
