import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import ImageUpload from '@/Components/Common/ImageUpload';
import { assetPath } from '@/lib/assets';

/**
 * SettingField — one self-saving SiteSetting editor, for every setting type.
 *
 * This is the single field primitive behind the admin CMS pages. It replaces
 * the per-page `SettingInput` closures those pages used to declare inline,
 * which had two problems beyond the duplication:
 *
 *  1. A component declared inside a page body is a NEW component type on every
 *     render, so React unmounted and remounted it — the field lost its cursor
 *     mid-typing and any in-flight edit.
 *  2. Image settings were plain text boxes asking a non-technical admin to
 *     type a path like `assets/img/backdrops/stadium-fans.jpg`. Those paths
 *     have no leading slash, so they also 404 on any nested route.
 *
 * `type="image"` therefore renders <ImageUpload> with a live preview of the
 * current value and uploads the file; the server stores it under /storage and
 * writes the resulting path back. "Reset to default" saves an empty string,
 * which every reader treats as "fall back to config".
 *
 * Props:
 *  - label, hint, placeholder, rows
 *  - settingKey + group → the SiteSetting key is `{group}_{settingKey}`
 *  - value          current saved value
 *  - defaultValue   what the code falls back to when the setting is blank
 *                   (shown as the preview + enables "Reset to default")
 *  - type           text | textarea | url | color | image
 *  - onSaved        optional callback
 */
export default function SettingField({
    label,
    settingKey,
    group,
    type = 'text',
    value = '',
    defaultValue = null,
    placeholder = '',
    hint = '',
    rows = 3,
    accept,
    onSaved,
}) {
    const fullKey = `${group}_${settingKey}`;
    const isImage = type === 'image';

    const [text, setText] = useState(value ?? '');
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const post = (payload, opts = {}) => {
        setSaving(true);
        setSaved(false);
        router.post(route('admin.content.settings.update'), {
            key: fullKey,
            // `type` and `group` are required server-side; omitting either
            // makes the save fail validation silently.
            type: type === 'textarea' || type === 'url' ? 'text' : type,
            group,
            ...payload,
        }, {
            preserveScroll: true,
            preserveState: true,
            forceFormData: !!opts.hasFile,
            onSuccess: () => {
                setSaved(true);
                onSaved?.();
                setTimeout(() => setSaved(false), 2200);
            },
            onFinish: () => setSaving(false),
        });
    };

    const saveText = () => post({ value: text });

    const saveFile = (picked) => {
        setFile(picked);
        post({ value: picked }, { hasFile: true });
    };

    // Picked an existing asset from the media library — save its URL as a plain
    // string value (no upload), exactly like the legacy stored-path behaviour.
    const savePickedUrl = (url) => post({ value: url });

    const clearImage = () => {
        setFile(null);
        post({ value: '' });
    };

    // The image the admin is currently looking at: the saved override if there
    // is one, otherwise whatever the code falls back to.
    const preview = value ? assetPath(value) : (defaultValue ? assetPath(defaultValue) : null);

    return (
        <div className="tfe-form-field admin-setting-field">
            <label className="tfe-form-label" htmlFor={`setting-${fullKey}`}>{label}</label>

            {isImage ? (
                <>
                    <ImageUpload
                        value={preview}
                        accept={accept}
                        hint={hint || 'JPG, PNG, WebP, GIF or AVIF — auto-compressed'}
                        onFile={saveFile}
                        onClear={clearImage}
                        gallery
                        onPick={savePickedUrl}
                    />
                    <div className="admin-setting-field__foot">
                        {value ? (
                            <button type="button" className="tfe-btn tfe-btn--sm" onClick={clearImage} disabled={saving}>
                                <i className="fas fa-rotate-left" /> Reset to default
                            </button>
                        ) : (
                            <span className="tfe-form-help">Showing the built-in default.</span>
                        )}
                        {saving && <span className="tfe-form-help"><i className="fas fa-spinner fa-spin" /> Saving…</span>}
                        {saved && <span className="admin-setting-field__saved"><i className="fas fa-check" /> Saved</span>}
                    </div>
                </>
            ) : (
                <>
                    {type === 'textarea' ? (
                        <textarea
                            id={`setting-${fullKey}`}
                            className="tfe-textarea"
                            rows={rows}
                            value={text}
                            placeholder={placeholder}
                            onChange={(e) => setText(e.target.value)}
                        />
                    ) : type === 'color' ? (
                        <input
                            id={`setting-${fullKey}`}
                            type="color"
                            className="tfe-color-swatch"
                            value={text || '#dc143c'}
                            onChange={(e) => setText(e.target.value)}
                        />
                    ) : (
                        <input
                            id={`setting-${fullKey}`}
                            type={type === 'url' ? 'url' : 'text'}
                            className="tfe-input"
                            value={text}
                            placeholder={placeholder}
                            onChange={(e) => setText(e.target.value)}
                        />
                    )}

                    {hint && <p className="tfe-form-help">{hint}</p>}

                    <div className="admin-setting-field__foot">
                        <button
                            type="button"
                            className="tfe-btn tfe-btn--sm"
                            onClick={saveText}
                            disabled={saving || text === (value ?? '')}
                        >
                            {saving ? (<><i className="fas fa-spinner fa-spin" /> Saving…</>) : 'Save'}
                        </button>
                        {saved && <span className="admin-setting-field__saved"><i className="fas fa-check" /> Saved</span>}
                    </div>
                </>
            )}
        </div>
    );
}
