import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminHero from '@/Components/Admin/AdminHero';
import StatCard from '@/Components/Common/StatCard';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

export default function Analytics({ 
    calculatorUsage, 
    savedItineraries, 
    quoteStats, 
    priceModifications, 
    totalPriceDifference,
    stats 
}) {
    const formatMoney = (amount) => 'KES ' + new Intl.NumberFormat().format(amount || 0);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Analytics' }
    ];

    const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];
    
    const pieData = [
        { name: 'Approved', value: quoteStats.approved },
        { name: 'Modified', value: quoteStats.modified },
        { name: 'Pending', value: quoteStats.pending },
    ];

    return (
        <AdminLayout title="Advanced Analytics">
            <AdminHero 
                title="Advanced Analytics"
                subtitle="Tracking system performance and partner engagement."
                breadcrumbs={breadcrumbs}
            />

            {/* Dashboard Stats */}
            <div className="admin-visual-cards mb-4" style={{ overflow: 'visible', flexWrap: 'wrap' }}>
                <StatCard 
                    type="visual"
                    label="Calculator Uses" 
                    value={stats.total_calc_uses} 
                    icon="fas fa-calculator"
                    bgType="analytics"
                    settingsKey="bg_card_analytics_calc_uses"
                    image="/assets/images/bgimage01.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Market Potential Avg" 
                    value={formatMoney(stats.avg_calc_cost)} 
                    icon="fas fa-search-dollar"
                    bgType="analytics"
                    settingsKey="bg_card_analytics_avg_potential"
                    image="/assets/images/bgimage02.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Itineraries Saved" 
                    value={stats.total_saved} 
                    icon="fas fa-save"
                    bgType="analytics"
                    settingsKey="bg_card_analytics_saved_itins"
                    image="/assets/images/bgimage03.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Actual Conversion Avg" 
                    value={formatMoney(stats.avg_itinerary_cost)} 
                    icon="fas fa-chart-line"
                    bgType="analytics"
                    settingsKey="bg_card_analytics_avg_conversion"
                    image="/assets/images/bgimage04.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Quote Value Variance" 
                    value={formatMoney(totalPriceDifference)} 
                    icon="fas fa-hand-holding-usd"
                    bgType="analytics"
                    settingsKey="bg_card_analytics_variance"
                    image="/assets/images/bgimage08.jpg"
                    className="flex-grow-1"
                />
            </div>

            <div className="row g-4">
                {/* Usage Comparison Chart */}
                <div className="col-lg-8">
                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-chart-area"></i> Activity Trends (Last 30 Days)</h3>
                        </div>
                        <div className="card-body" style={{ minHeight: '350px' }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={calculatorUsage && calculatorUsage.length ? calculatorUsage : [{date: 'No Data', count: 0}]}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                                    <XAxis dataKey="date" stroke="#eee" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#eee" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="count" name="Calculator Uses" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Quote Status Distribution */}
                <div className="col-lg-4">
                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-chart-pie"></i> Quote Status</h3>
                        </div>
                        <div className="card-body" style={{ minHeight: '350px' }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Price Modifications Table */}
                <div className="col-lg-12">
                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-exchange-alt"></i> Recent Quote Adjustments</h3>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="admin-table-dark">
                                    <thead>
                                        <tr>
                                            <th>Itinerary Name</th>
                                            <th>Original Estimate</th>
                                            <th>Partner Quote</th>
                                            <th>Price Diff</th>
                                            <th>% Change</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {priceModifications.map((mod, idx) => {
                                            const diff = mod.partner_cost - mod.total_cost;
                                            const percent = (diff / mod.total_cost) * 100;
                                            return (
                                                <tr key={idx}>
                                                    <td>{mod.name}</td>
                                                    <td>{formatMoney(mod.total_cost)}</td>
                                                    <td>{formatMoney(mod.partner_cost)}</td>
                                                    <td className={diff > 0 ? 'text-danger' : 'text-success'}>
                                                        {diff > 0 ? '+' : ''}{formatMoney(diff)}
                                                    </td>
                                                    <td>
                                                        <span className={`admin-badge ${diff > 0 ? 'admin-badge-red' : 'admin-badge-green'}`}>
                                                            {diff > 0 ? '+' : ''}{percent.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
