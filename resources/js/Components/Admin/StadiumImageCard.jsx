import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import ImageUpload from '@/Components/Common/ImageUpload';

/**
 * StadiumImageCard — one venue's hero image in the admin Stadium Images grid.
 *
 * Shows what is currently live, lets an admin upload a replacement, and offers
 * a Reset once an override exists. The committed default under
 * public/stadiums/ is never touched by either action — "Reset" just deletes
 * the SiteSetting row and the default becomes live again, which is why a bad
 * upload can always be undone without a redeploy.
 */
export default function StadiumImageCard({ venue, tournamentId }) {
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [broken, setBroken] = useState(false);

    const save = () => {
        if (!file) return;
        setSaving(true);

        router.post(route('admin.content.settings.update'), {
            key: `stadium_image_${venue.slug}`,
            value: file,
            type: 'image',
            group: 'stadiums',
        }, {
            // The payload carries a File, so it has to go up as multipart.
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setFile(null),
            onFinish: () => setSaving(false),
        });
    };

    const reset = () => {
        setSaving(true);
        router.post(route('admin.content.stadium-images.reset'), {
            slug: venue.slug,
            tournament_id: tournamentId,
        }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="admin-card-dark h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
                <h3 className="mb-0">{venue.name}</h3>
                {venue.is_overridden && (
                    <span className="tfe-pill tfe-pill--info">Custom</span>
                )}
            </div>

            <div className="card-body">
                <div className="admin-stadium-preview mb-3">
                    {venue.url && !broken ? (
                        <img
                            src={venue.url}
                            alt={venue.name}
                            loading="lazy"
                            decoding="async"
                            onError={() => setBroken(true)}
                        />
                    ) : (
                        <div className="tfe-empty tfe-empty--inline">
                            <div className="tfe-empty__icon"><i className="fas fa-image" /></div>
                            <p className="tfe-empty__body mb-0">
                                {broken
                                    ? 'This image failed to load — the file may be missing.'
                                    : 'No image set.'}
                            </p>
                        </div>
                    )}
                </div>

                <p className="admin-stadium-meta">
                    <i className="fas fa-location-dot me-1" />
                    {[venue.city, venue.country].filter(Boolean).join(', ')}
                    <span className="admin-stadium-slug">{venue.slug}</span>
                </p>

                <ImageUpload
                    onFile={setFile}
                    onClear={() => setFile(null)}
                    hint="JPG, PNG or WebP — 1920px wide recommended"
                />

                <div className="d-flex gap-2 mt-3">
                    <button
                        className="tfe-btn tfe-btn--sm tfe-btn--filled"
                        onClick={save}
                        disabled={!file || saving}
                    >
                        {saving ? 'Saving…' : 'Replace Image'}
                    </button>

                    {venue.is_overridden && (
                        <button
                            className="tfe-btn tfe-btn--sm"
                            onClick={reset}
                            disabled={saving}
                            title="Restore the image shipped with the app"
                        >
                            Reset to Default
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
