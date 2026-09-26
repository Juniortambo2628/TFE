import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TfeModal from '@/Components/Common/TfeModal';

/**
 * MediaPicker — the shared "choose from the gallery" dialog. Lists the media
 * library (Admin\MediaController::list) and hands the chosen asset's URL back
 * via onPick. Any image field can open this instead of forcing a re-upload of
 * a photo that already lives in the library.
 *
 * `kind="image"` keeps a background-image picker from offering videos; pass
 * `kind={null}` to show everything.
 */
export default function MediaPicker({ open, onClose, onPick, kind = 'image' }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        axios
            .get(route('admin.media.list'), { params: kind ? { kind } : {} })
            .then((res) => { if (!cancelled) setAssets(res.data.assets || []); })
            .catch(() => { if (!cancelled) setError('Could not load the media library.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, kind]);

    const choose = (asset) => {
        onPick(asset.url);
        onClose();
    };

    return (
        <TfeModal open={open} title="Media library" onClose={onClose} size="lg">
            {loading && (
                <div className="tfe-empty tfe-empty--inline">
                    <div className="tfe-empty__icon"><i className="fas fa-spinner fa-spin" /></div>
                    <p className="tfe-empty__body">Loading…</p>
                </div>
            )}

            {!loading && error && (
                <div className="tfe-empty tfe-empty--inline">
                    <div className="tfe-empty__icon"><i className="fas fa-triangle-exclamation" /></div>
                    <p className="tfe-empty__body">{error}</p>
                </div>
            )}

            {!loading && !error && assets.length === 0 && (
                <div className="tfe-empty tfe-empty--inline">
                    <div className="tfe-empty__icon"><i className="fas fa-photo-film" /></div>
                    <h3 className="tfe-empty__title">The library is empty</h3>
                    <p className="tfe-empty__body">Upload photos under Admin → Media, then pick them here.</p>
                </div>
            )}

            {!loading && !error && assets.length > 0 && (
                <div className="tfe-media-grid">
                    {assets.map((asset) => (
                        <button
                            key={asset.id}
                            type="button"
                            className="tfe-media-tile"
                            onClick={() => choose(asset)}
                            title={asset.name}
                        >
                            {asset.kind === 'video' ? (
                                <video src={asset.url} muted playsInline preload="metadata" />
                            ) : (
                                <img src={asset.url} alt={asset.name} loading="lazy" />
                            )}
                            <span className="tfe-media-tile__name">{asset.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </TfeModal>
    );
}
