import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminHero from '@/Components/Admin/AdminHero';
import StatCard from '@/Components/Common/StatCard';
import { AreaChart, BarChart, Card, Title, Text } from "@tremor/react";
import { Link, usePage } from '@inertiajs/react';
import { formatMoney } from '@/lib/utils';

export default function Dashboard({ stats = {}, recentUsers = [], recentTransactions = [], revenueGrowth = [], usersByRole = [] }) {
    const { auth, adminTheme } = usePage().props;

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Dashboard' }
    ];

    // Chart data derived from controller props
    const chartData = (revenueGrowth && revenueGrowth.length > 0)
        ? revenueGrowth
        : [
            { Month: "Jan", Revenue: 0, Previous: 0 },
            { Month: "Feb", Revenue: 0, Previous: 0 },
            { Month: "Mar", Revenue: 0, Previous: 0 },
            { Month: "Apr", Revenue: 0, Previous: 0 },
            { Month: "May", Revenue: 0, Previous: 0 },
            { Month: "Jun", Revenue: 0, Previous: 0 },
        ];

    const userData = (usersByRole && usersByRole.length > 0)
        ? usersByRole
        : [
            { Tier: "Fan", Users: stats?.total_users || 0 },
            { Tier: "Admin", Users: 1 },
        ];

    return (
        <AdminLayout title="Admin Dashboard">
            <AdminHero 
                title={`Welcome back, ${auth.user?.name?.split(' ')[0] || 'Admin'}!`}
                subtitle="System overview and management console."
                breadcrumbs={breadcrumbs}
            />

            {/* Tremor chart white label overrides */}
            <style>{`
                .tremor-chart-white text,
                .tremor-chart-white .recharts-cartesian-axis-tick-value,
                .tremor-chart-white .recharts-legend-item-text,
                .tremor-chart-white .recharts-text {
                    fill: #ffffff !important;
                    color: #ffffff !important;
                }
                .tremor-chart-white .recharts-cartesian-grid line {
                    stroke: rgba(255,255,255,0.08) !important;
                }
                .tremor-chart-white .recharts-tooltip-wrapper .recharts-default-tooltip {
                    background: #1a1a2e !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 10px !important;
                }
                .tremor-chart-white .recharts-tooltip-wrapper .recharts-default-tooltip .recharts-tooltip-label {
                    color: #ffffff !important;
                }
                .tremor-chart-white .recharts-tooltip-wrapper .recharts-default-tooltip .recharts-tooltip-item {
                    color: #e0e0e0 !important;
                }
                /* Tremor specific overrides */
                .tremor-chart-white [class*="tremor-AreaChart"],
                .tremor-chart-white [class*="tremor-BarChart"] {
                    --tremor-content-DEFAULT: #ffffff;
                    --tremor-content-subtle: rgba(255,255,255,0.7);
                    --tremor-content-emphasis: #ffffff;
                }
            `}</style>

            {/* Quick Stats Row */}
            <div className="admin-visual-cards mb-4" style={{ overflow: 'visible', flexWrap: 'wrap' }}>
                <StatCard 
                    type="visual"
                    label="Total Users" 
                    value={stats?.total_users || 0} 
                    icon="fas fa-users"
                    bgType="dashboard"
                    settingsKey="bg_card_dashboard_total_users"
                    image="/assets/images/bgimage05.jpg"
                    className="flex-grow-1"
                    allowEdit={adminTheme?.editMode}
                />
                <StatCard 
                    type="visual"
                    label="Total Revenue" 
                    value={formatMoney(stats?.total_revenue || 0)} 
                    icon="fas fa-coins"
                    bgType="dashboard"
                    settingsKey="bg_card_dashboard_total_revenue"
                    image="/assets/images/bgimage06.jpg"
                    className="flex-grow-1"
                    allowEdit={adminTheme?.editMode}
                />
                <StatCard 
                    type="visual"
                    label="Active Tribes" 
                    value={stats?.active_tribes || 0} 
                    icon="fas fa-handshake"
                    bgType="dashboard"
                    settingsKey="bg_card_dashboard_active_tribes"
                    image="/assets/images/bgimage07.jpg"
                    className="flex-grow-1"
                    allowEdit={adminTheme?.editMode}
                />
            </div>

            {/* Premium Analytics Row */}
            <div className="row g-4 mb-4">
                <div className="col-lg-8">
                    <Card className="admin-card-dark border-0 p-6">
                        <Title className="text-white mb-2">Revenue Growth</Title>
                        <Text className="text-gray-400 mb-6">Monthly revenue from Paystack transactions</Text>
                        <div className="tremor-chart-white">
                            <AreaChart
                                className="h-72 mt-4"
                                data={chartData}
                                index="Month"
                                categories={["Revenue", "Previous"]}
                                colors={["cyan", "rose"]}
                                valueFormatter={(number) => `KES ${Intl.NumberFormat("us").format(number).toString()}`}
                                yAxisWidth={80}
                                showAnimation={true}
                                curveType="monotone"
                            />
                        </div>
                    </Card>
                </div>
                <div className="col-lg-4">
                    <Card className="admin-card-dark border-0 p-6 h-full">
                        <Title className="text-white mb-2">User Registrations</Title>
                        <Text className="text-gray-400 mb-6">Current signups by platform tier</Text>
                        <div className="tremor-chart-white">
                            <BarChart
                                className="h-72 mt-4"
                                data={userData}
                                index="Tier"
                                categories={["Users"]}
                                colors={["emerald"]}
                                showAnimation={true}
                                valueFormatter={(number) => Intl.NumberFormat("us").format(number).toString()}
                            />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Content Cards Grid */}
            <div className="row g-4">
                {/* Recent Users */}
                <div className="col-lg-6">
                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-user-clock"></i> Recent Registrations</h3>
                            <Link href={route('admin.users')} className="btn-admin-outline btn-admin-sm">
                                View All
                            </Link>
                        </div>
                        <div className="card-body p-0">
                            {recentUsers && recentUsers.length > 0 ? (
                                <table className="admin-table-dark">
                                    <tbody>
                                        {recentUsers.slice(0, 5).map(user => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div 
                                                            className="dash-avatar dash-avatar-md"
                                                            style={{ 
                                                                background: 'var(--admin-primary-light)',
                                                                color: 'var(--admin-primary)',
                                                            }}
                                                        >
                                                            {user.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="fw-semibold text-white">{user.name}</div>
                                                            <small className="text-white opacity-75">{user.email}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    <small className="text-white opacity-75">{user.created_at}</small>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="admin-empty-state">
                                    <i className="fas fa-users"></i>
                                    <h4>No Users Yet</h4>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="col-lg-6">
                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-receipt"></i> Recent Payments</h3>
                            <Link href={route('admin.payments')} className="btn-admin-outline btn-admin-sm">
                                View All
                            </Link>
                        </div>
                        <div className="card-body p-0">
                            {recentTransactions && recentTransactions.length > 0 ? (
                                <table className="admin-table-dark">
                                    <tbody>
                                        {recentTransactions.slice(0, 5).map(txn => (
                                            <tr key={txn.id}>
                                                <td>
                                                    <div className="fw-semibold text-white">{txn.user}</div>
                                                    <small className="text-white opacity-75">{txn.method}</small>
                                                </td>
                                                <td>
                                                    <span className={`admin-badge admin-badge-${txn.status === 'completed' ? 'green' : txn.status === 'pending' ? 'amber' : 'red'}`}>
                                                        {txn.status}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <div className="fw-bold" style={{ color: 'var(--admin-success)' }}>
                                                        {formatMoney(txn.amount)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="admin-empty-state">
                                    <i className="fas fa-credit-card"></i>
                                    <h4>No Payments Yet</h4>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="col-12">
                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
                        </div>
                        <div className="card-body">
                            <div className="d-flex flex-wrap gap-3">
                                <Link href={route('admin.content')} className="btn-admin-outline">
                                    <i className="fas fa-edit"></i> Manage Content
                                </Link>
                                <Link href={route('admin.users')} className="btn-admin-outline">
                                    <i className="fas fa-users"></i> View Users
                                </Link>
                                <Link href={route('admin.events')} className="btn-admin-outline">
                                    <i className="fas fa-calendar-plus"></i> Add Event
                                </Link>
                                <Link href={route('admin.analytics')} className="btn-admin-outline">
                                    <i className="fas fa-chart-line"></i> View Analytics
                                </Link>
                                <Link href={route('admin.bookings.index')} className="btn-admin-outline">
                                    <i className="fas fa-calendar-check"></i> Manage Bookings
                                </Link>
                                <Link href={route('admin.products.index')} className="btn-admin-outline">
                                    <i className="fas fa-box-open"></i> Manage Inventory
                                </Link>
                                <Link href={route('admin.loan-applications')} className="btn-admin-outline">
                                    <i className="fas fa-hand-holding-usd"></i> Manage Loans
                                </Link>
                                <Link href={route('admin.prizes.index')} className="btn-admin-outline">
                                    <i className="fas fa-trophy"></i> Manage Prizes
                                </Link>
                                <Link href={route('admin.settings')} className="btn-admin-outline">
                                    <i className="fas fa-cog"></i> Settings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
