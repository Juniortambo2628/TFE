import React, { useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import ListingGrid from '@/Components/Common/ListingGrid';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { router } from '@inertiajs/react';
import { MEDIA_ACCEPT } from '@/lib/media';

/**
 * Media library — the shared gallery of uploaded photos and videos. Uploads
 * here are compressed by MediaLibraryService like every other upload, and any
 * image field across the CMS can re-pick them via MediaPicker.
 */
export default function Media({ auth, assets = { data: [] }, stats = {} }) {
    const items = assets.data || [];
    const fileInput = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [toDelete, setToDelete] = useState(null);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Media' },
    ];

    const formatSize = (bytes) => {
        if (!bytes) return '0 KB';
        const mb = bytes / (1024 * 1024);
        return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    };

    const onFilesPicked = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setUploading(true);
        router.post(route('admin.media.store'), { files }, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploading(false);
                if (fileInput.current) fileInput.current.value = '';
            },
        });
    };

    const handleDelete = () => {
        if (!toDelete) return;
        router.delete(route('admin.media.destroy', toDelete), {
            preserveScroll: true,
            onSuccess: () => setToDelete(null),
        });
    };

    return (
        <AdminLayout title="Media Library">
            <DashboardHero
                role="admin"
                title="Media Library"
                subtitle="Upload once, reuse anywhere — every image field can pick from here."
                breadcrumbs={breadcrumbs}
                action={{
                    label: uploading ? 'Uploading…' : 'Upload',
                    icon: 'fas fa-cloud-arrow-up me-2',
                    onClick: () => fileInput.current?.click(),
                }}
            />

            <input
                ref={fileInput}
                type="file"
                accept={MEDIA_ACCEPT.media}
                multiple
                hidden
                onChange={onFilesPicked}
            />

            <SummaryTiles items={[
                { label: 'Total Files', value: stats.total ?? items.length, icon: 'fa-photo-film', accent: 'violet' },
                { label: 'Images', value: stats.images ?? 0, icon: 'fa-image', accent: 'blue' },
                { label: 'Videos', value: stats.videos ?? 0, icon: 'fa-video', accent: 'cyan' },
                { label: 'Storage', value: formatSize(stats.bytes), icon: 'fa-hard-drive', accent: 'teal' },
            ]} className="mb-4" />

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-photo-film me-2"></i> Uploaded Media</h3>
                    <span className="admin-badge admin-badge-gray">{items.length} items</span>
                </div>
                <div className="card-body">
                    <ListingGrid
                        items={items}
                        emptyIcon="fas fa-photo-film"
                        emptyTitle="No media yet"
                        emptyBody="Click 'Upload' to add photos or videos to the library."
                        to={(asset) => ({
                            title: asset.name,
                            eyebrow: asset.kind === 'video' ? 'Video' : 'Image',
                            accent: asset.kind === 'video' ? '#06b6d4' : '#8b5cf6',
                            cover: asset.kind === 'image' ? asset.url : undefined,
                            artwork: asset.kind === 'image' ? undefined : { icon: 'fas fa-video' },
                            meta: [
                                { label: 'Size', value: formatSize(asset.size) },
                                { label: 'Dimensions', value: asset.width ? `${asset.width}×${asset.height}` : '—' },
                            ],
                            cornerButton: {
                                icon: 'fas fa-trash',
                                label: `Delete ${asset.name}`,
                                onClick: () => setToDelete(asset.id),
                            },
                        })}
                        tableView={
                            <table className="tfe-table">
                                <thead>
                                    <tr>
                                        <th>File</th>
                                        <th>Type</th>
                                        <th>Size</th>
                                        <th>Dimensions</th>
                                        <th>Uploaded</th>
                                        <th style={{ width: 80 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((asset) => (
                                        <tr key={asset.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="rounded overflow-hidden bg-dark" style={{ width: 40, height: 40 }}>
                                                        {asset.kind === 'image' ? (
                                                            <img src={asset.url} alt={asset.name} className="w-100 h-100 object-fit-cover" />
                                                        ) : (
                                                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary">
                                                                <i className="fas fa-video"></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="fw-semibold text-truncate" style={{ maxWidth: 260 }}>{asset.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="tfe-pill tfe-pill--info">{asset.kind}</span>
                                            </td>
                                            <td>{formatSize(asset.size)}</td>
                                            <td>{asset.width ? `${asset.width}×${asset.height}` : '—'}</td>
                                            <td>{asset.created_at}</td>
                                            <td>
                                                <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Delete media" onClick={() => setToDelete(asset.id)}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        }
                    />
                </div>
            </div>

            <ConfirmationDialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
                title="Delete Media?"
                description="Remove this file from the library? Anything still referencing it will fall back to its placeholder."
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
