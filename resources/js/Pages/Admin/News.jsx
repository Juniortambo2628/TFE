import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import AdminToolbar from '@/Components/Admin/AdminToolbar';
import StatCard from '@/Components/Common/StatCard';
import DataTable from '@/Components/DataTable';
import DashboardModal from '@/Components/Common/DashboardModal';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import { useForm, router } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';

export default function News({ auth, news = { data: [] } }) {
    const [showForm, setShowForm] = useState(false);
    const [newsToEdit, setNewsToEdit] = useState(null);
    const [newsToDelete, setNewsToDelete] = useState(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [imageFiles, setImageFiles] = useState([]);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        content: '',
        category: '',
        image: null
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'News' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        const routeName = newsToEdit ? 'admin.news.update' : 'admin.news.store';
        const routeParams = newsToEdit ? newsToEdit.id : undefined;

        post(route(routeName, routeParams), {
            _method: newsToEdit ? 'PUT' : 'POST',
            onSuccess: () => {
                reset();
                setShowForm(false);
                setNewsToEdit(null);
                setImageFiles([]);
            },
            forceFormData: true
        });
    };

    const handleEdit = (article) => {
        setNewsToEdit(article);
        setIsViewOnly(false);
        setData({
            title: article.title || '',
            content: article.content || '',
            category: article.category || '',
            image: null
        });
        setActiveTab('details');
        setShowForm(true);
    };

    const handleView = (article) => {
        setNewsToEdit(article);
        setIsViewOnly(true);
        setData({
            title: article.title || '',
            content: article.content || '',
            category: article.category || '',
            image: article.image || null
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
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => <span className="admin-badge admin-badge-blue">{row.original.category || 'General'}</span>,
        },
        {
            accessorKey: "created_at",
            header: "Posted",
            cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="d-flex gap-2">
                    <button className="btn-admin-icon" onClick={() => handleView(row.original)}><i className="fas fa-eye"></i></button>
                    <button className="btn-admin-icon" onClick={() => handleEdit(row.original)}><i className="fas fa-edit"></i></button>
                    <button className="btn-admin-icon" onClick={() => setNewsToDelete(row.original.id)} style={{'--admin-primary': 'var(--admin-danger)'}}><i className="fas fa-trash"></i></button>
                </div>
            )
        }
    ];

    return (
        <AdminLayout title="News Management">
            <DashboardHero role="admin" 
                title="News Management" 
                subtitle="Manage platform announcements and articles."
                breadcrumbs={breadcrumbs}
                action={{
                    label: "Add News",
                    icon: "fas fa-plus me-2",
                    onClick: () => {
                        reset();
                        setNewsToEdit(null);
                        setIsViewOnly(false);
                        setShowForm(true);
                    }
                }}
            />

            <div className="admin-visual-cards mb-4">
                <StatCard 
                    type="visual"
                    label="Total Articles" 
                    value={news.total || 0} 
                    icon="fas fa-newspaper" 
                    bgType="news" 
                    image="/assets/images/bgimage05.jpg"
                />
            </div>

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-list me-2"></i> Articles</h3>
                </div>
                <div className="card-body p-0">
                    <DataTable columns={columns} data={news.data || []} />
                </div>
            </div>

            <DashboardModal
                open={showForm}
                onOpenChange={setShowForm}
                title={isViewOnly ? "View News" : (newsToEdit ? "Edit News" : "Create News")}
                label="News Management"
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    { id: 'details', label: 'Details', icon: 'fas fa-info-circle' },
                    { id: 'media', label: 'Banner Image', icon: 'fas fa-image' }
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
                                        disabled={isViewOnly}
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="admin-form-group">
                                    <label className="form-label">Category</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={data.category} 
                                        onChange={e => setData('category', e.target.value)} 
                                        disabled={isViewOnly}
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="admin-form-group">
                                    <label className="form-label">Content *</label>
                                    <textarea 
                                        className="form-control" 
                                        rows={6} 
                                        value={data.content} 
                                        onChange={e => setData('content', e.target.value)} 
                                        required 
                                        disabled={isViewOnly}
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
                                    if (isViewOnly) return;
                                    setImageFiles(files);
                                    if (files[0]) setData('image', files[0].file);
                                }}
                                disabled={isViewOnly}
                                labelIdle={isViewOnly ? 'Article Banner' : 'Drag & Drop banner or <span class="filepond--label-action">Browse</span>'}
                            />
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                            {isViewOnly ? 'Close' : 'Cancel'}
                        </button>
                        {!isViewOnly && (
                            <button type="submit" className="btn-submit-modal" disabled={processing}>
                                {newsToEdit ? 'Update Article' : 'Post Article'}
                            </button>
                        )}
                    </div>
                </form>
            </DashboardModal>

            <ConfirmationDialog 
                open={!!newsToDelete}
                onOpenChange={(open) => !open && setNewsToDelete(null)}
                title="Delete News?"
                description="Are you sure you want to delete this article? This action cannot be undone."
                onConfirm={() => {
                    router.delete(route('admin.news.destroy', newsToDelete), {
                        onSuccess: () => setNewsToDelete(null)
                    });
                }}
                variant="destructive"
            />
        </AdminLayout>
    );
}
