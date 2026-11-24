import React, { useEffect, useRef, useState } from 'react';

import { createBowlScene } from '@/lib/stadiumBowlScene';

/**
 * StadiumBowlCanvas — React lifecycle around the three.js bowl scene.
 *
 * Imported lazily by `StadiumBowl`, which is what surfaces should use. Keeping
 * this a separate module is what keeps `three` (~600KB) in its own Rollup
 * chunk instead of the entry bundle — see the manualChunks note in
 * vite.config.js for why hand-grouping it would backfire.
 *
 * Props:
 *   bowl          object   — one StadiumBowlService payload.
 *   highlightKey  string?  — tier key to light up from outside (legend hover).
 *   onHover       fn?      — ({ tier, block }|null, x, y), stage-relative.
 *   onSelect      fn?      — (tier, block) when a block is clicked.
 *   view          object?  — { tierKey, blockCode, seat } to fly to, or null
 *                            for the overview. See `setView` in the scene.
 *   onSnapshot    fn?      — (dataUrl|null) a still of the view from the
 *                            focused tier, whenever the focus changes.
 *   height        number?  — canvas height in px.
 */
export default function StadiumBowlCanvas({
    bowl,
    highlightKey = null,
    onHover,
    onSelect,
    view = null,
    onSnapshot,
    height = 420,
}) {
    const hostRef = useRef(null);
    const sceneRef = useRef(null);
    const hoverRef = useRef(onHover);
    const selectRef = useRef(onSelect);
    const snapshotRef = useRef(onSnapshot);
    const [failed, setFailed] = useState(false);

    // Keep the latest callbacks reachable without tearing the scene down and
    // rebuilding it every time the parent re-renders with new closures.
    hoverRef.current = onHover;
    selectRef.current = onSelect;
    snapshotRef.current = onSnapshot;

    useEffect(() => {
        const host = hostRef.current;

        if (!host) return undefined;

        const scene = createBowlScene(host);

        if (!scene) {
            setFailed(true);
            return undefined;
        }

        sceneRef.current = scene;
        scene.onHover((hit, x, y) => hoverRef.current?.(hit, x, y));
        scene.onSelect((tier, block) => selectRef.current?.(tier, block));

        const ro = new ResizeObserver(() => scene.resize());
        ro.observe(host);

        // Don't spin an animation loop for a bowl nobody is looking at. The
        // budget calculator mounts this a long way down a scrolling page.
        let io = null;

        if (typeof IntersectionObserver !== 'undefined') {
            io = new IntersectionObserver(
                ([entry]) => scene.setAutoRotate(entry.isIntersecting),
                { threshold: 0.1 },
            );
            io.observe(host);
        }

        return () => {
            ro.disconnect();
            io?.disconnect();
            scene.dispose();
            sceneRef.current = null;
        };
    }, []);

    // Rebuild only when the venue actually changes — the payload object
    // identity churns on every Inertia partial reload.
    useEffect(() => {
        sceneRef.current?.render(bowl);
    }, [bowl?.slug, bowl?.source, bowl?.sold_pct]);

    useEffect(() => {
        sceneRef.current?.highlight(highlightKey);
    }, [highlightKey]);

    // Declared after the venue effect on purpose: on first mount the bowl has
    // to exist before the camera can be pointed at one of its tiers.
    useEffect(() => {
        const scene = sceneRef.current;

        if (!scene) return;

        scene.setView(view);

        if (view?.tierKey && !view.seat) {
            snapshotRef.current?.(scene.snapshot(view));
        }
    }, [bowl?.slug, view?.tierKey, view?.blockCode, view?.viewKey, view?.seat]);

    if (failed) {
        return (
            <div className="tfe-bowl__fallback" style={{ height }}>
                <i className="fas fa-cube" aria-hidden="true" />
                <p>
                    Your browser could not start the 3D view. The tier breakdown below still
                    shows every seating band and how full it is.
                </p>
            </div>
        );
    }

    return <div ref={hostRef} className="tfe-bowl__canvas" style={{ height }} />;
}
