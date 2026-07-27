import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminHero from '@/Components/Admin/AdminHero';
import { useForm, usePage } from '@inertiajs/react';

export default function Profile({ auth, status }) {
    const { user } = auth;
    
    const { data: profileData, setData: setProfileData, put: putProfile, processing: profileProcessing, errors: profileErrors } = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
    });

    const { data: passwordData, setData: setPasswordData, put: putPassword, processing: passwordProcessing, errors: passwordErrors, reset: resetPassword } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        putProfile(route('admin.profile.update'), {
            preserveScroll: true
        });
    };

    const handlePasswordUpdate = (e) => {
        e.preventDefault();
        putPassword(route('admin.profile.password'), {
            preserveScroll: true,
            onSuccess: () => resetPassword(),
        });
    };

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Profile Settings' }
    ];

    return (
        <AdminLayout title="Profile Settings">
            <AdminHero 
                title="Account Settings" 
                subtitle="Manage your personal information and account security."
                breadcrumbs={breadcrumbs}
            />

            <div className="row g-4">
                {/* Profile Info */}
                <div className="col-lg-6">
                    <div className="admin-card-dark h-100">
                        <div className="card-header">
                            <h3><i className="fas fa-user-circle me-2"></i> Personal Information</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleProfileUpdate}>
                                <div className="admin-form-group">
                                    <label className="form-label">Full Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={profileData.name} 
                                        onChange={e => setProfileData('name', e.target.value)} 
                                        required 
                                    />
                                    {profileErrors.name && <div className="text-danger small mt-1">{profileErrors.name}</div>}
                                </div>

                                <div className="admin-form-group">
                                    <label className="form-label">Email Address</label>
                                    <input 
                                        type="email" 
                                        className="form-control" 
                                        value={profileData.email} 
                                        onChange={e => setProfileData('email', e.target.value)} 
                                        required 
                                    />
                                    {profileErrors.email && <div className="text-danger small mt-1">{profileErrors.email}</div>}
                                </div>

                                <div className="admin-form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={profileData.phone} 
                                        onChange={e => setProfileData('phone', e.target.value)} 
                                    />
                                    {profileErrors.phone && <div className="text-danger small mt-1">{profileErrors.phone}</div>}
                                </div>

                                <div className="mt-4">
                                    <button type="submit" className="btn-admin" disabled={profileProcessing}>
                                        <i className="fas fa-save me-2"></i> Save Profile
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Password Change */}
                <div className="col-lg-6">
                    <div className="admin-card-dark h-100">
                        <div className="card-header">
                            <h3><i className="fas fa-shield-alt me-2"></i> Change Password</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handlePasswordUpdate}>
                                <div className="admin-form-group">
                                    <label className="form-label">Current Password</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        value={passwordData.current_password} 
                                        onChange={e => setPasswordData('current_password', e.target.value)} 
                                        required 
                                    />
                                    {passwordErrors.current_password && <div className="text-danger small mt-1">{passwordErrors.current_password}</div>}
                                </div>

                                <div className="admin-form-group">
                                    <label className="form-label">New Password</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        value={passwordData.password} 
                                        onChange={e => setPasswordData('password', e.target.value)} 
                                        required 
                                    />
                                    {passwordErrors.password && <div className="text-danger small mt-1">{passwordErrors.password}</div>}
                                </div>

                                <div className="admin-form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        value={passwordData.password_confirmation} 
                                        onChange={e => setPasswordData('password_confirmation', e.target.value)} 
                                        required 
                                    />
                                </div>

                                <div className="mt-4">
                                    <button type="submit" className="btn-admin" disabled={passwordProcessing}>
                                        <i className="fas fa-key me-2"></i> Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
