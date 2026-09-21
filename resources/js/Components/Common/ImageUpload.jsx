import React, { useState } from 'react';

/**
 * ImageUpload — shared file picker with live preview, replacing bare
 * "image URL" text fields across the dashboards. Hands the chosen File up
 * via onFile (the parent posts it with forceFormData); onClear resets.
 *
 * Accepts jpg/png/webp only — matches the server-side
 * `mimes:jpg,jpeg,png,webp` rule (SVG is refused platform-wide to avoid
 * stored-XSS via same-origin storage).
 */
export default function ImageUpload({ value, onFile, onClear, hint = 'JPG, PNG or WebP — up to 5MB' }) {
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
        <div className="tfe-image-upload">
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
                    <span>Click to upload</span>
                    <small>{hint}</small>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} hidden />
                </label>
            )}
        </div>
    );
}
