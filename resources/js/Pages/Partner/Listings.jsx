import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import TournamentPill from '@/Components/Common/TournamentPill';
import CapacityBar from '@/Components/Common/CapacityBar';
import TfeModal from '@/Components/Common/TfeModal';
import ImageUpload from '@/Components/Common/ImageUpload';
import { formatMoney } from '@/lib/utils';

/**
 * Publish tab — partner authors their own listings.
 *
 * No admin review: a saved listing goes live immediately. The partner
 * controls visibility with the Published / Hidden toggle. The create/edit
 * form is contextual — the trip fields (nights, flight class, accommodation)
 * only appear for Package / Tour listings, so a finance/airline/betting
 * partner authoring an Offer isn't asked to fill them.
 */

// Which listing type a partner sees by default, by partner_type. Package =
// full trip (travel-style); Offer = a simple priced product (finance, airline
// fares, betting promos, sponsorships).
const DEFAULT_TYPE = {
    travel_agent: 'package',
    destination: 'package',
    event_organiser: 'event',
    hotel_provider: 'package',
    finance_partner: 'offer',
    airline: 'offer',
    sponsor: 'offer',
    club: 'offer',
    federation: 'offer',
};

// Trip fields only make sense for a packaged trip (or a multi-night tour).
const showsNights = (type) => type === 'package' || type === 'tour';
const showsTravel = (type) => type === 'package';

export default function Listings({ listings = [], tournaments = [], status_counts, partner_type }) {
    const [editing, setEditing] = useState(null); // null | 'new' | listing.id
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all'
        ? listings
        : filter === 'published'
            ? listings.filter((l) => l.is_active)
            : listings.filter((l) => !l.is_active);

    const stateChip = (l) => {
        const s = l.is_active
            ? { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Published' }
            : { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: 'Hidden' };
        return (
            <span className="px-2 py-1 small fw-semibold" style={{ background: s.bg, color: s.color, borderRadius: 999 }}>
                {s.label}
            </span>
        );
    };

    return (
        <PartnerLayout title="Publish — Listings">
            <DashboardHero
                role="partner"
                title="Publish"
                subtitle="Author your own listings. They go live the moment you publish — no review needed."
            />

            <div className="tfe-stat-grid mt-4">
                {[
                    { key: 'total',     label: 'Total',     variant: 'blue',   icon: 'fas fa-tags' },
                    { key: 'published', label: 'Published', variant: 'teal',   icon: 'fas fa-circle-check' },
                    { key: 'hidden',    label: 'Hidden',    variant: 'amber',  icon: 'fas fa-eye-slash' },
                    { key: 'sold_out',  label: 'Sold out',  variant: 'rose',   icon: 'fas fa-ban' },
                ].map(({ key, label, variant, icon }) => (
                    <div key={key} className={`tfe-tile tfe-tile--${variant}`}>
                        <div className="tfe-tile__head">
                            <div className="tfe-tile__icon"><i className={icon} /></div>
                        </div>
                        <div className="tfe-tile__value">{status_counts?.[key] || 0}</div>
                        <div className="tfe-tile__label">{label}</div>
                    </div>
                ))}
            </div>

            <div className="content-card mt-4">
                <div className="card-header d-flex flex-wrap gap-3 align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-tags me-2" style={{ color: '#d97706' }}></i>
                        <h3 className="mb-0">Your listings</h3>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        {['all', 'published', 'hidden'].map((f) => (
                            <button
                                key={f}
                                type="button"
                                className={`tfe-btn tfe-btn--sm${filter === f ? ' is-active' : ''}`}
                                aria-pressed={filter === f}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="tfe-btn tfe-btn--sm tfe-btn--filled"
                            onClick={() => setEditing('new')}
                        >
                            <i className="fas fa-plus" /> New listing
                        </button>
                    </div>
                </div>

                <div className="p-3">
                    {filtered.length === 0 ? (
                        <div className="tfe-empty">
                            <div className="tfe-empty__icon"><i className="fas fa-box-open" /></div>
                            <h4 className="tfe-empty__title">Nothing here yet</h4>
                            <p className="tfe-empty__body">Create your first listing to start selling on the platform.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="tfe-table">
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
                                                <div className="text-white-50 small text-capitalize">
                                                    {l.type}{showsNights(l.type) && l.nights ? ` • ${l.nights}n` : ''}
                                                    {showsTravel(l.type) && l.flight_class ? ` • ${l.flight_class}` : ''}
                                                </div>
                                            </td>
                                            <td><TournamentPill tournamentId={l.tournament_id} shortName={l.tournament_name} /></td>
                                            <td>{formatMoney(l.base_price, l.currency)}</td>
                                            <td style={{ minWidth: 140 }}>
                                                {l.capacity ? (
                                                    <CapacityBar sold={l.sold_count} capacity={l.capacity} pct={l.availability_pct} />
                                                ) : (
                                                    <span className="text-white-50 small">Unlimited</span>
                                                )}
                                            </td>
                                            <td>{stateChip(l)}</td>
                                            <td className="text-white-50 small">{l.updated_at}</td>
                                            <td className="text-end">
                                                <div className="d-inline-flex gap-2 flex-wrap justify-content-end">
                                                    <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setEditing(l.id)}>
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`tfe-btn tfe-btn--sm${l.is_active ? '' : ' tfe-btn--filled'}`}
                                                        onClick={() => router.post(route('partner.listings.toggle', l.id), {}, { preserveScroll: true })}
                                                    >
                                                        {l.is_active ? 'Hide' : 'Publish'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="tfe-btn tfe-btn--sm"
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
                    partnerType={partner_type}
                    onClose={() => setEditing(null)}
                />
            )}
        </PartnerLayout>
    );
}

function ListingFormModal({ listing, tournaments, partnerType, onClose }) {
    const isEdit = !!listing;
    const form = useForm({
        tournament_id: listing?.tournament_id || tournaments[0]?.id || '',
        type: listing?.type || DEFAULT_TYPE[partnerType] || 'offer',
        name: listing?.name || '',
        description: listing?.description || '',
        hero_image: listing?.hero_image || '',
        hero_image_file: null,
        base_price: listing?.base_price || '',
        currency: listing?.currency || 'USD',
        nights: listing?.nights || 7,
        flight_class: listing?.flight_class || 'economy',
        accommodation_level: listing?.accommodation_level || '3-star',
        capacity: listing?.capacity || '',
        is_active: listing?.is_active ?? true,
    });
    const { data, setData, processing, errors } = form;

    const save = (e, active) => {
        e.preventDefault();
        // transform() runs at submit time, so the just-clicked publish/hide
        // choice and PUT method-spoofing (needed for multipart file uploads)
        // are applied to the payload reliably despite setData being async.
        form.transform((d) => ({ ...d, is_active: active, ...(isEdit ? { _method: 'put' } : {}) }));
        form.post(
            isEdit ? route('partner.listings.update', listing.id) : route('partner.listings.store'),
            { preserveScroll: true, forceFormData: true, onSuccess: onClose },
        );
    };

    return (
        <TfeModal open title={isEdit ? 'Edit listing' : 'New listing'} onClose={onClose} size="lg">
                <form onSubmit={(e) => save(e, true)}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="tfe-form-label">Tournament</label>
                            <select className="tfe-select" value={data.tournament_id} onChange={(e) => setData('tournament_id', e.target.value)}>
                                {tournaments.map((t) => (
                                    <option key={t.id} value={t.id}>{t.short_name || t.name}</option>
                                ))}
                            </select>
                            {errors.tournament_id && <div className="tfe-form-error">{errors.tournament_id}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="tfe-form-label">Type</label>
                            <select className="tfe-select" value={data.type} onChange={(e) => setData('type', e.target.value)}>
                                <option value="package">Package (full trip)</option>
                                <option value="offer">Offer (single product)</option>
                                <option value="event">Event</option>
                                <option value="tour">Tour</option>
                            </select>
                            <div className="tfe-form-help">
                                {showsTravel(data.type)
                                    ? 'Package includes flights + stay + nights.'
                                    : showsNights(data.type)
                                        ? 'Multi-night tour — set the number of nights.'
                                        : 'A simple priced offer (fare, financing, promo, sponsorship).'}
                            </div>
                        </div>

                        <div className="col-12">
                            <label className="tfe-form-label">Name</label>
                            <input type="text" className="tfe-input" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            {errors.name && <div className="tfe-form-error">{errors.name}</div>}
                        </div>

                        <div className="col-12">
                            <label className="tfe-form-label">Description</label>
                            <textarea className="tfe-textarea" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                            {errors.description && <div className="tfe-form-error">{errors.description}</div>}
                        </div>

                        <div className="col-md-4">
                            <label className="tfe-form-label">Base price</label>
                            <input type="number" className="tfe-input" value={data.base_price} onChange={(e) => setData('base_price', e.target.value)} />
                            {errors.base_price && <div className="tfe-form-error">{errors.base_price}</div>}
                        </div>
                        <div className="col-md-4">
                            <label className="tfe-form-label">Currency</label>
                            <input type="text" className="tfe-input" value={data.currency} onChange={(e) => setData('currency', e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="tfe-form-label">Capacity</label>
                            <input type="number" className="tfe-input" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} placeholder="Unlimited" />
                        </div>

                        {showsNights(data.type) && (
                            <div className="col-md-4">
                                <label className="tfe-form-label">Nights</label>
                                <input type="number" className="tfe-input" value={data.nights} onChange={(e) => setData('nights', e.target.value)} />
                                {errors.nights && <div className="tfe-form-error">{errors.nights}</div>}
                            </div>
                        )}
                        {showsTravel(data.type) && (
                            <>
                                <div className="col-md-4">
                                    <label className="tfe-form-label">Flight class</label>
                                    <select className="tfe-select" value={data.flight_class} onChange={(e) => setData('flight_class', e.target.value)}>
                                        <option value="economy">Economy</option>
                                        <option value="business">Business</option>
                                        <option value="first">First</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="tfe-form-label">Accommodation</label>
                                    <input type="text" className="tfe-input" value={data.accommodation_level} onChange={(e) => setData('accommodation_level', e.target.value)} placeholder="3-star, 5-star, boutique…" />
                                </div>
                            </>
                        )}

                        <div className="col-12">
                            <label className="tfe-form-label">Hero image</label>
                            <ImageUpload
                                value={data.hero_image}
                                onFile={(file) => setData('hero_image_file', file)}
                                onClear={() => { setData('hero_image', ''); setData('hero_image_file', null); }}
                            />
                            {errors.hero_image_file && <div className="tfe-form-error">{errors.hero_image_file}</div>}
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
                        <div className="text-white-50 small">Publish to go live now, or save hidden to keep it off your hub.</div>
                        <div className="d-flex gap-2">
                            <button type="button" className="tfe-btn" disabled={processing} onClick={(e) => save(e, false)}>
                                Save hidden
                            </button>
                            <button type="submit" className="tfe-btn tfe-btn--filled" disabled={processing}>
                                {isEdit ? 'Save & publish' : 'Publish listing'}
                            </button>
                        </div>
                    </div>
                </form>
        </TfeModal>
    );
}
