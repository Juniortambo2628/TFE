import React from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import '../../../css/login-dark.css';

export default function TwoFactorChallenge() {
    const { assetUrl } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login.two-factor'));
    };

    return (
        <>
            <Head>
                <title>Two-Factor Confirmation</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
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
                            <h2>Security Check</h2>
                            <p className="login-sub">
                                Please confirm access to your account by entering the authentication code from your app.
                            </p>
                        </div>

                        <form onSubmit={submit}>
                            <div className="form-group mb-4 text-center">
                                <label className="form-label d-block text-center mb-3">Verification Code</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={data.code}
                                    className="form-control text-center fs-3"
                                    placeholder="000000"
                                    style={{ letterSpacing: '8px', fontWeight: 'bold' }}
                                    maxLength="6"
                                    autoComplete="one-time-code"
                                    autoFocus
                                    onChange={(e) => setData('code', e.target.value)}
                                />
                                {errors.code && <div className="text-danger mt-3 small">{errors.code}</div>}
                            </div>

                            <div className="d-grid gap-2">
                                <button className="btn-signin py-3" disabled={processing}>
                                    Verify & Log In
                                </button>
                            </div>

                            <div className="alt-links mt-4">
                                <Link href={route('login')} className="text-decoration-none">
                                    <i className="fas fa-arrow-left me-2"></i>
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
