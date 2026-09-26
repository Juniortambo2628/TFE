import React from 'react';

/**
 * SplitEditorLayout — the shared edit-page layout: form on the left, a sticky
 * live preview on the right, using the full width of the main area. This is the
 * arrangement the tournament + partner edit pages use; extracted here so every
 * "edit one thing and watch it update" surface reads the same.
 *
 * Sprint 53: the CSS it reaches for (`.tfe-split-grid` / `.tfe-split-preview`)
 * moved from the admin-only stylesheets into `primitives.css`, so the fan and
 * partner account pages render through this component too. The former
 * `.partner-edit-grid` / `.admin-split-preview` names are kept as aliases
 * there — an existing page that spells them out still looks right.
 *
 * Usage:
 *   <SplitEditorLayout preview={<AccentCard … />}>
 *     <div className="tfe-editor-stack">…form slabs…</div>
 *   </SplitEditorLayout>
 */
export default function SplitEditorLayout({
    children,
    preview,
    previewTitle = 'Live preview',
    className = '',
}) {
    // Without a preview there is no second column to reserve — rendering the
    // grid anyway would leave the form at 2/3 width beside empty space.
    if (!preview) {
        return <div className={className || undefined}>{children}</div>;
    }

    return (
        <div className={`tfe-split-grid ${className}`.trim()}>
            <div>{children}</div>
            <div>
                <div className="tfe-split-preview">
                    {previewTitle && <h3 className="tfe-split-preview__title">{previewTitle}</h3>}
                    {preview}
                </div>
            </div>
        </div>
    );
}
