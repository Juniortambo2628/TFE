import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import SearchableSelect from '@/Components/SearchableSelect';
import { countries } from '../../Data/countries';
import '../../../css/register-dark.css';
import { useTournamentTeams } from '@/Hooks/useTournamentTeams';

export default function CompleteProfile({ auth }) {
    const { assetUrl } = usePage().props;
    const user = auth.user;
    const tournamentTeams = useTournamentTeams({ assetUrl });

    const { data, setData, post, processing, errors } = useForm({
        phone: '',
        country: '',
        country_code: '',
        team_support: '',
        terms_agreed: false,
    });

    // Teams the fan can support are pulled from the active tournament
    // (Wikipedia teams + config flag codes), never from a static WC list.
    const teams = [
        ...tournamentTeams.map(function (t) {
            return {
                name: t.value,
                iso: t.iso || '',
                flag: t.flag,
                icon: t.flag ? null : 'fas fa-futbol',
            };
        }),
        { name: 'Other', icon: 'fas fa-globe' },
    ];

    const submit = (e) => {
        e.preventDefault();
        post(route('register.complete.store'));
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 py-12">
             <Head title="Complete Profile">
             </Head>
             
             <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl">
                <div className="text-center mb-8">
                    <img src={`${assetUrl}assets/img/logo/TFE-logo.png`} alt="TFE" className="h-12 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Final Step</h2>
                    <p className="text-zinc-400">Please complete your profile to continue.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">WhatsApp Number <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <div style={{width: '120px'}}>
                                 <SearchableSelect
                                    options={countries}
                                    value={data.country_code}
                                    onChange={(val) => {
                                        const countryObj = countries.find(c => c.code === val);
                                        setData(prev => ({
                                            ...prev, 
                                            country_code: val,
                                            country: countryObj ? countryObj.value : prev.country
                                        }));
                                    }}
                                    placeholder="Code"
                                    labelKey="code"
                                    valueKey="code"
                                    searchKeys={['code', 'value', 'iso']}
                                    renderOption={(option) => (
                                        <div className="d-flex align-items-center justify-content-between w-100">
                                            <div className="d-flex align-items-center">
                                                <span className="text-white me-2 small">{option.iso}</span>
                                                <span className="text-white fw-bold">{option.code}</span>
                                            </div>
                                            <span className="text-white-50 small ms-2 text-truncate" style={{maxWidth: '80px'}}>{option.value}</span>
                                        </div>
                                    )}
                                />
                            </div>
                            <input
                                type="tel"
                                className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none"
                                placeholder="712 345 678"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    {/* Country */}
                     <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Country of Residence <span className="text-red-500">*</span></label>
                        <SearchableSelect
                            options={countries}
                            value={data.country}
                            onChange={(val) => setData('country', val)}
                            placeholder="Select Your Country"
                            labelKey="text"
                            valueKey="value"
                        />
                        {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                    </div>

                    {/* Team Support */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">Which team will you be supporting? <span className="text-red-500">*</span></label>
                        <div className="team-grid" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', 
                            gap: '8px',
                            width: '100%' 
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
                                        textAlign: 'center'
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

                    {/* Terms */}
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

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Saving...' : 'Complete Registration'}
                    </button>
                </form>
             </div>
        </div>
    );
}
