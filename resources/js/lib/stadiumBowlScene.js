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

import { LEN_K, WID_K, resolveTiers } from './stadiumBowl';
import { buildVenue } from './stadiumBowlGeometry';

const SKY_TOP = 0x08080a;
const SKY_HORIZON = 0x7a1f22;
const FOG_COLOR = 0x180b0c;

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
    const target = new THREE.Vector3(0, 6, 0);
    let radius = 220;
    let targetRadius = 220;
    let azimuth = Math.PI * 0.22;
    let targetAzimuth = azimuth;
    let polar = Math.PI * 0.36;
    let targetPolar = polar;
    const MIN_RADIUS = 55;
    const MAX_RADIUS = 480;
    const MIN_POLAR = 0.14;
    const MAX_POLAR = Math.PI * 0.49;

    let autoRotate = true;
    let userHasInteracted = false;
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

    function onPointerDown(e) {
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
            targetRadius = clamp(pinchStartRadius / (scale || 1), MIN_RADIUS, MAX_RADIUS);
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

        // Not dragging — hit-test for the hover tooltip.
        updateHover(e);
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
        e.preventDefault();
        userHasInteracted = true;
        autoRotate = false;
        targetRadius = clamp(targetRadius + e.deltaY * 0.15, MIN_RADIUS, MAX_RADIUS);
    }

    function onPointerLeave() {
        setHover(null);
        hoverHandler?.(null, 0, 0);
    }

    function onClick(e) {
        const mesh = pick(e);

        if (mesh && selectHandler) selectHandler(mesh.userData.tier);
    }

    function pick(e) {
        const rect = el.getBoundingClientRect();

        if (!rect.width || !rect.height) return null;

        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);

        const hits = raycaster.intersectObjects(tierMeshes, false);

        return hits.length ? hits[0].object : null;
    }

    function updateHover(e) {
        const mesh = pick(e);
        setHover(mesh);

        if (!hoverHandler) return;

        if (mesh) {
            // Canvas-relative, NOT clientX/clientY: the tooltip is positioned
            // inside the stage. A viewport-positioned overlay would land in the
            // wrong place the moment an ancestor carries a transform, which is
            // routine inside a modal.
            const rect = el.getBoundingClientRect();
            hoverHandler(mesh.userData.tier, e.clientX - rect.left, e.clientY - rect.top);
        } else {
            hoverHandler(null, 0, 0);
        }
    }

    function setHover(mesh) {
        if (hovered === mesh) return;

        // Every mesh of the same tier lifts together — a partial bowl draws
        // its top tier as two meshes (covered stand + open terrace) and
        // highlighting only the one under the cursor looks like a glitch.
        const key = mesh?.userData?.tier?.key ?? null;

        tierMeshes.forEach((m) => {
            const on = key !== null && m.userData.tier.key === key;
            m.material.emissive.setHex(on ? 0x330a10 : 0x000000);
        });

        hovered = mesh;
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

        if (!payload) return;

        const tiers = resolveTiers(payload.tiers, payload.capacity);

        if (!tiers.length) return;

        buildVenue(venueGroup, payload, tiers, (mesh) => tierMeshes.push(mesh));

        // Frame the camera to this bowl's footprint. Angle is preserved once
        // the fan has moved the camera — re-framing on a venue switch would
        // throw away their chosen viewpoint.
        const outer = tiers[tiers.length - 1].outerR;
        bowlHalfLength = outer * LEN_K;
        bowlHalfWidth = outer * WID_K;

        const framed = frameDistance();
        targetRadius = framed;

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
        if (!userHasInteracted) {
            targetRadius = frameDistance();
        }
    }

    function tick() {
        if (disposed) return;

        frame = requestAnimationFrame(tick);

        if (autoRotate && !dragging) targetAzimuth += 0.0018;

        azimuth += (targetAzimuth - azimuth) * 0.08;
        polar += (targetPolar - polar) * 0.08;
        radius += (targetRadius - radius) * 0.08;

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
        /** Highlight a tier from outside (legend hover). */
        highlight(key) {
            setHover(key ? tierMeshes.find((m) => m.userData.tier.key === key) || null : null);
        },
        setAutoRotate(on) { autoRotate = Boolean(on); },
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
