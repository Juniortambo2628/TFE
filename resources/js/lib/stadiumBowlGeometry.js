/**
 * stadiumBowlGeometry — builds one venue's meshes into a group.
 *
 * Split out of `stadiumBowlScene` so that file stays about camera, pointer and
 * lifecycle while this one is purely "what does this ground look like".
 *
 * Everything is generated from the payload + the tier radii — there is no
 * hand-modelled geometry and no downloaded asset. Roof styles are keyed to
 * each venue's documented design (`config/stadiums.php` -> `roof_style`), but
 * the bowl underneath is a generic parametric shape, not a replica.
 */
import * as THREE from 'three';

import { LEN_K, WID_K, seedForSlug, seededRandom, stadiumXZ } from './stadiumBowl';

// Regulation pitch + track, in bowl units. Fixed for every venue: a pitch is
// the same size in a 15,000-seat ground as in a 60,000-seat one, and scaling
// it is what makes a small stadium read as a scale model of a big one.
const PITCH_OUTER = 13.5;
const TRACK_INNER = 11.5;
const FIELD_HALF_LEN = 16.1;
const FIELD_HALF_WID = 6.6;

// ~150 degrees of covered main stand on a partial-bowl ground.
const MAIN_STAND_CENTER = Math.PI / 2;
const MAIN_STAND_HALF_SPAN = Math.PI * 0.42;

/**
 * @param {THREE.Group} group    cleared group to build into
 * @param {object} payload       StadiumBowlService payload
 * @param {Array} tiers          resolveTiers() output, innermost first
 * @param {(m: THREE.Mesh) => void} registerTier called for each hit-testable tier mesh
 */
export function buildVenue(group, payload, tiers, registerTier) {
    const rand = seededRandom(seedForSlug(payload.slug));
    const cornerRatio = payload.corner_ratio;
    const partial = Boolean(payload.partial_bowl);

    const xz = (a, R) => stadiumXZ(a, R, cornerRatio);

    const a0 = MAIN_STAND_CENTER - MAIN_STAND_HALF_SPAN;
    const a1 = MAIN_STAND_CENTER + MAIN_STAND_HALF_SPAN;

    // ---- footprint shape helpers -----------------------------------
    function polygonShape(R, segs) {
        const shape = new THREE.Shape();

        for (let i = 0; i <= segs; i += 1) {
            const [x, z] = xz((i / segs) * Math.PI * 2, R);
            if (i === 0) shape.moveTo(x, z); else shape.lineTo(x, z);
        }

        return shape;
    }

    function polygonRingShape(innerR, outerR, segs) {
        const shape = polygonShape(outerR, segs);
        const hole = new THREE.Path();

        for (let i = 0; i <= segs; i += 1) {
            // Reverse winding, or the hole is not subtracted.
            const [x, z] = xz(-(i / segs) * Math.PI * 2, innerR);
            if (i === 0) hole.moveTo(x, z); else hole.lineTo(x, z);
        }

        shape.holes.push(hole);

        return shape;
    }

    function wedgeShape(innerR, outerR, start, end, segs) {
        const n = segs || 48;
        const shape = new THREE.Shape();

        for (let i = 0; i <= n; i += 1) {
            const [x, z] = xz(start + (end - start) * (i / n), outerR);
            if (i === 0) shape.moveTo(x, z); else shape.lineTo(x, z);
        }

        for (let i = 0; i <= n; i += 1) {
            const [x, z] = xz(end - (end - start) * (i / n), innerR);
            shape.lineTo(x, z);
        }

        shape.closePath();

        return shape;
    }

    // ---- pitch, track, markings ------------------------------------
    const pitch = new THREE.Mesh(
        new THREE.ShapeGeometry(polygonShape(PITCH_OUTER, 64)),
        new THREE.MeshStandardMaterial({ color: 0x1c5e2d, roughness: 0.85 }),
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.02;
    pitch.receiveShadow = true;
    group.add(pitch);

    const trackGeo = new THREE.ShapeGeometry(polygonRingShape(TRACK_INNER, PITCH_OUTER, 64));
    trackGeo.rotateX(-Math.PI / 2);
    const track = new THREE.Mesh(trackGeo, new THREE.MeshStandardMaterial({
        color: 0xb31f35, roughness: 0.9,
    }));
    track.position.y = 0.03;
    group.add(track);

    addPitchMarkings(group);

    // ---- the bowl --------------------------------------------------
    let yCursor = 0;

    function addTierMesh(shape, depth, tier) {
        const geo = new THREE.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: true,
            bevelThickness: 0.35,
            bevelSize: 0.25,
            bevelSegments: 2,
            curveSegments: 2,
        });
        geo.rotateX(-Math.PI / 2);

        // Occupancy darkens the tier slightly. `booked` is null where there is
        // no inventory behind the bowl — an unknown tier must render at its
        // base colour, NOT as if it were empty.
        const shade = tier.booked === null ? 0 : tier.booked * 0.18;
        const color = new THREE.Color(tier.color).multiplyScalar(1 - shade);

        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
            color, roughness: 0.55, metalness: 0.08,
        }));
        mesh.position.y = yCursor;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { tier };
        registerTier(mesh);
        group.add(mesh);
    }

    tiers.forEach((tier, idx) => {
        const isTop = idx === tiers.length - 1;

        if (partial && isTop) {
            // Covered main stand at full height, the rest dropped to open
            // terracing — how these grounds actually read in reference photos.
            addTierMesh(wedgeShape(tier.innerR, tier.outerR, a0, a1), tier.height, tier);
            addTierMesh(
                wedgeShape(tier.innerR, tier.outerR, a1, a0 + Math.PI * 2),
                tier.height * 0.4,
                tier,
            );
        } else {
            addTierMesh(polygonRingShape(tier.innerR, tier.outerR, 96), tier.height, tier);
        }

        yCursor += tier.height * 0.35;
    });

    const topTier = tiers[tiers.length - 1];
    const maxOuter = topTier.outerR;
    const topY = yCursor + topTier.height;

    addVomitories(group, xz, maxOuter, topY, yCursor, topTier, partial, a0, a1);

    // ---- roof ------------------------------------------------------
    const roofMat = new THREE.MeshStandardMaterial({
        color: 0xe9e9ea, roughness: 0.35, metalness: 0.25,
    });

    const ctx = {
        group, xz, wedgeShape, polygonRingShape, roofMat,
        maxOuter, topY, yCursor, tiers, topTier,
    };

    if (partial) {
        addFlatRoofRing(ctx, a0, a1);
    } else {
        switch (payload.roof_style) {
            case 'dome': addDomeRoof(ctx); break;
            case 'arch': addArchTrusses(ctx); break;
            case 'crown': addCrownRoof(ctx, 48, maxOuter * 0.075, maxOuter * 0.045); break;
            case 'petal': addScallopedRoof(ctx, 11, maxOuter * 0.05); break;
            case 'facet': addScallopedRoof(ctx, 22, maxOuter * 0.028); break;
            case 'shield': addShieldAccents(ctx); break;
            default: addFlatRoofRing(ctx); break;
        }
    }

    addEnvironment(group, xz, polygonRingShape, maxOuter, rand);
}

// ===================================================================
// Pitch markings
// ===================================================================

function lineMaterial() {
    return new THREE.LineBasicMaterial({ color: 0xf4f4f6, transparent: true, opacity: 0.85 });
}

function addLine(group, points, mat, y) {
    const geo = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p[0], y, p[1])),
    );
    group.add(new THREE.Line(geo, mat));
}

function addArc(group, cx, cz, r, segs, startAngle, endAngle, mat, y) {
    const pts = [];
    const from = startAngle ?? 0;
    const to = endAngle ?? Math.PI * 2;

    for (let i = 0; i <= segs; i += 1) {
        const a = from + (to - from) * (i / segs);
        pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }

    addLine(group, pts, mat, y);
}

function addPitchMarkings(group) {
    const mat = lineMaterial();
    const y = 0.045;
    const FL = FIELD_HALF_LEN;
    const FW = FIELD_HALF_WID;

    addLine(group, [[-FL, -FW], [FL, -FW], [FL, FW], [-FL, FW], [-FL, -FW]], mat, y);
    addLine(group, [[0, -FW], [0, FW]], mat, y);
    addArc(group, 0, 0, 3.6, 48, undefined, undefined, mat, y);
    addLine(group, [[-0.08, 0], [0.08, 0]], mat, y);

    [-1, 1].forEach((side) => {
        const edgeX = side * FL;
        const boxX = side * (FL - 5.6);
        const sixX = side * (FL - 1.9);

        addLine(group, [[edgeX, -4.6], [boxX, -4.6], [boxX, 4.6], [edgeX, 4.6]], mat, y);
        addLine(group, [[edgeX, -2.1], [sixX, -2.1], [sixX, 2.1], [edgeX, 2.1]], mat, y);

        const arcCenter = side * (FL - 3.4);
        addArc(
            group, arcCenter, 0, 2.6, 32,
            side > 0 ? Math.PI * 0.62 : -Math.PI * 0.38,
            side > 0 ? Math.PI * 1.38 : Math.PI * 0.38,
            mat, y,
        );
    });

    // Corner arcs.
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
        addArc(
            group, sx * FL, sz * FW, 0.9, 12,
            sx * sz > 0 ? Math.PI : 0,
            sx * sz > 0 ? Math.PI * 1.5 : Math.PI * 0.5,
            mat, y,
        );
    });
}

/** Radial gangway lines up the stands, for visible bowl structure. */
function addVomitories(group, xz, maxOuter, topY, yCursor, topTier, partial, a0, a1) {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 });
    const count = 20;

    for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2;
        const localTopY = partial && (a < a0 || a > a1)
            ? yCursor + topTier.height * 0.4
            : topY;
        const [ix, iz] = xz(a, TRACK_INNER);
        const [ox, oz] = xz(a, maxOuter);

        group.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(ix, 0.1, iz),
                new THREE.Vector3(ox, localTopY, oz),
            ]),
            mat,
        ));
    }
}

// ===================================================================
// Roofs — one generator per documented design
// ===================================================================

function addFlatRoofRing(ctx, start, end, radiusBoost) {
    const { group, wedgeShape, polygonRingShape, roofMat, maxOuter, topY } = ctx;
    const boost = radiusBoost || 0;
    const shape = start === undefined
        ? polygonRingShape(maxOuter - 6 + boost, maxOuter + 3 + boost, 96)
        : wedgeShape(maxOuter - 6 + boost, maxOuter + 3 + boost, start, end);

    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.5, bevelEnabled: false, curveSegments: 2,
    });
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, roofMat);
    mesh.position.y = topY + 1.2;
    mesh.castShadow = true;
    group.add(mesh);

    return mesh;
}

/** Kasarani — shallow translucent dome over the bowl. */
function addDomeRoof(ctx) {
    const { group, maxOuter, topY } = ctx;
    const geo = new THREE.SphereGeometry(maxOuter * 1.02, 64, 20, 0, Math.PI * 2, 0, Math.PI / 2);

    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: 0xf2f2f3, roughness: 0.3, metalness: 0.15, transparent: true, opacity: 0.55,
    }));
    mesh.scale.set(LEN_K, 0.22, WID_K);
    mesh.position.y = topY;
    group.add(mesh);

    const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }),
    );
    wire.scale.copy(mesh.scale);
    wire.position.copy(mesh.position);
    group.add(wire);
}

/** Mandela National — arch trusses plus its real facade band. */
function addArchTrusses(ctx) {
    const { group, wedgeShape, maxOuter, topY, yCursor } = ctx;
    addFlatRoofRing(ctx);

    const archMat = new THREE.LineBasicMaterial({
        color: 0xf4f4f6, transparent: true, opacity: 0.55,
    });
    const sweepHalf = maxOuter * LEN_K;

    [-0.55, 0, 0.55].forEach((offset) => {
        const pts = [];

        for (let i = 0; i <= 40; i += 1) {
            const t = i / 40;
            pts.push(new THREE.Vector3(
                (t - 0.5) * sweepHalf * 2,
                topY + 1.5 + Math.sin(t * Math.PI) * 9,
                offset * maxOuter * WID_K * 0.82,
            ));
        }

        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), archMat));
    });

    // Mandela National's documented black / red / gold facade. The gold is a
    // deliberate exception to the locked red/white/charcoal palette — it is
    // the ground's real livery, not decoration.
    const bandColors = [0x151515, 0xe0263f, 0xd9a916];
    const segs = 24;

    for (let i = 0; i < segs; i += 1) {
        const shape = wedgeShape(
            maxOuter - 1.5, maxOuter + 0.3,
            (i / segs) * Math.PI * 2, ((i + 1) / segs) * Math.PI * 2,
            6,
        );
        const geo = new THREE.ExtrudeGeometry(shape, {
            depth: 1.4, bevelEnabled: false, curveSegments: 1,
        });
        geo.rotateX(-Math.PI / 2);

        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
            color: bandColors[i % bandColors.length], roughness: 0.6,
        }));
        mesh.position.y = yCursor - 0.5;
        group.add(mesh);
    }
}

/**
 * Benjamin Mkapa — a dense ribbon of pointed tensile sections fanning outward.
 *
 * The inner edge is anchored on the boundary between the outermost tier and
 * the one inside it, so the points read as roof springing from that margin
 * rather than as free-floating spikes above the rim.
 */
function addCrownRoof(ctx, peakCount, peakHeight, peakOutset) {
    const { group, xz, maxOuter, topY, topTier } = ctx;

    const panelMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.45,
        metalness: 0.02,
        // Keeps the panels reading white from underneath as well as above.
        emissive: 0x6e6e72,
        emissiveIntensity: 0.55,
        side: THREE.DoubleSide,
        flatShading: true,
    });
    const strutMat = new THREE.LineBasicMaterial({
        color: 0x8a8a90, transparent: true, opacity: 0.45,
    });

    const innerEdgeR = topTier.innerR;
    const skirtY = topY - topTier.height * 0.1;

    for (let i = 0; i < peakCount; i += 1) {
        const aL = (i / peakCount) * Math.PI * 2;
        const aR = ((i + 1) / peakCount) * Math.PI * 2;
        const [ilx, ilz] = xz(aL, innerEdgeR);
        const [irx, irz] = xz(aR, innerEdgeR);
        const [px, pz] = xz((aL + aR) / 2, maxOuter + peakOutset);

        const vA = new THREE.Vector3(ilx, skirtY, ilz);
        const vB = new THREE.Vector3(irx, skirtY, irz);
        const vC = new THREE.Vector3(px, topY + peakHeight, pz);

        // Wind the triangle so its normal points up, or the panel lights as
        // dark grey from the only angle anyone looks at it from.
        const normal = new THREE.Vector3()
            .subVectors(vB, vA)
            .cross(new THREE.Vector3().subVectors(vC, vA));
        const ordered = normal.y < 0 ? [vB, vA, vC] : [vA, vB, vC];

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            ordered[0].x, ordered[0].y, ordered[0].z,
            ordered[1].x, ordered[1].y, ordered[1].z,
            ordered[2].x, ordered[2].y, ordered[2].z,
        ]), 3));
        geo.computeVertexNormals();
        group.add(new THREE.Mesh(geo, panelMat));

        group.add(new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([vA.clone(), vC.clone(), vB.clone(), vC.clone()]),
            strutMat,
        ));
    }
}

/**
 * Samia Suluhu Hassan (petal) and Dodoma (facet) — a smooth radius-only
 * scallop around the rim. Frequency and amplitude are what separate a few
 * broad petals from many shallow panels.
 */
function addScallopedRoof(ctx, frequency, amplitude) {
    const { group, xz, roofMat, maxOuter, topY } = ctx;
    const segs = 160;
    const shape = new THREE.Shape();

    for (let i = 0; i <= segs; i += 1) {
        const a = (i / segs) * Math.PI * 2;
        const [bx, bz] = xz(a, maxOuter + 3);
        const bump = 1 + (Math.sin(a * frequency) * amplitude) / (maxOuter + 3);

        if (i === 0) shape.moveTo(bx * bump, bz * bump);
        else shape.lineTo(bx * bump, bz * bump);
    }

    const hole = new THREE.Path();

    for (let i = 0; i <= segs; i += 1) {
        const [hx, hz] = xz(-(i / segs) * Math.PI * 2, maxOuter - 6);
        if (i === 0) hole.moveTo(hx, hz); else hole.lineTo(hx, hz);
    }

    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.5, bevelEnabled: false, curveSegments: 2,
    });
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, roofMat);
    mesh.position.y = topY + 1.2;
    mesh.castShadow = true;
    group.add(mesh);
}

/**
 * Raila Odinga International — diagrid cladding, eight Maasai-shield gateway
 * emblems and a trussed open oculus, all documented facade features.
 */
function addShieldAccents(ctx) {
    const { group, xz, maxOuter, topY } = ctx;

    addFlatRoofRing(ctx);
    addDiagridCladding(ctx);

    const shieldRed = new THREE.MeshStandardMaterial({ color: 0xbf1d33, roughness: 0.5 });
    const shieldBlack = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.5 });
    const shieldWhite = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 });
    const spearMat = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8, roughness: 0.3, metalness: 0.4,
    });

    const gateCount = 8;
    const shieldH = (topY - 2) * 0.34;
    const shieldW = shieldH * 0.58;

    function shieldOutline(w, h) {
        const s = new THREE.Shape();
        s.moveTo(0, h / 2);
        s.quadraticCurveTo(w / 2, h * 0.34, w / 2, 0);
        s.quadraticCurveTo(w / 2, -h * 0.38, 0, -h / 2);
        s.quadraticCurveTo(-w / 2, -h * 0.38, -w / 2, 0);
        s.quadraticCurveTo(-w / 2, h * 0.34, 0, h / 2);

        return s;
    }

    for (let i = 0; i < gateCount; i += 1) {
        const [px, pz] = xz((i / gateCount) * Math.PI * 2, maxOuter + 1.4);
        const emblem = new THREE.Group();

        const outer = new THREE.Mesh(new THREE.ExtrudeGeometry(shieldOutline(shieldW, shieldH), {
            depth: 0.35,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 1,
            curveSegments: 16,
        }), shieldWhite);

        const red = new THREE.Mesh(new THREE.ExtrudeGeometry(
            shieldOutline(shieldW * 0.86, shieldH * 0.88),
            { depth: 0.38, bevelEnabled: false, curveSegments: 16 },
        ), shieldRed);
        red.position.z = 0.02;

        const band = new THREE.Mesh(
            new THREE.BoxGeometry(shieldW * 0.16, shieldH * 0.86, 0.42),
            shieldBlack,
        );
        band.position.z = 0.05;

        emblem.add(outer, red, band);

        // Crossed spears behind the shield.
        [1, -1].forEach((dir) => {
            const spear = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, shieldH * 1.35, 6),
                spearMat,
            );
            spear.rotation.z = dir * 0.42;
            spear.position.z = -0.15;
            emblem.add(spear);
        });

        emblem.position.set(px, topY * 0.4, pz);
        emblem.lookAt(new THREE.Vector3(px, emblem.position.y, pz).multiplyScalar(1.4));
        group.add(emblem);
    }

    // Truss lines across the open oculus.
    const oculusMat = new THREE.LineBasicMaterial({
        color: 0xd8d8da, transparent: true, opacity: 0.35,
    });
    const oculusSegs = 18;

    for (let i = 0; i < oculusSegs; i += 1) {
        const a = (i / oculusSegs) * Math.PI * 2;
        const [x1, z1] = xz(a, maxOuter - 6);
        const [x2, z2] = xz(a + Math.PI, maxOuter - 6);

        group.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x1, topY + 1.2, z1),
                new THREE.Vector3(x2, topY + 1.2, z2),
            ]),
            oculusMat,
        ));
    }
}

/** White diamond-lattice steel skin wrapped around the bowl exterior. */
function addDiagridCladding(ctx) {
    const { group, xz, maxOuter, topY } = ctx;
    const mat = new THREE.LineBasicMaterial({
        color: 0xf4f4f6, transparent: true, opacity: 0.4,
    });
    const rings = 5;
    const cols = 40;
    const rBase = maxOuter + 0.4;
    const hTop = topY - 1;
    const grid = [];

    for (let r = 0; r <= rings; r += 1) {
        const row = [];
        const y = (r / rings) * hTop;

        for (let c = 0; c <= cols; c += 1) {
            const [x, z] = xz((c / cols) * Math.PI * 2, rBase);
            row.push(new THREE.Vector3(x, y, z));
        }

        grid.push(row);
    }

    // One merged geometry rather than 2 * rings * cols Line objects — that was
    // 400 draw calls per venue on the diagrid alone.
    const pts = [];

    for (let r = 0; r < rings; r += 1) {
        for (let c = 0; c < cols; c += 1) {
            pts.push(grid[r][c], grid[r + 1][c + 1]);
            pts.push(grid[r][c + 1], grid[r + 1][c]);
        }
    }

    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat));
}

// ===================================================================
// Environment — access road, trees, distant skyline
// ===================================================================

function addEnvironment(group, xz, polygonRingShape, maxOuter, rand) {
    const roadOuter = maxOuter + 16;
    const roadGeo = new THREE.ExtrudeGeometry(
        polygonRingShape(maxOuter + 4, roadOuter, 96),
        { depth: 0.04, bevelEnabled: false, curveSegments: 2 },
    );
    roadGeo.rotateX(-Math.PI / 2);

    const road = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({
        color: 0x1c1a1b, roughness: 1,
    }));
    road.position.y = 0.01;
    road.receiveShadow = true;
    group.add(road);

    // One shared geometry + material per part, instanced by transform. The
    // prototype built 46 trees as 92 separate meshes with 92 materials.
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.1, 6);
    const foliageGeo = new THREE.ConeGeometry(0.9, 2.1, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a1c17, roughness: 1 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x203521, roughness: 0.95 });

    const TREES = 46;
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, TREES);
    const foliage = new THREE.InstancedMesh(foliageGeo, foliageMat, TREES);
    const m = new THREE.Matrix4();

    for (let i = 0; i < TREES; i += 1) {
        const a = rand() * Math.PI * 2;
        const dist = roadOuter + 6 + rand() * 30;
        const jitter = (rand() - 0.5) * 10;
        const scale = 0.8 + rand() * 0.9;
        const [bx, bz] = xz(a, dist);
        const x = bx + jitter;
        const z = bz + jitter * 0.5;

        m.makeScale(scale, scale, scale).setPosition(x, 0.55 * scale, z);
        trunks.setMatrixAt(i, m);

        m.makeScale(scale, scale, scale).setPosition(x, 1.7 * scale, z);
        foliage.setMatrixAt(i, m);
    }

    trunks.instanceMatrix.needsUpdate = true;
    foliage.instanceMatrix.needsUpdate = true;
    group.add(trunks, foliage);

    const buildingColors = [0x1c1a1c, 0x232022, 0x2a2426, 0x141314];
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const litMat = new THREE.MeshStandardMaterial({
        color: 0x1c1a1c, roughness: 0.8, emissive: 0xe0263f, emissiveIntensity: 0.4,
    });

    for (let i = 0; i < 16; i += 1) {
        const a = -Math.PI * 0.32 + rand() * Math.PI * 0.5;
        const dist = roadOuter + 60 + rand() * 90;
        const h = 8 + rand() * 30;
        const w = 5 + rand() * 6;
        const d = 5 + rand() * 6;
        const lit = rand() > 0.55;

        const mat = lit ? litMat : new THREE.MeshStandardMaterial({
            color: buildingColors[i % buildingColors.length], roughness: 0.8,
        });

        const b = new THREE.Mesh(boxGeo, mat);
        b.scale.set(w, h, d);
        b.position.set(Math.cos(a) * dist, h / 2, Math.sin(a) * dist - 40);
        group.add(b);
    }
}
