import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import DashboardModal from '@/Components/Common/DashboardModal';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import ListingGrid from '@/Components/Common/ListingGrid';
import { useForm, router } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';

export default function News({ auth, news = { data: [] } }) {
    const items = news.data || [];

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

    const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

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

            <SummaryTiles items={[
                { label: 'Total Articles', value: news.total ?? items.length, icon: 'fa-newspaper', accent: 'cyan' },
            ]} className="mb-4" />

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-list me-2"></i> Articles</h3>
                    <span className="admin-badge admin-badge-gray">{items.length} items</span>
                </div>
                <div className="card-body">
                    <ListingGrid
                        items={items}
                        emptyIcon="fas fa-newspaper"
                        emptyTitle="No articles yet"
                        emptyBody="Click 'Add News' to publish your first article."
                        to={(article) => ({
                            title: article.title,
                            eyebrow: article.category || 'General',
                            desc: article.content,
                            accent: '#06b6d4',
                            cover: article.image_url || undefined,
                            artwork: article.image_url ? undefined : { icon: 'fas fa-newspaper' },
                            meta: [{ label: 'Posted', value: formatDate(article.created_at) }],
                            cornerButton: {
                                icon: 'fas fa-edit',
                                label: `Edit ${article.title}`,
                                onClick: () => handleEdit(article),
                            },
                        })}
                        tableView={
                            <table className="tfe-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Posted</th>
                                        <th style={{ width: 130 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((article) => (
                                        <tr key={article.id}>
                                            <td className="fw-semibold">{article.title}</td>
                                            <td>
                                                <span className="tfe-pill tfe-pill--info">{article.category || 'General'}</span>
                                            </td>
                                            <td>{formatDate(article.created_at)}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="View article" onClick={() => handleView(article)}>
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Edit article" onClick={() => handleEdit(article)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Delete article" onClick={() => setNewsToDelete(article.id)}>
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
                                    <label className="tfe-form-label">Title *</label>
                                    <input
                                        type="text"
                                        className="tfe-input"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        required
                                        disabled={isViewOnly}
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="admin-form-group">
                                    <label className="tfe-form-label">Category</label>
                                    <input
                                        type="text"
                                        className="tfe-input"
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                        disabled={isViewOnly}
                                    />
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="admin-form-group">
                                    <label className="tfe-form-label">Content *</label>
                                    <textarea
                                        className="tfe-input"
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
