import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import StatCard from '@/Components/Common/StatCard';
import { router, useForm } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import DashboardModal from '@/Components/Common/DashboardModal';
import '../../../css/fan/dashboard-modals.css';

export default function Prizes({ auth, prizes = [] }) {
    const [showForm, setShowForm] = useState(false);
    const [prizeToDelete, setPrizeToDelete] = useState(null);
    const [prizeToEdit, setPrizeToEdit] = useState(null);
    
    const { data, setData, post, put, processing, reset, errors } = useForm({
        position: '',
        name: '',
        description: '',
        value: '',
        active: true,
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Prizes' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        if (prizeToEdit) {
            put(route('admin.prizes.update', prizeToEdit.id), {
                onSuccess: () => {
                    closeModal();
                }
            });
        } else {
            post(route('admin.prizes.store'), {
                onSuccess: () => {
                    closeModal();
                }
            });
        }
    };

    const closeModal = () => {
        setShowForm(false);
        setPrizeToEdit(null);
        reset();
    };

    const handleDelete = () => {
        if (prizeToDelete) {
            router.delete(route('admin.prizes.destroy', prizeToDelete), {
                onSuccess: () => setPrizeToDelete(null)
            });
        }
    };

    const handleEdit = (prize) => {
        setPrizeToEdit(prize);
        setData({
            position: prize.position || '',
            name: prize.name || '',
            description: prize.description || '',
            value: prize.value || '',
            active: prize.active ?? true,
        });
        setShowForm(true);
    };

    return (
        <AdminLayout title="Tournament Prizes">
            <DashboardHero role="admin" 
                title="Tournament Prizes"
                subtitle="Manage and configure rewards for tournament winners."
                breadcrumbs={breadcrumbs}
                action={{
                    label: "Add Prize",
                    icon: "fas fa-plus me-2",
                    onClick: () => {
                        reset();
                        setPrizeToEdit(null);
                        setShowForm(true);
                    }
                }}
            />

            <div className="admin-visual-cards mb-4">
                <StatCard 
                    type="visual"
                    label="Active Prizes" 
                    value={prizes.filter(p => p.active).length} 
                    icon="fas fa-trophy"
                    bgType="events"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Total Value" 
                    value={`KES ${new Intl.NumberFormat().format(prizes.reduce((acc, p) => acc + parseFloat(p.value || 0), 0))}`} 
                    icon="fas fa-coins"
                    bgType="payments"
                    className="flex-grow-1"
                />
            </div>

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-list-ol me-2"></i> Prize List</h3>
                    <span className="admin-badge admin-badge-gray">{prizes.length} items</span>
                </div>
                
                <div className="card-body">
                    <table className="admin-table-dark">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Pos</th>
                                <th>Prize Name</th>
                                <th>Value</th>
                                <th>Status</th>
                                <th style={{ width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prizes.length > 0 ? (
                                prizes.map(prize => (
                                    <tr key={prize.id}>
                                        <td className="fw-bold text-white">#{prize.position}</td>
                                        <td>
                                            <div className="text-white fw-medium">{prize.name}</div>
                                            <div className="text-xs text-medium-contrast">{prize.description}</div>
                                        </td>
                                        <td className="text-blue-400 fw-semibold">{prize.value_formatted}</td>
                                        <td>
                                            <span className={`admin-badge ${prize.active ? 'admin-badge-blue' : 'admin-badge-gray'}`}>
                                                {prize.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button className="btn-admin-icon" title="Edit" onClick={() => handleEdit(prize)}>
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn-admin-icon" title="Delete" onClick={() => setPrizeToDelete(prize.id)}>
                                                    <i className="fas fa-trash text-danger"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-5">
                                        <div className="admin-empty-state">
                                            <i className="fas fa-trophy opacity-20 fa-3x mb-3"></i>
                                            <h4>No prizes configured</h4>
                                            <p className="text-medium-contrast">Click 'Add Prize' to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <DashboardModal
                open={showForm}
                onOpenChange={setShowForm}
                title={prizeToEdit ? "Edit Prize" : "Add New Prize"}
                label="Prize Management"
                tabs={[{ id: 'details', label: 'Prize Details', icon: 'fas fa-info-circle' }]}
            >
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <div className="admin-form-group">
                                <label className="form-label">Position *</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    value={data.position} 
                                    onChange={e => setData('position', e.target.value)} 
                                    required 
                                />
                                {errors.position && <div className="text-danger small mt-1">{errors.position}</div>}
                            </div>
                        </div>
                        <div className="col-md-8">
                            <div className="admin-form-group">
                                <label className="form-label">Prize Name *</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="e.g. Winner Trophy + Cash" 
                                    value={data.name} 
                                    onChange={e => setData('name', e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="admin-form-group">
                                <label className="form-label">Value (KES) *</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    value={data.value} 
                                    onChange={e => setData('value', e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="admin-form-group">
                                <label className="form-label">Status</label>
                                <div className="form-check form-switch mt-2">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="activeSwitch"
                                        checked={data.active}
                                        onChange={e => setData('active', e.target.checked)}
                                    />
                                    <label className="form-check-label text-white" htmlFor="activeSwitch">
                                        {data.active ? 'Active' : 'Inactive'}
                                    </label>
                                </div>
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
                    <div className="mt-4 d-flex justify-content-end gap-2">
                        <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                        <button type="submit" className="btn-submit-modal" disabled={processing}>
                            {prizeToEdit ? 'Update Prize' : 'Save Prize'}
                        </button>
                    </div>
                </form>
            </DashboardModal>

            <ConfirmationDialog
                open={!!prizeToDelete}
                onOpenChange={(open) => !open && setPrizeToDelete(null)}
                title="Delete Prize?"
                description="Are you sure you want to remove this prize from the list?"
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
