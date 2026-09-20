import { Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function TwoFactorChallenge() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login.two-factor'));
    };

    return (
        <AuthLayout
            head="Two-Factor Confirmation"
            title="Security check"
            subtitle="Enter the authentication code from your app to confirm access to your account."
            backHref={route('index')}
            heroHeadline="Keeping your account safe."
            heroTagline="Two-factor authentication adds an extra shield to your matchday plans."
        >
            <form onSubmit={submit}>
                <div className="tfe-auth__field">
                    <label className="tfe-form-label" htmlFor="code">
                        <i className="fas fa-shield-halved"></i> Verification Code
                    </label>
                    <input
                        id="code"
                        type="text"
                        name="code"
                        value={data.code}
                        className="tfe-input text-center"
                        placeholder="000000"
                        style={{ letterSpacing: '10px', fontWeight: 'bold', fontSize: '1.4rem' }}
                        maxLength="6"
                        autoComplete="one-time-code"
                        autoFocus
                        onChange={(e) => setData('code', e.target.value)}
                    />
                    {errors.code && <div className="tfe-form-error">{errors.code}</div>}
                </div>

                <button type="submit" className="tfe-auth__submit" disabled={processing}>
                    <i className="fas fa-arrow-right-to-bracket"></i> Verify &amp; Log In
                </button>
            </form>

            <div className="tfe-auth__alt">
                <Link href={route('login')}>
                    <i className="fas fa-arrow-left me-2"></i> Back to Login
                </Link>
            </div>
        </AuthLayout>
    );
}
