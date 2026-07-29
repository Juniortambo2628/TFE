import React, { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Common/Breadcrumbs';
import '../../../css/fan/fan-pages.css';

export default function Security({ security_settings }) {
    const { flash } = usePage().props;
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const passkeyForm = useForm({
        name: '',
    });

    const enable2fa = () => {
        if (confirm('Enable Two-Factor Authentication?')) {
            router.post(route('partner.security.2fa.enable'));
        }
    };

    const disable2fa = () => {
        if (confirm('Disable Two-Factor Authentication? This reduces account security.')) {
            router.post(route('partner.security.2fa.disable'));
        }
    };

    const regenerateCodes = () => {
        if (confirm('Regenerate recovery codes? Old codes will stop working.')) {
            router.post(route('partner.security.2fa.regenerate'));
        }
    };

    const addPasskey = () => {
        passkeyForm.post(route('partner.passkeys.store'), {
            onSuccess: () => passkeyForm.reset('name'),
        });
    };

    const deletePasskey = (id, name) => {
        if (confirm(`Delete passkey "${name}"?`)) {
            router.delete(route('partner.passkeys.destroy', id));
        }
    };

    const handleDeleteAccount = () => {
        if (confirm('Permanently delete your partner account? This cannot be undone.')) {
            router.delete(route('partner.security.destroy'));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('partner.profile.update'), {
            onSuccess: () => {
                setIsEditing(false);
                reset();
            },
        });
    };

    return (
        <PartnerLayout title="Security">
            <Head title="Security - Partner" />

            {/* Hero Section */}
            <div className="partner-hero">
                <Breadcrumbs 
                    title="Security" 
                    breadcrumbs={[{ label: 'Security' }]}
                    accentColor="#d97706"
                    homeRoute="partner.dashboard"
                />
                <h1 className="dash-section-title">
                    <i className="fas fa-shield-alt accent-danger"></i>
                    Security Settings
                </h1>
                <p className="dash-text-muted dash-no-margin">
                    Manage your partner account security, 2FA, passkeys, and active sessions.
                </p>
            </div>

            {/* Success Message */}
            {flash?.success && (
                <div className="dash-flash-success">
                    <i className="fas fa-check-circle me-2"></i>
                    {flash.success}
                </div>
            )}

            <div className="dash-grid-col-2">
                {/* Change Password */}
                <div className="dash-card dash-card-body">
                    <h4 className="dash-fw-semibold dash-mb-lg">
                        <i className="fas fa-key accent-partner me-2"></i>
                        Change Password
                    </h4>
                    <form onSubmit={handleSubmit}>
                        <div className="dash-form-col">
                            <label className="dash-label">Current Password</label>
                            <input
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                className="dash-input"
                                required
                                disabled={processing}
                            />
                            {errors.current_password && <span className="accent-danger">{errors.current_password}</span>}
                        </div>

                        <div className="dash-form-col">
                            <label className="dash-label">New Password</label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="dash-input"
                                required
                                disabled={processing}
                            />
                            {errors.password && <span className="accent-danger">{errors.password}</span>}
                        </div>

                        <div className="dash-form-col">
                            <label className="dash-label">Confirm Password</label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="dash-input"
                                required
                                disabled={processing}
                            />
                        </div>

                        <button type="submit" disabled={processing} className="partner-passkey-btn-save">
                            {processing ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>

                {/* Two-Factor Authentication */}
                <div className="dash-card dash-card-body">
                    <h4 className="dash-fw-semibold dash-mb-lg">
                        <i className="fas fa-lock accent-danger me-2"></i>
                        Two-Factor Authentication
                    </h4>

                    {security_settings?.two_factor_enabled ? (
                        <div>
                            <div className="dash-flex-center gap-2 dash-mb-lg">
                                <span className="dash-badge dash-badge-success">
                                    <i className="fas fa-check me-2"></i>2FA Enabled
                                </span>
                            </div>
                            <button onClick={disable2fa} className="partner-passkey-btn-disable">
                                <i className="fas fa-times me-2"></i>Disable 2FA
                            </button>
                            <button onClick={regenerateCodes} className="partner-passkey-btn-regenerate">
                                <i className="fas fa-key me-2"></i>Regenerate Codes
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="accent-success dash-mb-md">
                                Two-Factor Authentication is currently disabled. Enable it to add an extra layer of security to your partner account.
                            </p>
                            <button onClick={enable2fa} className="partner-passkey-btn-enable">
                                <i className="fas fa-shield-alt me-2"></i>Enable 2FA
                            </button>
                        </div>
                    )}
                </div>

                {/* Passkeys */}
                <div className="dash-card dash-card-body">
                    <h4 className="dash-fw-semibold dash-mb-lg">
                        <i className="fas fa-key accent-admin me-2"></i>
                        Passkeys
                    </h4>
                    <div className="dash-flex-center gap-2 dash-mb-lg">
                        <input
                            type="text"
                            value={passkeyForm.data.name}
                            onChange={(e) => passkeyForm.setData('name', e.target.value)}
                            placeholder="Passkey name (e.g. My iPhone)"
                            className="dash-input partner-passkey-input-name"
                            disabled={passkeyForm.processing}
                        />
                        <button onClick={addPasskey} disabled={passkeyForm.processing} className="partner-passkey-btn-add">
                            <i className="fas fa-plus me-2"></i>
                            {passkeyForm.processing ? 'Adding...' : 'Add Passkey'}
                        </button>
                    </div>
                    {errors.name && <span className="accent-danger dash-mb-md">{errors.name}</span>}

                    {security_settings?.passkeys && security_settings.passkeys.length > 0 ? (
                        <div className="partner-passkey-list">
                            {security_settings.passkeys.map((passkey) => (
                                <div key={passkey.id} className="partner-passkey-item">
                                    <i className="fas fa-key accent-admin"></i>
                                    <span className="partner-passkey-name">{passkey.name || 'Unnamed Passkey'}</span>
                                    <span className="partner-passkey-date">
                                        Added {passkey.created_at}
                                    </span>
                                    <button onClick={() => deletePasskey(passkey.id, passkey.name || 'Unnamed Passkey')} className="partner-passkey-btn-delete">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="dash-text-muted dash-text-sm">No passkeys registered yet.</p>
                    )}
                </div>

                {/* Active Sessions */}
                <div className="dash-card dash-card-body">
                    <h4 className="dash-fw-semibold dash-mb-lg">
                        <i className="fas fa-desktop accent-partner me-2"></i>
                        Active Sessions
                    </h4>
                    <div className="partner-passkey-list">
                        <div className="partner-passkey-item">
                            <i className="fas fa-laptop accent-success"></i>
                            <span className="partner-passkey-name">This Device (Browser)</span>
                            <span className="partner-passkey-date">Current Session</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="dash-card dash-card-body dash-mt-xl">
                <div className="dash-flex-between dash-mb-md">
                    <div>
                        <h4 className="accent-danger">Delete Partner Account</h4>
                        <p className="dash-text-muted dash-text-sm">
                            Permanently remove your partner account and all associated data.
                        </p>
                    </div>
                    <button onClick={handleDeleteAccount} className="partner-passkey-btn-danger">
                        <i className="fas fa-trash me-2"></i>Delete Account
                    </button>
                </div>
            </div>
        </PartnerLayout>
    );
}
