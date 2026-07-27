import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminHero from '@/Components/Admin/AdminHero';
import AdminToolbar from '@/Components/Admin/AdminToolbar';
import { router, useForm } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';

export default function Announcements({ auth, announcements = { data: [] } }) {
    const [showForm, setShowForm] = useState(false);
    const [editingAnn, setEditingAnn] = useState(null);
    const [search, setSearch] = useState('');
    const [annToDelete, setAnnToDelete] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        title: '',
        content: '',
        type: 'info',
        is_active: true
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Announcements' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingAnn) {
            put(route('admin.announcements.update', editingAnn.id), {
                onSuccess: () => {
                    setShowForm(false);
                    setEditingAnn(null);
                    reset();
                }
            });
        } else {
            post(route('admin.announcements.store'), {
                onSuccess: () => {
                    setShowForm(false);
                    reset();
                }
            });
        }
    };

    const handleEdit = (ann) => {
        setEditingAnn(ann);
        setData({
            title: ann.title || '',
            content: ann.content,
            type: ann.type,
            is_active: !!ann.is_active
        });
        setShowForm(true);
    };

    const handleDelete = () => {
        if (annToDelete) {
            router.delete(route('admin.announcements.destroy', annToDelete), {
                onSuccess: () => setAnnToDelete(null)
            });
        }
    };

    const handleToggle = (id) => {
        router.put(route('admin.announcements.toggle', id));
    };

    const filteredAnnouncements = announcements.data.filter(ann => 
        (ann.title?.toLowerCase().includes(search.toLowerCase())) ||
        (ann.content?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <AdminLayout title="Announcements">
            <AdminHero 
                title="System Announcements"
                subtitle="Manage global broadcast messages for all users."
                breadcrumbs={breadcrumbs}
                action={{
                    label: showForm ? 'Back to List' : 'Post Announcement',
                    icon: showForm ? 'fas fa-arrow-left' : 'fas fa-plus',
                    onClick: () => {
                        setShowForm(!showForm);
                        if (!showForm) {
                            setEditingAnn(null);
                            reset();
                        }
                    }
                }}
            />

            {showForm ? (
                <div className="admin-card-dark max-w-2xl mx-auto bounce-in">
                    <div className="card-header">
                        <h3><i className="fas fa-bullhorn"></i> {editingAnn ? 'Edit Announcement' : 'New Broadcast Message'}</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Alert Type</label>
                                <div className="d-flex gap-2 flex-wrap mt-2">
                                    {['info', 'success', 'warning', 'danger'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            className={`admin-tab ${data.type === type ? 'active' : ''}`}
                                            onClick={() => setData('type', type)}
                                            style={{ textTransform: 'capitalize' }}
                                        >
                                            <span 
                                                className={`rounded-circle me-1`} 
                                                style={{ 
                                                    width: '8px', 
                                                    height: '8px', 
                                                    background: type === 'info' ? '#3b82f6' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444',
                                                    display: 'inline-block'
                                                }}
                                            ></span>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-form-label">Broadcast Title</label>
                                <input 
                                    type="text"
                                    className="admin-form-input"
                                    placeholder="e.g. System Maintenance"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    required
                                />
                                {errors.title && <div className="text-danger small mt-1">{errors.title}</div>}
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-form-label">Message Content</label>
                                <textarea 
                                    className="admin-form-input admin-form-textarea" 
                                    rows={4}
                                    placeholder="Type your message here..."
                                    value={data.content}
                                    onChange={e => setData('content', e.target.value)}
                                    required
                                ></textarea>
                                {errors.content && <div className="text-danger small mt-1">{errors.content}</div>}
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-toggle d-flex align-items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        checked={data.is_active}
                                        onChange={e => setData('is_active', e.target.checked)}
                                    />
                                    <span className="admin-toggle-slider"></span>
                                    <span className="text-white small">Live & Visible</span>
                                </label>
                            </div>

                            <div className="d-flex gap-2 mt-4">
                                <button type="submit" className="btn-admin" disabled={processing}>
                                    <i className="fas fa-paper-plane"></i> {editingAnn ? 'Update' : 'Post Broadcast'}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-admin-outline" 
                                    onClick={() => { setShowForm(false); setEditingAnn(null); }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <>
                    <AdminToolbar 
                        search={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Search announcements..."
                        showSort={false}
                        showViewToggle={false}
                    />

                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-list"></i> History</h3>
                            <span className="admin-badge admin-badge-gray">{filteredAnnouncements.length} active</span>
                        </div>
                        <div className="card-body p-0">
                            <table className="admin-table-dark">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Type</th>
                                        <th>Message</th>
                                        <th>Posted On</th>
                                        <th style={{ width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAnnouncements.length > 0 ? (
                                        filteredAnnouncements.map(ann => (
                                            <tr key={ann.id}>
                                                <td>
                                                    <div className="admin-toggle" onClick={() => handleToggle(ann.id)}>
                                                        <input type="checkbox" readOnly checked={ann.is_active} />
                                                        <span className="admin-toggle-slider"></span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`admin-badge admin-badge-${ann.type === 'info' ? 'blue' : (ann.type === 'success' ? 'green' : (ann.type === 'warning' ? 'amber' : 'red'))}`}>
                                                        {ann.type}
                                                    </span>
                                                </td>
                                                <td className="text-white" style={{ maxWidth: '400px' }}>
                                                    <div className="fw-semibold">{ann.title}</div>
                                                    <div className="text-truncate small opacity-75">{ann.content}</div>
                                                </td>
                                                <td className="text-white" style={{ opacity: 0.7 }}>
                                                    {new Date(ann.created_at).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button 
                                                            className="btn-admin-icon" 
                                                            title="Edit"
                                                            onClick={() => handleEdit(ann)}
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button 
                                                            className="btn-admin-icon" 
                                                            title="Delete"
                                                            onClick={() => setAnnToDelete(ann.id)}
                                                            style={{ color: 'var(--admin-danger)' }}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5">
                                                <div className="admin-empty-state">
                                                    <i className="fas fa-bullhorn"></i>
                                                    <h4>No announcements found</h4>
                                                    <p>Create your first broadcast message using the button above.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <ConfirmationDialog
                open={!!annToDelete}
                onOpenChange={(open) => !open && setAnnToDelete(null)}
                title="Delete Announcement?"
                description="Are you sure you want to delete this announcement? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
