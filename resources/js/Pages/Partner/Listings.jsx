import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import TournamentPill from '@/Components/Common/TournamentPill';
import CapacityBar from '@/Components/Common/CapacityBar';
import { formatMoney } from '@/lib/utils';

/**
 * Publish tab — partner authors their own listings.
 *
 * Draft rows stay hidden from fans. "Submit for review" flips them to
 * pending and admin sees them in the approvals queue. A rejected row
 * comes back with moderation_notes and the partner can edit + resubmit.
 */
export default function Listings({ listings = [], tournaments = [], status_counts }) {
    const [editing, setEditing] = useState(null); // null | 'new' | listing.id
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all' ? listings : listings.filter((l) => l.moderation_status === filter);

    const statusChip = (status) => {
        const map = {
            draft: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: 'Draft' },
            pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'Pending review' },
            approved: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Approved' },
            rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Rejected' },
        };
        const s = map[status] || map.draft;
        return (
            <span
                className="px-2 py-1 small fw-semibold"
                style={{ background: s.bg, color: s.color, borderRadius: 999 }}
            >
                {s.label}
            </span>
        );
    };

    return (
        <PartnerLayout title="Publish — Listings">
            <DashboardHero
                role="partner"
                title="Publish"
                subtitle="Author your own listings. Admin approves before they go public."
            />

            <div className="partner-summary-cards mt-4">
                {['draft', 'pending', 'approved', 'rejected'].map((k) => (
                    <div key={k} className="partner-stat-card" data-accent={
                        k === 'approved' ? 'green' : k === 'rejected' ? 'red' : k === 'pending' ? 'amber' : 'blue'
                    }>
                        <div className="stat-value">{status_counts?.[k] || 0}</div>
                        <div className="stat-label text-capitalize">{k}</div>
                    </div>
                ))}
            </div>

            <div className="content-card mt-4">
                <div className="card-header d-flex flex-wrap gap-3 align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-tags me-2" style={{ color: '#d97706' }}></i>
                        <h3 className="mb-0">Your listings</h3>
                    </div>
                    <div className="d-flex gap-2">
                        {['all', 'draft', 'pending', 'approved', 'rejected'].map((f) => (
                            <button
                                key={f}
                                type="button"
                                className={`btn btn-sm ${filter === f ? 'btn-warning' : 'btn-outline-secondary'}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                        <button className="btn btn-sm btn-primary" onClick={() => setEditing('new')}>
                            <i className="fas fa-plus me-1"></i> New listing
                        </button>
                    </div>
                </div>

                <div className="p-3">
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-box-open"></i>
                            <h4>Nothing here yet</h4>
                            <p>Draft your first listing to start selling on the platform.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-dark table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Listing</th>
                                        <th>Tournament</th>
                                        <th>Price</th>
                                        <th>Capacity</th>
                                        <th>Status</th>
                                        <th>Updated</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((l) => (
                                        <tr key={l.id}>
                                            <td>
                                                <div className="fw-semibold">{l.name}</div>
                                                <div className="text-white-50 small">
                                                    {l.nights}n • {l.flight_class} • {l.accommodation_level}
                                                </div>
                                            </td>
                                            <td><TournamentPill tournamentId={l.tournament_id} shortName={l.tournament_name} /></td>
                                            <td>{formatMoney(l.base_price)}</td>
                                            <td style={{ minWidth: 140 }}>
                                                {l.capacity ? (
                                                    <CapacityBar sold={l.sold_count} capacity={l.capacity} pct={l.availability_pct} />
                                                ) : (
                                                    <span className="text-white-50 small">Unlimited</span>
                                                )}
                                            </td>
                                            <td>{statusChip(l.moderation_status)}</td>
                                            <td className="text-white-50 small">{l.updated_at}</td>
                                            <td className="text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button className="btn btn-outline-secondary" onClick={() => setEditing(l.id)}>
                                                        Edit
                                                    </button>
                                                    {(l.moderation_status === 'draft' || l.moderation_status === 'rejected') && (
                                                        <button
                                                            className="btn btn-warning"
                                                            onClick={() => router.post(route('partner.listings.submit', l.id))}
                                                        >
                                                            Submit
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-outline-danger"
                                                        onClick={() => {
                                                            if (confirm(`Delete "${l.name}"?`)) {
                                                                router.delete(route('partner.listings.destroy', l.id));
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {editing !== null && (
                <ListingFormModal
                    listing={editing === 'new' ? null : listings.find((l) => l.id === editing)}
                    tournaments={tournaments}
                    onClose={() => setEditing(null)}
                />
            )}
        </PartnerLayout>
    );
}

function ListingFormModal({ listing, tournaments, onClose }) {
    const isEdit = !!listing;
    const { data, setData, post, put, processing, errors } = useForm({
        tournament_id: listing?.tournament_id || tournaments[0]?.id || '',
        type: listing?.type || 'package',
        name: listing?.name || '',
        description: listing?.description || '',
        hero_image: listing?.hero_image || '',
        base_price: listing?.base_price || '',
        currency: listing?.currency || 'USD',
        included_match_ids: listing?.included_match_ids || [],
        included_venues: listing?.included_venues || [],
        nights: listing?.nights || 7,
        flight_class: listing?.flight_class || 'economy',
        accommodation_level: listing?.accommodation_level || '3-star',
        capacity: listing?.capacity || '',
        is_active: listing?.is_active ?? false,
        moderation_status: listing?.moderation_status === 'approved' ? 'approved' : 'draft',
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('partner.listings.update', listing.id), { preserveScroll: true, onSuccess: onClose });
        } else {
            post(route('partner.listings.store'), { preserveScroll: true, onSuccess: onClose });
        }
    };

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1050 }}
            onClick={onClose}
        >
            <div
                className="p-4"
                style={{ background: '#1a1a1a', borderRadius: 16, width: 'min(720px, 92vw)', maxHeight: '90vh', overflow: 'auto' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="text-white mb-0">{isEdit ? 'Edit listing' : 'New listing'}</h3>
                    <button type="button" className="btn-close btn-close-white" onClick={onClose} />
                </div>

                {listing?.moderation_status === 'rejected' && listing?.moderation_notes && (
                    <div className="alert alert-danger">
                        <strong>Admin feedback:</strong> {listing.moderation_notes}
                    </div>
                )}

                <form onSubmit={submit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label text-white-50">Tournament</label>
                            <select
                                className="form-select"
                                value={data.tournament_id}
                                onChange={(e) => setData('tournament_id', e.target.value)}
                            >
                                {tournaments.map((t) => (
                                    <option key={t.id} value={t.id}>{t.short_name || t.name}</option>
                                ))}
                            </select>
                            {errors.tournament_id && <div className="text-danger small">{errors.tournament_id}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="form-label text-white-50">Type</label>
                            <select
                                className="form-select"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                            >
                                <option value="package">Package</option>
                                <option value="offer">Offer</option>
                                <option value="event">Event</option>
                                <option value="tour">Tour</option>
                            </select>
                        </div>

                        <div className="col-12">
                            <label className="form-label text-white-50">Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                            {errors.name && <div className="text-danger small">{errors.name}</div>}
                        </div>

                        <div className="col-12">
                            <label className="form-label text-white-50">Description</label>
                            <textarea
                                className="form-control"
                                rows={3}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label text-white-50">Base price</label>
                            <input
                                type="number"
                                className="form-control"
                                value={data.base_price}
                                onChange={(e) => setData('base_price', e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label text-white-50">Currency</label>
                            <input
                                type="text"
                                className="form-control"
                                value={data.currency}
                                onChange={(e) => setData('currency', e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label text-white-50">Nights</label>
                            <input
                                type="number"
                                className="form-control"
                                value={data.nights}
                                onChange={(e) => setData('nights', e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label text-white-50">Capacity</label>
                            <input
                                type="number"
                                className="form-control"
                                value={data.capacity}
                                onChange={(e) => setData('capacity', e.target.value)}
                                placeholder="Unlimited"
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label text-white-50">Flight class</label>
                            <select
                                className="form-select"
                                value={data.flight_class}
                                onChange={(e) => setData('flight_class', e.target.value)}
                            >
                                <option value="economy">Economy</option>
                                <option value="business">Business</option>
                                <option value="first">First</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label text-white-50">Accommodation</label>
                            <input
                                type="text"
                                className="form-control"
                                value={data.accommodation_level}
                                onChange={(e) => setData('accommodation_level', e.target.value)}
                                placeholder="3-star, 5-star, boutique…"
                            />
                        </div>

                        <div className="col-12">
                            <label className="form-label text-white-50">Hero image URL</label>
                            <input
                                type="text"
                                className="form-control"
                                value={data.hero_image}
                                onChange={(e) => setData('hero_image', e.target.value)}
                                placeholder="https://…"
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-4">
                        <div className="text-white-50 small">
                            Save as draft to keep working, or submit for admin review.
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-outline-secondary"
                                disabled={processing}
                                onClick={() => setData('moderation_status', 'draft')}
                            >
                                Save draft
                            </button>
                            <button
                                type="submit"
                                className="btn btn-warning"
                                disabled={processing}
                                onClick={() => setData('moderation_status', 'pending')}
                            >
                                Submit for review
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
