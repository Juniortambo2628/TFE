import React, { useState } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/Components/ui/dialog';
import { startRegistration } from '@simplewebauthn/browser';
import DashboardHero from '@/Components/Common/DashboardHero';
import SplitEditorLayout from '@/Components/Common/SplitEditorLayout';
import IdentityPreview from '@/Components/Common/IdentityPreview';
import StatusDialog from '@/Components/Common/StatusDialog';
import ConfirmationDialog from '@/Components/ConfirmationDialog';

/**
 * AccountSecurity — the ONE account-security surface, for every role
 * (Sprint 53).
 *
 * There used to be a page per role. They shared a backend (one
 * `SecurityService`, one set of `security.*` actions) but nothing else: the
 * fan page had the real WebAuthn registration flow, confirmation dialogs and
 * primitives, while the partner page was a hand-rolled copy on
 * `partner-passkey-btn-*` classes, browser `confirm()` prompts, a password
 * form that posted to the PROFILE endpoint, and buttons wired to
 * `partner.security.2fa.enable` / `partner.passkeys.*` route names that do not
 * exist — every one of them threw the moment it was clicked.
 *
 * So the page is a component now, and the role pages are ten-line wrappers
 * that hand it their own route names. Passkeys are the exception: the
 * `webauthn.*` routes are global and identical for everyone, so they are
 * referenced directly rather than passed in.
 *
 * @param {string}  role          'fan' | 'partner' | 'admin' — drives accent + hero.
 * @param {Object}  routes        Route NAMES for this role's security actions.
 * @param {Array}   breadcrumbs   Passed straight to DashboardHero.
 */
export default function AccountSecurity({
    role = 'fan',
    routes: routeNames,
    breadcrumbs = [{ label: 'Security' }],
    security_settings: securitySettings = {},
    loginHistory = [],
    passkeys = [],
}) {
    const { flash, auth } = usePage().props;
    const user = auth?.user || {};

    const {
        data: passData,
        setData: setPassData,
        post: passPost,
        processing: passProcessing,
        reset: passReset,
        errors: passErrors,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassForm, setShowPassForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [setupCode, setSetupCode] = useState('');
    const [confirmDisable2FA, setConfirmDisable2FA] = useState(false);
    const [passkeyToDelete, setPasskeyToDelete] = useState(null);
    const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);

    const handlePasswordChange = (e) => {
        e.preventDefault();
        passPost(route(routeNames.password), {
            onSuccess: () => {
                passReset();
                setShowPassForm(false);
                setSuccessMessage('Password updated successfully!');
            },
        });
    };

    const toggleLoginNotifications = () => {
        // Not every role exposes this preference; hide rather than 500.
        if (!routeNames.notifications) return;
        router.post(route(routeNames.notifications), {
            login_notifications: !securitySettings.login_notifications,
        }, {
            preserveScroll: true,
            onSuccess: () => setSuccessMessage('Preference updated'),
        });
    };

    const toggle2FA = () => {
        if (securitySettings.two_factor_enabled) {
            setConfirmDisable2FA(true);
            return;
        }
        router.post(route(routeNames.twoFactor), {}, {
            preserveScroll: true,
            onSuccess: () => setShow2FAModal(true),
        });
    };

    const handleDisable2FA = () => {
        router.post(route(routeNames.twoFactor), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmDisable2FA(false);
                setSuccessMessage('Two-factor authentication disabled');
            },
        });
    };

    const confirm2FA = (e) => {
        e.preventDefault();
        router.post(route(routeNames.twoFactorConfirm), {
            code: setupCode,
            secret: flash?.two_factor_setup?.secret,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShow2FAModal(false);
                setSetupCode('');
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
                onError: () => {
                    setIsRegisteringPasskey(false);
                    setErrorMessage('Registration failed. Your device might not support Passkeys or it was cancelled.');
                },
            });
        } catch (error) {
            console.error('Passkey creation error details:', error);
            setIsRegisteringPasskey(false);

            let message = error.response?.data?.message || error.message || 'Unknown error';

            if (error.name === 'SecurityError') {
                message = 'WebAuthn (Passkeys) requires a secure domain (like localhost or a real domain). IP addresses (like 127.0.0.1) are NOT allowed.';
            }

            const errorName = error.name ? `[${error.name}] ` : '';
            setErrorMessage(`Could not start Passkey registration: ${errorName}${message}. Ensure you are on a secure connection (HTTPS).`);
        }
    };

    const deletePasskey = () => {
        if (!passkeyToDelete) return;
        router.delete(route('webauthn.register.destroy', passkeyToDelete), {
            preserveScroll: true,
            onSuccess: () => {
                setPasskeyToDelete(null);
                setSuccessMessage('Passkey removed successfully');
            },
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown Date';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString();
    };

    const twoFactorOn = !!securitySettings.two_factor_enabled;

    return (
        <div className="pb-5">
            <DashboardHero
                role={role}
                title="Account Security"
                subtitle="Manage your password, login methods, and account safety."
                breadcrumbs={breadcrumbs}
            />

            <SplitEditorLayout
                previewTitle="Account standing"
                preview={(
                    <>
                        <IdentityPreview
                            name={user.name}
                            sub={user.email}
                            avatar={user.avatar}
                            badge={twoFactorOn ? 'Two-factor on' : 'Two-factor off'}
                        />
                        <div className="tfe-slab">
                            <div className="tfe-slab__body">
                                <div className="tfe-security-stat">
                                    <span>Two-factor auth</span>
                                    <span className={`tfe-pill ${twoFactorOn ? 'tfe-pill--approved' : 'tfe-pill--pending'}`}>
                                        {twoFactorOn ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <div className="tfe-security-stat">
                                    <span>Passkeys</span>
                                    <strong>{passkeys.length}</strong>
                                </div>
                                <div className="tfe-security-stat">
                                    <span>Recent logins</span>
                                    <strong>{loginHistory.length}</strong>
                                </div>
                                <div className="tfe-security-stat">
                                    <span>Password changed</span>
                                    <strong>{securitySettings.last_password_change || 'Never'}</strong>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            >
                <div className="tfe-editor-stack">
                    {/* Security preferences + password */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">
                                <i className="fas fa-lock me-2" aria-hidden="true" /> Security preferences
                            </h3>
                        </div>
                        <div className="tfe-slab__body">
                            <div className="tfe-setting-row">
                                <div>
                                    <h4>Two-Factor Authentication</h4>
                                    <p>Add an extra layer of security to your account.</p>
                                </div>
                                <button
                                    type="button"
                                    className={`toggle-switch ${twoFactorOn ? 'active' : ''}`}
                                    onClick={toggle2FA}
                                    aria-pressed={twoFactorOn}
                                    aria-label="Toggle two-factor authentication"
                                />
                            </div>

                            {routeNames.notifications && (
                                <div className="tfe-setting-row">
                                    <div>
                                        <h4>Login Notifications</h4>
                                        <p>Get notified of new login attempts.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className={`toggle-switch ${securitySettings.login_notifications ? 'active' : ''}`}
                                        onClick={toggleLoginNotifications}
                                        aria-pressed={!!securitySettings.login_notifications}
                                        aria-label="Toggle login notifications"
                                    />
                                </div>
                            )}

                            <div className="tfe-setting-row">
                                <div>
                                    <h4>Password</h4>
                                    <p>Last changed {securitySettings.last_password_change || 'never'}.</p>
                                </div>
                                <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setShowPassForm(!showPassForm)}>
                                    <i className="fas fa-key me-2" aria-hidden="true" />
                                    {showPassForm ? 'Close' : 'Change Password'}
                                </button>
                            </div>

                            {showPassForm && (
                                <form onSubmit={handlePasswordChange} className="tfe-form-section">
                                    <div className="tfe-form-field">
                                        <label className="tfe-form-label">Current Password</label>
                                        <input
                                            type="password"
                                            className="tfe-input"
                                            value={passData.current_password}
                                            onChange={(e) => setPassData('current_password', e.target.value)}
                                            required
                                        />
                                        {passErrors.current_password && <div className="tfe-form-error">{passErrors.current_password}</div>}
                                    </div>
                                    <div className="tfe-form-field">
                                        <label className="tfe-form-label">New Password</label>
                                        <input
                                            type="password"
                                            className="tfe-input"
                                            value={passData.password}
                                            onChange={(e) => setPassData('password', e.target.value)}
                                            required
                                        />
                                        {passErrors.password && <div className="tfe-form-error">{passErrors.password}</div>}
                                    </div>
                                    <div className="tfe-form-field">
                                        <label className="tfe-form-label">Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="tfe-input"
                                            value={passData.password_confirmation}
                                            onChange={(e) => setPassData('password_confirmation', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="tfe-form-actions">
                                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setShowPassForm(false)}>Cancel</button>
                                        <button type="submit" className="tfe-btn tfe-btn--filled tfe-btn--sm" disabled={passProcessing}>
                                            {passProcessing ? 'Updating…' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </section>

                    {/* Passkeys */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">
                                <i className="fas fa-fingerprint me-2" aria-hidden="true" /> Passkeys &amp; biometrics
                            </h3>
                        </div>
                        <div className="tfe-slab__body">
                            <p className="tfe-form-help mb-3">
                                Use your fingerprint, face, or screen lock to sign in securely without a password.
                            </p>

                            {passkeys.length > 0 ? (
                                <div className="mb-3">
                                    {passkeys.map((passkey, idx) => (
                                        <div key={passkey.id} className="passkey-row">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="passkey-row__glyph"><i className="fas fa-key" /></div>
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
                                                <i className="fas fa-trash-alt" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="tfe-empty tfe-empty--inline">
                                    <div className="tfe-empty__icon"><i className="fas fa-fingerprint" /></div>
                                    <div className="tfe-empty__title">No passkeys registered yet</div>
                                    <div className="tfe-empty__body">Secure your account with biometrics.</div>
                                </div>
                            )}

                            <button
                                type="button"
                                className="tfe-btn w-100 justify-content-center"
                                onClick={registerPasskey}
                                disabled={isRegisteringPasskey}
                            >
                                {isRegisteringPasskey
                                    ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> Registering…</>
                                    : <><i className="fas fa-plus" /> Register new passkey</>}
                            </button>
                        </div>
                    </section>

                    {/* Login history */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">
                                <i className="fas fa-history me-2" aria-hidden="true" /> Login history
                            </h3>
                        </div>
                        <div className="tfe-slab__body">
                            {loginHistory.length > 0 ? loginHistory.map((login, idx) => (
                                <div key={login.id ?? idx} className="login-row">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="login-row__glyph"><i className="fas fa-globe" /></div>
                                        <div>
                                            <div className="text-white fw-medium">{login.ip_address}</div>
                                            <div className="text-white-50 small">{login.created_at}</div>
                                        </div>
                                    </div>
                                    <span className={`tfe-pill ${login.successful === false ? 'tfe-pill--rejected' : 'tfe-pill--approved'}`}>
                                        {login.successful === false ? 'Failed' : 'Success'}
                                    </span>
                                </div>
                            )) : (
                                <div className="tfe-empty tfe-empty--inline">
                                    <div className="tfe-empty__body">No login history available.</div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </SplitEditorLayout>

            {/* 2FA setup */}
            <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
                <DialogContent className="admin-card-dark border-0 text-center twofa-modal">
                    <DialogHeader>
                        <DialogTitle className="twofa-modal__title">Setup Two-Factor Authentication</DialogTitle>
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
                                    onChange={(e) => setSetupCode(e.target.value)}
                                    required
                                />
                            </div>
                            <DialogFooter className="dash-modal-footer">
                                <button type="button" className="tfe-btn flex-fill justify-content-center" onClick={() => setShow2FAModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="tfe-btn tfe-btn--filled flex-fill justify-content-center">
                                    Confirm &amp; Enable
                                </button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            <StatusDialog
                open={!!successMessage || !!errorMessage}
                onOpenChange={(open) => { if (!open) { setSuccessMessage(''); setErrorMessage(''); } }}
                type={successMessage ? 'success' : 'error'}
                title={successMessage ? 'Everything Set!' : 'Oops!'}
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
    );
}
