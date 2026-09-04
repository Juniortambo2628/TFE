import React, { useMemo, useState } from 'react';

/**
 * StadiumSeatMap — Procedural SVG stadium bowl.
 *
 * Renders an oval "bowl" made of section blocks in four tiers
 * (VIP / Premium / Standard / Upper) around a central pitch. Each
 * section is coloured by a "sold" heat overlay driven by the parent's
 * `soldPct` (0–100) — the higher the fill, the more sections read as
 * sold. Hovering a section reveals its tier, seat count and price.
 *
 * Zero external deps. Sections are deterministic per-tournament (seed
 * derived from stadium name) so rerenders don't shuffle blocks.
 *
 * Props:
 *   stadiumName    string   — the name shown in the pitch centre.
 *   capacity       number?  — total seats (defaults to 60,000).
 *   soldPct        number?  — 0..100, drives the heat overlay.
 *   currency       string?  — currency for price tags.
 *   basePrice      number?  — Standard-tier ticket price; other tiers derived.
 *   onSectionClick fn?      — called with (section) when a section is picked.
 */
export default function StadiumSeatMap({
    stadiumName = 'Stadium',
    capacity = 60000,
    soldPct = 0,
    currency = 'USD',
    basePrice = 150,
    onSectionClick,
}) {
    const [hovered, setHovered] = useState(null);

    const sections = useMemo(() => buildSections(stadiumName, capacity, basePrice, soldPct), [stadiumName, capacity, basePrice, soldPct]);

    const width = 640;
    const height = 380;
    const cx = width / 2;
    const cy = height / 2;

    return (
        <div className="stadium-seat-map">
            <div className="d-flex flex-wrap gap-3 mb-2 align-items-center">
                <TierChip color={TIER_COLORS.VIP} label="VIP" />
                <TierChip color={TIER_COLORS.Premium} label="Premium" />
                <TierChip color={TIER_COLORS.Standard} label="Standard" />
                <TierChip color={TIER_COLORS.Upper} label="Upper" />
                <span className="ms-auto d-flex align-items-center gap-2 text-white-50 small">
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(220,20,60,0.75)', display: 'inline-block' }} />
                    Sold
                </span>
            </div>

            <div style={{ position: 'relative' }}>
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    role="img"
                    aria-label={`Stadium seat map for ${stadiumName}`}
                >
                    {/* Bowl backdrop */}
                    <defs>
                        <radialGradient id="bowlBg" cx="50%" cy="55%" r="70%">
                            <stop offset="0%" stopColor="#0d1117" />
                            <stop offset="100%" stopColor="#000" />
                        </radialGradient>
                        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#15803d" />
                            <stop offset="100%" stopColor="#166534" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width={width} height={height} rx="16" fill="url(#bowlBg)" />

                    {/* Section blocks — outer tier first, layered inward */}
                    {sections.map((s) => (
                        <SectionBlock
                            key={s.id}
                            section={s}
                            cx={cx}
                            cy={cy}
                            isHovered={hovered?.id === s.id}
                            onEnter={() => setHovered(s)}
                            onLeave={() => setHovered(null)}
                            onClick={() => onSectionClick && onSectionClick(s)}
                        />
                    ))}

                    {/* Pitch */}
                    <ellipse cx={cx} cy={cy} rx={110} ry={62} fill="url(#pitchGrad)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                    <line x1={cx} y1={cy - 60} x2={cx} y2={cy + 60} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
                    <circle cx={cx} cy={cy} r="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />

                    {/* Stadium label */}
                    <text
                        x={cx}
                        y={cy + 4}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.85)"
                        fontSize="12"
                        fontWeight="700"
                        style={{ textTransform: 'uppercase', letterSpacing: '1.5px' }}
                    >
                        {truncate(stadiumName, 22)}
                    </text>
                    <text
                        x={cx}
                        y={cy + 20}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.45)"
                        fontSize="10"
                    >
                        {capacity.toLocaleString()} seats · {soldPct}% booked
                    </text>
                </svg>

                {/* Hover tooltip */}
                {hovered && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            background: 'rgba(0,0,0,0.85)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: '10px 14px',
                            color: '#fff',
                            pointerEvents: 'none',
                            minWidth: 180,
                        }}
                    >
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <span
                                style={{
                                    width: 10, height: 10, borderRadius: 2,
                                    background: TIER_COLORS[hovered.tier],
                                    display: 'inline-block',
                                }}
                            />
                            <strong>{hovered.label}</strong>
                            <span className="ms-auto text-white-50 small">{hovered.tier}</span>
                        </div>
                        <div className="small text-white-50">
                            {hovered.seats.toLocaleString()} seats · {hovered.soldRatio}% sold
                        </div>
                        <div className="mt-1 text-warning fw-bold">
                            {currency} {hovered.price.toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TierChip({ color, label }) {
    return (
        <span className="d-flex align-items-center gap-1 text-white-50 small">
            <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: 'inline-block' }} />
            {label}
        </span>
    );
}

function SectionBlock({ section, cx, cy, isHovered, onEnter, onLeave, onClick }) {
    return (
        <path
            d={section.path(cx, cy)}
            fill={section.isSold ? 'rgba(220,20,60,0.75)' : TIER_COLORS[section.tier]}
            stroke={isHovered ? '#fff' : 'rgba(0,0,0,0.35)'}
            strokeWidth={isHovered ? 2 : 1}
            style={{ cursor: onClick ? 'pointer' : 'default', transition: 'fill 200ms, stroke 150ms' }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            onClick={onClick}
            opacity={isHovered ? 1 : 0.94}
        />
    );
}

// ── Section geometry ──────────────────────────────────────────────────
// Four concentric elliptical rings, each cut into 16 sections. The
// outermost ring is "Upper" (cheapest), inner-most is "VIP" (most
// expensive). Prices derive from basePrice via a fixed tier multiplier.

const TIER_COLORS = {
    VIP: '#eab308',
    Premium: '#f59e0b',
    Standard: '#3b82f6',
    Upper: '#64748b',
};

const TIER_MULTIPLIERS = {
    VIP: 4.0,
    Premium: 2.2,
    Standard: 1.0,
    Upper: 0.55,
};

const RINGS = [
    { tier: 'Upper', rxOuter: 300, ryOuter: 175, rxInner: 250, ryInner: 145, share: 0.35 },
    { tier: 'Standard', rxOuter: 250, ryOuter: 145, rxInner: 200, ryInner: 115, share: 0.35 },
    { tier: 'Premium', rxOuter: 200, ryOuter: 115, rxInner: 155, ryInner: 88, share: 0.22 },
    { tier: 'VIP', rxOuter: 155, ryOuter: 88, rxInner: 118, ryInner: 68, share: 0.08 },
];

const SECTIONS_PER_RING = 16;

function buildSections(stadiumName, capacity, basePrice, soldPct) {
    // Deterministic pseudo-random so sold pattern stays stable per
    // stadium across renders — a mulberry32 seeded on the stadium name.
    const seed = hashString(stadiumName || 'stadium');
    const rng = mulberry32(seed);

    const soldTarget = Math.round((soldPct / 100) * RINGS.length * SECTIONS_PER_RING);
    // Bias sold toward Standard/Premium — those go first in real life.
    const soldPriority = ['Standard', 'Premium', 'VIP', 'Upper'];
    const soldSet = new Set();

    // Fill sold sections tier-by-tier until target reached.
    for (const tier of soldPriority) {
        if (soldSet.size >= soldTarget) break;
        const ringIndex = RINGS.findIndex((r) => r.tier === tier);
        const ring = RINGS[ringIndex];
        // Shuffled indices deterministically per tier.
        const indices = shuffle([...Array(SECTIONS_PER_RING).keys()], rng);
        for (const i of indices) {
            if (soldSet.size >= soldTarget) break;
            soldSet.add(`${ringIndex}-${i}`);
        }
    }

    const list = [];
    RINGS.forEach((ring, ringIndex) => {
        const seatsPerSection = Math.round((capacity * ring.share) / SECTIONS_PER_RING);
        const price = Math.round(basePrice * TIER_MULTIPLIERS[ring.tier]);

        for (let i = 0; i < SECTIONS_PER_RING; i++) {
            const start = (i / SECTIONS_PER_RING) * Math.PI * 2 - Math.PI / 2;
            const end = ((i + 1) / SECTIONS_PER_RING) * Math.PI * 2 - Math.PI / 2;
            const gap = 0.008; // small gap between sections
            const isSold = soldSet.has(`${ringIndex}-${i}`);
            list.push({
                id: `${ring.tier}-${i}`,
                label: `${ring.tier.charAt(0)}${(i + 1).toString().padStart(2, '0')}`,
                tier: ring.tier,
                seats: seatsPerSection,
                soldRatio: isSold ? 100 : Math.round(rng() * 40), // partially-sold for un-flagged
                isSold,
                price,
                path: (cx, cy) => ringSectionPath(cx, cy, ring, start + gap, end - gap),
            });
        }
    });
    return list;
}

function ringSectionPath(cx, cy, ring, a1, a2) {
    // Outer arc → inner arc, forming a section wedge.
    const outerStart = pointOnEllipse(cx, cy, ring.rxOuter, ring.ryOuter, a1);
    const outerEnd = pointOnEllipse(cx, cy, ring.rxOuter, ring.ryOuter, a2);
    const innerStart = pointOnEllipse(cx, cy, ring.rxInner, ring.ryInner, a2);
    const innerEnd = pointOnEllipse(cx, cy, ring.rxInner, ring.ryInner, a1);

    return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${ring.rxOuter} ${ring.ryOuter} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerStart.x} ${innerStart.y}`,
        `A ${ring.rxInner} ${ring.ryInner} 0 0 0 ${innerEnd.x} ${innerEnd.y}`,
        'Z',
    ].join(' ');
}

function pointOnEllipse(cx, cy, rx, ry, angle) {
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
}

// ── Deterministic random helpers ──────────────────────────────────────
function hashString(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffle(arr, rng) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function truncate(s, n) {
    return s && s.length > n ? s.slice(0, n - 1) + '…' : s;
}
