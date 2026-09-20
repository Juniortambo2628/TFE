import { Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthLayout
            head="Forgot Password"
            title="Reset your password"
            subtitle="Enter your email and we'll send you a secure link to set a new password."
            backHref={route('login')}
            backLabel="Back to Login"
            backIcon="fas fa-arrow-left"
            heroHeadline="Locked out? It happens."
            heroTagline="We'll get you back to planning your trip in a couple of clicks."
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
                        placeholder="you@example.com"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    {errors.email && <div className="tfe-form-error">{errors.email}</div>}
                </div>

                <button type="submit" className="tfe-auth__submit" disabled={processing}>
                    <i className="fas fa-paper-plane"></i> Send Reset Link
                </button>
            </form>

            <div className="tfe-auth__alt">
                Remembered your password? <Link href={route('login')}>Back to Sign In</Link>
            </div>
        </AuthLayout>
    );
}
