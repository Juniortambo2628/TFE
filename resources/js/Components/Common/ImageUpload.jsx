import React, { useState } from 'react';

/**
 * ImageUpload — shared file picker with live preview, replacing bare
 * "image URL" text fields across the dashboards. Hands the chosen File up
 * via onFile (the parent posts it with forceFormData); onClear resets.
 *
 * Defaults to jpg/png/webp — matching the server-side
 * `mimes:jpg,jpeg,png,webp` rule most uploaders enforce. SVG is refused
 * platform-wide to avoid stored-XSS via same-origin storage, so never add it
 * to `accept`. Surfaces whose server rule is wider (the social feed also
 * takes GIFs) pass their own `accept` + `hint`.
 */
export default function ImageUpload({
    value,
    onFile,
    onClear,
    accept = 'image/jpeg,image/png,image/webp',
    hint = 'JPG, PNG or WebP — up to 5MB',
    label = 'Click to upload',
    compact = false,
}) {
    const [preview, setPreview] = useState(value || null);

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
        </div>
    );
}
