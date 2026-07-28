import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminHero from '@/Components/Admin/AdminHero';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/utils';

export default function BookingDetail({ auth, booking }) {
    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Bookings', href: route('admin.bookings.index') },
        { label: `Booking #${booking.id}` },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'admin-badge-blue';
            case 'pending': return 'admin-badge-gray';
            case 'cancelled': return 'admin-badge-red';
            case 'completed': return 'admin-badge-green';
            default: return 'admin-badge-gray';
        }
    };

    const handleStatusUpdate = (status) => {
        router.put(route('admin.bookings.update', booking.id), { status }, {
            onSuccess: () => toast.success(`Booking marked as ${status}`),
        });
    };

    return (
        <AdminLayout title={`Booking #${booking.id}`}>
            <Head title={`Booking #${booking.id}`} />
            <AdminHero
                title="Booking Details"
                subtitle={`Viewing booking for ${booking.user_name}`}
                breadcrumbs={breadcrumbs}
            />

            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="admin-card-dark p-3 text-center">
                        <i className="fas fa-user fa-2x mb-2" style={{ color: 'var(--admin-accent, #DC143C)' }}></i>
                        <div className="text-white-50 small mb-1">Customer</div>
                        <div className="text-white fw-bold">{booking.user_name}</div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="admin-card-dark p-3 text-center">
                        <i className="fas fa-box fa-2x mb-2" style={{ color: 'var(--admin-accent, #DC143C)' }}></i>
                        <div className="text-white-50 small mb-1">Package</div>
                        <div className="text-white fw-bold">{booking.package_name || 'N/A'}</div>
                        <div className="text-white-50 small text-uppercase">{booking.package_type || ''}</div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="admin-card-dark p-3 text-center">
                        <i className="fas fa-coins fa-2x mb-2" style={{ color: 'var(--admin-accent, #DC143C)' }}></i>
                        <div className="text-white-50 small mb-1">Total Amount</div>
                        <div className="text-white fw-bold">{formatMoney(booking.total_amount)}</div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="admin-card-dark p-3 text-center">
                        <i className="fas fa-check-circle fa-2x mb-2" style={{ color: '#10b981' }}></i>
                        <div className="text-white-50 small mb-1">Amount Paid</div>
                        <div className="text-green-400 fw-bold">{formatMoney(booking.amount_paid)}</div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-info-circle me-2"></i> Booking Information</h3>
                        </div>
                        <div className="card-body">
                            <table className="admin-table-dark">
                                <tbody>
                                    <tr>
                                        <td className="text-white-50" style={{ width: '200px' }}>Booking ID</td>
                                        <td className="text-white">#{booking.id}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-white-50">Customer</td>
                                        <td className="text-white">{booking.user_name}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-white-50">Package</td>
                                        <td className="text-white">{booking.package_name || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-white-50">Type</td>
                                        <td className="text-white text-uppercase">{booking.package_type || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-white-50">Booking Date</td>
                                        <td className="text-white">{booking.booking_date || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-white-50">Created</td>
                                        <td className="text-white">{booking.created_at}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-white-50">Status</td>
                                        <td>
                                            <span className={`admin-badge ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-white-50">Balance Due</td>
                                        <td className={booking.total_amount - booking.amount_paid > 0 ? 'text-yellow-400 fw-bold' : 'text-green-400 fw-bold'}>
                                            {formatMoney(booking.total_amount - booking.amount_paid)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-cog me-2"></i> Actions</h3>
                        </div>
                        <div className="card-body d-flex flex-column gap-2">
                            <button className="btn btn-sm btn-outline-success" onClick={() => handleStatusUpdate('confirmed')}>
                                <i className="fas fa-check me-1"></i> Mark Confirmed
                            </button>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleStatusUpdate('completed')}>
                                <i className="fas fa-flag-checkered me-1"></i> Mark Completed
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleStatusUpdate('cancelled')}>
                                <i className="fas fa-times me-1"></i> Cancel Booking
                            </button>
                            <hr className="border-secondary my-2" />
                            <Link href={route('admin.bookings.index')} className="btn btn-sm btn-outline-light">
                                <i className="fas fa-arrow-left me-1"></i> Back to Bookings
                            </Link>
                        </div>
                    </div>

                    {booking.payment_schedules && booking.payment_schedules.length > 0 && (
                        <div className="admin-card-dark mt-4">
                            <div className="card-header">
                                <h3><i className="fas fa-calendar me-2"></i> Payment Schedule</h3>
                            </div>
                            <div className="card-body">
                                <table className="admin-table-dark">
                                    <thead>
                                        <tr>
                                            <th>Due Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {booking.payment_schedules.map(schedule => (
                                            <tr key={schedule.id}>
                                                <td className="text-white">{schedule.due_date}</td>
                                                <td className="text-white">{formatMoney(schedule.amount)}</td>
                                                <td>
                                                    <span className={`admin-badge ${schedule.status === 'paid' ? 'admin-badge-green' : 'admin-badge-gray'}`}>
                                                        {schedule.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
