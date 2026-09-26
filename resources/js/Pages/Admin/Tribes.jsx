import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import DashboardModal from '@/Components/Common/DashboardModal';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { Link, router, useForm } from '@inertiajs/react';
import TournamentPill from '@/Components/Common/TournamentPill';
import ListingGrid from '@/Components/Common/ListingGrid';

/**
 * Admin Tribes — list + reassign tournament + delete.
 *
 * Sprint 6 adds tournament scoping to tribes; this page surfaces the
 * assignment as a first-class column and lets admins re-pin a tribe
 * to a different tournament or clear the pin (cross-tournament).
 */
export default function Tribes({ auth, tribes = { data: [] }, tournaments = [] }) {
    const [editing, setEditing] = useState(null);
    const [toDelete, setToDelete] = useState(null);

    const { data, setData, put, processing, reset } = useForm({
        tournament_id: '',
        clear_tournament: false,
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Tribes' },
    ];

    const rows = Array.isArray(tribes) ? tribes : (tribes.data || []);

    const openReassign = (tribe) => {
        setEditing(tribe);
        setData({
            tournament_id: tribe.tournament_id || '',
            clear_tournament: false,
        });
    };

    const closeReassign = () => {
        setEditing(null);
        reset();
    };

    const submitReassign = (e) => {
        e.preventDefault();
        put(route('admin.tribes.update', editing.id), { onSuccess: closeReassign });
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        router.delete(route('admin.tribes.destroy', toDelete.id), {
            onSuccess: () => setToDelete(null),
        });
    };

    return (
        <AdminLayout title="Tribes">
            <DashboardHero
                role="admin"
                title="Tribes Management"
                subtitle="Community groups fans join. Scope a tribe to a single tournament or open it to all."
                breadcrumbs={breadcrumbs}
            />

            <ListingGrid
                items={rows}
                LinkComponent={Link}
                emptyIcon="fas fa-layer-group"
                emptyTitle="No tribes yet"
                emptyBody="Fans can create tribes from their dashboard once they're logged in."
                to={(tribe) => ({
                    href: route('admin.tribes.show', tribe.id),
                    title: tribe.name,
                    eyebrow: tribe.slug,
                    desc: `Created by ${tribe.creator_name}`,
                    accent: '#8b5cf6',
                    status: tribe.privacy,
                    artwork: { icon: 'fas fa-layer-group' },
                    pills: tribe.tournament_short ? [tribe.tournament_short] : ['Open to all'],
                    meta: [
                        { label: 'Members', value: tribe.member_count },
                        { label: 'Created', value: tribe.created_at },
                    ],
                    cta: { label: 'Open', icon: 'fas fa-arrow-right' },
                })}
                tableView={
                    <table className="tfe-table">
                        <thead>
                            <tr>
                                <th>Tribe</th>
                                <th>Tournament</th>
                                <th>Creator</th>
                                <th>Members</th>
                                <th>Privacy</th>
                                <th>Created</th>
                                <th style={{ width: 110 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((tribe) => (
                                <tr key={tribe.id}>
                                    <td>
                                        <div className="fw-semibold text-white">{tribe.name}</div>
                                        <small className="text-white-50">{tribe.slug}</small>
                                    </td>
                                    <td>
                                        <TournamentPill
                                            tournamentId={tribe.tournament_id}
                                            shortName={tribe.tournament_short}
                                            size="md"
                                        />
                                    </td>
                                    <td>{tribe.creator_name}</td>
                                    <td>{tribe.member_count}</td>
                                    <td><span className="tfe-pill tfe-pill--concluded">{tribe.privacy}</span></td>
                                    <td>{tribe.created_at}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="button"
                                                className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                onClick={() => openReassign(tribe)}
                                                aria-label="Reassign tournament"
                                                title="Reassign tournament"
                                            >
                                                <i className="fas fa-random"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                onClick={() => setToDelete(tribe)}
                                                aria-label="Delete tribe"
                                                title="Delete tribe"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                }
            />

            {/* Reassign modal */}
            <DashboardModal
                open={!!editing}
                onOpenChange={(open) => !open && closeReassign()}
                title={editing ? `Reassign ${editing.name}` : ''}
                label="Tribe"
            >
                <form onSubmit={submitReassign} className="p-4">
                    <p className="text-white-50 small mb-3">
                        Pick a tournament to scope this tribe to (fans of other tournaments won't see it),
                        or leave it as "Cross-tournament" so every fan sees it regardless of context.
                    </p>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Tournament</label>
                        <select
                            className="admin-form-input"
                            value={data.tournament_id}
                            onChange={(e) => setData('tournament_id', e.target.value)}
                            disabled={data.clear_tournament}
                        >
                            <option value="">— Select a tournament —</option>
                            {tournaments.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({t.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-3">
                        <label className="d-flex align-items-center gap-2 text-white">
                            <input
                                type="checkbox"
                                checked={data.clear_tournament}
                                onChange={(e) => setData('clear_tournament', e.target.checked)}
                            />
                            <span>
                                Make this tribe cross-tournament (open to all)
                            </span>
                        </label>
                    </div>

                    <div className="mt-4 pt-3 border-top border-white border-opacity-10 d-flex justify-content-end gap-2">
                        <button type="button" className="btn-admin-outline" onClick={closeReassign}>
                            Cancel
                        </button>
                        <button type="submit" className="tfe-btn tfe-btn--filled" disabled={processing}>
                            Save
                        </button>
                    </div>
                </form>
            </DashboardModal>

            <ConfirmationDialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
                title="Delete Tribe?"
                description={toDelete ? `"${toDelete.name}" and all its posts will be permanently removed. Members will lose access.` : ''}
                onConfirm={confirmDelete}
                confirmText="Delete"
                destructive
            />
        </AdminLayout>
    );
}
