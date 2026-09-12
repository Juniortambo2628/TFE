import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import TournamentPill from '@/Components/Common/TournamentPill';
import { formatMoney } from '@/lib/utils';

/**
 * Admin approval queue for partner-authored listings — Sprint 10.
 * Sprint 19 added checkbox selection + bulk approve/reject actions.
 *
 * Fanned by moderation_status. Pending listings show inline
 * approve/reject; rejected requires a note. Selecting one or more
 * rows exposes a bulk action bar at the top.
 */
export default function ListingApprovals({ listings = [], filter_status, counts }) {
    const [rejecting, setRejecting] = useState(null); // single-row reject modal
    const [rejectNotes, setRejectNotes] = useState('');
    const [selected, setSelected] = useState(() => new Set());
    const [bulkReject, setBulkReject] = useState(false); // bulk reject modal open
    const [bulkNotes, setBulkNotes] = useState('');

    const listingIds = useMemo(() => listings.map((l) => l.id), [listings]);
    const listingIdSet = useMemo(() => new Set(listingIds), [listingIds]);

    // Drop any selected IDs that aren't in the current listings prop
    // — a concurrent moderation elsewhere can shrink the queue while
    // we still hold stale IDs. Prevents "select-all" showing checked
    // from a set that doesn't match what's on screen.
    useEffect(() => {
        setSelected((prev) => {
            const next = new Set([...prev].filter((id) => listingIdSet.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [listingIdSet]);

    // allSelected must actually cover *these* IDs, not just match the count.
    const allSelected = listingIds.length > 0
        && listingIds.every((id) => selected.has(id));
    const anySelected = selected.size > 0;

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const toggleAll = () => {
        setSelected(allSelected ? new Set() : new Set(listingIds));
    };
    const clearSelection = () => setSelected(new Set());

    const switchFilter = (status) => {
        clearSelection();
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

    const bulkApprove = () => {
        if (!anySelected) return;
        if (!confirm(`Approve ${selected.size} listing${selected.size === 1 ? '' : 's'}?`)) return;
        router.post(
            route('admin.listing-approvals.bulk-approve'),
            { ids: Array.from(selected) },
            { preserveScroll: true, onSuccess: clearSelection },
        );
    };

    const submitBulkReject = () => {
        if (!anySelected || !bulkNotes.trim()) return;
        router.post(
            route('admin.listing-approvals.bulk-reject'),
            { ids: Array.from(selected), notes: bulkNotes },
            {
                preserveScroll: true,
                onSuccess: () => {
                    clearSelection();
                    setBulkReject(false);
                    setBulkNotes('');
                },
            },
        );
    };

    // Bulk actions surface on any bucket other than 'approved' — the
    // approve path is a no-op there. Individual button availability is
    // gated below (bulkApprove hidden on 'approved', bulkReject on
    // 'rejected' is fine because backend now accepts re-rejection with
    // updated notes).
    const bulkAllowed = filter_status !== 'approved';
    const canBulkApprove = filter_status !== 'approved';
    const canBulkReject = true; // always available in visible buckets

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
                        type="button"
                        className={`tfe-btn tfe-btn--sm${filter_status === f.k ? ' is-active' : ''}`}
                        aria-pressed={filter_status === f.k}
                        onClick={() => switchFilter(f.k)}
                    >
                        {f.label} <span className="tfe-pill" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>{counts?.[f.k] || 0}</span>
                    </button>
                ))}
            </div>

            {bulkAllowed && listings.length > 0 && (
                <div className="bulk-action-bar">
                    <label className="bulk-action-bar__select-all">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                        />
                        <span>
                            {anySelected
                                ? `${selected.size} of ${listings.length} selected`
                                : 'Select all in view'}
                        </span>
                    </label>

                    {anySelected && (
                        <div className="d-flex gap-2 flex-wrap">
                            {canBulkApprove && (
                                <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled" onClick={bulkApprove}>
                                    <i className="fas fa-check" />
                                    Approve {selected.size}
                                </button>
                            )}
                            {canBulkReject && (
                                <button
                                    type="button"
                                    className="tfe-btn tfe-btn--sm"
                                    onClick={() => setBulkReject(true)}
                                >
                                    <i className="fas fa-undo" />
                                    Return {selected.size} with feedback
                                </button>
                            )}
                            <button type="button" className="tfe-btn tfe-btn--sm" onClick={clearSelection}>
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            )}

            {listings.length === 0 ? (
                <div className="tfe-slab">
                    <div className="tfe-slab__body">
                        <div className="tfe-empty">
                            <div className="tfe-empty__icon"><i className="fas fa-clipboard-check" /></div>
                            <h4 className="tfe-empty__title">Nothing in this bucket</h4>
                            <p className="tfe-empty__body">No partner-authored listings match this filter.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="row g-3">
                    {listings.map((l) => (
                        <div key={l.id} className="col-lg-6">
                            <div className={`content-card p-3 h-100 approval-card${selected.has(l.id) ? ' is-selected' : ''}`}>
                                <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div className="d-flex gap-2 flex-grow-1">
                                        {bulkAllowed && (
                                            <input
                                                type="checkbox"
                                                className="approval-card__check"
                                                checked={selected.has(l.id)}
                                                onChange={() => toggle(l.id)}
                                                aria-label={`Select ${l.name}`}
                                            />
                                        )}
                                        <div>
                                            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                                <h4 className="mb-0 approval-card__name">{l.name}</h4>
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
                                    </div>
                                    <div className="text-end flex-shrink-0">
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
                                    <div className="d-flex gap-2 mt-3 flex-wrap">
                                        <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled" onClick={() => approve(l)}>
                                            <i className="fas fa-check" /> Approve & publish
                                        </button>
                                        <button
                                            type="button"
                                            className="tfe-btn tfe-btn--sm"
                                            onClick={() => {
                                                setRejecting(l);
                                                setRejectNotes(l.moderation_notes || '');
                                            }}
                                        >
                                            <i className="fas fa-undo" /> Return with feedback
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
                <RejectModal
                    title={`Return "${rejecting.name}" to ${rejecting.publisher_name}`}
                    notes={rejectNotes}
                    onChange={setRejectNotes}
                    onCancel={() => setRejecting(null)}
                    onSubmit={submitReject}
                />
            )}

            {bulkReject && (
                <RejectModal
                    title={`Return ${selected.size} listing${selected.size === 1 ? '' : 's'} with feedback`}
                    subtitle="Every partner in the batch will see this note on their listing."
                    notes={bulkNotes}
                    onChange={setBulkNotes}
                    onCancel={() => setBulkReject(false)}
                    onSubmit={submitBulkReject}
                />
            )}
        </AdminLayout>
    );
}

function RejectModal({ title, subtitle, notes, onChange, onCancel, onSubmit }) {
    return (
        <div className="approval-modal-overlay" onClick={onCancel}>
            <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
                <h4 className="text-white">{title}</h4>
                <p className="text-white-50 small">
                    {subtitle || 'The partner will see this note in the Publish tab and can edit + resubmit.'}
                </p>
                <textarea
                    className="tfe-textarea"
                    rows={4}
                    value={notes}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="What needs to change before this listing goes live?"
                />
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="tfe-btn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="tfe-btn tfe-btn--filled" onClick={onSubmit} disabled={!notes.trim()}>
                        Send feedback
                    </button>
                </div>
            </div>
        </div>
    );
}
