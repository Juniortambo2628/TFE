import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import DashboardModal from '@/Components/Common/DashboardModal';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import ListingGrid from '@/Components/Common/ListingGrid';
import { useForm, router } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';

export default function Ads({ auth, ads = [] }) {
    // The controller returns a bare collection; stay tolerant of a paginator too.
    const items = Array.isArray(ads) ? ads : (ads.data || []);

    const [showForm, setShowForm] = useState(false);
    const [adToEdit, setAdToEdit] = useState(null);
    const [adToDelete, setAdToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [imageFiles, setImageFiles] = useState([]);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        link_url: '',
        ad_type: 'banner',
        partner_name: '',
        image: null
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Ads' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        const routeName = adToEdit ? 'admin.ads.update' : 'admin.ads.store';
        const routeParams = adToEdit ? adToEdit.id : undefined;

        post(route(routeName, routeParams), {
            _method: adToEdit ? 'PUT' : 'POST',
            onSuccess: () => {
                reset();
                setShowForm(false);
                setAdToEdit(null);
                setImageFiles([]);
            },
            forceFormData: true
        });
    };

    const handleEdit = (ad) => {
        setAdToEdit(ad);
        setData({
            title: ad.title || '',
            description: ad.description || '',
            link_url: ad.link_url || '',
            ad_type: ad.ad_type || 'banner',
            partner_name: ad.partner_name || '',
            image: null
        });
        setActiveTab('details');
        setShowForm(true);
    };

    return (
        <AdminLayout title="Ads Management">
            <DashboardHero role="admin"
                title="Advertisements"
                subtitle="Manage partners and banner ads across the platform."
                breadcrumbs={breadcrumbs}
                action={{
                    label: "New Ad",
                    icon: "fas fa-plus me-2",
                    onClick: () => {
                        reset();
                        setAdToEdit(null);
                        setShowForm(true);
                    }
                }}
            />

            <SummaryTiles items={[
                { label: 'Active Ads', value: items.length, icon: 'fa-ad', accent: 'red' },
                { label: 'Impressions', value: items.reduce((acc, a) => acc + (a.impressions || 0), 0), icon: 'fa-eye', accent: 'cyan' },
                { label: 'Clicks', value: items.reduce((acc, a) => acc + (a.clicks || 0), 0), icon: 'fa-mouse-pointer', accent: 'teal' },
            ]} className="mb-4" />

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-bullhorn me-2"></i> Current Ads</h3>
                    <span className="admin-badge admin-badge-gray">{items.length} items</span>
                </div>
                <div className="card-body">
                    <ListingGrid
                        items={items}
                        emptyIcon="fas fa-ad"
                        emptyTitle="No ads yet"
                        emptyBody="Click 'New Ad' to publish your first banner."
                        to={(ad) => ({
                            title: ad.title,
                            eyebrow: (ad.ad_type || 'banner').replace('_', ' '),
                            desc: ad.description,
                            accent: '#dc143c',
                            cover: ad.image_display_url || undefined,
                            artwork: ad.image_display_url ? undefined : { icon: 'fas fa-ad' },
                            pills: ad.partner_name ? [ad.partner_name] : [],
                            meta: [
                                { label: 'Impressions', value: ad.impressions || 0 },
                                { label: 'Clicks', value: ad.clicks || 0 },
                            ],
                            cornerButton: {
                                icon: 'fas fa-edit',
                                label: `Edit ${ad.title}`,
                                onClick: () => handleEdit(ad),
                            },
                        })}
                        tableView={
                            <table className="tfe-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Partner</th>
                                        <th>Type</th>
                                        <th>Stats</th>
                                        <th style={{ width: 100 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((ad) => (
                                        <tr key={ad.id}>
                                            <td className="fw-semibold">{ad.title}</td>
                                            <td>{ad.partner_name || '—'}</td>
                                            <td>
                                                <span className="tfe-pill tfe-pill--info">
                                                    {(ad.ad_type || 'banner').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="small">
                                                <div><i className="fas fa-eye me-1"></i> {ad.impressions || 0}</div>
                                                <div><i className="fas fa-mouse-pointer me-1"></i> {ad.clicks || 0}</div>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Edit ad" onClick={() => handleEdit(ad)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Delete ad" onClick={() => setAdToDelete(ad.id)}>
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
                </div>
            </div>

            <DashboardModal
                open={showForm}
                onOpenChange={setShowForm}
                title={adToEdit ? "Edit Ad" : "Create Ad"}
                label="Ads Management"
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    { id: 'details', label: 'Details', icon: 'fas fa-info-circle' },
                    { id: 'media', label: 'Ad Banner', icon: 'fas fa-image' }
                ]}
            >
                <form onSubmit={handleSubmit} className="p-1">
                    {activeTab === 'details' && (
                        <div className="row g-3 bounce-in">
                            <div className="col-12">
                                <div className="admin-form-group">
                                    <label className="tfe-form-label">Title *</label>
                                    <input
                                        type="text"
                                        className="tfe-input"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        required
                                    />
                                    {errors.title && <div className="text-danger small mt-1">{errors.title}</div>}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="admin-form-group">
                                    <label className="tfe-form-label">Partner Name</label>
                                    <input
                                        type="text"
                                        className="tfe-input"
                                        value={data.partner_name}
                                        onChange={e => setData('partner_name', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="admin-form-group">
                                    <label className="tfe-form-label">Ad Type</label>
                                    <select
                                        className="tfe-select"
                                        value={data.ad_type}
                                        onChange={e => setData('ad_type', e.target.value)}
                                    >
                                        <option value="banner">Banner Ad</option>
                                        <option value="popup">Popup Ad</option>
                                        <option value="sidebar">Sidebar Ad</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="admin-form-group">
                                    <label className="tfe-form-label">Link URL</label>
                                    <input
                                        type="url"
                                        className="tfe-input"
                                        value={data.link_url}
                                        onChange={e => setData('link_url', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="admin-form-group">
                                    <label className="tfe-form-label">Description</label>
                                    <textarea
                                        className="tfe-input"
                                        rows={3}
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="bounce-in">
                            <FilePondUploader
                                files={imageFiles}
                                onUpdateFiles={(files) => {
                                    setImageFiles(files);
                                    if (files[0]) setData('image', files[0].file);
                                }}
                                labelIdle='Drag & Drop ad banner or <span class="filepond--label-action">Browse</span>'
                            />
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn-submit-modal" disabled={processing}>
                            {adToEdit ? 'Update Ad' : 'Create Ad'}
                        </button>
                    </div>
                </form>
            </DashboardModal>

            <ConfirmationDialog
                open={!!adToDelete}
                onOpenChange={(open) => !open && setAdToDelete(null)}
                title="Delete Ad?"
                description="Are you sure you want to delete this advertisement?"
                onConfirm={() => {
                    router.delete(route('admin.ads.destroy', adToDelete), {
                        onSuccess: () => setAdToDelete(null)
                    });
                }}
                variant="destructive"
            />
        </AdminLayout>
    );
}
