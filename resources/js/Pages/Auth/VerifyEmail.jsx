import { Head, Link, useForm, usePage } from '@inertiajs/react';
import '../../../css/login-dark.css';

export default function VerifyEmail({ status }) {
    const { assetUrl } = usePage().props;
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <>
            <Head>
                <title>Email Verification</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
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
                            <h2>Verify Email</h2>
                        </div>

                        <div className="login-sub">
                            Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn't receive the email, we will gladly send you another.
                        </div>

                        {status === 'verification-link-sent' && (
                            <div className="mb-4 font-medium text-sm text-green-600 text-center">
                                A new verification link has been sent to the email address you provided during registration.
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div style={{ marginTop: '24px' }}>
                                <button type="submit" className="btn-signin" disabled={processing}>
                                    ➜ Resend Verification Email
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-6">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="text-gray-400 hover:text-white transition-colors text-sm underline"
                                >
                                    Log Out
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
