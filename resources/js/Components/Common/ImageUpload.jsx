import React, { useState } from 'react';
import MediaPicker from '@/Components/Common/MediaPicker';
import { MEDIA_ACCEPT } from '@/lib/media';

/**
 * ImageUpload — shared file picker with live preview, replacing bare
 * "image URL" text fields across the dashboards. Hands the chosen File up
 * via onFile (the parent posts it with forceFormData); onClear resets.
 *
 * Accepts jpg/png/webp/gif/avif by default (the platform-wide raster set —
 * see lib/media.js, the single source of truth mirrored server-side by
 * MediaLibraryService). SVG is refused platform-wide to avoid stored-XSS via
 * same-origin storage, so never add it to `accept`.
 *
 * Pass `gallery` to add a "Choose from library" button: the field can then
 * reuse a photo already in the media library instead of re-uploading it. The
 * picked URL comes back via `onPick(url)`.
 */
export default function ImageUpload({
    value,
    onFile,
    onClear,
    onPick,
    accept = MEDIA_ACCEPT.image,
    hint = 'JPG, PNG, WebP, GIF or AVIF — auto-compressed',
    label = 'Click to upload',
    compact = false,
    gallery = false,
    galleryKind = 'image',
}) {
    const [preview, setPreview] = useState(value || null);
    const [pickerOpen, setPickerOpen] = useState(false);

    const pick = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const clear = () => {
        setPreview(null);
        onClear?.();
    };

    const pickFromGallery = (url) => {
        setPreview(url);
        onPick?.(url);
    };

    return (
        <div className={`tfe-image-upload${compact ? ' tfe-image-upload--compact' : ''}`}>
            {preview ? (
                <div className="tfe-image-upload__preview">
                    <img src={preview} alt="Preview" />
                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Remove image" onClick={clear}>
                        <i className="fas fa-times" />
                    </button>
                </div>
            ) : (
                <label className="tfe-image-upload__drop">
                    <i className="fas fa-cloud-arrow-up" />
                    <span>{label}</span>
                    <small>{hint}</small>
                    <input type="file" accept={accept} onChange={pick} hidden />
                </label>
            )}

            {gallery && (
                <>
                    <button
                        type="button"
                        className="tfe-btn tfe-btn--sm tfe-image-upload__gallery-btn"
                        onClick={() => setPickerOpen(true)}
                    >
                        <i className="fas fa-photo-film" /> Choose from library
                    </button>
                    <MediaPicker
                        open={pickerOpen}
                        onClose={() => setPickerOpen(false)}
                        onPick={pickFromGallery}
                        kind={galleryKind}
                    />
                </>
            )}
        </div>
    );
}
