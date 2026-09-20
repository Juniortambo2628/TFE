import { useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import PasswordField from '@/Components/Common/PasswordField';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            head="Confirm Password"
            title="Confirm your password"
            subtitle="This is a secure area of the application. Please confirm your password before continuing."
            backHref={route('index')}
            heroHeadline="A quick security check."
            heroTagline="Confirm it's really you before we open this secure area."
        >
            <form onSubmit={submit}>
                <div className="tfe-auth__field">
                    <label className="tfe-form-label" htmlFor="password">
                        <i className="fas fa-lock"></i> Password
                    </label>
                    <PasswordField
                        id="password"
                        value={data.password}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    {errors.password && <div className="tfe-form-error">{errors.password}</div>}
                </div>

                <button type="submit" className="tfe-auth__submit" disabled={processing}>
                    <i className="fas fa-check"></i> Confirm
                </button>
            </form>
        </AuthLayout>
    );
}
