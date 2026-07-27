import React, { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import { startRegistration } from '@simplewebauthn/browser';
import Breadcrumbs from '@/Components/Common/Breadcrumbs';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import StatusDialog from '@/Components/Common/StatusDialog';
import DataTable from '@/Components/DataTable';
import '../../../css/fan/dashboard.css';
import '../../../css/fan/fan-pages.css';

export default function Security({ security_settings = {}, loginHistory = [], passkeys = [], stats = {} }) {
    const { flash } = usePage().props;
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [twoFactorSetup, setTwoFactorSetup] = useState(null);
    const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [passkeyToDelete, setPasskeyToDelete] = useState(null);

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const twoFactorForm = useForm({
        code: '',
        secret: '',
    });

    const handlePasswordChange = (e) => {
        e.preventDefault();
        passwordForm.post(route('partner.security.password'), {
            onSuccess: () => {
                setShowPasswordModal(false);
                passwordForm.reset();
            },
        });
    };

    const toggle2FA = () => {
        router.post(route('partner.security.two-factor'), {}, {
            onSuccess: (page) => {
                if (page.props.flash?.two_factor_setup) {
                    setTwoFactorSetup(page.props.flash.two_factor_setup);
                    setShow2FAModal(true);
                }
            },
        });
    };

    const confirm2FA = (e) => {
        e.preventDefault();
        twoFactorForm.post(route('partner.security.two-factor.confirm'), {
            onSuccess: () => {
                setShow2FAModal(false);
                setTwoFactorSetup(null);
                twoFactorForm.reset();
                setSuccessMessage('Two-factor authentication enabled successfully!');
            },
        });
    };

    const registerPasskey = async () => {
        setIsRegisteringPasskey(true);
        try {
            const optionsResponse = await axios.get(route('webauthn.register.options'));
            const attestation = await startRegistration({ optionsJSON: optionsResponse.data });

            router.post(route('webauthn.register'), attestation, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsRegisteringPasskey(false);
                    setSuccessMessage('Passkey registered successfully! You can now use it to sign in.');
                },
                onError: (err) => {
                    setIsRegisteringPasskey(false);
                    setErrorMessage('Registration failed. Your device might not support Passkeys or it was cancelled.');
                }
            });
        } catch (error) {
            console.error('Passkey creation error details:', error);
            setIsRegisteringPasskey(false);
            
            let message = error.response?.data?.message || error.message || 'Unknown error';
            
            if (error.name === 'SecurityError') {
                message = "WebAuthn (Passkeys) requires a secure domain (like localhost or a real domain). IP addresses (like 127.0.0.1) are NOT allowed.";
            }

            const errorName = error.name ? `[${error.name}] ` : '';
            setErrorMessage(`Could not start Passkey registration: ${errorName}${message}. Ensure you are on a secure connection (HTTPS).`);
        }
    };

    const deletePasskey = () => {
        if (passkeyToDelete) {
            router.delete(route('webauthn.register.destroy', passkeyToDelete), {
                preserveScroll: true,
                onSuccess: () => {
                    setPasskeyToDelete(null);
                    setSuccessMessage('Passkey removed successfully');
                }
            });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const loginHistoryColumns = [
        {
            accessorKey: "device",
            header: "Device",
            cell: ({ row }) => <span className="dash-text-primary">{row.original.device}</span>,
        },
        {
            accessorKey: "ip_address",
            header: "IP Address",
            cell: ({ row }) => <span className="dash-text-muted">{row.original.ip_address}</span>,
        },
        {
            accessorKey: "successful",
            header: "Status",
            cell: ({ row }) => (
                <span className={`dash-badge ${row.original.successful ? 'dash-badge-success' : 'dash-badge-danger'}`}>
                    {row.original.successful ? 'Success' : 'Failed'}
                </span>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Time",
            cell: ({ row }) => <span className="dash-text-muted">{row.original.created_at}</span>,
        },
    ];

    return (
        <PartnerLayout title="Security">
            <Head title="Security - Partner" />

            {/* Hero Section */}
            <div className="dash-card dash-card-body" style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                borderColor: 'var(--partner-amber)',
            }}>
                <Breadcrumbs 
                    title="Security" 
                    breadcrumbs={[{ label: 'Security' }]}
                    accentColor="#d97706"
                    homeRoute="partner.dashboard"
                />
                <h1 className="dash-section-title">
                    <i className="fas fa-shield-alt accent-partner"></i>
                    Security Settings
                </h1>
                <p className="dash-text-muted dash-no-margin">
                    Manage your password, two-factor authentication, and security preferences.
                </p>
            </div>

            {/* Success Message */}
            {flash?.success && (
                <div className="dash-flash-success">
                    <i className="fas fa-check-circle me-2"></i>
                    {flash.success}
                </div>
            )}

            {/* Security Stats */}
            <div className="dash-stat-grid dash-mb-lg">
                <div className="dash-stat-card">
                    <i className="fas fa-sign-in-alt accent-partner dash-stat-icon"></i>
                    <div className="dash-stat-value">{stats.login_count || 0}</div>
                    <div className="dash-stat-label">Total Logins</div>
                </div>
                <div className="dash-stat-card">
                    <i className="fas fa-exclamation-triangle accent-danger dash-stat-icon"></i>
                    <div className="dash-stat-value">{stats.failed_logins || 0}</div>
                    <div className="dash-stat-label">Failed Attempts</div>
                </div>
                <div className="dash-stat-card">
                    <i className="fas fa-key accent-success dash-stat-icon"></i>
                    <div className="dash-stat-value">{stats.days_since_password_change || 0}</div>
                    <div className="dash-stat-label">Days Since Password Change</div>
                </div>
            </div>

            {/* Password Section */}
            <div className="dash-card dash-card-body">
                <div className="dash-flex-between">
                    <div>
                        <h3 className="dash-text-primary dash-no-margin">
                            <i className="fas fa-lock me-2 accent-partner"></i>
                            Password
                        </h3>
                        <p className="dash-text-muted dash-text-base dash-section-subtitle">
                            Last changed: {security_settings.last_password_change || 'Never'}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="dash-btn dash-btn-outline accent-partner"
                    >
                        Change Password
                    </button>
                </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="dash-card dash-card-body">
                <div className="dash-flex-between">
                    <div>
                        <h3 className="dash-text-primary dash-no-margin">
                            <i className="fas fa-mobile-alt me-2 accent-partner"></i>
                            Two-Factor Authentication
                        </h3>
                        <p className="dash-text-muted dash-text-base dash-section-subtitle">
                            {security_settings.two_factor_enabled 
                                ? 'Enabled - Your account has an extra layer of security.' 
                                : 'Add an extra layer of security to your account.'}
                        </p>
                    </div>
                    <button
                        onClick={toggle2FA}
                        className={`dash-btn ${security_settings.two_factor_enabled ? 'dash-btn-danger' : 'dash-btn-success'}`}
                    >
                        {security_settings.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                </div>
            </div>

            {/* Passkeys */}
            <div className="dash-card dash-card-body">
                <h3 className="dash-text-primary dash-mb-lg">
                    <i className="fas fa-fingerprint me-2 accent-partner"></i>
                    Passkeys
                </h3>
                {passkeys.length > 0 ? (
                    <div className="dash-flex-col dash-gap-md">
                        {passkeys.map((passkey) => (
                            <div key={passkey.id} className="dash-flex-between" style={{
                                padding: 'var(--space-md) var(--space-lg)',
                                background: 'var(--surface-elevated)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-default)',
                            }}>
                                <div>
                                    <span className="dash-text-primary dash-fw-medium">{passkey.alias || 'Passkey'}</span>
                                    <span className="dash-text-dim dash-text-sm" style={{ marginLeft: 'var(--space-md)' }}>
                                        Added {formatDate(passkey.created_at)}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => setPasskeyToDelete(passkey.id)}
                                    className="dash-btn dash-btn-danger dash-btn-sm"
                                    style={{ padding: 'var(--space-xs)' }}
                                    title="Remove Passkey"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="dash-text-muted" style={{ margin: '0 0 var(--space-lg)' }}>No passkeys registered yet.</p>
                )}

                <button
                    onClick={registerPasskey}
                    disabled={isRegisteringPasskey}
                    className="dash-btn dash-btn-outline accent-partner"
                    style={{
                        width: '100%',
                        cursor: isRegisteringPasskey ? 'not-allowed' : 'pointer',
                        marginTop: passkeys.length > 0 ? 'var(--space-lg)' : '0',
                    }}
                >
                    {isRegisteringPasskey ? (
                        <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                        <i className="fas fa-plus-circle"></i>
                    )}
                    {isRegisteringPasskey ? 'Registering...' : 'Register New Passkey'}
                </button>
            </div>

            {/* Login History */}
            <div className="dash-card dash-card-body">
                <h3 className="dash-text-primary dash-mb-lg">
                    <i className="fas fa-history me-2 accent-partner"></i>
                    Recent Login History
                </h3>
                {loginHistory.length > 0 ? (
                    <div style={{ padding: 0 }}>
                        <DataTable 
                            columns={loginHistoryColumns} 
                            data={loginHistory} 
                            className="m-0 border-0"
                            style={{ background: 'transparent' }}
                        />
                    </div>
                ) : (
                    <p className="dash-text-muted dash-no-margin">No login history available.</p>
                )}
            </div>

            {/* Password Change Modal */}
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogContent className="admin-card-dark max-w-lg border-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">
                            Change Password
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePasswordChange}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#d97706]/50 transition-all"
                                />
                                {passwordForm.errors.current_password && (
                                    <span className="text-red-500 text-xs mt-1 block">{passwordForm.errors.current_password}</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#d97706]/50 transition-all"
                                />
                                {passwordForm.errors.password && (
                                    <span className="text-red-500 text-xs mt-1 block">{passwordForm.errors.password}</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#d97706]/50 transition-all"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-8 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="flex-1 py-3 bg-[#d97706] hover:bg-[#b45309] rounded-xl text-white font-bold shadow-lg shadow-[#d97706]/20 transition-all disabled:opacity-50"
                            >
                                {passwordForm.processing ? 'Updating...' : 'Update Password'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 2FA Setup Modal */}
            <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
                <DialogContent className="admin-card-dark max-w-lg border-0 text-center">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">
                            Set Up Two-Factor Authentication
                        </DialogTitle>
                    </DialogHeader>
                    {twoFactorSetup && (
                        <>
                            <div className="mb-6">
                                <p className="text-gray-400 mb-4">
                                    Scan this QR code with your authenticator app:
                                </p>
                                <div 
                                    dangerouslySetInnerHTML={{ __html: twoFactorSetup.qr_code }} 
                                    className="bg-white p-3 rounded-2xl inline-block shadow-lg"
                                />
                            </div>
                            <form onSubmit={confirm2FA}>
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-400">
                                        Enter the 6-digit code from your app:
                                    </label>
                                    <input
                                        type="text"
                                        value={twoFactorForm.data.code}
                                        onChange={(e) => {
                                            twoFactorForm.setData('code', e.target.value);
                                            twoFactorForm.setData('secret', twoFactorSetup.secret);
                                        }}
                                        maxLength={6}
                                        className="w-full text-center text-3xl font-bold tracking-[0.5rem] py-4 bg-[#1a1a1a] border border-white/10 rounded-2xl text-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/50 transition-all"
                                        placeholder="000000"
                                    />
                                    {twoFactorForm.errors.two_factor_code && (
                                        <span className="text-red-500 text-xs mt-1 block">{twoFactorForm.errors.two_factor_code}</span>
                                    )}
                                </div>
                                <DialogFooter className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShow2FAModal(false)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={twoFactorForm.processing}
                                        className="flex-1 py-3 bg-[#10b981] hover:bg-[#059669] rounded-xl text-white font-bold shadow-lg shadow-[#10b981]/20 transition-all disabled:opacity-50"
                                    >
                                        {twoFactorForm.processing ? 'Verifying...' : 'Verify & Enable'}
                                    </button>
                                </DialogFooter>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Success/Error Dialog */}
            <StatusDialog 
                open={!!successMessage || !!errorMessage}
                onOpenChange={(open) => { if(!open) { setSuccessMessage(''); setErrorMessage(''); } }}
                type={successMessage ? 'success' : 'error'}
                title={successMessage ? "Everything Set!" : "Action Failed"}
                message={successMessage || errorMessage}
                onButtonClick={() => { setSuccessMessage(''); setErrorMessage(''); }}
            />

            <ConfirmationDialog
                open={!!passkeyToDelete}
                onOpenChange={(open) => !open && setPasskeyToDelete(null)}
                title="Remove Passkey?"
                description="Are you sure you want to remove this passkey?"
                onConfirm={deletePasskey}
                confirmText="Remove"
                variant="destructive"
            />
        </PartnerLayout>
    );
}
