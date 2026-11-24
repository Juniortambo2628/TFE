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
        })
        // The block code leads with the tier's FIXED position (VIP 1 … Upper 4),
        // as the server's does — not its index here, which shifts if a
        // payload leaves a tier out.
        .map((tier) => ({
            ...tier,
            blocks: resolveBlocks(tier, BASE_TIERS.findIndex((g) => g.key === tier.key), bySlug.get(tier.key).blocks),
        }));
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
    // The footprint's own diagonal, not 45 degrees: the pitch is longer than
    // it is wide, so PI/4 lands on the side stand, not in the corner.
    { key: 'corner', label: 'Corner flag', angle: Math.atan2(WID_K, LEN_K) },
    { key: 'goal', label: 'Behind the goal', angle: 0 },
];

export function viewpoint(key) {
    return VIEWPOINTS.find((v) => v.key === key) || VIEWPOINTS[0];
}

/** A viewpoint key or a bare angle, as an angle. */
function angleOf(where) {
    return typeof where === 'number' ? where : viewpoint(where).angle;
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
 * Where a fan sitting in `tierKey` at `where` (a viewpoint key or an angle,
 * e.g. a block's `mid`) has their eyes, and what they
 * look at (the centre spot). Null for a tier the bowl does not draw.
 *
 * This is an APPROXIMATE sightline: the bowl is a generic parametric shape,
 * so the view is right about height and distance, not about a particular
 * ground's architecture. The UI says so.
 *
 * @param {Array} tiers resolveTiers() output, innermost first
 * @param {object} opts { cornerRatio, partial }
 */
export function seatView(tiers, tierKey, where, opts = {}) {
    const idx = tiers.findIndex((t) => t.key === tierKey);

    if (idx === -1) return null;

    const tier = tiers[idx];
    const angle = angleOf(where);
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
export function standView(tiers, tierKey, where, opts = {}) {
    const idx = tiers.findIndex((t) => t.key === tierKey);

    if (idx === -1) return null;

    const tier = tiers[idx];
    const angle = angleOf(where);
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

// ===================================================================
// Stands and blocks — the ground divided the way a ticket names a seat.
//
// MIRRORED in app/Support/StadiumLayout.php. The codes and stands both sides
// produce are pinned by tests/fixtures/stadium-blocks.json, which
// tests/JS/stadiumBlocks.test.mjs and tests/Unit/StadiumLayoutTest.php each
// assert against — change one side and both fail until the other follows.
// Seat COUNTS are the server's alone (it owns the inventory); this side only
// needs to know where each block is.
// ===================================================================

/** Half the angle a corner stand spans either side of the diagonal. */
export const CORNER_HALF = 0.2;

/** Target angle per block; each stand is split into the nearest whole number. */
export const BLOCK_SPAN = 0.2;

/** The footprint's diagonal — where a corner stand is centred. */
const DIAGONAL = Math.atan2(WID_K, LEN_K);

/**
 * The eight stands, in angle order from the north end. Angles are in the
 * outline's own plane (see `worldXZ`); `west` is the main stand, on the
 * halfway line at PI/2, which is why the "Halfway line" viewpoint sits in it.
 */
export function standLayout() {
    const c = DIAGONAL;
    const h = CORNER_HALF;
    const pi = Math.PI;

    return [
        { key: 'north', name: 'North Stand', start: -(c - h), end: c - h },
        { key: 'north_west', name: 'North-West Corner', start: c - h, end: c + h },
        { key: 'west', name: 'West Stand', start: c + h, end: pi - c - h },
        { key: 'south_west', name: 'South-West Corner', start: pi - c - h, end: pi - c + h },
        { key: 'south', name: 'South Stand', start: pi - c + h, end: pi + c - h },
        { key: 'south_east', name: 'South-East Corner', start: pi + c - h, end: pi + c + h },
        { key: 'east', name: 'East Stand', start: pi + c + h, end: 2 * pi - c - h },
        { key: 'north_east', name: 'North-East Corner', start: 2 * pi - c - h, end: 2 * pi - c + h },
    ];
}

/**
 * Every block of one tier, in order round the ground. `tierNumber` is the
 * tier's 1-based position (VIP 1 … Upper 4) and leads the code, so block
 * 307 is the seventh block of the third tier — the way a ticket reads.
 */
export function blockLayout(tierNumber) {
    const out = [];

    standLayout().forEach((stand) => {
        const span = stand.end - stand.start;
        const n = Math.max(1, Math.round(span / BLOCK_SPAN));

        for (let i = 0; i < n; i += 1) {
            const start = stand.start + (span * i) / n;
            const end = stand.start + (span * (i + 1)) / n;

            out.push({
                code: String(tierNumber * 100 + out.length + 1),
                stand: stand.key,
                standName: stand.name,
                start,
                end,
                mid: (start + end) / 2,
            });
        }
    });

    return out;
}

/**
 * Join the server's block rows onto the layout for one tier.
 *
 * A block with a row of its own carries real figures and an id (fixture
 * payloads only). Without one — an aggregate across fixtures, or a ground
 * with nothing on sale — it carries the TIER's occupancy and says so with
 * `inherited`, so a tooltip never presents a tier figure as the block's own.
 */
function resolveBlocks(tier, index, payloadBlocks) {
    const rows = new Map((payloadBlocks || []).map((b) => [String(b.code), b]));

    return blockLayout(index + 1).map((b) => {
        const row = rows.get(b.code);

        if (!row) {
            return {
                ...b,
                tierKey: tier.key,
                blockId: null,
                capacity: null,
                remaining: null,
                isSoldOut: false,
                booked: tier.booked,
                inherited: true,
            };
        }

        const pct = row.sold_pct;

        return {
            ...b,
            tierKey: tier.key,
            blockId: row.id ?? null,
            capacity: row.capacity ?? null,
            remaining: row.remaining ?? null,
            isSoldOut: Boolean(row.is_sold_out),
            booked: typeof pct === 'number' ? Math.min(1, Math.max(0, pct / 100)) : null,
            inherited: false,
        };
    });
}

/** The block of `tier` that contains `angle` (any turn). */
export function blockAt(tier, angle) {
    const blocks = tier?.blocks || [];

    if (!blocks.length) return null;

    const twoPi = Math.PI * 2;
    const first = blocks[0].start;
    const a = ((((angle - first) % twoPi) + twoPi) % twoPi) + first;

    return blocks.find((b) => a >= b.start && a < b.end) || blocks[blocks.length - 1];
}

/** The tier's block with the most seats left, for "best available". */
export function bestBlock(tier) {
    const open = (tier?.blocks || []).filter((b) => b.remaining !== null && !b.isSoldOut);

    if (!open.length) return null;

    return open.reduce((best, b) => (b.remaining > best.remaining ? b : best));
}
