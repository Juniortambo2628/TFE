import { useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { startAuthentication } from '@simplewebauthn/browser';
import { toast } from 'sonner';
import '../../../css/login-dark.css';

export default function Login({ status, canResetPassword }) {
    const { assetUrl } = usePage().props;
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
        <>
            <Head>
                <title>Sign In</title>
            </Head>

            {/* Back Button */}
            <Link href={route('index')} className="pill-back-btn auth-back-link pill-fixed-left" aria-label="Return to home">
                <i className="fas fa-home" aria-hidden="true"></i>
                <span>Home</span>
            </Link>

            <div className="login-dark-wrapper">
                <div className="login-card">
                    <div className="login-card-inner">
                        <div className="login-brand">
                            <img src={`${assetUrl}assets/img/logo/TFE-logo.png`} alt="logo" aria-hidden="true" />
                            <h2>Sign In</h2>
                        </div>

                        {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

                        <form onSubmit={submit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">
                                    <i className="fas fa-envelope"></i> Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                            </div>

                            <div className="form-group password-row">
                                <label className="form-label" htmlFor="password">
                                    <i className="fas fa-lock"></i> Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                                
                                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                                    {canResetPassword && (
                                        <Link href={route('password.request')} className="alt-links" style={{ fontSize: '0.9rem' }}>
                                            Forgot your password?
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="remember-row">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <label htmlFor="rememberMe" style={{ margin: 0 }}>Remember me</label>
                            </div>

                            <div>
                                <button type="submit" className="btn-signin" disabled={processing}>
                                    ➜ Sign In
                                </button>
                            </div>
                        </form>

                        <div className="alt-links" style={{ marginTop: '12px' }}>
                            Don't have an account? <Link href={route('register')}>Sign up here</Link>
                        </div>

                        <div className="divider" aria-hidden="true"><span>OR</span></div>

                        <div className="social-row">
                            <a href={route('social.redirect', 'google')} className="social-btn" id="googleLoginBtn" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <i className="fab fa-google"></i> Sign in with Google
                            </a>
                            <button onClick={loginWithPasskey} className="social-btn" id="passkeyLoginBtn" type="button">
                                <i className="fas fa-fingerprint"></i> Sign in with Passkey
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
