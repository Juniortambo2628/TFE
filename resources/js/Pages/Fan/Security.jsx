import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import { startRegistration } from '@simplewebauthn/browser';
import '../../../css/fan/fan-pages.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import StatusDialog from '@/Components/Common/StatusDialog';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { cn } from '@/lib/utils';

export default function Security({ auth, security_settings = {}, loginHistory = [], passkeys = [] }) {
    const { data: passData, setData: setPassData, post: passPost, processing: passProcessing, reset: passReset, errors: passErrors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassForm, setShowPassForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handlePasswordChange = (e) => {
        e.preventDefault();
        passPost(route('fan.security.password'), {
            onSuccess: () => {
                passReset();
                setShowPassForm(false);
                setSuccessMessage('Password updated successfully!');
            }
        });
    };

    const toggleSetting = (setting) => {
        router.post(route('fan.security.notifications'), {
            [setting]: !security_settings[setting]
        }, { 
            preserveScroll: true,
            onSuccess: () => setSuccessMessage('Preference updated')
        });
    };

    const { flash } = usePage().props;
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [setupCode, setSetupCode] = useState('');
    const [confirmDisable2FA, setConfirmDisable2FA] = useState(false);
    const [passkeyToDelete, setPasskeyToDelete] = useState(null);

    const toggle2FA = () => {
        if (security_settings.two_factor_enabled) {
            setConfirmDisable2FA(true);
        } else {
            router.post(route('fan.security.two-factor'), {}, { 
                preserveScroll: true,
                onSuccess: () => setShow2FAModal(true)
            });
        }
    };

    const handleDisable2FA = () => {
        router.post(route('fan.security.two-factor'), {}, { 
            preserveScroll: true,
            onSuccess: () => {
                setConfirmDisable2FA(false);
                setSuccessMessage('Two-factor authentication disabled');
            }
        });
    };

    const confirm2FA = (e) => {
        e.preventDefault();
        router.post(route('fan.security.two-factor.confirm'), {
            code: setupCode,
            secret: flash.two_factor_setup?.secret
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShow2FAModal(false);
                setSetupCode('');
                setSuccessMessage('Two-factor authentication enabled successfully!');
            }
        });
    };

    const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);

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
        if (!dateString) return 'Unknown Date';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString();
    };

    return (
        <FanLayout title="Security">
            <Head title="Security" />

            <div className="pb-5">
                <DashboardHero role="fan" 
                    title="Account Security"
                    subtitle="Manage your password, login methods, and account safety."
                    breadcrumbs={[{ label: 'Security' }]}
                />
                
                <SummaryTiles
                    items={[
                        {
                            label: 'Two-factor auth',
                            value: security_settings.two_factor_enabled ? 'Enabled' : 'Disabled',
                            icon: security_settings.two_factor_enabled ? 'fa-shield-check' : 'fa-shield-alt',
                            accent: security_settings.two_factor_enabled ? 'teal' : 'red',
                            subtext: security_settings.two_factor_enabled ? 'Account secure' : 'Action required',
                        },
                        {
                            label: 'Login sessions',
                            value: loginHistory.length,
                            icon: 'fa-history',
                            accent: 'blue',
                            subtext: 'Activity tracking',
                        },
                    ]}
                />

                {/* Content Grid */}
                <div className="content-cards-grid mt-4">
                    {/* Security Settings */}
                    <div className="content-card">
                        <div className="card-header">
                            <i className="fas fa-lock text-accent"></i>
                            <h3>Security Preferences</h3>
                        </div>
                        <div className="settings-list">
                            <div className="setting-item">
                                <div>
                                    <h4 className="text-white">Two-Factor Authentication</h4>
                                    <p className="text-white-50 small">Add an extra layer of security to your account</p>
                                </div>
                                <div 
                                    className={`toggle-switch ${security_settings.two_factor_enabled ? 'active' : ''}`}
                                    onClick={toggle2FA}
                                ></div>
                            </div>
                            <div className="setting-item">
                                <div>
                                    <h4 className="text-white">Login Notifications</h4>
                                    <p className="text-white-50 small">Get notified of new login attempts</p>
                                </div>
                                <div 
                                    className={`toggle-switch ${security_settings.login_notifications ? 'active' : ''}`}
                                    onClick={() => toggleSetting('login_notifications')}
                                ></div>
                            </div>
                        </div>
                        
                        <div className="p-3 border-top border-secondary border-opacity-25 shadow-inner">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="text-white mb-1">Password Management</h4>
                                    <p className="text-white-50 small mb-0">Update your account password</p>
                                </div>
                                <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setShowPassForm(!showPassForm)}>
                                    <i className="fas fa-key me-2"></i> {showPassForm ? 'Close' : 'Change Password'}
                                </button>
                            </div>

                            {showPassForm && (
                                <form onSubmit={handlePasswordChange} className="mt-4 p-4 glass-card border border-secondary border-opacity-25 rounded-3">
                                    <div className="mb-3">
                                        <label className="tfe-form-label">Current Password</label>
                                        <input type="password" className="tfe-input" value={passData.current_password} onChange={e => setPassData('current_password', e.target.value)} required />
                                        {passErrors.current_password && <div className="text-danger small mt-1">{passErrors.current_password}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="tfe-form-label">New Password</label>
                                        <input type="password" className="tfe-input" value={passData.password} onChange={e => setPassData('password', e.target.value)} required />
                                        {passErrors.password && <div className="text-danger small mt-1">{passErrors.password}</div>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="tfe-form-label">Confirm New Password</label>
                                        <input type="password" className="tfe-input" value={passData.password_confirmation} onChange={e => setPassData('password_confirmation', e.target.value)} required />
                                    </div>
                                    <div className="d-flex gap-2 justify-content-end">
                                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setShowPassForm(false)}>Cancel</button>
                                        <button type="submit" className="tfe-btn tfe-btn--filled tfe-btn--sm" disabled={passProcessing}>{passProcessing ? 'Updating…' : 'Update Password'}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Passkeys Management */}
                    <div className="content-card">
                        <div className="card-header">
                            <i className="fas fa-fingerprint text-accent"></i>
                            <h3>Passkeys & Biometrics</h3>
                        </div>
                        <div className="p-4">
                            <p className="text-white-50 small mb-4">
                                Use your fingerprint, face, or screen lock to securely sign in without a password.
                            </p>

                            <div className="mb-4">
                                {passkeys.length > 0 ? passkeys.map((passkey, idx) => (
                                    <div key={passkey.id} className="passkey-row">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="passkey-row__glyph">
                                                <i className="fas fa-key"></i>
                                            </div>
                                            <div>
                                                <div className="text-white fw-bold">{passkey.alias || `Passkey ${idx + 1}`}</div>
                                                <div className="text-white-50 small">Added: {formatDate(passkey.created_at)}</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="tfe-btn tfe-btn--icon tfe-btn--sm"
                                            onClick={() => setPasskeyToDelete(passkey.id)}
                                            aria-label="Remove passkey"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                )) : (
                                    <div className="tfe-empty tfe-empty--inline">
                                        <div className="tfe-empty__icon"><i className="fas fa-fingerprint"></i></div>
                                        <div className="tfe-empty__title">No passkeys registered yet</div>
                                        <div className="tfe-empty__body">Secure your account with biometrics.</div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                className="tfe-btn w-100 justify-content-center"
                                onClick={registerPasskey}
                                disabled={isRegisteringPasskey}
                            >
                                {isRegisteringPasskey ? (
                                    <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering…</>
                                ) : (
                                    <><i className="fas fa-plus"></i> Register new passkey</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Login History */}
                    <div className="content-card">
                        <div className="card-header">
                            <i className="fas fa-history text-accent"></i>
                            <h3>Login History</h3>
                        </div>
                        <div className="p-3">
                            {loginHistory.length > 0 ? loginHistory.map((login, idx) => (
                                <div key={idx} className="login-row">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="login-row__glyph">
                                            <i className="fas fa-globe"></i>
                                        </div>
                                        <div>
                                            <div className="text-white fw-medium">{login.ip_address}</div>
                                            <div className="text-white-50 small">{login.created_at}</div>
                                        </div>
                                    </div>
                                    <span className="tfe-pill tfe-pill--approved">Success</span>
                                </div>
                            )) : (
                                <div className="tfe-empty tfe-empty--inline">
                                    <div className="tfe-empty__body">No login history available.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2FA Setup Modal */}
                <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
                    <DialogContent className="admin-card-dark border-0 text-center twofa-modal">
                        <DialogHeader>
                            <DialogTitle className="twofa-modal__title">
                                Setup Two-Factor Authentication
                            </DialogTitle>
                        </DialogHeader>
                        <div>
                            <p className="text-white-50 mb-4">
                                Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy) and enter the 6-digit code to confirm.
                            </p>

                            {flash?.two_factor_setup?.qr_code && (
                                <div
                                    className="twofa-modal__qr"
                                    dangerouslySetInnerHTML={{ __html: flash.two_factor_setup.qr_code }}
                                />
                            )}

                            <form onSubmit={confirm2FA}>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label text-start">Verification code</label>
                                    <input
                                        type="text"
                                        className="tfe-input twofa-modal__code"
                                        placeholder="000000"
                                        maxLength="6"
                                        value={setupCode}
                                        onChange={e => setSetupCode(e.target.value)}
                                        required
                                    />
                                </div>
                                <DialogFooter className="dash-modal-footer">
                                    <button
                                        type="button"
                                        className="tfe-btn flex-fill justify-content-center"
                                        onClick={() => setShow2FAModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="tfe-btn tfe-btn--filled flex-fill justify-content-center"
                                    >
                                        Confirm &amp; Enable
                                    </button>
                                </DialogFooter>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success/Error Dialog */}
                <StatusDialog 
                    open={!!successMessage || !!errorMessage}
                    onOpenChange={(open) => { if(!open) { setSuccessMessage(''); setErrorMessage(''); } }}
                    type={successMessage ? 'success' : 'error'}
                    title={successMessage ? "Everything Set!" : "Oops!"}
                    message={successMessage || errorMessage}
                    onButtonClick={() => { setSuccessMessage(''); setErrorMessage(''); }}
                />

                <ConfirmationDialog
                    open={confirmDisable2FA}
                    onOpenChange={setConfirmDisable2FA}
                    title="Disable 2FA?"
                    description="Are you sure you want to disable 2FA? This will make your account less secure."
                    onConfirm={handleDisable2FA}
                    confirmText="Disable"
                    variant="destructive"
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
            </div>
        </FanLayout>
    );
}
