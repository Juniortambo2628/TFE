/**
 * assetPath — turn any stored image reference into a URL that resolves from
 * ANY route, not just the site root.
 *
 * Why this exists
 * ---------------
 * Paths are stored all over the platform without a leading slash —
 * `assets/img/backdrops/ball-on-field.jpg` in config/tournaments.php,
 * `assets/img/IMG-15.jpg` in the landing card arrays, `page_hero_*_background`
 * in SiteSetting. A browser resolves a relative src against the CURRENT
 * directory, so the moment one of those renders on a nested route it asks for
 * the wrong URL:
 *
 *     on /            → /assets/img/backdrops/ball-on-field.jpg   ✓
 *     on /admin/content → /admin/assets/img/backdrops/ball-on-field.jpg  ✗ 404
 *
 * That is the whole reason those three backdrop 404s only ever appeared on
 * admin pages. Rather than hunt every call site (and lose again the next time
 * someone adds one), the shared image primitives run their src through this,
 * so a relative path is corrected no matter who passes it.
 *
 * Left untouched: absolute URLs (http/https/protocol-relative), data: and
 * blob: URIs (ImageUpload previews), and anything already rooted at `/`.
 */
export function assetPath(value) {
    if (!value || typeof value !== 'string') return value;

    const trimmed = value.trim();
    if (trimmed === '') return trimmed;

    // Already absolute, a data/blob URI, or already root-relative.
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(trimmed)) return trimmed;

    return '/' + trimmed.replace(/^\.?\//, '');
}

export default assetPath;
