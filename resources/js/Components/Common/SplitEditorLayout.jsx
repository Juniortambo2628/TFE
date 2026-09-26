import React from 'react';

/**
 * SplitEditorLayout — the shared edit-page layout: form on the left, a sticky
 * live preview on the right, using the full width of the main area. This is the
 * arrangement the tournament + partner edit pages use; extracted here so every
 * "edit one thing and watch it update" surface reads the same.
 *
 * Reuses `.partner-edit-grid` (2fr / 1fr on wide screens, stacked on narrow)
 * and the sticky `.admin-split-preview` pane.
 *
 * Usage:
 *   <SplitEditorLayout preview={<AccentCard … />}>
 *     <section className="tfe-slab">…form…</section>
 *   </SplitEditorLayout>
 */
export default function SplitEditorLayout({
    children,
    preview,
    previewTitle = 'Live preview',
    className = '',
}) {
    return (
        <div className={`partner-edit-grid ${className}`.trim()}>
            <div>{children}</div>
            <div>
                <div className="admin-split-preview">
                    {previewTitle && <h3 className="admin-split-preview__title">{previewTitle}</h3>}
                    {preview}
                </div>
            </div>
        </div>
    );
}
