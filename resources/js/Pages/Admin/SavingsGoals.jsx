import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import StatCard from '@/Components/Common/StatCard';
import { Head, router, usePage } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { toast } from 'sonner';

export default function SavingsGoals({ auth, goals, stats }) {
    const [goalToDelete, setGoalToDelete] = useState(null);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Savings Goals' }
    ];

    const handleDelete = () => {
        if (goalToDelete) {
            router.delete(route('admin.savings-goals.destroy', goalToDelete), {
                onSuccess: () => {
                    toast.success('Savings goal deleted');
                    setGoalToDelete(null);
                }
            });
        }
    };

    return (
        <AdminLayout title="Savings Goals Monitor">
            <Head title="Savings Goals" />
            <DashboardHero role="admin" 
                title="Savings Goals Monitor"
                subtitle="Track and analyze user savings progress for upcoming tournaments."
                breadcrumbs={breadcrumbs}
            />

            <div className="admin-visual-cards mb-4">
                <StatCard 
                    type="visual"
                    label="Total Saved" 
                    value={`KES ${new Intl.NumberFormat().format(stats.total_saved)}`} 
                    icon="fas fa-piggy-bank"
                    bgType="payments"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Active Goals" 
                    value={stats.active} 
                    icon="fas fa-running"
                    bgType="events"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Completed" 
                    value={stats.completed} 
                    icon="fas fa-check-double"
                    bgType="news"
                    className="flex-grow-1"
                />
            </div>

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-chart-line me-2"></i> Savings Progress</h3>
                    <span className="admin-badge admin-badge-gray">{stats.total} goals</span>
                </div>
                
                <div className="card-body">
                    <table className="admin-table-dark">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Budget/Plan</th>
                                <th>Progress</th>
                                <th>Target Amount</th>
                                <th>Status</th>
                                <th style={{ width: '80px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {goals.data.length > 0 ? (
                                goals.data.map(goal => (
                                    <tr key={goal.id}>
                                        <td>
                                            <div className="text-white fw-medium">{goal.user_name}</div>
                                            <div className="text-xs text-medium-contrast">Started {goal.created_at}</div>
                                        </td>
                                        <td className="text-white opacity-75">{goal.budget_name}</td>
                                        <td style={{ minWidth: '200px' }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="flex-grow-1" style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div 
                                                        style={{ 
                                                            width: `${Math.min(goal.progress, 100)}%`, 
                                                            height: '100%', 
                                                            background: goal.progress >= 100 ? '#10b981' : '#3b82f6',
                                                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs fw-bold text-white">{goal.progress}%</span>
                                            </div>
                                            <div className="text-xs mt-1 text-medium-contrast">
                                                KES {new Intl.NumberFormat().format(goal.current_amount)} saved
                                            </div>
                                        </td>
                                        <td className="text-white fw-medium">KES {new Intl.NumberFormat().format(goal.target_amount)}</td>
                                        <td>
                                            <span className={`admin-badge ${goal.status === 'COMPLETED' ? 'admin-badge-blue' : 'admin-badge-gray'}`}>
                                                {goal.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-admin-icon" title="Delete" onClick={() => setGoalToDelete(goal.id)}>
                                                <i className="fas fa-trash text-danger"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-5">
                                        <div className="admin-empty-state">
                                            <i className="fas fa-piggy-bank opacity-20 fa-3x mb-3"></i>
                                            <h4>No savings goals tracked yet</h4>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationDialog
                open={!!goalToDelete}
                onOpenChange={(open) => !open && setGoalToDelete(null)}
                title="Delete Tracking?"
                description="Are you sure you want to remove this savings goal tracking? The user will still have their data, but it won't show in this admin list."
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
