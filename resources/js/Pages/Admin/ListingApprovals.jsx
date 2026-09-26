import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import TfeModal from '@/Components/Common/TfeModal';
import { formatMoney } from '@/lib/utils';

/**
 * Listing safety surface — reports + takedowns.
 *
 * Partners self-publish (Sprint 42). This page shows what's currently
 * live and lets admin take a listing down for policy violations, with
 * mandatory notes. Taken-down listings sit under a second filter so
 * they can be re-published once the partner has addressed the issue.
 */
export default function ListingApprovals({ listings = [], filter_status = 'live', counts = {} }) {
    const [takingDown, setTakingDown] = useState(null);
    const [notes, setNotes] = useState('');

    const switchFilter = (status) => {
        router.get(route('admin.listing-approvals.index', { status }), {}, { preserveScroll: true });
    };

    const restore = (listing) => {
        if (!confirm(`Restore "${listing.name}" — it will go live again.`)) return;
        router.post(route('admin.listing-approvals.approve', listing.id), {}, { preserveScroll: true });
    };

    const submitTakedown = () => {
        if (!notes.trim() || !takingDown) return;
        router.post(
            route('admin.listing-approvals.reject', takingDown.id),
            { notes },
            {
                preserveScroll: true,
                onSuccess: () => { setTakingDown(null); setNotes(''); },
            },
        );
    };

    return (
        <AdminLayout title="Listing safety">
            <Head title="Listing safety" />
            <DashboardHero
                role="admin"
                title="Listing safety"
                subtitle="Every live partner listing. Take one down when it breaks policy; restore it once resolved."
                breadcrumbs={[{ label: 'Admin', href: route('admin.dashboard') }, { label: 'Listing safety' }]}
            />

            <div className="d-flex gap-2 mb-4">
                <FilterChip active={filter_status === 'live'} onClick={() => switchFilter('live')} label="Live" count={counts.live} />
                <FilterChip active={filter_status === 'taken_down'} onClick={() => switchFilter('taken_down')} label="Taken down" count={counts.taken_down} />
            </div>

            <div className="tfe-slab">
                <div className="tfe-slab__body tfe-slab__body--flush">
                    <div className="table-responsive">
                        <table className="tfe-table tfe-table--compact">
                            <thead>
                                <tr>
                                    <th>Listing</th>
                                    <th>Partner</th>
                                    <th>Tournament</th>
                                    <th>Price</th>
                                    <th>Updated</th>
                                    <th>Notes</th>
                                    <th style={{ width: 140 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.length === 0 ? (
                                    <tr><td colSpan="7">
                                        <div className="tfe-empty tfe-empty--inline">
                                            <div className="tfe-empty__icon"><i className="fas fa-shield-alt"></i></div>
                                            <h3 className="tfe-empty__title">
                                                {filter_status === 'taken_down' ? 'Nothing taken down.' : 'No listings to review.'}
                                            </h3>
                                        </div>
                                    </td></tr>
                                ) : listings.map((l) => (
                                    <tr key={l.id}>
                                        <td>
                                            <strong>{l.name}</strong>
                                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{l.type}</div>
                                        </td>
                                        <td>
                                            {l.publisher_name}
                                            {l.publisher_verified && <i className="fas fa-check-circle ms-1" style={{ color: '#22c55e' }} title="Verified" />}
                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{l.publisher_email}</div>
                                        </td>
                                        <td>{l.tournament_name}</td>
                                        <td>{formatMoney(l.base_price, l.currency)}</td>
                                        <td style={{ fontSize: '0.72rem' }}>{l.updated_at}</td>
                                        <td style={{ maxWidth: 220, fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                                            {l.moderation_notes || '—'}
                                        </td>
                                        <td>
                                            {filter_status === 'live' ? (
                                                <button className="tfe-btn tfe-btn--sm" onClick={() => setTakingDown(l)}>
                                                    <i className="fas fa-ban"></i> Take down
                                                </button>
                                            ) : (
                                                <button className="tfe-btn tfe-btn--sm tfe-btn--filled" onClick={() => restore(l)}>
                                                    <i className="fas fa-redo"></i> Restore
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <TfeModal open={!!takingDown} title={`Take down "${takingDown?.name || ''}"`} onClose={() => { setTakingDown(null); setNotes(''); }}>
                <div className="tfe-form-field">
                    <label className="tfe-form-label" htmlFor="td-notes">Why this listing breaks policy (partner will see this)</label>
                    <textarea
                        id="td-notes"
                        className="tfe-textarea"
                        rows={5}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Cite the rule and what needs to change."
                    />
                    <p className="tfe-form-help">Required. The partner receives this note verbatim and can re-publish once resolved.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button className="tfe-btn" onClick={() => { setTakingDown(null); setNotes(''); }}>Cancel</button>
                    <button className="tfe-btn tfe-btn--filled" onClick={submitTakedown} disabled={!notes.trim()}>
                        <i className="fas fa-ban"></i> Take down
                    </button>
                </div>
            </TfeModal>
        </AdminLayout>
    );
}

function FilterChip({ active, onClick, label, count }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`tfe-btn tfe-btn--sm${active ? ' is-active' : ''}`}
        >
            {label}
            {typeof count === 'number' && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>· {count}</span>
            )}
        </button>
    );
}
