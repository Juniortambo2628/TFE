import React from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { startAuthentication } from '@simplewebauthn/browser';
import AuthLayout from '@/Layouts/AuthLayout';
import PasswordField from '@/Components/Common/PasswordField';

export default function ConfirmPassword({ hasPasskey = false, socialOnly = false }) {
    const [passkeyBusy, setPasskeyBusy] = React.useState(false);
    const [passkeyError, setPasskeyError] = React.useState(null);

    // Sprint 68 — a fan with no password (Google sign-up, passkey-only)
    // proves it's them with the passkey they already use to sign in.
    const confirmWithPasskey = async () => {
        setPasskeyBusy(true);
        setPasskeyError(null);
        try {
            const options = await axios.get(route('passkey.confirm.options'));
            const assertion = await startAuthentication({ optionsJSON: options.data });
            router.post(route('passkey.confirm'), assertion, {
                onError: (err) => setPasskeyError(err.passkey || 'That passkey could not be verified.'),
                onFinish: () => setPasskeyBusy(false),
            });
        } catch (error) {
            if (error?.name !== 'NotAllowedError' && error?.name !== 'AbortError') {
                setPasskeyError('Passkey check is unavailable right now. Use your password instead.');
            }
            setPasskeyBusy(false);
        }
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            head="Confirm Password"
            title="Confirm your password"
            subtitle="This is a secure area of the application. Please confirm your password before continuing."
            backHref={route('index')}
            heroHeadline="A quick security check."
            heroTagline="Confirm it's really you before we open this secure area."
        >
            <form onSubmit={submit}>
                <div className="tfe-auth__field">
                    <label className="tfe-form-label" htmlFor="password">
                        <i className="fas fa-lock"></i> Password
                    </label>
                    <PasswordField
                        id="password"
                        value={data.password}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    {errors.password && <div className="tfe-form-error">{errors.password}</div>}
                </div>

                <button type="submit" className="tfe-auth__submit" disabled={processing}>
                    <i className="fas fa-check"></i> Confirm
                </button>
            </form>

            {hasPasskey && (
                <div className="tfe-auth__social">
                    <button type="button" className="tfe-btn justify-content-center w-100" onClick={confirmWithPasskey} disabled={passkeyBusy}>
                        <i className="fas fa-fingerprint" aria-hidden="true"></i> {passkeyBusy ? 'Waiting for your passkey…' : 'Confirm with a passkey'}
                    </button>
                    {passkeyError && <div className="tfe-form-error mt-2">{passkeyError}</div>}
                </div>
            )}

            {socialOnly && !hasPasskey && (
                <div className="tfe-auth__alt">
                    Signed up with Google? You have no TFE password to type here —{' '}
                    <Link href={route('fan.security')}>add a passkey under Security</Link> (it takes a few seconds), then confirm with it.
                </div>
            )}
        </AuthLayout>
    );
}
