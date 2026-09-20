import { useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import PasswordField from '@/Components/Common/PasswordField';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            head="Reset Password"
            title="Set a new password"
            subtitle="Choose a strong new password to secure your account."
            backHref={route('login')}
            backLabel="Back to Login"
            backIcon="fas fa-arrow-left"
            heroHeadline="Almost there."
            heroTagline="Pick a new password and you're back in the game."
        >
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
                        onChange={(e) => setData('email', e.target.value)}
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
                        autoComplete="new-password"
                        placeholder="••••••••"
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    {errors.password && <div className="tfe-form-error">{errors.password}</div>}
                </div>

                <div className="tfe-auth__field">
                    <label className="tfe-form-label" htmlFor="password_confirmation">
                        <i className="fas fa-lock"></i> Confirm Password
                    </label>
                    <PasswordField
                        id="password_confirmation"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />
                    {errors.password_confirmation && <div className="tfe-form-error">{errors.password_confirmation}</div>}
                </div>

                <button type="submit" className="tfe-auth__submit" disabled={processing}>
                    <i className="fas fa-key"></i> Reset Password
                </button>
            </form>
        </AuthLayout>
    );
}
