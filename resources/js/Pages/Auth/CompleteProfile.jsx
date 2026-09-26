import { useForm, usePage } from '@inertiajs/react';
import '../../../css/register-dark.css';
import AuthLayout from '@/Layouts/AuthLayout';
import { useTournamentTeams } from '@/Hooks/useTournamentTeams';

/**
 * CompleteProfile — social sign-up finishing step. TFE only needs the
 * fan's supported team + terms agreement; everything KYC (phone, country,
 * DOB) is handled by whichever partner services the fan.
 */
export default function CompleteProfile({ auth }) {
    const { assetUrl } = usePage().props;
    const tournamentTeams = useTournamentTeams({ assetUrl });

    const { data, setData, post, processing, errors } = useForm({
        team_support: '',
        terms_agreed: false,
    });

    const teams = [
        ...tournamentTeams.map((t) => ({
            name: t.value,
            iso: t.iso || '',
            flag: t.flag,
            icon: t.flag ? null : 'fas fa-futbol',
        })),
        { name: 'Other', icon: 'fas fa-globe' },
    ];

    const submit = (e) => {
        e.preventDefault();
        post(route('register.complete.store'));
    };

    return (
        <AuthLayout
            head="Complete Profile"
            title="One final step"
            subtitle="Pick your team and you're on the platform."
            heroHeadline="Nearly kicked off."
            heroTagline="A few last details and your matchday experience is ready."
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="tfe-auth__field">
                    <label className="tfe-form-label">Which team will you be supporting? <span className="text-red-500">*</span></label>
                    <div className="team-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                        gap: '8px',
                        width: '100%',
                    }}>
                        {teams.map(team => (
                            <div
                                key={team.name}
                                className={`team-option ${data.team_support === team.name ? 'selected' : ''}`}
                                onClick={() => setData('team_support', team.name)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px 4px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    minHeight: '64px',
                                    textAlign: 'center',
                                }}
                            >
                                {team.flag ? (
                                    <img src={team.flag} alt={team.name} className="team-flag" style={{ width: '30px', height: '20px', objectFit: 'cover' }} />
                                ) : (
                                    <i className={`${team.icon} team-icon`} style={{ fontSize: '16px' }}></i>
                                )}
                                <span className="team-name text-white" style={{ fontSize: '9px', lineHeight: '1.2' }}>{team.name}</span>
                            </div>
                        ))}
                    </div>
                    {errors.team_support && <p className="text-red-500 text-xs mt-1">{errors.team_support}</p>}
                </div>

                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        id="terms"
                        className="mt-1 rounded border-zinc-700 bg-black text-red-600 focus:ring-red-600"
                        checked={data.terms_agreed}
                        onChange={e => setData('terms_agreed', e.target.checked)}
                    />
                    <label htmlFor="terms" className="text-sm text-zinc-400">
                        I agree to the <a href="#" className="text-red-500 hover:underline">Terms & Conditions</a> and <a href="#" className="text-red-500 hover:underline">Privacy Policy</a>
                    </label>
                </div>
                {errors.terms_agreed && <p className="text-red-500 text-xs mt-1">{errors.terms_agreed}</p>}

                <button type="submit" className="tfe-auth__submit" disabled={processing}>
                    {processing ? 'Saving...' : 'Complete Registration'}
                </button>
            </form>
        </AuthLayout>
    );
}
