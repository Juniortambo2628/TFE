import React, { useCallback, useEffect, useRef, useState } from 'react';
import TfeModal from '@/Components/Common/TfeModal';
import TeamAvatar from '@/Components/Common/TeamAvatar';

/**
 * AvatarCropper — drag to reposition, zoom, and export a square avatar
 * (Sprint 54).
 *
 * Hand-rolled on pointer events + a canvas rather than pulling in a cropper
 * package: it is ~150 lines, and an avatar crop needs exactly two gestures.
 *
 * The preview beside the stage is the real `TeamAvatar`, so the fan is
 * framing the thing they will actually get — ring, flag badge and all —
 * rather than a bare square they have to imagine circled.
 *
 * Exports WebP where the browser supports it and JPEG otherwise; both are in
 * `MediaLibraryService::IMAGE_MIMES`, which then compresses again server-side.
 *
 * @param {File}     file      The picked image. Opening with a file resets the view.
 * @param {Function} onCancel  Dismiss without producing anything.
 * @param {Function} onCrop    Receives the cropped File.
 */
const OUTPUT_SIZE = 512;
const STAGE = 280;

export default function AvatarCropper({ file, open, onCancel, onCrop, name, team, teamFlag }) {
    const [image, setImage] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [preview, setPreview] = useState(null);
    const [busy, setBusy] = useState(false);

    const drag = useRef(null);
    const stageRef = useRef(null);

    // Load the picked file into an Image once per file.
    useEffect(() => {
        if (!file) { setImage(null); return undefined; }

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            setImage(img);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        };
        img.src = url;

        return () => URL.revokeObjectURL(url);
    }, [file]);

    // The scale at which the image exactly covers the square stage. Zoom is a
    // multiplier on top, so zoom=1 is always "filled, nothing letterboxed".
    const coverScale = image ? Math.max(STAGE / image.width, STAGE / image.height) : 1;
    const scale = coverScale * zoom;

    // Keep the image covering the stage: clamp the pan to the overflow.
    const clamp = useCallback((next, currentScale) => {
        if (!image) return { x: 0, y: 0 };
        const maxX = Math.max(0, (image.width * currentScale - STAGE) / 2);
        const maxY = Math.max(0, (image.height * currentScale - STAGE) / 2);
        return {
            x: Math.max(-maxX, Math.min(maxX, next.x)),
            y: Math.max(-maxY, Math.min(maxY, next.y)),
        };
    }, [image]);

    useEffect(() => {
        setOffset((o) => clamp(o, scale));
    }, [scale, clamp]);

    const onPointerDown = (e) => {
        if (!image) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, from: offset };
    };

    const onPointerMove = (e) => {
        if (!drag.current) return;
        const next = {
            x: drag.current.from.x + (e.clientX - drag.current.x),
            y: drag.current.from.y + (e.clientY - drag.current.y),
        };
        setOffset(clamp(next, scale));
    };

    const endDrag = (e) => {
        if (!drag.current) return;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
        drag.current = null;
    };

    /** Paint the current view into a square canvas at output resolution. */
    const render = useCallback(() => {
        if (!image) return null;
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Everything on screen is in stage units; one factor converts to output.
        const k = OUTPUT_SIZE / STAGE;
        const w = image.width * scale * k;
        const h = image.height * scale * k;
        const x = (OUTPUT_SIZE - w) / 2 + offset.x * k;
        const y = (OUTPUT_SIZE - h) / 2 + offset.y * k;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, x, y, w, h);
        return canvas;
    }, [image, scale, offset]);

    // Keep the live preview in step with the stage.
    useEffect(() => {
        if (!image) { setPreview(null); return; }
        const canvas = render();
        if (canvas) setPreview(canvas.toDataURL('image/jpeg', 0.7));
    }, [image, render]);

    const confirm = () => {
        const canvas = render();
        if (!canvas) return;
        setBusy(true);

        const finish = (blob, ext) => {
            setBusy(false);
            if (!blob) return;
            onCrop(new File([blob], `avatar.${ext}`, { type: blob.type }));
        };

        canvas.toBlob((blob) => {
            // Safari used to hand back a PNG for an unsupported type rather
            // than null, so check what actually came out, not just that it did.
            if (blob && blob.type === 'image/webp') { finish(blob, 'webp'); return; }
            canvas.toBlob((jpeg) => finish(jpeg, 'jpg'), 'image/jpeg', 0.9);
        }, 'image/webp', 0.9);
    };

    return (
        <TfeModal
            open={open}
            title="Position your photo"
            onClose={onCancel}
            size="md"
            footer={(
                <>
                    <button type="button" className="tfe-btn" onClick={onCancel}>Cancel</button>
                    <button type="button" className="tfe-btn tfe-btn--filled" onClick={confirm} disabled={!image || busy}>
                        {busy ? 'Saving…' : 'Use this photo'}
                    </button>
                </>
            )}
        >
            <div className="tfe-cropper">
                <div className="tfe-cropper__stage-wrap">
                    <div
                        ref={stageRef}
                        className="tfe-cropper__stage"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        role="application"
                        aria-label="Drag to reposition your photo"
                    >
                        {image && (
                            <img
                                className="tfe-cropper__img"
                                src={image.src}
                                alt=""
                                draggable="false"
                                style={{
                                    width: image.width * scale,
                                    height: image.height * scale,
                                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                                }}
                            />
                        )}
                        <div className="tfe-cropper__mask" aria-hidden="true" />
                    </div>

                    <label className="tfe-cropper__zoom">
                        <i className="fas fa-magnifying-glass-minus" aria-hidden="true" />
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.01"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            aria-label="Zoom"
                        />
                        <i className="fas fa-magnifying-glass-plus" aria-hidden="true" />
                    </label>
                </div>

                <div className="tfe-cropper__preview">
                    <span className="tfe-form-label">Preview</span>
                    <TeamAvatar src={preview} name={name} team={team} teamFlag={teamFlag} size={104} />
                    <p className="tfe-form-help">
                        {team
                            ? `Framed in ${team}'s colours.`
                            : 'Pick a team on this page to frame your photo in their colours.'}
                    </p>
                </div>
            </div>
        </TfeModal>
    );
}
