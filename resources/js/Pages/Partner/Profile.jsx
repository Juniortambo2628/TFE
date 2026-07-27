import React, { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Common/Breadcrumbs';
import '../../../css/fan/dashboard.css';
import '../../../css/fan/fan-pages.css';

export default function Profile({ profile }) {
    const { flash } = usePage().props;
    const [isEditing, setIsEditing] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: profile.name || '',
        phone: profile.phone || '',
        company_name: profile.company_name || '',
        company_address: profile.company_address || '',
        avatar: profile.avatar || '',
        cover_image: profile.cover_image || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('_method', 'POST'); 
        formData.append('name', data.name);
        formData.append('phone', data.phone || '');
        formData.append('company_name', data.company_name || '');
        formData.append('company_address', data.company_address || '');
        formData.append('avatar', data.avatar || '');
        
        if (data.cover_image instanceof File) {
            formData.append('cover_image', data.cover_image);
        } else {
            formData.append('cover_image', data.cover_image || '');
        }

        post(route('partner.profile.update'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => setIsEditing(false),
        });
    };

    return (
        <PartnerLayout title="Profile">
            <Head title="Profile - Partner" />

            {/* Hero Section with Cover */}
            <div className="dash-card" style={{
                background: data.cover_image && !(data.cover_image instanceof File) 
                    ? `url(${data.cover_image})` 
                    : 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderColor: 'var(--partner-amber)',
                padding: 'var(--space-xl)',
                position: 'relative',
                minHeight: '200px',
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <Breadcrumbs 
                        title="Profile" 
                        breadcrumbs={[{ label: 'Profile' }]}
                        accentColor="#d97706"
                        homeRoute="partner.dashboard"
                    />
                    <h1 className="dash-section-title" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        <i className="fas fa-user accent-partner"></i>
                        My Profile
                    </h1>
                    <p style={{ color: '#eee', marginBottom: 0, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        Manage your partner account details and company information.
                    </p>
                </div>
                {data.cover_image && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', borderRadius: 'var(--radius-xl)' }}></div>}
            </div>

            {/* Success Message */}
            {flash?.success && (
                <div className="dash-flash-success">
                    <i className="fas fa-check-circle me-2"></i>
                    {flash.success}
                </div>
            )}

            {/* Profile Card */}
            <div className="dash-card dash-card-body">
                <div className="dash-flex-between dash-mb-xl">
                    <div className="dash-flex dash-gap-lg">
                        <div className="dash-avatar dash-avatar-xl" style={{ background: 'var(--partner-amber)', border: '3px solid var(--border-light)' }}>
                            {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.name} className="dash-avatar-img" />
                            ) : profile.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="dash-text-primary dash-no-margin">{profile.name}</h3>
                            <p className="dash-text-muted dash-no-margin dash-text-base">{profile.email}</p>
                            <span className="dash-badge dash-badge-warning" style={{ marginTop: 'var(--space-xs)' }}>
                                Travel Partner
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`dash-btn ${isEditing ? 'dash-btn-danger' : 'dash-btn-outline accent-partner'}`}
                    >
                        <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'} me-2`}></i>
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="dash-form-grid">
                        {/* Name */}
                        <div>
                            <label className="dash-label">Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="dash-input"
                                    disabled={processing}
                                />
                            ) : (
                                <div className="dash-field-value">{profile.name}</div>
                            )}
                            {errors.name && <span className="accent-danger dash-error-text">{errors.name}</span>}
                        </div>

                        {/* Email (readonly) */}
                        <div>
                            <label className="dash-label">Email Address</label>
                            <div className="dash-field-value-muted">{profile.email}</div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="dash-label">Phone Number</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="dash-input"
                                    placeholder="+254 700 000 000"
                                    disabled={processing}
                                />
                            ) : (
                                <div className="dash-field-value">{profile.phone || 'Not set'}</div>
                            )}
                            {errors.phone && <span className="accent-danger dash-error-text">{errors.phone}</span>}
                        </div>

                        {/* Company Name */}
                        <div>
                            <label className="dash-label">Company Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    className="dash-input"
                                    placeholder="Your travel company name"
                                    disabled={processing}
                                />
                            ) : (
                                <div className="dash-field-value">{profile.company_name || 'Not set'}</div>
                            )}
                            {errors.company_name && <span className="accent-danger dash-error-text">{errors.company_name}</span>}
                        </div>

                        {/* Company Address (full width) */}
                        <div className="dash-col-full">
                            <label className="dash-label">Company Address</label>
                            {isEditing ? (
                                <textarea
                                    value={data.company_address}
                                    onChange={(e) => setData('company_address', e.target.value)}
                                    className="dash-textarea dash-min-h-80"
                                    placeholder="Enter your company address"
                                    disabled={processing}
                                />
                            ) : (
                                <div className="dash-field-value">{profile.company_address || 'Not set'}</div>
                            )}
                            {errors.company_address && <span className="accent-danger dash-error-text">{errors.company_address}</span>}
                        </div>

                        {/* Avatar & Cover (Editing only) */}
                        {isEditing && (
                            <>
                                <div className="dash-section-divider">
                                    <h4 className="dash-section-heading">Branding & Appearance</h4>
                                </div>
                                <div className="dash-col-full">
                                    <label className="dash-label">Avatar URL</label>
                                    <input
                                        type="text"
                                        value={data.avatar}
                                        onChange={(e) => setData('avatar', e.target.value)}
                                        className="dash-input"
                                        placeholder="https://example.com/avatar.png"
                                    />
                                </div>
                                <div className="dash-col-full">
                                    <label className="dash-label">Cover Image</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setData('cover_image', e.target.files[0])}
                                        className="dash-input"
                                        accept="image/*"
                                    />
                                    <p className="dash-helper-text">Recommended size: 1200x400px</p>
                                </div>
                            </>
                        )}
                    </div>

                    {isEditing && (
                        <div className="dash-submit-row">
                            <button
                                type="submit"
                                disabled={processing}
                                className="dash-btn dash-btn-primary"
                                style={{
                                    padding: 'var(--space-md) var(--space-2xl)',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 'var(--opacity-disabled)' : 1,
                                }}
                            >
                                {processing ? (
                                    <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</>
                                ) : (
                                    <><i className="fas fa-save me-2"></i>Save Changes</>
                                )}
                            </button>
                        </div>
                    )}
                </form>

                {/* Account Info */}
                <div className="dash-top-divider">
                    <h4 className="dash-text-muted dash-text-base dash-mb-lg">Account Information</h4>
                    <div className="dash-flex dash-gap-xl dash-flex-wrap">
                        <div>
                            <span className="dash-info-label">Member since</span>
                            <p className="dash-info-value">{profile.created_at}</p>
                        </div>
                        <div>
                            <span className="dash-info-label">Account Type</span>
                            <p className="accent-partner dash-info-value">Travel Partner</p>
                        </div>
                    </div>
                </div>
            </div>
        </PartnerLayout>
    );
}
