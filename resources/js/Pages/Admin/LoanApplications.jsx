import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import StatCard from '@/Components/Common/StatCard';
import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

export default function LoanApplications({ loans, stats }) {
    const { auth } = usePage().props;
    const [processingId, setProcessingId] = useState(null);

    const updateStatus = (id, newStatus) => {
        if (confirm(`Are you sure you want to change status to ${newStatus}?`)) {
            setProcessingId(id);
            router.put(route('admin.loan-applications.update', id), {
                status: newStatus
            }, {
                onSuccess: () => {
                    toast.success(`Loan application ${newStatus.toLowerCase()} successfully`);
                    setProcessingId(null);
                },
                onError: () => {
                    toast.error('Failed to update status');
                    setProcessingId(null);
                }
            });
        }
    };

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Loan Applications' }
    ];

    return (
        <AdminLayout title="Loan Applications">
            <Head title="Loan Applications" />

            <DashboardHero role="admin" 
                title="Loan Applications"
                subtitle="Review and manage fan loan requests."
                breadcrumbs={breadcrumbs}
            />

            <div className="admin-visual-cards mb-4 mt-4" style={{ overflow: 'visible', flexWrap: 'wrap' }}>
                <StatCard 
                    type="visual"
                    label="Total Applications" 
                    value={stats.total} 
                    icon="fas fa-file-invoice-dollar"
                    bgType="dashboard"
                    settingsKey="bg_card_loans_total"
                    image="/assets/images/bgimage05.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Pending Review" 
                    value={stats.pending} 
                    icon="fas fa-clock"
                    bgType="dashboard"
                    settingsKey="bg_card_loans_pending"
                    image="/assets/images/bgimage06.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Approved" 
                    value={stats.approved} 
                    icon="fas fa-check-circle"
                    bgType="dashboard"
                    settingsKey="bg_card_loans_approved"
                    image="/assets/images/bgimage07.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Approved Amount" 
                    value={`KES ${new Intl.NumberFormat().format(stats.total_amount)}`} 
                    icon="fas fa-coins"
                    bgType="dashboard"
                    settingsKey="bg_card_loans_amount"
                    image="/assets/images/bgimage08.jpg"
                    className="flex-grow-1"
                />
            </div>

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-list"></i> Applications List</h3>
                </div>
                <div className="card-body p-0">
                    <table className="admin-table-dark">
                        <thead>
                            <tr>
                                <th>Applicant</th>
                                <th>Amount</th>
                                <th>Budget/Plan</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.data.map((loan) => (
                                <tr key={loan.id}>
                                    <td>
                                        <div className="fw-semibold text-white">{loan.user_name}</div>
                                    </td>
                                    <td>
                                        <div className="text-white">KES {new Intl.NumberFormat().format(loan.amount)}</div>
                                        <small className="text-white opacity-50">{loan.interest_rate}% Interest</small>
                                    </td>
                                    <td>
                                        <div className="text-white opacity-75">{loan.budget_name}</div>
                                    </td>
                                    <td className="text-white opacity-75">
                                        {loan.created_at}
                                    </td>
                                    <td>
                                        <span className={`admin-badge admin-badge-${
                                            loan.status === 'APPROVED' ? 'green' : 
                                            loan.status === 'REJECTED' ? 'red' : 
                                            'amber'}`}>
                                            {loan.status}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        {loan.status === 'PENDING' && (
                                            <div className="d-flex justify-content-end gap-2">
                                                <button 
                                                    onClick={() => updateStatus(loan.id, 'APPROVED')}
                                                    disabled={processingId === loan.id}
                                                    className="btn-admin-outline btn-admin-sm text-success border-success/30"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => updateStatus(loan.id, 'REJECTED')}
                                                    disabled={processingId === loan.id}
                                                    className="btn-admin-outline btn-admin-sm text-danger border-danger/30"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {loans.data.length === 0 && (
                                <tr>
                                    <td colSpan="6">
                                        <div className="admin-empty-state">
                                            <i className="fas fa-hand-holding-usd"></i>
                                            <h4>No loan applications found.</h4>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
