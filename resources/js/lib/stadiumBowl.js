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

// ===================================================================
// Viewpoints — where the camera goes when a fan focuses a tier or asks
// for the view from it. Pure numbers, so the scene and the tests read the
// same answer.
// ===================================================================

/**
 * The covered main stand on a partial bowl: centred on the halfway line,
 * spanning most of one long side. `stadiumBowlGeometry` draws the top tier at
 * full height inside this arc and as low terracing outside it.
 */
export const MAIN_STAND_CENTER = Math.PI / 2;
export const MAIN_STAND_HALF_SPAN = Math.PI * 0.42;

/** Each tier sits this fraction of the previous tier's height above it. */
export const TIER_STEP = 0.35;

/** Top tier height factor outside the main stand of a partial bowl. */
export const PARTIAL_TERRACE_K = 0.4;

/** Eye height above the tier's surface, in bowl units. */
export const EYE_HEIGHT = 1.4;

/**
 * Named places to sit, as an angle around the footprint. Angle 0 is behind
 * the goal (the pitch runs along x); PI/2 is the halfway line on the main
 * stand side. "Another view" cycles through these in order.
 */
export const VIEWPOINTS = [
    { key: 'halfway', label: 'Halfway line', angle: Math.PI / 2 },
    { key: 'corner', label: 'Corner flag', angle: Math.PI / 4 },
    { key: 'goal', label: 'Behind the goal', angle: 0 },
];

export function viewpoint(key) {
    return VIEWPOINTS.find((v) => v.key === key) || VIEWPOINTS[0];
}

/** The viewpoint after `key`, wrapping round. */
export function nextViewpoint(key) {
    const i = VIEWPOINTS.findIndex((v) => v.key === key);

    return VIEWPOINTS[(i + 1) % VIEWPOINTS.length];
}

/**
 * The y each tier's mesh starts at. `stadiumBowlGeometry` stacks the tiers
 * with exactly this rule, so a camera placed from it sits on the stand rather
 * than inside or above it.
 */
export function tierBaseHeights(tiers) {
    let y = 0;

    return tiers.map((tier) => {
        const base = y;
        y += tier.height * TIER_STEP;
        return base;
    });
}

/** Is `angle` inside the covered main stand of a partial bowl? */
export function inMainStand(angle) {
    const twoPi = Math.PI * 2;
    const d = ((((angle - MAIN_STAND_CENTER) % twoPi) + twoPi + Math.PI) % twoPi) - Math.PI;

    return Math.abs(d) <= MAIN_STAND_HALF_SPAN;
}

/**
 * World position of a point on the footprint. The tier shapes are drawn in a
 * plane and rotated flat with `rotateX(-PI/2)`, which maps the shape's second
 * axis to world -z — so the world z is the NEGATED outline z.
 */
export function worldXZ(angle, R, cornerRatio) {
    const [x, z] = stadiumXZ(angle, R, cornerRatio);

    return [x, -z];
}

/**
 * Where a fan sitting in `tierKey` at `viewKey` has their eyes, and what they
 * look at (the centre spot). Null for a tier the bowl does not draw.
 *
 * This is an APPROXIMATE sightline: the bowl is a generic parametric shape,
 * so the view is right about height and distance, not about a particular
 * ground's architecture. The UI says so.
 *
 * @param {Array} tiers resolveTiers() output, innermost first
 * @param {object} opts { cornerRatio, partial }
 */
export function seatView(tiers, tierKey, viewKey, opts = {}) {
    const idx = tiers.findIndex((t) => t.key === tierKey);

    if (idx === -1) return null;

    const tier = tiers[idx];
    const { angle } = viewpoint(viewKey);
    const isTop = idx === tiers.length - 1;
    const height = opts.partial && isTop && !inMainStand(angle)
        ? tier.height * PARTIAL_TERRACE_K
        : tier.height;
    const base = tierBaseHeights(tiers)[idx];

    // A third of the way back: far enough up the tier to be "in" it, close
    // enough to the front that the tier below does not hide the pitch.
    const R = tier.innerR + (tier.outerR - tier.innerR) / 3;
    const [x, z] = worldXZ(angle, R, opts.cornerRatio);

    return {
        eye: [x, base + height + EYE_HEIGHT, z],
        look: [0, 0, 0],
    };
}

/**
 * Orbit parameters (target, radius, azimuth, polar) that put the camera at
 * `eye` looking at `look` — the scene's camera is an orbit, so every view is
 * expressed in its terms and the move between two views is one smooth tween.
 */
export function orbitFromEye(eye, look) {
    const dx = eye[0] - look[0];
    const dy = eye[1] - look[1];
    const dz = eye[2] - look[2];
    const radius = Math.hypot(dx, dy, dz) || 1;

    return {
        target: [...look],
        radius,
        azimuth: Math.atan2(dx, dz),
        polar: Math.acos(Math.max(-1, Math.min(1, dy / radius))),
    };
}

/**
 * Orbit parameters for "fly to this stand": the camera hangs just past the
 * centre spot, a little above the tier, looking across at it. It stays LOW on
 * purpose — every roof style covers the stands, and a closed one (`dome`)
 * covers the pitch too, so a camera placed above the bowl sees roof.
 */
export function standView(tiers, tierKey, viewKey, opts = {}) {
    const idx = tiers.findIndex((t) => t.key === tierKey);

    if (idx === -1) return null;

    const tier = tiers[idx];
    const { angle } = viewpoint(viewKey);
    const mid = (tier.innerR + tier.outerR) / 2;
    const [x, z] = worldXZ(angle, mid, opts.cornerRatio);
    const y = tierBaseHeights(tiers)[idx] + tier.height * 0.6;

    return orbitFromEye([-x * 0.12, y + 3, -z * 0.12], [x, y, z]);
}

/**
 * `to`, shifted by whole turns so it is within PI of `from`. Without this a
 * tween from 350° to 10° spins the long way round the stadium.
 */
export function nearestAngle(from, to) {
    const twoPi = Math.PI * 2;
    let d = (to - from) % twoPi;

    if (d > Math.PI) d -= twoPi;
    if (d < -Math.PI) d += twoPi;

    return from + d;
}
