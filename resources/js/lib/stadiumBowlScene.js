/**
 * stadiumBowlScene — the three.js side of the 3D seat map.
 *
 * Imperative on purpose. The geometry is generated once per venue from a data
 * object and never diffed, so expressing it through a React reconciler
 * (react-three-fiber) would mean rewriting every generator as JSX to describe
 * exactly what it already describes — and would add a second renderer to keep
 * in step with React. The orbit control is hand-rolled for the same reason: it
 * is ~40 lines and avoids pulling in the OrbitControls addon.
 *
 * `createBowlScene(host)` returns a controller; React owns its lifecycle
 * (`Components/Common/StadiumBowlCanvas.jsx`). Nothing here touches React or
 * the document beyond `host`.
 *
 * Palette is locked to red / white / charcoal, with two deliberate exceptions
 * that are both real-world colour: the pitch is green, and Mandela National's
 * facade band carries its documented black/red/gold.
 */
import * as THREE from 'three';

import {
    EYE_HEIGHT,
    LEN_K,
    WID_K,
    blockView,
    nearestAngle,
    orbitFromEye,
    resolveTiers,
    seatPosition,
    seatView,
    seatsInRow,
    standView,
} from './stadiumBowl';
import { buildVenue } from './stadiumBowlGeometry';

const SKY_TOP = 0x08080a;
const SKY_HORIZON = 0x7a1f22;
const FOG_COLOR = 0x180b0c;

// Seat colours. Inside the locked palette: free seats are near-white, taken
// ones a muted slate (so the free ones stand out), the fan's own red.
const SEAT_FREE = 0xe9e4e4;
const SEAT_TAKEN = 0x3d4256;
const SEAT_HOVER = 0xffffff;
const SEAT_PICKED = 0xe0263f;
const SEAT_PICKED_HOVER = 0xff5a6e;

// A pointer that travels further than this between down and up was a drag,
// not a click — orbiting the bowl must not pick whatever it ends over.
const CLICK_SLOP = 6;

export function createBowlScene(host) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);

    let renderer;

    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch (e) {
        // No WebGL (blocked, software-rendering disabled, headless). The
        // caller falls back to a static panel rather than a blank box.
        return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    scene.add(makeSky());
    scene.fog = new THREE.FogExp2(FOG_COLOR, 0.0016);
    addLighting(scene);

    addGround(scene);

    // ---------------------------------------------------------------
    // Camera / orbit state
    // ---------------------------------------------------------------
    // Everything the camera does is an orbit around `target`: the overview,
    // a stand close-up and the view from a seat are all (target, radius,
    // azimuth, polar), so moving between any two is one eased tween.
    const HOME_TARGET = new THREE.Vector3(0, 6, 0);
    const HOME_POLAR = Math.PI * 0.36;
    const target = HOME_TARGET.clone();
    const desiredTarget = HOME_TARGET.clone();
    let radius = 220;
    let targetRadius = 220;
    let azimuth = Math.PI * 0.22;
    let targetAzimuth = azimuth;
    let polar = HOME_POLAR;
    let targetPolar = polar;
    const MIN_RADIUS = 55;
    const STAND_MIN_RADIUS = 10;
    const MAX_RADIUS = 480;
    const MIN_POLAR = 0.14;
    const MAX_POLAR = Math.PI * 0.49;

    let autoRotate = true;
    let userHasInteracted = false;
    // 'home' (the overview), 'stand' (flown to a tier, still orbitable
    // around it) or 'seat' (sitting in it — input is ignored so the
    // sightline holds still).
    let mode = 'home';
    let minRadius = MIN_RADIUS;
    let payloadNow = null;
    let tiersNow = [];
    let frame = null;
    let disposed = false;

    // ---------------------------------------------------------------
    // Pointer handling — drag to orbit, wheel or pinch to zoom.
    // Pointer events cover mouse, touch and pen with one code path;
    // a second active pointer switches to pinch.
    // ---------------------------------------------------------------
    const pointers = new Map();
    let pinchStart = 0;
    let pinchStartRadius = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    let hoverHandler = null;
    let selectHandler = null;

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let tierMeshes = [];
    let hovered = null;

    const el = renderer.domElement;

    function pinchDistance() {
        const [a, b] = [...pointers.values()];

        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    let downAt = null;

    function onPointerDown(e) {
        downAt = { x: e.clientX, y: e.clientY };

        if (mode === 'seat') return;

        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        el.setPointerCapture?.(e.pointerId);
        userHasInteracted = true;
        autoRotate = false;

        if (pointers.size === 2) {
            pinchStart = pinchDistance();
            pinchStartRadius = targetRadius;
            dragging = false;
            return;
        }

        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        host.classList.add('is-dragging');
    }

    function onPointerMove(e) {
        if (pointers.has(e.pointerId)) {
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        if (pointers.size === 2 && pinchStart > 0) {
            const scale = pinchDistance() / pinchStart;
            targetRadius = clamp(pinchStartRadius / (scale || 1), minRadius, MAX_RADIUS);
            return;
        }

        if (dragging) {
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            targetAzimuth -= dx * 0.006;
            targetPolar = clamp(targetPolar - dy * 0.006, MIN_POLAR, MAX_POLAR);
            return;
        }

        // Not dragging — hit-test for the hover tooltip. Nothing to hover
        // from inside a seat: the tier under the cursor is your own.
        if (mode !== 'seat') updateHover(e);
    }

    function endPointer(e) {
        pointers.delete(e.pointerId);

        if (pointers.size < 2) pinchStart = 0;

        if (pointers.size === 0) {
            dragging = false;
            host.classList.remove('is-dragging');
        }
    }

    function onWheel(e) {
        if (mode === 'seat') return;

        e.preventDefault();
        userHasInteracted = true;
        autoRotate = false;
        targetRadius = clamp(targetRadius + e.deltaY * 0.15, minRadius, MAX_RADIUS);
    }

    function onPointerLeave() {
        setHover(null);
        setSeatHover(-1);
        hoverHandler?.(null, 0, 0);
    }

    function onClick(e) {
        if (mode === 'seat') return;

        if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > CLICK_SLOP) return;

        const hit = pick(e);

        if (hit && selectHandler) selectHandler(hit.tier, hit.block, hit.seat || null);
    }

    /**
     * What is under the pointer: a seat of the open block (checked first —
     * the seats sit on top of their block), else a block. `{ tier, block,
     * seat? , mesh? }` or null.
     */
    function pick(e) {
        const rect = el.getBoundingClientRect();

        if (!rect.width || !rect.height) return null;

        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);

        if (seatLayer) {
            const seatHits = raycaster.intersectObjects(seatLayer.meshes, false);

            if (seatHits.length && seatHits[0].instanceId !== undefined) {
                const index = seatHits[0].instanceId;
                const cell = seatLayer.cells[index];

                return {
                    tier: seatLayer.tier,
                    block: seatLayer.block,
                    seat: { row: cell.row, number: cell.number, taken: seatLayer.taken.has(cell.key) },
                    seatIndex: index,
                };
            }
        }

        const hits = raycaster.intersectObjects(tierMeshes, false);

        return hits.length
            ? { tier: hits[0].object.userData.tier, block: hits[0].object.userData.block, mesh: hits[0].object }
            : null;
    }

    function updateHover(e) {
        const hit = pick(e);
        setHover(hit?.mesh ?? null);
        setSeatHover(hit?.seatIndex ?? -1);

        if (!hoverHandler) return;

        if (hit) {
            // Canvas-relative, NOT clientX/clientY: the tooltip is positioned
            // inside the stage. A viewport-positioned overlay would land in the
            // wrong place the moment an ancestor carries a transform, which is
            // routine inside a modal.
            const rect = el.getBoundingClientRect();
            const { mesh, seatIndex, ...rest } = hit;
            hoverHandler(rest, e.clientX - rect.left, e.clientY - rect.top);
        } else {
            hoverHandler(null, 0, 0);
        }
    }

    // What is lit: the block under the cursor, a whole tier lit from the
    // legend, and the focused block (which stays lit while the camera is
    // on it). Recomputed from scratch each time, so the three never fight.
    let tierLight = null;
    let focusBlock = null;

    function paint() {
        const hoverCode = hovered?.userData?.block?.code ?? null;

        tierMeshes.forEach((m) => {
            const { tier, block } = m.userData;
            let hex = 0x000000;

            if (tierLight !== null && tier.key === tierLight) hex = 0x220810;
            if (block.code === hoverCode) hex = 0x4a0d18;
            if (block.code === focusBlock) hex = 0x6a1422;

            m.material.emissive.setHex(hex);
        });
    }

    function setHover(mesh) {
        if (hovered === mesh) return;

        hovered = mesh;
        paint();
    }

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endPointer);
    el.addEventListener('pointercancel', endPointer);
    el.addEventListener('pointerleave', onPointerLeave);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('click', onClick);

    // ---------------------------------------------------------------
    // Venue group — everything rebuilt per venue hangs off this.
    // ---------------------------------------------------------------
    const venueGroup = new THREE.Group();
    scene.add(venueGroup);

    // Footprint of the bowl currently rendered, for framing.
    let bowlHalfLength = 0;
    let bowlHalfWidth = 0;

    /**
     * Distance at which the bowl fills the frame.
     *
     * The prototype used a flat `halfLength * 2.1`, tuned for a full-viewport
     * canvas. A seat map panel is wide and short, so that constant left the
     * bowl as a small object in a lot of sky.
     *
     * Each footprint axis is fitted against the field of view it actually
     * spans: the bowl's LENGTH runs across the screen (horizontal FOV), its
     * WIDTH up it (vertical FOV). Fitting the length against the vertical FOV
     * instead — the obvious-looking version — over-estimates the distance by
     * about 50% on a wide panel, because the long axis is not what the short
     * dimension has to accommodate. Taking the max of the two keeps a narrow
     * phone viewport correct as well, where the horizontal term dominates.
     *
     * Recomputed on resize: the aspect ratio is precisely what changed.
     */
    function frameDistance() {
        if (bowlHalfLength <= 0) return targetRadius;

        const vFov = (camera.fov * Math.PI) / 180;
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
        const fit = Math.max(
            bowlHalfLength / Math.tan(hFov / 2),
            bowlHalfWidth / Math.tan(vFov / 2),
        );

        return clamp(fit * 1.15, MIN_RADIUS, MAX_RADIUS);
    }

    function render(payload) {
        clearGroup(venueGroup);
        tierMeshes = [];
        hovered = null;
        tierLight = null;
        focusBlock = null;
        clearGroup(seatGroup);
        seatLayer = null;
        seatHover = -1;
        payloadNow = payload || null;
        tiersNow = [];

        if (!payload) return;

        const tiers = resolveTiers(payload.tiers, payload.capacity);

        if (!tiers.length) return;

        tiersNow = tiers;

        buildVenue(venueGroup, payload, tiers, (mesh) => tierMeshes.push(mesh));

        // Frame the camera to this bowl's footprint. Angle is preserved once
        // the fan has moved the camera — re-framing on a venue switch would
        // throw away their chosen viewpoint.
        const outer = tiers[tiers.length - 1].outerR;
        bowlHalfLength = outer * LEN_K;
        bowlHalfWidth = outer * WID_K;

        const framed = frameDistance();
        targetRadius = framed;

        // A new venue always starts on its overview.
        mode = 'home';
        minRadius = MIN_RADIUS;
        desiredTarget.copy(HOME_TARGET);

        if (!userHasInteracted) {
            radius = framed;
            autoRotate = true;
        }
    }

    function resize() {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;

        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        // Re-frame: a rotated phone or a reflowed panel changes which axis
        // binds, and a bowl framed for the old aspect is cropped or lost.
        if (!userHasInteracted && mode === 'home') {
            targetRadius = frameDistance();
        }
    }

    function viewOpts() {
        return {
            cornerRatio: payloadNow?.corner_ratio,
            partial: Boolean(payloadNow?.partial_bowl),
        };
    }

    function aim(orbit) {
        desiredTarget.set(...orbit.target);
        targetRadius = orbit.radius;
        targetAzimuth = nearestAngle(azimuth, orbit.azimuth);
        targetPolar = orbit.polar;
    }

    // ---------------------------------------------------------------
    // Seats of one open block. Two instanced meshes (cushions and backs)
    // whatever the seat count, so a 800-seat Upper block is two draw calls.
    // Empty seats exist only here, derived from the grid; only the taken
    // ones came from the server.
    // ---------------------------------------------------------------
    const seatGroup = new THREE.Group();
    scene.add(seatGroup);
    let seatLayer = null;
    let seatHover = -1;
    const seatColor = new THREE.Color();

    function paintSeats() {
        if (!seatLayer) return;

        seatLayer.cells.forEach((cell, i) => {
            const picked = seatLayer.selected.has(cell.key);
            let hex = SEAT_FREE;

            if (seatLayer.taken.has(cell.key)) hex = SEAT_TAKEN;
            else if (picked) hex = i === seatHover ? SEAT_PICKED_HOVER : SEAT_PICKED;
            else if (i === seatHover) hex = SEAT_HOVER;

            seatColor.setHex(hex);
            seatLayer.meshes.forEach((m) => m.setColorAt(i, seatColor));
        });

        seatLayer.meshes.forEach((m) => { m.instanceColor.needsUpdate = true; });
    }

    function setSeatHover(index) {
        if (index === seatHover) return;

        seatHover = index;
        paintSeats();
    }

    /**
     * Draw one block's seats, or clear them with null:
     *   { tierKey, blockCode, grid: {rows, perRow, lastRow},
     *     taken: Set<"row:number">, selected: Set<"row:number"> }
     * Calling again with the same block only repaints (a selection change),
     * so picking a seat does not rebuild 800 instances.
     */
    function showSeats(spec) {
        const same = spec && seatLayer
            && seatLayer.block.code === spec.blockCode && seatLayer.tier.key === spec.tierKey
            && seatLayer.cells.length === countSeats(spec.grid);

        if (same) {
            seatLayer.taken = spec.taken;
            seatLayer.selected = spec.selected;
            paintSeats();
            return;
        }

        clearGroup(seatGroup);
        seatLayer = null;
        seatHover = -1;

        const tier = spec && tiersNow.find((t) => t.key === spec.tierKey);
        const block = tier?.blocks?.find((b) => b.code === spec.blockCode);

        if (!tier || !block || !spec.grid?.rows) return;

        const opts = viewOpts();
        const place = (row, n) => seatPosition(tiersNow, tier.key, block, spec.grid, row, n, opts);
        const cells = [];

        for (let row = 1; row <= spec.grid.rows; row += 1) {
            for (let n = 1; n <= seatsInRow(spec.grid, row); n += 1) {
                cells.push({ row, number: n, key: `${row}:${n}`, at: place(row, n) });
            }
        }

        // Seat size from the spacing of the grid itself.
        const a = place(1, 1).position;
        const along = spec.grid.perRow > 1 ? dist(a, place(1, 2).position) : 1;
        const across = spec.grid.rows > 1 ? dist(a, place(2, 1).position) : 1;
        const w = Math.min(along * 0.8, 1.4);
        const d = Math.min(across * 0.5, 1.2);
        const backH = Math.min(across * 0.45, 0.9);

        const material = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 });
        const cushions = new THREE.InstancedMesh(new THREE.BoxGeometry(w, 0.16, d), material, cells.length);
        const backs = new THREE.InstancedMesh(new THREE.BoxGeometry(w, backH, 0.1), material, cells.length);
        const dummy = new THREE.Object3D();

        cells.forEach((cell, i) => {
            const [x, y, z] = cell.at.position;

            // Face the pitch: local +z towards the centre, so x runs along
            // the row and the back sits behind, on the far side from the pitch.
            dummy.position.set(x, y, z);
            dummy.lookAt(0, y, 0);
            dummy.updateMatrix();
            cushions.setMatrixAt(i, dummy.matrix);

            dummy.translateZ(-d / 2);
            dummy.position.y += backH / 2;
            dummy.updateMatrix();
            backs.setMatrixAt(i, dummy.matrix);
        });

        [cushions, backs].forEach((m) => {
            m.instanceMatrix.needsUpdate = true;
            seatGroup.add(m);
        });

        seatLayer = {
            tier, block, cells, meshes: [cushions, backs], taken: spec.taken, selected: spec.selected,
        };
        paintSeats();
    }

    function countSeats(grid) {
        return grid?.rows ? grid.perRow * (grid.rows - 1) + grid.lastRow : 0;
    }

    /** Eye position of a seat of the open block, or null. */
    function eyeAt(seat) {
        if (!seatLayer || !seat) return null;

        const cell = seatLayer.cells.find((c) => c.row === seat.row && c.number === seat.number);

        if (!cell) return null;

        const [x, y, z] = cell.at.position;

        return { eye: [x, y + EYE_HEIGHT, z], look: [0, 0, 0] };
    }

    /** The angle a view is centred on: its block's middle, if it names one. */
    function angleFor(view) {
        const tier = tiersNow.find((t) => t.key === view.tierKey);
        const block = tier?.blocks?.find((b) => b.code === view.blockCode);

        return block ? block.mid : view.viewKey;
    }

    /**
     * Move the camera to a view:
     *   null                                        — the overview
     *   { tierKey, blockCode, seat: false }         — fly to that block
     *   { tierKey, blockCode, seat: true }          — sit in it
     * (`viewKey` in place of `blockCode` names a viewpoint instead.)
     * A tier this venue does not draw falls back to the overview.
     */
    function setView(view) {
        autoRotate = false;
        focusBlock = view?.blockCode ?? null;
        paint();

        if (view && view.tierKey) {
            const opts = viewOpts();
            const where = angleFor(view);

            if (view.seat) {
                // A picked seat of the open block, else the block's middle.
                const seat = eyeAt(view.seatAt) || seatView(tiersNow, view.tierKey, where, opts);

                if (seat) {
                    mode = 'seat';
                    aim(orbitFromEye(seat.eye, seat.look));
                    setHover(null);
                    hoverHandler?.(null, 0, 0);
                    return;
                }
            } else {
                // Close in when the block's seats are on show; frame the
                // stand otherwise.
                const stand = view.close
                    ? blockView(tiersNow, view.tierKey, where, opts)
                    : standView(tiersNow, view.tierKey, where, opts);

                if (stand) {
                    mode = 'stand';
                    minRadius = view.close ? 6 : STAND_MIN_RADIUS;
                    aim(stand);
                    return;
                }
            }
        }

        mode = 'home';
        minRadius = MIN_RADIUS;
        desiredTarget.copy(HOME_TARGET);
        targetRadius = frameDistance();
        targetPolar = HOME_POLAR;
    }

    /**
     * A still of the view from a seat, as a data URL, without moving the
     * visible camera. Rendered on the live canvas and copied off in the same
     * task — the browser has not composited yet, so the frame is never seen,
     * and the next line puts the real view back. (A render target would avoid
     * the double render but skips the canvas's sRGB output conversion, so the
     * thumbnail would come out darker than the scene it previews.)
     */
    function snapshot(view, w = 320, h = 180) {
        const seat = view?.tierKey
            ? eyeAt(view.seatAt) || seatView(tiersNow, view.tierKey, angleFor(view), viewOpts())
            : null;

        if (!seat) return null;

        try {
            const src = renderer.domElement;
            const cam = new THREE.PerspectiveCamera(camera.fov, src.width / src.height, 0.1, 3000);
            cam.position.set(...seat.eye);
            cam.lookAt(new THREE.Vector3(...seat.look));
            renderer.render(scene, cam);

            const out = document.createElement('canvas');
            out.width = w;
            out.height = h;

            // Centre-crop the canvas to the thumbnail's aspect.
            const scale = Math.min(src.width / w, src.height / h);
            const sw = w * scale;
            const sh = h * scale;
            out.getContext('2d').drawImage(
                src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, w, h,
            );

            renderer.render(scene, camera);

            return out.toDataURL('image/jpeg', 0.82);
        } catch (e) {
            return null;
        }
    }

    function tick() {
        if (disposed) return;

        frame = requestAnimationFrame(tick);

        if (autoRotate && !dragging && mode === 'home') targetAzimuth += 0.0018;

        azimuth += (targetAzimuth - azimuth) * 0.08;
        polar += (targetPolar - polar) * 0.08;
        radius += (targetRadius - radius) * 0.08;
        target.lerp(desiredTarget, 0.08);

        camera.position.set(
            target.x + radius * Math.sin(polar) * Math.sin(azimuth),
            target.y + radius * Math.cos(polar),
            target.z + radius * Math.sin(polar) * Math.cos(azimuth),
        );
        camera.lookAt(target);
        renderer.render(scene, camera);
    }

    resize();
    tick();

    return {
        render,
        resize,
        onHover(cb) { hoverHandler = cb; },
        onSelect(cb) { selectHandler = cb; },
        /** Light a whole tier from outside (legend hover), or null. */
        highlight(key) {
            tierLight = key || null;
            paint();
        },
        setAutoRotate(on) { autoRotate = Boolean(on) && mode === 'home'; },
        setView,
        showSeats,
        snapshot,
        dispose() {
            disposed = true;

            if (frame !== null) cancelAnimationFrame(frame);

            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', endPointer);
            el.removeEventListener('pointercancel', endPointer);
            el.removeEventListener('pointerleave', onPointerLeave);
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('click', onClick);

            clearGroup(venueGroup);
            disposeObject(scene);
            scene.clear();
            tierMeshes = [];
            hoverHandler = null;
            selectHandler = null;

            renderer.dispose();
            renderer.forceContextLoss?.();

            if (renderer.domElement.parentNode === host) {
                host.removeChild(renderer.domElement);
            }
        },
    };
}

// ===================================================================
// Scene furniture
// ===================================================================

function dist(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
}

function makeSky() {
    const geo = new THREE.SphereGeometry(700, 32, 20);
    const top = new THREE.Color(SKY_TOP);
    const horizon = new THREE.Color(SKY_HORIZON);
    const colors = [];
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i += 1) {
        const y = pos.getY(i);
        const t = THREE.MathUtils.clamp((y + 60) / 420, 0, 1);
        const c = horizon.clone().lerp(top, t);
        colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        vertexColors: true, side: THREE.BackSide, fog: false,
    }));
}

function addLighting(scene) {
    scene.add(new THREE.AmbientLight(0x3a3436, 1.1));

    const key = new THREE.DirectionalLight(0xfff5f0, 1.15);
    key.position.set(90, 140, 70);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -140;
    key.shadow.camera.right = 140;
    key.shadow.camera.top = 140;
    key.shadow.camera.bottom = -140;
    scene.add(key);

    const floodA = new THREE.PointLight(0xffffff, 0.5, 340);
    floodA.position.set(-100, 60, -100);
    scene.add(floodA);

    const floodB = new THREE.PointLight(0xe0263f, 0.4, 340);
    floodB.position.set(100, 55, 100);
    scene.add(floodB);
}

function addGround(scene) {
    const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(420, 72),
        new THREE.MeshStandardMaterial({ color: 0x100f11, roughness: 1 }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.08;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

function disposeObject(obj) {
    obj.traverse((child) => {
        if (child.geometry) child.geometry.dispose();

        if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m) => {
                Object.values(m).forEach((v) => {
                    if (v && v.isTexture) v.dispose();
                });
                m.dispose();
            });
        }
    });
}

function clearGroup(group) {
    disposeObject(group);

    while (group.children.length) group.remove(group.children[0]);
}
