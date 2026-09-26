import React from 'react';
import { Head } from '@inertiajs/react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney } from '@/lib/utils';
import '../../../css/tickets.css';

const AT = (s) => new Date(s).toLocaleString();

export default function TicketSales({ auth, sales = [] }) {
    return (
        <PartnerLayout user={auth.user}>
            <Head title="Ticket sales" />
            <DashboardHero
                role="partner"
                title="Ticket sales"
                subtitle="Every confirmed order, with buyer and reference."
                breadcrumbs={[
                    { label: 'Dashboard', href: route('partner.dashboard') },
                    { label: 'Tickets', href: route('partner.tickets.index') },
                    { label: 'Sales' },
                ]}
            />

            <div className="tfe-slab">
                <div className="tfe-slab__body tfe-slab__body--flush">
                    <div className="table-responsive">
                        <table className="tfe-table tfe-table--compact">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Fan</th>
                                    <th>Fixture</th>
                                    <th>Venue</th>
                                    <th>Qty</th>
                                    <th>Total</th>
                                    <th>Paid with</th>
                                    <th>Status</th>
                                    <th>Placed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.length === 0 ? (
                                    <tr><td colSpan="9">
                                        <div className="tfe-empty tfe-empty--inline">
                                            <div className="tfe-empty__icon"><i className="fas fa-cash-register"></i></div>
                                            <h3 className="tfe-empty__title">No orders yet</h3>
                                        </div>
                                    </td></tr>
                                ) : sales.map((s) => (
                                    <tr key={s.id}>
                                        <td><code>{s.reference}</code></td>
                                        <td>{s.user?.name || '—'}<div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{s.user?.email}</div></td>
                                        <td>{s.match}</td>
                                        <td>{s.venue}</td>
                                        <td>{s.quantity}</td>
                                        <td>{formatMoney(s.total, s.currency)}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{(s.paid_with || 'card').replace('_', ' ')}</td>
                                        <td><span className="tfe-pill tfe-pill--approved">{s.status}</span></td>
                                        <td style={{ fontSize: '0.75rem' }}>{AT(s.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PartnerLayout>
    );
}
