import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import DashboardModal from '@/Components/Common/DashboardModal';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';

/**
 * Admin Packages — CRUD for prepacked fixed-price itineraries.
 *
 * Packages are tournament-scoped (belongs to exactly one tournament from
 * config/tournaments.php). Fixtures + venues for the picker come from
 * a lazy JSON endpoint so the initial page load stays lean.
 */
export default function Packages({ auth, packages = [], tournaments = [], filter_tournament_id = null }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const [tournamentFilter, setTournamentFilter] = useState(filter_tournament_id || '');

    // Fixture picker state — loaded on-demand when tournament_id is picked.
    const [fixtures, setFixtures] = useState([]);
    const [venuesList, setVenuesList] = useState([]);
    const [fixturesLoading, setFixturesLoading] = useState(false);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        tournament_id: '',
        name: '',
        description: '',
        hero_image: '',
        base_price: '',
        currency: 'USD',
        included_match_ids: [],
        included_venues: [],
        nights: 7,
        flight_class: 'economy',
        accommodation_level: '3_star',
        capacity: '',
        is_active: true,
        is_featured: false,
        display_order: 0,
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Packages' },
    ];

    const loadFixtures = async (tournamentId) => {
        if (!tournamentId) {
            setFixtures([]);
            setVenuesList([]);
            return;
        }
        setFixturesLoading(true);
        try {
            const { data: resp } = await axios.get(route('admin.packages.fixtures'), {
                params: { tournament_id: tournamentId },
            });
            setFixtures(resp.fixtures || []);
            setVenuesList(resp.venues || []);
        } catch (e) {
            toast.error('Could not load fixtures for this tournament.');
        } finally {
            setFixturesLoading(false);
        }
    };

    // Reload fixtures when the tournament in the form changes.
    useEffect(() => {
        if (showForm && data.tournament_id) {
            loadFixtures(data.tournament_id);
        }
    }, [showForm, data.tournament_id]);

    const openCreate = () => {
        setEditing(null);
        reset();
        setData((prev) => ({
            ...prev,
            tournament_id: tournamentFilter || (tournaments[0]?.id || ''),
        }));
        setShowForm(true);
    };

    const openEdit = (pkg) => {
        setEditing(pkg);
        setData({
            tournament_id: pkg.tournament_id,
            name: pkg.name,
            description: pkg.description || '',
            hero_image: pkg.hero_image || '',
            base_price: pkg.base_price,
            currency: pkg.currency,
            included_match_ids: pkg.included_match_ids || [],
            included_venues: pkg.included_venues || [],
            nights: pkg.nights,
            flight_class: pkg.flight_class,
            accommodation_level: pkg.accommodation_level,
            capacity: pkg.capacity || '',
            is_active: pkg.is_active,
            is_featured: pkg.is_featured,
            display_order: pkg.display_order,
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: closeForm };
        if (editing) {
            put(route('admin.packages.update', editing.id), opts);
        } else {
            post(route('admin.packages.store'), opts);
        }
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        router.delete(route('admin.packages.destroy', toDelete.id), {
            onSuccess: () => setToDelete(null),
        });
    };

    const toggleMatch = (id) => {
        setData('included_match_ids',
            data.included_match_ids.includes(id)
                ? data.included_match_ids.filter((x) => x !== id)
                : [...data.included_match_ids, id],
        );
    };

    const toggleVenue = (v) => {
        setData('included_venues',
            data.included_venues.includes(v)
                ? data.included_venues.filter((x) => x !== v)
                : [...data.included_venues, v],
        );
    };

    const applyTournamentFilter = (id) => {
        setTournamentFilter(id);
        router.get(route('admin.packages.index'), id ? { tournament_id: id } : {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AdminLayout title="Packages">
            <DashboardHero
                role="admin"
                title="Prepacked Packages"
                subtitle="Fixed-price itineraries fans can pick as a starting point."
                breadcrumbs={breadcrumbs}
                action={{
                    label: 'Add Package',
                    icon: 'fas fa-plus me-2',
                    onClick: openCreate,
                }}
            />

            {/* Tournament filter */}
            <div className="admin-card-dark mb-3">
                <div className="card-body d-flex flex-wrap gap-2 align-items-center">
                    <label className="admin-form-label mb-0 me-2">Tournament:</label>
                    <select
                        className="admin-form-input"
                        style={{ maxWidth: 320 }}
                        value={tournamentFilter}
                        onChange={(e) => applyTournamentFilter(e.target.value)}
                    >
                        <option value="">All tournaments</option>
                        {tournaments.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name} ({t.status})
                            </option>
                        ))}
                    </select>
                    <span className="ms-auto text-white-50 small">
                        {packages.length} package{packages.length === 1 ? '' : 's'}
                    </span>
                </div>
            </div>

            {/* Packages grid */}
            {packages.length === 0 ? (
                <div className="admin-card-dark">
                    <div className="admin-empty-state">
                        <i className="fas fa-box-open"></i>
                        <h4>No packages yet</h4>
                        <p className="text-white-50">Add your first prepacked itinerary to give fans a fast-path option.</p>
                    </div>
                </div>
            ) : (
                <div className="row g-3">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="col-md-6 col-xl-4">
                            <div className="admin-card-dark h-100">
                                {pkg.hero_image && (
                                    <img
                                        src={pkg.hero_image}
                                        alt={pkg.name}
                                        className="w-100"
                                        style={{ height: 140, objectFit: 'cover', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
                                    />
                                )}
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h4 className="text-white mb-1">{pkg.name}</h4>
                                            <div className="text-white-50 small">{pkg.tournament_name}</div>
                                        </div>
                                        <div className="text-end">
                                            <div className="text-white fw-bold">{pkg.currency} {Number(pkg.base_price).toLocaleString()}</div>
                                            <div className="text-white-50 small">{pkg.nights} nights</div>
                                        </div>
                                    </div>
                                    {pkg.description && (
                                        <p className="text-white-50 small mb-2" style={{ minHeight: 40 }}>
                                            {pkg.description.length > 100 ? pkg.description.slice(0, 100) + '…' : pkg.description}
                                        </p>
                                    )}
                                    <div className="d-flex flex-wrap gap-1 mb-2">
                                        <span className="admin-badge admin-badge-blue">{pkg.included_match_ids.length} match{pkg.included_match_ids.length === 1 ? '' : 'es'}</span>
                                        <span className="admin-badge admin-badge-green">{pkg.flight_class}</span>
                                        <span className="admin-badge">{pkg.accommodation_level.replace('_', ' ')}</span>
                                        {pkg.is_featured && <span className="admin-badge admin-badge-amber">Featured</span>}
                                        {!pkg.is_active && <span className="admin-badge admin-badge-red">Inactive</span>}
                                    </div>
                                    {pkg.capacity && (
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between text-white-50 small mb-1">
                                                <span>{pkg.sold_count} sold / {pkg.capacity}</span>
                                                <span>{pkg.availability_pct}%</span>
                                            </div>
                                            <div className="progress" style={{ height: 6, background: 'rgba(255,255,255,0.08)' }}>
                                                <div
                                                    className={`progress-bar ${pkg.availability_pct >= 80 ? 'bg-danger' : pkg.availability_pct >= 50 ? 'bg-warning' : 'bg-success'}`}
                                                    style={{ width: `${pkg.availability_pct}%` }}
                                                />
                                            </div>
                                            {pkg.is_sold_out && <span className="text-danger small mt-1 d-block">Sold out</span>}
                                        </div>
                                    )}
                                    <div className="d-flex gap-2">
                                        <button className="btn-admin-outline btn-admin-sm flex-grow-1" onClick={() => openEdit(pkg)}>
                                            <i className="fas fa-edit me-1"></i>Edit
                                        </button>
                                        <button className="btn-admin-outline btn-admin-sm" onClick={() => setToDelete(pkg)}>
                                            <i className="fas fa-trash text-danger"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form modal */}
            <DashboardModal
                open={showForm}
                onOpenChange={(open) => !open && closeForm()}
                title={editing ? `Edit Package: ${editing.name}` : 'New Package'}
                label="Package"
                size="lg"
            >
                <form onSubmit={submit} className="p-4">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="admin-form-label">Tournament *</label>
                            <select
                                className="admin-form-input"
                                value={data.tournament_id}
                                onChange={(e) => {
                                    setData('tournament_id', e.target.value);
                                    // Reset picks when switching tournaments — the old
                                    // fixture ids won't exist in the new one.
                                    setData('included_match_ids', []);
                                    setData('included_venues', []);
                                }}
                                required
                            >
                                <option value="">Select tournament</option>
                                {tournaments.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            {errors.tournament_id && <div className="text-danger small mt-1">{errors.tournament_id}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="admin-form-label">Name *</label>
                            <input className="admin-form-input" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
                        </div>
                        <div className="col-12">
                            <label className="admin-form-label">Description</label>
                            <textarea className="admin-form-input" rows="3" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="admin-form-label">Base Price *</label>
                            <input type="number" step="0.01" min="0" className="admin-form-input" value={data.base_price} onChange={(e) => setData('base_price', e.target.value)} required />
                        </div>
                        <div className="col-md-2">
                            <label className="admin-form-label">Currency</label>
                            <input className="admin-form-input" value={data.currency} onChange={(e) => setData('currency', e.target.value.toUpperCase())} maxLength="8" />
                        </div>
                        <div className="col-md-2">
                            <label className="admin-form-label">Nights *</label>
                            <input type="number" min="1" max="60" className="admin-form-input" value={data.nights} onChange={(e) => setData('nights', parseInt(e.target.value, 10) || 1)} />
                        </div>
                        <div className="col-md-2">
                            <label className="admin-form-label">Flight Class</label>
                            <select className="admin-form-input" value={data.flight_class} onChange={(e) => setData('flight_class', e.target.value)}>
                                <option value="economy">Economy</option>
                                <option value="business">Business</option>
                                <option value="first">First</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="admin-form-label">Accommodation</label>
                            <select className="admin-form-input" value={data.accommodation_level} onChange={(e) => setData('accommodation_level', e.target.value)}>
                                <option value="hostel">Hostel</option>
                                <option value="airbnb">Airbnb</option>
                                <option value="3_star">3-star</option>
                                <option value="4_star">4-star</option>
                                <option value="5_star">5-star</option>
                                <option value="resort">Resort</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="admin-form-label">Capacity (optional)</label>
                            <input type="number" min="1" className="admin-form-input" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} placeholder="Unlimited if blank" />
                        </div>
                        <div className="col-md-4">
                            <label className="admin-form-label">Hero Image URL</label>
                            <input className="admin-form-input" value={data.hero_image} onChange={(e) => setData('hero_image', e.target.value)} placeholder="/storage/…" />
                        </div>
                        <div className="col-md-4">
                            <label className="admin-form-label">Display Order</label>
                            <input type="number" min="0" className="admin-form-input" value={data.display_order} onChange={(e) => setData('display_order', parseInt(e.target.value, 10) || 0)} />
                        </div>
                        <div className="col-md-6 d-flex align-items-center gap-4">
                            <label className="d-flex align-items-center gap-2 text-white">
                                <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                                Active
                            </label>
                            <label className="d-flex align-items-center gap-2 text-white">
                                <input type="checkbox" checked={data.is_featured} onChange={(e) => setData('is_featured', e.target.checked)} />
                                Featured
                            </label>
                        </div>
                    </div>

                    {/* Fixtures picker */}
                    <div className="mt-4 pt-4 border-top border-white border-opacity-10">
                        <label className="admin-form-label">
                            Included Matches
                            {fixturesLoading && <span className="text-white-50 small ms-2">Loading fixtures…</span>}
                        </label>
                        <div style={{ maxHeight: 240, overflowY: 'auto' }} className="p-2 rounded" >
                            {fixtures.length === 0 && !fixturesLoading && (
                                <div className="text-white-50 small">
                                    {data.tournament_id ? 'No fixtures available yet.' : 'Pick a tournament first.'}
                                </div>
                            )}
                            {fixtures.map((f) => (
                                <label key={f.id} className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: data.included_match_ids.includes(f.id) ? 'rgba(59,130,246,0.15)' : 'transparent' }}>
                                    <input
                                        type="checkbox"
                                        checked={data.included_match_ids.includes(f.id)}
                                        onChange={() => toggleMatch(f.id)}
                                    />
                                    <span className="text-white small">
                                        {f.date} · {f.homeTeam} vs {f.awayTeam}
                                        <span className="text-white-50 ms-2">{f.venue || ''}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Venue picker (loose — venues the package covers) */}
                    {venuesList.length > 0 && (
                        <div className="mt-3">
                            <label className="admin-form-label">Featured Venues (optional)</label>
                            <div className="d-flex flex-wrap gap-2">
                                {venuesList.map((v) => (
                                    <button
                                        type="button"
                                        key={v}
                                        onClick={() => toggleVenue(v)}
                                        className={`btn btn-sm ${data.included_venues.includes(v) ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 pt-3 border-top border-white border-opacity-10 d-flex justify-content-end gap-2">
                        <button type="button" className="btn-admin-outline" onClick={closeForm}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={processing}>
                            {editing ? 'Save Changes' : 'Create Package'}
                        </button>
                    </div>
                </form>
            </DashboardModal>

            <ConfirmationDialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
                title="Delete Package?"
                description={toDelete ? `"${toDelete.name}" will be permanently removed. Fans who have this package saved will keep their itinerary, but no new fans can select it.` : ''}
                onConfirm={confirmDelete}
                confirmText="Delete"
                destructive
            />
        </AdminLayout>
    );
}
