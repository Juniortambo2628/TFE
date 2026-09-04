import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import TournamentPill from '@/Components/Common/TournamentPill';
import { formatMoney } from '@/lib/utils';

/**
 * Admin approval queue for partner-authored listings — Sprint 10.
 *
 * Fanned by moderation_status. Pending listings show inline
 * approve/reject actions; rejected requires a note (goes to
 * partner as moderation_notes).
 */
export default function ListingApprovals({ listings = [], filter_status, counts }) {
    const [rejecting, setRejecting] = useState(null); // listing.id
    const [rejectNotes, setRejectNotes] = useState('');

    const switchFilter = (status) => {
        router.get(route('admin.listing-approvals.index', { status }), {}, { preserveScroll: true });
    };

    const approve = (listing) => {
        router.post(route('admin.listing-approvals.approve', listing.id), {}, { preserveScroll: true });
    };

    const submitReject = () => {
        if (!rejectNotes.trim()) return;
        router.post(
            route('admin.listing-approvals.reject', rejecting.id),
            { notes: rejectNotes },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejecting(null);
                    setRejectNotes('');
                },
            },
        );
    };

    return (
        <AdminLayout title="Listing approvals">
            <DashboardHero
                role="admin"
                title="Listing approvals"
                subtitle="Review, approve or return partner-authored listings."
            />

            <div className="d-flex flex-wrap gap-2 mt-3 mb-3">
                {[
                    { k: 'pending', label: 'Pending' },
                    { k: 'approved', label: 'Approved' },
                    { k: 'rejected', label: 'Rejected' },
                    { k: 'draft', label: 'Drafts' },
                ].map((f) => (
                    <button
                        key={f.k}
                        className={`btn btn-sm ${filter_status === f.k ? 'btn-warning' : 'btn-outline-secondary'}`}
                        onClick={() => switchFilter(f.k)}
                    >
                        {f.label} <span className="badge bg-dark ms-1">{counts?.[f.k] || 0}</span>
                    </button>
                ))}
            </div>

            {listings.length === 0 ? (
                <div className="content-card p-4">
                    <div className="empty-state">
                        <i className="fas fa-clipboard-check"></i>
                        <h4>Nothing in this bucket</h4>
                        <p>No partner-authored listings match this filter.</p>
                    </div>
                </div>
            ) : (
                <div className="row g-3">
                    {listings.map((l) => (
                        <div key={l.id} className="col-lg-6">
                            <div className="content-card p-3 h-100">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <h4 className="mb-0" style={{ fontSize: '1.05rem' }}>{l.name}</h4>
                                            <TournamentPill tournamentId={l.tournament_id} shortName={l.tournament_name} />
                                        </div>
                                        <div className="text-white-50 small">
                                            By <strong>{l.publisher_name}</strong>
                                            {l.publisher_verified && (
                                                <i className="fas fa-check-circle text-success ms-1" title="Verified partner"></i>
                                            )}
                                            {' · '}{l.publisher_email}
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="fw-bold">{formatMoney(l.base_price)}</div>
                                        <div className="text-white-50 small">{l.nights}n • {l.flight_class}</div>
                                    </div>
                                </div>

                                {l.description && (
                                    <p className="text-white-50 small mt-2 mb-2">{l.description}</p>
                                )}

                                <div className="d-flex flex-wrap gap-3 text-white-50 small mt-2">
                                    <span><i className="fas fa-bed me-1"></i> {l.accommodation_level}</span>
                                    {l.capacity && <span><i className="fas fa-users me-1"></i> {l.capacity} seats</span>}
                                    {l.included_match_ids?.length > 0 && (
                                        <span><i className="fas fa-futbol me-1"></i> {l.included_match_ids.length} matches</span>
                                    )}
                                    {l.included_venues?.length > 0 && (
                                        <span><i className="fas fa-map-marker-alt me-1"></i> {l.included_venues.length} venues</span>
                                    )}
                                </div>

                                {l.moderation_notes && (
                                    <div className="alert alert-secondary small mt-3 mb-0">
                                        <strong>Prior note:</strong> {l.moderation_notes}
                                    </div>
                                )}

                                {filter_status === 'pending' && (
                                    <div className="d-flex gap-2 mt-3">
                                        <button className="btn btn-success btn-sm" onClick={() => approve(l)}>
                                            <i className="fas fa-check me-1"></i> Approve & publish
                                        </button>
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => {
                                                setRejecting(l);
                                                setRejectNotes(l.moderation_notes || '');
                                            }}
                                        >
                                            <i className="fas fa-undo me-1"></i> Return with feedback
                                        </button>
                                    </div>
                                )}

                                {l.submitted_at && (
                                    <div className="text-white-50 small mt-2">
                                        Submitted {l.submitted_at}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {rejecting && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1050 }}
                    onClick={() => setRejecting(null)}
                >
                    <div
                        className="p-4"
                        style={{ background: '#1a1a1a', borderRadius: 16, width: 'min(540px, 92vw)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="text-white">Return "{rejecting.name}" to {rejecting.publisher_name}</h4>
                        <p className="text-white-50 small">
                            The partner will see this note in the Publish tab and can edit + resubmit.
                        </p>
                        <textarea
                            className="form-control"
                            rows={4}
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            placeholder="What needs to change before this listing goes live?"
                        />
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button className="btn btn-outline-secondary" onClick={() => setRejecting(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={submitReject} disabled={!rejectNotes.trim()}>
                                Send feedback
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
