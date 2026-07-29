import { Head, Link, useForm, usePage } from '@inertiajs/react';
import '../../../css/login-dark.css';

export default function ForgotPassword({ status }) {
    const { assetUrl } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head>
                <title>Forgot Password</title>
            </Head>

            {/* Back Button */}
            <Link href={route('login')} className="pill-back-btn auth-back-link pill-fixed-left" aria-label="Return to login">
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
                <span>Back to Login</span>
            </Link>

            <div className="login-dark-wrapper">
                <div className="login-card">
                    <div className="login-card-inner">
                        <div className="login-brand">
                            <img src={`${assetUrl}assets/img/logo/TFE-logo.png`} alt="logo" aria-hidden="true" />
                            <h2>Reset Password</h2>
                        </div>

                        <div className="login-sub">
                            Forgot your password? No problem. Just let us know your email address and we will email you a password reset link.
                        </div>

                        {status && <div className="mb-4 font-medium text-sm text-green-600 text-center">{status}</div>}

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
                                    autoFocus
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <button type="submit" className="btn-signin" disabled={processing}>
                                    ➜ Send Reset Link
                                </button>
                            </div>
                        </form>

                        <div className="alt-links" style={{ marginTop: '20px' }}>
                            Remembered your password? <Link href={route('login')}>Back to Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
