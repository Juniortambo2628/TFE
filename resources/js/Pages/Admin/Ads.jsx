import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import StatCard from '@/Components/Common/StatCard';
import DataTable from '@/Components/DataTable';
import DashboardModal from '@/Components/Common/DashboardModal';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import { useForm, router } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';

export default function Ads({ auth, ads = { data: [] } }) {
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

    const columns = [
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => <span className="fw-semibold">{row.original.title}</span>,
        },
        {
            accessorKey: "partner_name",
            header: "Partner",
            cell: ({ row }) => <span className="text-white opacity-75">{row.original.partner_name || '-'}</span>,
        },
        {
            accessorKey: "impressions",
            header: "Stats",
            cell: ({ row }) => (
                <div className="small">
                    <div><i className="fas fa-eye me-1"></i> {row.original.impressions || 0}</div>
                    <div><i className="fas fa-mouse-pointer me-1"></i> {row.original.clicks || 0}</div>
                </div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="d-flex gap-2">
                    <button className="btn-admin-icon" onClick={() => handleEdit(row.original)}><i className="fas fa-edit"></i></button>
                    <button className="btn-admin-icon" onClick={() => setAdToDelete(row.original.id)} style={{'--admin-primary': 'var(--admin-danger)'}}><i className="fas fa-trash"></i></button>
                </div>
            )
        }
    ];

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

            <div className="admin-visual-cards mb-4">
                <StatCard 
                    type="visual"
                    label="Active Ads" 
                    value={ads.total || 0} 
                    icon="fas fa-ad" 
                    bgType="ads" 
                    image="/assets/images/bgimage03.jpg"
                />
            </div>

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-bullhorn me-2"></i> Current Ads</h3>
                </div>
                <div className="card-body p-0">
                    <DataTable columns={columns} data={ads.data || []} />
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
                                    <label className="form-label">Title *</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={data.title} 
                                        onChange={e => setData('title', e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="admin-form-group">
                                    <label className="form-label">Partner Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={data.partner_name} 
                                        onChange={e => setData('partner_name', e.target.value)} 
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="admin-form-group">
                                    <label className="form-label">Ad Type</label>
                                    <select 
                                        className="form-select bg-dark text-white border-secondary"
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
                                    <label className="form-label">Link URL</label>
                                    <input 
                                        type="url" 
                                        className="form-control" 
                                        value={data.link_url} 
                                        onChange={e => setData('link_url', e.target.value)} 
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="admin-form-group">
                                    <label className="form-label">Description</label>
                                    <textarea 
                                        className="form-control" 
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
