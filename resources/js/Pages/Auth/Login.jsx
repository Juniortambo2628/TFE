import { useEffect, useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { startAuthentication } from '@simplewebauthn/browser';
import { toast } from 'sonner';
import AuthLayout from '@/Layouts/AuthLayout';
import PasswordField from '@/Components/Common/PasswordField';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [passkeyBusy, setPasskeyBusy] = useState(false);

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    const loginWithPasskey = async () => {
        setPasskeyBusy(true);

        try {
            // 1. Ask the server for a challenge. The email is optional — without
            //    it the browser offers whatever discoverable passkey it holds.
            const optionsResponse = await axios.get(route('webauthn.login.options'), {
                params: data.email ? { email: data.email } : {},
            });

            // 2. Let the authenticator sign the challenge.
            const assertion = await startAuthentication({ optionsJSON: optionsResponse.data });

            // 3. Hand the signed assertion back; the server redirects on success.
            router.post(route('webauthn.login'), { ...assertion, remember: data.remember }, {
                onError: (err) => {
                    toast.error(err.passkey || 'That passkey could not be verified. Try your password instead.');
                },
                onFinish: () => setPasskeyBusy(false),
            });

            return;
        } catch (error) {
            // The fan dismissed the browser/OS prompt — not worth an error toast.
            if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
                setPasskeyBusy(false);

                return;
            }

            if (error?.name === 'SecurityError') {
                toast.error('Passkeys need a real domain or localhost — a bare IP address will not work.');
            } else if (error?.response?.status === 422) {
                toast.error(error.response.data?.message || 'Passkey sign-in is unavailable. Please use your password.');
            } else if (error?.name === 'InvalidStateError') {
                toast.error('No passkey is registered for this device yet. Sign in with your password and add one under Security.');
            } else {
                toast.error(error?.message || 'Could not start passkey sign-in. Please use your password.');
            }

            setPasskeyBusy(false);
        }
    };

    return (
        <AuthLayout
            head="Sign In"
            title="Welcome back"
            subtitle="Sign in to pick up your matchday plan where you left off."
            backHref={route('index')}
            heroHeadline="Welcome back to the terraces."
            heroTagline="Your saved fixtures, budgets and trips are ready when you are."
        >
            {status && <div className="tfe-auth__status">{status}</div>}
            {errors.passkey && <div className="tfe-form-error">{errors.passkey}</div>}

            <form onSubmit={submit}>
                <div className="tfe-auth__field">
                    <label className="tfe-form-label" htmlFor="email">
                        <i className="fas fa-envelope"></i> Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="tfe-input"
                        autoComplete="username"
                        placeholder="you@example.com"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    {errors.email && <div className="tfe-form-error">{errors.email}</div>}
                </div>

                <div className="tfe-auth__field">
                    <label className="tfe-form-label" htmlFor="password">
                        <i className="fas fa-lock"></i> Password
                    </label>
                    <PasswordField
                        id="password"
                        value={data.password}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    {errors.password && <div className="tfe-form-error">{errors.password}</div>}
                </div>

                <div className="tfe-auth__row">
                    <label className="tfe-auth__remember" htmlFor="rememberMe">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        Remember me
                    </label>
                    {canResetPassword && (
                        <Link href={route('password.request')} className="tfe-auth__link">
                            Forgot your password?
                        </Link>
                    )}
                </div>

                <button type="submit" className="tfe-auth__submit" disabled={processing}>
                    <i className="fas fa-arrow-right-to-bracket"></i> Sign In
                </button>
            </form>

            <div className="tfe-auth__alt">
                Don't have an account? <Link href={route('register')}>Sign up here</Link>
            </div>

            <div className="tfe-auth__divider"><span>OR</span></div>

            <div className="tfe-auth__social">
                <a href={route('social.redirect', 'google')} className="tfe-btn justify-content-center" id="googleLoginBtn">
                    <i className="fab fa-google"></i> Google
                </a>
                <button
                    onClick={loginWithPasskey}
                    className="tfe-btn justify-content-center"
                    id="passkeyLoginBtn"
                    type="button"
                    disabled={passkeyBusy}
                >
                    <i className={passkeyBusy ? 'fas fa-circle-notch fa-spin' : 'fas fa-fingerprint'}></i>{' '}
                    {passkeyBusy ? 'Verifying…' : 'Passkey'}
                </button>
            </div>
        </AuthLayout>
    );
}
