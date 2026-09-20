import { Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <AuthLayout
            head="Email Verification"
            title="Verify your email"
            subtitle="Thanks for signing up! Please confirm your email by clicking the link we just sent you. Didn't get it? We'll happily send another."
            backHref={route('login')}
            backLabel="Back to Login"
            backIcon="fas fa-arrow-left"
            heroHeadline="One last step."
            heroTagline="Verify your email to unlock your full matchday experience."
        >
            {status === 'verification-link-sent' && (
                <div className="tfe-auth__status">
                    A new verification link has been sent to the email address you provided during registration.
                </div>
            )}

            <form onSubmit={submit}>
                <button type="submit" className="tfe-auth__submit" disabled={processing}>
                    <i className="fas fa-paper-plane"></i> Resend Verification Email
                </button>
            </form>

            <div className="tfe-auth__alt">
                <Link href={route('logout')} method="post" as="button" className="tfe-auth__link">
                    Log Out
                </Link>
            </div>
        </AuthLayout>
    );
}
