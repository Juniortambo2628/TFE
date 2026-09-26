import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import { AreaChart } from '@tremor/react';

/**
 * Reach analytics. TFE tracks connections, not transactions —
 * every metric on this page reflects "fans reached", "partners connected"
 * or "referrals sent". Money moves on the partner platforms.
 */
export default function Analytics({ signups30d = [], referrals = {}, stats = {} }) {
    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Analytics' },
    ];

    const chartData = (signups30d.length ? signups30d : Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
        count: 0,
    })));

    return (
        <AdminLayout title="Reach analytics">
            <DashboardHero
                role="admin"
                title="Reach analytics"
                subtitle="Fans on the platform, partners we've connected them to, and every referral we've sent."
                breadcrumbs={breadcrumbs}
            />

            <SummaryTiles
                className="mb-4"
                items={[
                    { label: 'Fans', value: stats.total_fans ?? 0, icon: 'fa-users', accent: 'blue', subtext: `${stats.new_fans_30d ?? 0} joined this month` },
                    { label: 'Verified partners', value: stats.active_partners ?? 0, icon: 'fa-handshake', accent: 'teal', subtext: 'Live on the directory' },
                    { label: 'Live listings', value: stats.active_listings ?? 0, icon: 'fa-tags', accent: 'amber', subtext: 'Across all tournaments' },
                    { label: 'Referrals sent', value: stats.total_referrals ?? 0, icon: 'fa-share', accent: 'red', subtext: 'Tickets + loans + budget briefs' },
                ]}
            />

            <div className="admin-card-dark admin-overview mb-4">
                <div className="admin-overview__head">
                    <div>
                        <h3 className="admin-overview__title">New fans · last 30 days</h3>
                        <p className="admin-overview__sub">Daily sign-ups to the platform.</p>
                    </div>
                </div>
                <div className="tremor-chart-white">
                    <AreaChart
                        className="h-64 mt-2"
                        data={chartData}
                        index="date"
                        categories={['count']}
                        colors={['cyan']}
                        yAxisWidth={40}
                        showAnimation
                        curveType="monotone"
                        showLegend={false}
                    />
                </div>
            </div>

            <div className="row g-4">
                <ReferralCard title="Ticket referrals" icon="fa-ticket-alt" rows={referrals.ticket_purchases || []} />
                <ReferralCard title="Loan referrals" icon="fa-hand-holding-usd" rows={referrals.loan_referrals || []} />
                <ReferralCard title="Budget briefs" icon="fa-suitcase" rows={referrals.budget_referrals || []} />
            </div>
        </AdminLayout>
    );
}

function ReferralCard({ title, icon, rows }) {
    return (
        <div className="col-lg-4">
            <div className="admin-card-dark h-100">
                <div className="card-header">
                    <h3><i className={`fas ${icon}`}></i> {title}</h3>
                </div>
                <div className="card-body p-0">
                    {rows.length === 0 ? (
                        <div className="admin-empty-state">
                            <i className={`fas ${icon}`}></i>
                            <h4>No referrals yet</h4>
                        </div>
                    ) : (
                        <table className="admin-table-dark">
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i}>
                                        <td className="text-white fw-semibold">{r.partner}</td>
                                        <td className="text-end text-white">{Number(r.referrals).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
