import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminHero from '@/Components/Admin/AdminHero';
import StatCard from '@/Components/Common/StatCard';
import { Head, router, useForm } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { toast } from 'sonner';

export default function Bookings({ auth, bookings, stats }) {
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [updatingBooking, setUpdatingBooking] = useState(null);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Bookings' }
    ];

    const handleDelete = () => {
        if (bookingToDelete) {
            router.delete(route('admin.bookings.destroy', bookingToDelete), {
                onSuccess: () => {
                    toast.success('Booking deleted');
                    setBookingToDelete(null);
                }
            });
        }
    };

    const handleStatusUpdate = (id, status) => {
        router.put(route('admin.bookings.update', id), { status }, {
            onSuccess: () => {
                toast.success(`Booking marked as ${status}`);
                setUpdatingBooking(null);
            }
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'admin-badge-blue';
            case 'pending': return 'admin-badge-gray';
            case 'cancelled': return 'admin-badge-red';
            case 'completed': return 'admin-badge-green';
            default: return 'admin-badge-gray';
        }
    };

    return (
        <AdminLayout title="Bookings Management">
            <Head title="Bookings" />
            <AdminHero 
                title="Bookings Management"
                subtitle="Review and manage tournament travel bookings."
                breadcrumbs={breadcrumbs}
            />

            <div className="admin-visual-cards mb-4">
                <StatCard 
                    type="visual"
                    label="Total Bookings" 
                    value={stats.total} 
                    icon="fas fa-calendar-check"
                    bgType="events"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Pending Review" 
                    value={stats.pending} 
                    icon="fas fa-clock"
                    bgType="dashboard"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Total Revenue" 
                    value={`KES ${new Intl.NumberFormat().format(stats.total_revenue)}`} 
                    icon="fas fa-coins"
                    bgType="payments"
                    className="flex-grow-1"
                />
            </div>

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-list me-2"></i> Booking List</h3>
                    <span className="admin-badge admin-badge-gray">{bookings.data.length} items</span>
                </div>
                
                <div className="card-body">
                    <table className="admin-table-dark">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Package</th>
                                <th>Amount</th>
                                <th>Paid</th>
                                <th>Status</th>
                                <th style={{ width: '150px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.data.length > 0 ? (
                                bookings.data.map(booking => (
                                    <tr key={booking.id}>
                                        <td>
                                            <div className="text-white fw-medium">{booking.user_name}</div>
                                            <div className="text-xs text-medium-contrast">Booked {booking.created_at}</div>
                                        </td>
                                        <td>
                                            <div className="text-white">{booking.package_name}</div>
                                            <div className="text-xs text-medium-contrast uppercase">{booking.package_type}</div>
                                        </td>
                                        <td className="text-white">KES {new Intl.NumberFormat().format(booking.total_amount)}</td>
                                        <td className="text-green-400 fw-semibold">KES {new Intl.NumberFormat().format(booking.amount_paid)}</td>
                                        <td>
                                            <span className={`admin-badge ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <select 
                                                    className="form-select form-select-sm bg-dark text-white border-secondary"
                                                    style={{ fontSize: '0.75rem', width: 'auto' }}
                                                    value={booking.status}
                                                    onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirm</option>
                                                    <option value="completed">Complete</option>
                                                    <option value="cancelled">Cancel</option>
                                                </select>
                                                <button className="btn-admin-icon" title="Delete" onClick={() => setBookingToDelete(booking.id)}>
                                                    <i className="fas fa-trash text-danger"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-5">
                                        <div className="admin-empty-state">
                                            <i className="fas fa-calendar-times opacity-20 fa-3x mb-3"></i>
                                            <h4>No bookings found</h4>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationDialog
                open={!!bookingToDelete}
                onOpenChange={(open) => !open && setBookingToDelete(null)}
                title="Delete Booking?"
                description="Are you sure you want to remove this booking record? This cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
