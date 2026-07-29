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
        if (auth.user.two_factor_enabled) {
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
        <FanLayout user={auth.user} header="Security Settings">
            <Head title="Security" />

            <div className="pb-5">
                <DashboardHero role="fan" 
                    title="Account Security"
                    subtitle="Manage your password, login methods, and account safety."
                    breadcrumbs={[{ label: 'Security' }]}
                />
                
                {/* Stats Cards - Keeping these but updating style to match new dashboard cards */}
                {/* Stats Cards */}
                <div className="summary-cards-grid">
                    <div className={`fan-card-premium ${security_settings.two_factor_enabled ? 'glow-blue' : 'glow-red'}`}>
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: security_settings.two_factor_enabled ? '#00d2ff' : '#ff2d55' }}>
                                <i className={`fas ${security_settings.two_factor_enabled ? 'fa-shield-check' : 'fa-shield-alt'}`}></i>
                            </div>
                            <h3 className="card-title-gaming">Two-Factor Auth</h3>
                            <div className="card-value-gaming">{security_settings.two_factor_enabled ? 'ENABLED' : 'DISABLED'}</div>
                            <div className="text-white-50 small mt-1">{security_settings.two_factor_enabled ? 'Account Secure' : 'Action Required'}</div>
                        </div>
                    </div>
                    
                    <div className="fan-card-premium glow-blue">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                                <i className="fas fa-history"></i>
                            </div>
                            <h3 className="card-title-gaming">Login Sessions</h3>
                            <div className="card-value-gaming">{loginHistory.length} LOGINS</div>
                            <div className="text-white-50 small mt-1">Activity Tracking</div>
                        </div>
                    </div>
                </div>

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
                                <button className="btn-fan-custom btn-fan-custom-sm" onClick={() => setShowPassForm(!showPassForm)}>
                                    <i className="fas fa-key me-2"></i> {showPassForm ? 'Close' : 'Change Password'}
                                </button>
                            </div>

                            {showPassForm && (
                                <form onSubmit={handlePasswordChange} className="mt-4 p-4 glass-card border border-secondary border-opacity-25 rounded-3">
                                    <div className="mb-3">
                                        <label className="form-label text-white-50 small">Current Password</label>
                                        <input type="password" className="form-control bg-dark text-white border-secondary border-opacity-50" value={passData.current_password} onChange={e => setPassData('current_password', e.target.value)} required />
                                        {passErrors.current_password && <div className="text-danger small mt-1">{passErrors.current_password}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label text-white-50 small">New Password</label>
                                        <input type="password" className="form-control bg-dark text-white border-secondary border-opacity-50" value={passData.password} onChange={e => setPassData('password', e.target.value)} required />
                                        {passErrors.password && <div className="text-danger small mt-1">{passErrors.password}</div>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label text-white-50 small">Confirm New Password</label>
                                        <input type="password" className="form-control bg-dark text-white border-secondary border-opacity-50" value={passData.password_confirmation} onChange={e => setPassData('password_confirmation', e.target.value)} required />
                                    </div>
                                    <div className="d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn-fan-custom btn-fan-custom-sm opacity-75" onClick={() => setShowPassForm(false)}>Cancel</button>
                                        <button type="submit" className="btn-fan-custom btn-fan-custom-sm" disabled={passProcessing}> {passProcessing ? 'Updating...' : 'Update Password'}</button>
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

                            <div className="passkeys-list mb-4">
                                {passkeys.length > 0 ? passkeys.map((passkey, idx) => (
                                    <div key={passkey.id} className="d-flex justify-content-between align-items-center mb-3 p-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-25 hover-glow transition-all">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="text-accent fs-4 bg-accent bg-opacity-10 p-2 rounded-circle" style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className="fas fa-key"></i>
                                            </div>
                                            <div>
                                                <div className="text-white fw-bold">{passkey.alias || `Passkey ${idx + 1}`}</div>
                                                <div className="text-white-50 x-small">Added: {formatDate(passkey.created_at)}</div>
                                            </div>
                                        </div>
                                        <button 
                                            className="btn-glass-pill btn-glass-pill-sm text-danger border-danger border-opacity-25"
                                            onClick={() => setPasskeyToDelete(passkey.id)}
                                            title="Remove Passkey"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-5 bg-dark bg-opacity-25 rounded-3 border border-dashed border-secondary border-opacity-25 mb-4">
                                        <div className="text-white-50 opacity-25 mb-3 fs-1">
                                            <i className="fas fa-fingerprint"></i>
                                        </div>
                                        <div className="text-white-50">No passkeys registered yet</div>
                                        <div className="text-white-50 x-small opacity-50">Secure your account with biometrics</div>
                                    </div>
                                )}
                            </div>

                            <button 
                                className="btn-fan-custom w-100 py-3 d-flex align-items-center justify-content-center gap-2" 
                                onClick={registerPasskey}
                                disabled={isRegisteringPasskey}
                            >
                                {isRegisteringPasskey ? (
                                    <><div className="spinner-border spinner-border-sm" role="status"></div> Registering...</>
                                ) : (
                                    <><i className="fas fa-plus"></i> Register New Passkey</>
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
                        <div className="login-history p-3">
                            {loginHistory.length > 0 ? loginHistory.map((login, idx) => (
                                <div key={idx} className="login-item d-flex justify-content-between align-items-center mb-1 p-3 hover-bg-light transition-all rounded-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-secondary bg-opacity-10 p-2 rounded-circle text-white-50">
                                            <i className="fas fa-globe"></i>
                                        </div>
                                        <div>
                                            <div className="login-device text-white fw-medium">{login.ip_address}</div>
                                            <div className="login-details text-white-50 x-small">{login.created_at}</div>
                                        </div>
                                    </div>
                                    <span className="badge bg-success-glass text-success border border-success border-opacity-25 px-3 py-2">Success</span>
                                </div>
                            )) : (
                                <div className="text-white-50 text-center py-4">No login history available.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2FA Setup Modal */}
                <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
                    <DialogContent className="admin-card-dark max-w-lg border-0 text-center">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">
                                Setup Two-Factor Authentication
                            </DialogTitle>
                        </DialogHeader>
                        <div className="mb-6">
                            <p className="text-gray-400 mb-4">
                                Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy) and enter the 6-digit code to confirm.
                            </p>
                            
                            {flash?.two_factor_setup?.qr_code && (
                                <div 
                                    className="bg-white p-3 rounded-2xl inline-block shadow-lg mb-4"
                                    dangerouslySetInnerHTML={{ __html: flash.two_factor_setup.qr_code }}
                                />
                            )}

                            <form onSubmit={confirm2FA}>
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-400 text-start">Verification Code</label>
                                    <input 
                                        type="text" 
                                        className="w-full text-center text-3xl font-bold tracking-[0.5rem] py-4 bg-[#1a1a1a] border border-white/10 rounded-2xl text-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/50 transition-all"
                                        placeholder="000 000"
                                        maxLength="6"
                                        value={setupCode}
                                        onChange={e => setSetupCode(e.target.value)}
                                        required 
                                    />
                                </div>
                                <DialogFooter className="mt-8 flex gap-3">
                                    <button 
                                        type="button" 
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all"
                                        onClick={() => setShow2FAModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-3 bg-[#10b981] hover:bg-[#059669] rounded-xl text-white font-bold shadow-lg shadow-[#10b981]/20 transition-all"
                                    >
                                        Confirm & Enable
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
