/**
 * stadiumBowl — the pure geometry behind the 3D seat map.
 *
 * Deliberately JSX-free and dependency-free so `node --test` can load it
 * directly (same reason as `lib/pageSkeleton.js` and `lib/flagAccent.js`).
 * Nothing here touches three.js, the DOM or React; the renderer that consumes
 * it is `Components/Common/StadiumBowl3D.jsx`.
 *
 * The bowl is a GENERIC parametric shape, not an architectural replica.
 * Public blueprints do not exist for most AFCON 2027 grounds — several are
 * still under construction — so a real footprint, the right number of tiers
 * and each venue's documented roof character is as far as this goes.
 */

/**
 * Tier radii, in bowl units, for a REFERENCE_CAPACITY ground.
 *
 * The four keys match `App\Models\TicketTier::KEYS`, and the ring areas these
 * radii describe are what `TicketTier::BLUEPRINT`'s seat shares are derived
 * from — see `tierAreaShares()`. Change a radius here and that PHP blueprint
 * has to move with it, or a tier will look like a third of the bowl while
 * holding a fifth of its seats. `tests/JS/stadiumBowl.test.mjs` and
 * `tests/Unit/TicketTierBlueprintTest.php` assert the two against the same
 * numbers.
 *
 * Colours stay inside the locked palette (red / white / charcoal): the tiers
 * run from near-white at the VIP ring to near-black red at the Upper.
 */
export const REFERENCE_CAPACITY = 60000;

export const BASE_TIERS = [
    { key: 'vip', name: 'VIP', color: 0xf5eeee, innerR: 14, outerR: 22, height: 3.0 },
    { key: 'premium', name: 'Premium', color: 0xe8a3ab, innerR: 22, outerR: 34, height: 4.2 },
    { key: 'standard', name: 'Standard', color: 0xc23349, innerR: 34, outerR: 50, height: 5.6 },
    { key: 'upper', name: 'Upper', color: 0x7a1220, innerR: 50, outerR: 68, height: 7.0 },
];

/** Footprint proportions: length along the pitch, width across it. */
export const LEN_K = 1.32;
export const WID_K = 0.85;

/** Roof generators the renderer knows how to draw. */
export const ROOF_STYLES = ['shield', 'dome', 'arch', 'crown', 'petal', 'facet', 'canopy'];

/**
 * Proportion of the bowl's seating area each tier covers.
 *
 * Area of a ring goes as outerR^2 - innerR^2, and since every tier is the same
 * footprint scaled, the footprint constants cancel — so this is exact without
 * integrating the real discorectangle outline.
 *
 * @returns {Record<string, number>} tier key => share, summing to 1.
 */
export function tierAreaShares() {
    const areas = BASE_TIERS.map((t) => t.outerR * t.outerR - t.innerR * t.innerR);
    const total = areas.reduce((s, a) => s + a, 0);

    return BASE_TIERS.reduce((out, tier, i) => {
        out[tier.key] = areas[i] / total;
        return out;
    }, {});
}

/**
 * Scale the reference tiers to a venue's real capacity.
 *
 * Radius goes as sqrt(capacity) because capacity tracks stand AREA, not a
 * linear dimension. The pitch is NOT scaled — a regulation pitch is the same
 * size in a 15,000-seat ground as in a 60,000-seat one, and scaling it is what
 * makes a small stadium read as a scale model of a big one.
 */
export function tiersForCapacity(capacity) {
    const safe = Number(capacity) > 0 ? Number(capacity) : REFERENCE_CAPACITY;
    const scale = Math.sqrt(safe / REFERENCE_CAPACITY);

    return BASE_TIERS.map((t) => ({
        ...t,
        innerR: t.innerR * scale,
        outerR: t.outerR * scale,
        height: t.height * scale,
    }));
}

/**
 * Distance from the centre to the footprint outline at `angle`.
 *
 * A real stadium footprint is a rounded rectangle — two straight sides joined
 * by rounded corners — not an ellipse. An athletics track forces the ends into
 * full semicircles (a discorectangle, `cornerRatio` null/1); a football-only
 * bowl pulls its corners in, which `cornerRatio` (0..1) controls.
 *
 * Solves three cases in order: the straight long side, the straight end, then
 * the corner arc (a ray/circle intersection).
 */
export function discoRadius(angle, halfLen, halfWid, cornerRatio) {
    const ratio = cornerRatio === undefined || cornerRatio === null ? 1 : cornerRatio;
    const r = halfWid * ratio;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const ax = halfLen - r;
    const az = halfWid - r;

    if (Math.abs(dz) > 1e-6) {
        const zTarget = dz > 0 ? halfWid : -halfWid;
        const t = zTarget / dz;
        if (Math.abs(dx * t) <= ax + 1e-6) return t;
    }

    if (Math.abs(dx) > 1e-6) {
        const xTarget = dx > 0 ? halfLen : -halfLen;
        const t = xTarget / dx;
        if (Math.abs(dz * t) <= az + 1e-6) return t;
    }

    const ccx = dx >= 0 ? ax : -ax;
    const ccz = dz >= 0 ? az : -az;
    const b = -2 * (dx * ccx + dz * ccz);
    const c = ccx * ccx + ccz * ccz - r * r;
    const disc = Math.max(0, b * b - 4 * c);

    return (-b + Math.sqrt(disc)) / 2;
}

/** The footprint outline point at `angle` for a bowl of radius `R`. */
export function stadiumXZ(angle, R, cornerRatio) {
    const t = discoRadius(angle, R * LEN_K, R * WID_K, cornerRatio);

    return [Math.cos(angle) * t, Math.sin(angle) * t];
}

/**
 * Deterministic RNG, so the scattered environment (trees, skyline) is laid out
 * identically on every render of the same venue rather than reshuffling.
 */
export function seededRandom(seed) {
    let s = seed;

    return function next() {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

/** A stable seed from a venue slug. */
export function seedForSlug(slug) {
    const str = String(slug || 'venue');
    let h = 1337;

    for (let i = 0; i < str.length; i += 1) {
        h = (h * 31 + str.charCodeAt(i)) % 233280;
    }

    return h;
}

/**
 * Join the server's tier rows (StadiumBowlService) onto the geometry.
 *
 * The payload is the source of truth for names, prices and occupancy; this
 * module is the source of truth for where each ring sits. A tier the payload
 * does not mention is dropped rather than drawn empty, and `booked` is null —
 * not 0 — when there is no inventory behind the bowl, so the renderer can
 * shade honestly instead of showing an empty stadium.
 *
 * @param {Array} payloadTiers rows from StadiumBowlService
 * @param {number} capacity    the venue's capacity, for radius scaling
 */
export function resolveTiers(payloadTiers, capacity) {
    const geometry = tiersForCapacity(capacity);
    const bySlug = new Map((payloadTiers || []).map((t) => [t.key, t]));

    return geometry
        .filter((g) => bySlug.has(g.key))
        .map((g) => {
            const row = bySlug.get(g.key);
            const pct = row.sold_pct;

            return {
                ...g,
                name: row.name || g.name,
                tierId: row.tier_id ?? null,
                price: row.price ?? null,
                capacity: row.capacity ?? null,
                sold: row.sold ?? null,
                remaining: row.remaining ?? null,
                isSoldOut: Boolean(row.is_sold_out),
                // 0..1, or null where occupancy is genuinely unknown.
                booked: typeof pct === 'number' ? Math.min(1, Math.max(0, pct / 100)) : null,
            };
        });
}
