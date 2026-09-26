import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import TfeModal from '@/Components/Common/TfeModal';
import ListingGrid from '@/Components/Common/ListingGrid';
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

            <ListingGrid
                items={listings}
                emptyIcon="fas fa-shield-alt"
                emptyTitle={filter_status === 'taken_down' ? 'Nothing taken down' : 'No listings to review'}
                render={(l) => (
                    <div className="tfe-acard" onClick={() => filter_status === 'live' ? setTakingDown(l) : restore(l)} style={{ cursor: 'pointer', '--acard-accent': '#3b82f6' }}>
                        {l.hero_image && <img src={l.hero_image.startsWith('http') ? l.hero_image : `/${l.hero_image}`} alt="" className="tfe-acard__bg" loading="lazy" onError={(e) => e.currentTarget.style.display = 'none'} />}
                        <div className="tfe-acard__body">
                            <div className="tfe-acard__eyebrow">{l.type} · {l.tournament_name}</div>
                            <div className="tfe-acard__title">{l.name}</div>
                            <div className="tfe-acard__desc">
                                By <strong>{l.publisher_name}</strong>
                                {l.publisher_verified && <i className="fas fa-check-circle ms-1" style={{ color: '#22c55e' }} />}
                            </div>
                            <div className="tfe-acard__meta">
                                <div><span>Price</span><strong>{formatMoney(l.base_price, l.currency)}</strong></div>
                                <div><span>Updated</span><strong>{l.updated_at}</strong></div>
                            </div>
                            {l.moderation_notes && (
                                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                                    <i className="fas fa-comment-alt"></i> {l.moderation_notes}
                                </p>
                            )}
                            {filter_status === 'live' ? (
                                <button className="tfe-btn tfe-btn--sm" style={{ marginTop: 8 }}>
                                    <i className="fas fa-ban"></i> Take down
                                </button>
                            ) : (
                                <button className="tfe-btn tfe-btn--sm tfe-btn--filled" style={{ marginTop: 8 }}>
                                    <i className="fas fa-redo"></i> Restore
                                </button>
                            )}
                        </div>
                    </div>
                )}
            />

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
