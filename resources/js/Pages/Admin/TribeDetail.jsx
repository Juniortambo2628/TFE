import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminHero from '@/Components/Admin/AdminHero';
import { Head, Link, router, useForm } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { toast } from 'sonner';

export default function TribeDetail({ auth, tribe }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editing, setEditing] = useState(false);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Tribes', href: route('admin.tribes.index') },
        { label: tribe.name },
    ];

    const editForm = useForm({
        name: tribe.name || '',
        description: tribe.description || '',
        privacy: tribe.privacy || 'public',
        forum_enabled: tribe.forum_enabled ?? true,
    });

    const handleUpdate = (e) => {
        e.preventDefault();
        editForm.put(route('admin.tribes.update', tribe.id), {
            onSuccess: () => {
                setEditing(false);
                toast.success('Tribe updated successfully');
            },
        });
    };

    const handleDelete = () => {
        router.delete(route('admin.tribes.destroy', tribe.id), {
            onSuccess: () => {
                toast.success('Tribe deleted');
                router.visit(route('admin.tribes.index'));
            },
        });
    };

    return (
        <AdminLayout title={`Tribe: ${tribe.name}`}>
            <Head title={`Tribe - ${tribe.name}`} />
            <AdminHero
                title={tribe.name}
                subtitle="Tribe Details"
                breadcrumbs={breadcrumbs}
            />

            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="admin-card-dark p-3 text-center">
                        <i className="fas fa-users fa-2x mb-2" style={{ color: 'var(--admin-accent, #DC143C)' }}></i>
                        <div className="text-white-50 small mb-1">Members</div>
                        <div className="text-white fw-bold">{tribe.member_count || tribe.members?.length || 0}</div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="admin-card-dark p-3 text-center">
                        <i className="fas fa-shield-alt fa-2x mb-2" style={{ color: 'var(--admin-accent, #DC143C)' }}></i>
                        <div className="text-white-50 small mb-1">Privacy</div>
                        <div className="text-white fw-bold text-capitalize">{tribe.privacy}</div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="admin-card-dark p-3 text-center">
                        <i className="fas fa-comments fa-2x mb-2" style={{ color: 'var(--admin-accent, #DC143C)' }}></i>
                        <div className="text-white-50 small mb-1">Forum</div>
                        <div className={`fw-bold ${tribe.forum_enabled ? 'text-green-400' : 'text-red-400'}`}>
                            {tribe.forum_enabled ? 'Enabled' : 'Disabled'}
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="admin-card-dark p-3 text-center">
                        <i className="fas fa-user fa-2x mb-2" style={{ color: 'var(--admin-accent, #DC143C)' }}></i>
                        <div className="text-white-50 small mb-1">Created By</div>
                        <div className="text-white fw-bold">{tribe.creator?.name || 'Unknown'}</div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="admin-card-dark">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h3><i className="fas fa-info-circle me-2"></i> Tribe Information</h3>
                            <button
                                className="btn btn-sm btn-outline-light"
                                onClick={() => setEditing(!editing)}
                            >
                                <i className={`fas ${editing ? 'fa-times' : 'fa-edit'} me-1`}></i>
                                {editing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>
                        <div className="card-body">
                            {editing ? (
                                <form onSubmit={handleUpdate}>
                                    <div className="mb-3">
                                        <label className="form-label text-white">Name</label>
                                        <input
                                            type="text"
                                            className="form-control bg-dark text-white border-secondary"
                                            value={editForm.data.name}
                                            onChange={(e) => editForm.setData('name', e.target.value)}
                                            required
                                        />
                                        {editForm.errors.name && <div className="text-danger small mt-1">{editForm.errors.name}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label text-white">Description</label>
                                        <textarea
                                            className="form-control bg-dark text-white border-secondary"
                                            rows={3}
                                            value={editForm.data.description}
                                            onChange={(e) => editForm.setData('description', e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label text-white">Privacy</label>
                                        <select
                                            className="form-select bg-dark text-white border-secondary"
                                            value={editForm.data.privacy}
                                            onChange={(e) => editForm.setData('privacy', e.target.value)}
                                        >
                                            <option value="public">Public</option>
                                            <option value="private">Private</option>
                                        </select>
                                    </div>
                                    <div className="mb-3 form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="forumEnabled"
                                            checked={editForm.data.forum_enabled}
                                            onChange={(e) => editForm.setData('forum_enabled', e.target.checked)}
                                        />
                                        <label className="form-check-label text-white" htmlFor="forumEnabled">
                                            Forum Enabled
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-sm"
                                        style={{ backgroundColor: 'var(--admin-accent, #DC143C)', color: '#fff' }}
                                        disabled={editForm.processing}
                                    >
                                        <i className="fas fa-save me-1"></i> Save Changes
                                    </button>
                                </form>
                            ) : (
                                <table className="admin-table-dark">
                                    <tbody>
                                        <tr>
                                            <td className="text-white-50" style={{ width: '180px' }}>Tribe ID</td>
                                            <td className="text-white">#{tribe.id}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-white-50">Name</td>
                                            <td className="text-white">{tribe.name}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-white-50">Slug</td>
                                            <td className="text-white">{tribe.slug}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-white-50">Description</td>
                                            <td className="text-white">{tribe.description || 'No description'}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-white-50">Created By</td>
                                            <td className="text-white">{tribe.creator?.name || 'Unknown'}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-white-50">Created At</td>
                                            <td className="text-white">{new Date(tribe.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {tribe.members && tribe.members.length > 0 && (
                        <div className="admin-card-dark mt-4">
                            <div className="card-header">
                                <h3><i className="fas fa-users me-2"></i> Members ({tribe.members.length})</h3>
                            </div>
                            <div className="card-body">
                                <table className="admin-table-dark">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tribe.members.map(member => (
                                            <tr key={member.id}>
                                                <td className="text-white">
                                                    {member.user?.name || 'Unknown'}
                                                </td>
                                                <td>
                                                    <span className={`admin-badge ${member.role === 'admin' ? 'admin-badge-blue' : 'admin-badge-gray'}`}>
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td className="text-white-50">
                                                    {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-lg-4">
                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-cog me-2"></i> Actions</h3>
                        </div>
                        <div className="card-body d-flex flex-column gap-2">
                            <Link
                                href={route('fan.tribes.show', tribe.id)}
                                className="btn btn-sm btn-outline-info"
                                target="_blank"
                            >
                                <i className="fas fa-external-link-alt me-1"></i> View as Fan
                            </Link>
                            <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <i className="fas fa-trash me-1"></i> Delete Tribe
                            </button>
                            <hr className="border-secondary my-2" />
                            <Link href={route('admin.tribes.index')} className="btn btn-sm btn-outline-light">
                                <i className="fas fa-arrow-left me-1"></i> Back to Tribes
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                open={showDeleteConfirm}
                onOpenChange={(open) => !open && setShowDeleteConfirm(false)}
                title="Delete Tribe?"
                description={`Are you sure you want to delete "${tribe.name}"? This will remove all members and posts. This cannot be undone.`}
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
