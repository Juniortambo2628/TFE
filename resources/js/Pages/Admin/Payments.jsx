import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import AdminToolbar from '@/Components/Admin/AdminToolbar';
import StatCard from '@/Components/Common/StatCard';
import { router } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import { formatMoney } from '@/lib/utils';

export default function Payments({ auth, transactions = { data: [] }, stats = {}, filters }) {
    const safeFilters = (filters && !Array.isArray(filters)) ? filters : {};
    const [search, setSearch] = useState(safeFilters.search || '');
    const [sortBy, setSortBy] = useState(typeof safeFilters.sort === 'string' ? safeFilters.sort : 'newest');
    const [viewMode, setViewMode] = useState('list');

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Payments' }
    ];

    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'amount_high', label: 'Highest Amount' },
        { value: 'amount_low', label: 'Lowest Amount' }
    ];

    const handleStatusChange = (txnId, newStatus) => {
        router.put(`/admin/payments/${txnId}/status`, { status: newStatus });
    };

    const columns = [
        {
            accessorKey: "user",
            header: "User",
            cell: ({ row }) => <span className="fw-semibold">{row.original.user}</span>,
        },
        {
            accessorKey: "amount",
            header: "Amount",
            cell: ({ row }) => (
                <span style={{ color: 'var(--admin-success)', fontWeight: '600' }}>
                    {formatMoney(row.original.amount)}
                </span>
            ),
        },
        {
            accessorKey: "method",
            header: "Method",
            cell: ({ row }) => <span className="admin-badge admin-badge-blue">{row.original.method}</span>,
        },
        {
            accessorKey: "reference",
            header: "Reference",
            cell: ({ row }) => (
                <code style={{ 
                    background: 'var(--admin-bg-dark)', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                }}>
                    {row.original.reference}
                </code>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <span className={`admin-badge admin-badge-${row.original.status === 'completed' ? 'green' : row.original.status === 'pending' ? 'amber' : 'red'}`}>
                    {row.original.status}
                </span>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Date",
            cell: ({ row }) => <span className="text-white small" style={{ opacity: 0.7 }}>{row.original.created_at}</span>,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="d-flex gap-2">
                    {row.original.status !== 'completed' && (
                        <button 
                            className="btn-admin-icon"
                            title="Mark Complete"
                            onClick={() => handleStatusChange(row.original.id, 'completed')}
                            style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--admin-success)', borderColor: 'var(--admin-success)' }}
                        >
                            <i className="fas fa-check"></i>
                        </button>
                    )}
                    {row.original.status === 'completed' && (
                        <button 
                            className="btn-admin-icon"
                            title="Re-Sync Data"
                            onClick={() => handleStatusChange(row.original.id, 'completed')}
                            style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--admin-success)', borderColor: 'var(--admin-success)' }}
                        >
                            <i className="fas fa-sync-alt"></i>
                        </button>
                    )}
                    <button 
                        className="btn-admin-icon" 
                        title="Mark Failed"
                        onClick={() => handleStatusChange(row.original.id, 'failed')}
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--admin-danger)', borderColor: 'var(--admin-danger)' }}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout title="Payments Management">
            <DashboardHero role="admin" 
                title="Payments & Transactions"
                subtitle="Monitor revenue and manage payment statuses."
                breadcrumbs={breadcrumbs}
            />

            {/* Dashboard Stats */}
            <div className="admin-visual-cards mb-4" style={{ overflow: 'visible', flexWrap: 'wrap' }}>
                <StatCard 
                    type="visual"
                    label="Total Volume" 
                    value={formatMoney(stats.total_volume)} 
                    icon="fas fa-money-bill-wave"
                    bgType="payments"
                    settingsKey="bg_card_payments_total"
                    image="/assets/images/bgimage04.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Completed" 
                    value={stats.completed_count || 0} 
                    icon="fas fa-check-circle"
                    bgType="payments"
                    settingsKey="bg_card_payments_completed"
                    image="/assets/images/bgimage05.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Pending" 
                    value={stats.pending_count || 0} 
                    icon="fas fa-clock"
                    bgType="payments"
                    settingsKey="bg_card_payments_pending"
                    image="/assets/images/bgimage01.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Failed/Cancelled" 
                    value={stats.failed_count || 0} 
                    icon="fas fa-times-circle"
                    bgType="payments"
                    settingsKey="bg_card_payments_failed"
                    image="/assets/images/bgimage02.jpg"
                    className="flex-grow-1"
                />
            </div>

            {/* Toolbar */}
            <AdminToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search transactions..."
                sortOptions={sortOptions}
                sortValue={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewChange={setViewMode}
            />

            {/* Transactions Table */}
            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-receipt"></i> All Transactions</h3>
                    <span className="admin-badge admin-badge-gray">{transactions.data?.length || 0} transactions</span>
                </div>
                <div className="card-body p-0">
                    <DataTable 
                        columns={columns} 
                        data={transactions.data || []} 
                        search={search}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
