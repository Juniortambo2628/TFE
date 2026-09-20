import { useEffect } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
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
        try {
            // 1. Get authentication options (challenge) from server
            const optionsResponse = await axios.get(route('webauthn.login.options'), {
                params: { email: data.email } // Optional: email can help identify the user
            });

            // 2. Start the biometric authentication ritual
            const assertion = await startAuthentication({ optionsJSON: optionsResponse.data });

            // 3. Send the assertion back to the server to verify and log in
            router.post(route('webauthn.login'), assertion, {
                onSuccess: () => {
                    // Redirect is handled by backend or intended path
                },
                onError: (err) => {
                    console.error('Passkey authentication failed:', err);
                    toast.error('Passkey authentication failed. Ensure you have registered this device.');
                }
            });
        } catch (error) {
            console.error('Passkey login error details:', error);
            let message = error.response?.data?.message || error.message || 'Unknown error';

            if (error.name === 'SecurityError') {
                message = "WebAuthn (Passkeys) requires a secure domain (like localhost or a real domain). IP addresses (like 127.0.0.1) are NOT allowed.";
            }

            const errorName = error.name ? `[${error.name}] ` : '';
            toast.error(`Could not start Passkey login: ${errorName}${message}. Ensure you are on a secure connection (HTTPS) and your email is entered if required.`);
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
                <button onClick={loginWithPasskey} className="tfe-btn justify-content-center" id="passkeyLoginBtn" type="button">
                    <i className="fas fa-fingerprint"></i> Passkey
                </button>
            </div>
        </AuthLayout>
    );
}
