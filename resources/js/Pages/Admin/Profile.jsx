import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import DashboardHero from '@/Components/Common/DashboardHero';
import SplitEditorLayout from '@/Components/Common/SplitEditorLayout';
import IdentityPreview from '@/Components/Common/IdentityPreview';
import ImageUpload from '@/Components/Common/ImageUpload';

/**
 * Admin profile — Sprint 56.
 *
 * The page was already on SplitEditorLayout, but it was the last account
 * surface still wearing its own chrome (`admin-card-dark`, `card-header`,
 * `admin-form-group`, `btn-admin`, `text-danger small`) instead of the shared
 * primitives every other form on the platform uses. Three things were also
 * wrong underneath:
 *
 *  - **Phone Number went nowhere.** There is no `users.phone` column and the
 *    controller never validated or saved it, so an admin could type a number,
 *    save, and find it blank — the same silent discard as the fan's Bio.
 *    Nothing on the platform reads a user phone number, so the field is gone
 *    rather than given a column.
 *  - **Change Password was a second password surface.** Sprint 53 moved
 *    password, 2FA, passkeys and login history onto one shared
 *    AccountSecurity page, which the admin has at /admin/security. This page
 *    links there now, exactly as the fan profile does.
 *  - **There was no way to set an avatar**, though `users.avatar` has always
 *    existed and both other roles could.
 *
 * Plus the fan/partner treatment: avatar first, one sticky save bar at the
 * end that says whether there is anything to save.
 */
export default function Profile({ profile }) {
    const form = useForm({
        _method: 'put',
        name: profile.name || '',
        email: profile.email || '',
        avatar: profile.avatar || '',
        avatar_file: null,
    });
    const { data, setData, processing, errors, isDirty } = form;

    const submit = (e) => {
        e.preventDefault();
        form.post(route('admin.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Profile updated.'),
        });
    };

    const emailChanged = data.email.trim().toLowerCase() !== (profile.email || '').toLowerCase();

    const preview = (
        <>
            <IdentityPreview
                name={data.name}
                sub={data.email}
                avatar={data.avatar || undefined}
                badge="System Admin"
                rows={[
                    { icon: 'fas fa-envelope', value: data.email },
                    { icon: 'fas fa-calendar-alt', value: `Admin since ${profile.created_at}` },
                ]}
            />

            <div className="tfe-slab">
                <div className="tfe-slab__body">
                    <div className="tfe-security-stat">
                        <span>Email</span>
                        <span className={`tfe-pill ${profile.email_verified ? 'tfe-pill--approved' : 'tfe-pill--pending'}`}>
                            {profile.email_verified ? 'Verified' : 'Unverified'}
                        </span>
                    </div>
                    <div className="tfe-security-stat">
                        <span>Role</span>
                        <strong>System Admin</strong>
                    </div>
                </div>
                <div className="tfe-slab__body pt-0">
                    <Link href={route('admin.security')} className="tfe-btn tfe-btn--sm w-100 justify-content-center">
                        <i className="fas fa-shield-alt" /> Security settings
                    </Link>
                </div>
            </div>
        </>
    );

    return (
        <AdminLayout title="Profile Settings">
            <DashboardHero
                role="admin"
                title="Account Settings"
                subtitle="Manage your personal information and account security."
                breadcrumbs={[
                    { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
                    { label: 'Profile Settings' },
                ]}
            />

            <SplitEditorLayout previewTitle="Live preview" preview={preview}>
                <form onSubmit={submit} className="tfe-editor-stack">
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">
                                <i className="fas fa-user-circle me-2" aria-hidden="true" /> Personal information
                            </h3>
                            <span className="tfe-slab__title-sub">Admin since {profile.created_at}</span>
                        </div>
                        <div className="tfe-slab__body">
                            <div className="tfe-form-field">
                                <label className="tfe-form-label">Profile picture</label>
                                <ImageUpload
                                    variant="avatar"
                                    label="Choose image"
                                    value={data.avatar}
                                    onFile={(f) => setData('avatar_file', f)}
                                    onClear={() => { setData('avatar', ''); setData('avatar_file', null); }}
                                    gallery
                                    onPick={(url) => { setData('avatar', url); setData('avatar_file', null); }}
                                />
                                {errors.avatar_file && <div className="tfe-form-error">{errors.avatar_file}</div>}
                            </div>

                            <div className="tfe-form-grid tfe-form-grid--2">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="admin-name">Full name</label>
                                    <input
                                        id="admin-name"
                                        type="text"
                                        className="tfe-input"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <div className="tfe-form-error">{errors.name}</div>}
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="admin-email">Email address</label>
                                    <input
                                        id="admin-email"
                                        type="email"
                                        className="tfe-input"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                    {errors.email && <div className="tfe-form-error">{errors.email}</div>}
                                    {emailChanged && (
                                        <p className="tfe-form-help">
                                            Saving a new address marks it unverified — you will need to confirm it
                                            again.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* One security surface for all three roles (Sprint 53),
                        so this page points at it instead of carrying its own
                        password form. */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">
                                <i className="fas fa-shield-alt me-2" aria-hidden="true" /> Security
                            </h3>
                        </div>
                        <div className="tfe-slab__body">
                            <div className="tfe-setting-row">
                                <div>
                                    <h4>Password, 2FA and passkeys</h4>
                                    <p>Change your password, manage two-factor sign-in and review login history.</p>
                                </div>
                                <Link href={route('admin.security')} className="tfe-btn tfe-btn--sm">
                                    Open security
                                </Link>
                            </div>
                        </div>
                    </section>

                    <div className="tfe-form-actions tfe-form-actions--sticky">
                        <p className="tfe-form-actions__note">
                            {isDirty ? 'You have unsaved changes.' : 'Everything is saved.'}
                        </p>
                        <button type="submit" className="tfe-btn tfe-btn--filled" disabled={processing || !isDirty}>
                            {processing ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </SplitEditorLayout>
        </AdminLayout>
    );
}
