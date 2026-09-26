import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import ListingGrid from '@/Components/Common/ListingGrid';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { Head, router } from '@inertiajs/react';

export default function Stories({ auth, stories = { data: [] } }) {
    const items = stories.data || [];

    const [storyToDelete, setStoryToDelete] = useState(null);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Stories' }
    ];

    const active = items.filter((s) => !s.is_expired);

    const handleDelete = () => {
        if (storyToDelete) {
            router.delete(route('admin.stories.destroy', storyToDelete), {
                onSuccess: () => setStoryToDelete(null)
            });
        }
    };

    return (
        <AdminLayout title="Stories Management">
            <Head title="Admin - Stories" />
            <DashboardHero role="admin"
                title="Stories Management"
                subtitle="Moderate fan stories — the 24-hour photo and video feed."
                breadcrumbs={breadcrumbs}
            />

            <SummaryTiles items={[
                { label: 'Total Stories', value: stories.total ?? items.length, icon: 'fa-images', accent: 'violet' },
                { label: 'Active Now', value: active.length, icon: 'fa-circle-play', accent: 'teal' },
                { label: 'Expired', value: items.length - active.length, icon: 'fa-clock', accent: 'amber' },
            ]} className="mb-4" />

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-images me-2"></i> Fan Stories</h3>
                    <span className="admin-badge admin-badge-gray">{items.length} items</span>
                </div>
                <div className="card-body">
                    <ListingGrid
                        items={items}
                        emptyIcon="fas fa-images"
                        emptyTitle="No stories yet"
                        emptyBody="Fan stories will appear here as they are posted."
                        to={(story) => ({
                            title: story.user_name,
                            eyebrow: story.media_type === 'video' ? 'Video story' : 'Photo story',
                            desc: story.caption,
                            accent: story.is_expired ? '#64748b' : '#8b5cf6',
                            cover: story.media_type === 'image' && story.media_url ? story.media_url : undefined,
                            artwork: story.media_type === 'image' && story.media_url
                                ? undefined
                                : { icon: story.media_type === 'video' ? 'fas fa-video' : 'fas fa-image' },
                            status: story.is_expired ? 'Expired' : 'Active',
                            meta: [
                                { label: 'Views', value: story.views_count ?? 0 },
                                { label: 'Replies', value: story.replies_count ?? 0 },
                            ],
                            cornerButton: {
                                icon: 'fas fa-trash',
                                label: `Delete ${story.user_name}'s story`,
                                onClick: () => setStoryToDelete(story.id),
                            },
                        })}
                        tableView={
                            <table className="tfe-table">
                                <thead>
                                    <tr>
                                        <th>Author</th>
                                        <th>Type</th>
                                        <th>Caption</th>
                                        <th>Views</th>
                                        <th>Replies</th>
                                        <th>Expires</th>
                                        <th>Status</th>
                                        <th style={{ width: 80 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((story) => (
                                        <tr key={story.id}>
                                            <td className="fw-semibold">{story.user_name}</td>
                                            <td>
                                                <span className="tfe-pill tfe-pill--info">
                                                    {story.media_type === 'video' ? 'Video' : 'Photo'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-white-50">{story.caption || '—'}</span>
                                            </td>
                                            <td>{story.views_count ?? 0}</td>
                                            <td>{story.replies_count ?? 0}</td>
                                            <td>{story.expires_at}</td>
                                            <td>
                                                <span className={`tfe-pill ${story.is_expired ? 'tfe-pill--concluded' : 'tfe-pill--approved'}`}>
                                                    {story.is_expired ? 'Expired' : 'Active'}
                                                </span>
                                            </td>
                                            <td>
                                                <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Delete story" onClick={() => setStoryToDelete(story.id)}>
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
                open={!!storyToDelete}
                onOpenChange={(open) => !open && setStoryToDelete(null)}
                title="Delete Story?"
                description="Are you sure you want to remove this story? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
