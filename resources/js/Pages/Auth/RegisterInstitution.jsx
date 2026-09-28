import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import StepFlow from '@/Components/Common/StepFlow';

/**
 * Institution sign-up (Sprint 62).
 *
 * A separate front door from the fan form because the questions are
 * different, not merely more numerous. A fan is asked which team they
 * support; an institution is asked what it is, where it is, and who is
 * authorised to act for it.
 *
 * Gated steps, so `StepFlow` rather than a tab rail — you cannot claim
 * authority for an institution you have not yet named.
 */
const STEPS = [
    { title: 'Institution', icon: 'fas fa-school' },
    { title: 'Appointed official', icon: 'fas fa-user-tie' },
    { title: 'Account', icon: 'fas fa-lock' },
];

export default function RegisterInstitution({ institutionTypes = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        institution_name: '',
        institution_type: 'school',
        registration_number: '',
        country: '',
        city: '',
        address: '',
        first_name: '',
        last_name: '',
        official_role: '',
        contact_phone: '',
        email: '',
        password: '',
        password_confirmation: '',
        authority_confirmed: false,
        terms_agreed: false,
        privacy_consent: false,
    });

    const [step, setStep] = useState(1);

    const institutionReady = Boolean(
        data.institution_name.trim() && data.institution_type && data.country.trim(),
    );
    const officialReady = Boolean(
        data.first_name.trim() && data.last_name.trim() && data.official_role.trim(),
    );
    const accountReady = Boolean(
        data.email.trim() && data.password && data.password_confirmation
        && data.authority_confirmed && data.terms_agreed && data.privacy_consent,
    );

    const submit = (e) => {
        e.preventDefault();
        post(route('register.institution'));
    };

    return (
        <AuthLayout
            title="Register your institution"
            subtitle="For schools, universities, academies, clubs and community groups travelling as a group."
            head="Institution sign-up"
            wide
            heroHeadline="Bring the whole group."
            heroTagline="Plan, declare and book a group trip in one place — with the partners who handle them."
            chips={[
                { icon: 'fas fa-school', label: 'Schools & clubs' },
                { icon: 'fas fa-users', label: 'Group travel' },
                { icon: 'fas fa-graduation-cap', label: 'Learning Hub' },
            ]}
            backHref="/register"
            backLabel="Individual sign-up"
            backIcon="fas fa-user"
        >
            <StepFlow
                variant="inline"
                className="mb-4"
                label={`Step ${step} of ${STEPS.length}`}
                steps={STEPS}
                cursor={step}
            />

            <form onSubmit={submit}>
                {step === 1 && (
                    <>
                        <div className="tfe-form-field">
                            <label className="tfe-form-label" htmlFor="ri-name">Institution name</label>
                            <input
                                id="ri-name" type="text" className="tfe-input" autoFocus
                                value={data.institution_name}
                                onChange={(e) => setData('institution_name', e.target.value)}
                                placeholder="Nairobi Girls High School"
                            />
                            {errors.institution_name && <div className="tfe-form-error">{errors.institution_name}</div>}
                        </div>

                        <div className="tfe-form-grid tfe-form-grid--2">
                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="ri-type">What kind of institution?</label>
                                <select
                                    id="ri-type" className="tfe-select"
                                    value={data.institution_type}
                                    onChange={(e) => setData('institution_type', e.target.value)}
                                >
                                    {Object.entries(institutionTypes).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                                {errors.institution_type && <div className="tfe-form-error">{errors.institution_type}</div>}
                            </div>

                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="ri-reg">
                                    Registration number <span className="text-white-50">(optional)</span>
                                </label>
                                <input
                                    id="ri-reg" type="text" className="tfe-input"
                                    value={data.registration_number}
                                    onChange={(e) => setData('registration_number', e.target.value)}
                                    placeholder="Ministry or authority reference"
                                />
                                {/* Optional on purpose: a community group may
                                    hold none, and a required field that forces
                                    an invention is worse than no field. */}
                                <div className="tfe-form-help">Speeds up verification. Leave blank if you have none.</div>
                                {errors.registration_number && <div className="tfe-form-error">{errors.registration_number}</div>}
                            </div>

                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="ri-country">Country</label>
                                <input
                                    id="ri-country" type="text" className="tfe-input"
                                    value={data.country}
                                    onChange={(e) => setData('country', e.target.value)}
                                    placeholder="Kenya"
                                />
                                {errors.country && <div className="tfe-form-error">{errors.country}</div>}
                            </div>

                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="ri-city">
                                    City or town <span className="text-white-50">(optional)</span>
                                </label>
                                <input
                                    id="ri-city" type="text" className="tfe-input"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    placeholder="Nairobi"
                                />
                                {errors.city && <div className="tfe-form-error">{errors.city}</div>}
                            </div>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <p className="tfe-form-help mb-3">
                            The person authorised to plan and book on the institution's behalf. They are
                            who a travel partner contacts, and who TFE reaches if there is a question or
                            a dispute later.
                        </p>

                        <div className="tfe-form-grid tfe-form-grid--2">
                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="ri-first">First name</label>
                                <input
                                    id="ri-first" type="text" className="tfe-input" autoFocus
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                />
                                {errors.first_name && <div className="tfe-form-error">{errors.first_name}</div>}
                            </div>

                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="ri-last">Last name</label>
                                <input
                                    id="ri-last" type="text" className="tfe-input"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                />
                                {errors.last_name && <div className="tfe-form-error">{errors.last_name}</div>}
                            </div>

                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="ri-role">Their role</label>
                                <input
                                    id="ri-role" type="text" className="tfe-input"
                                    value={data.official_role}
                                    onChange={(e) => setData('official_role', e.target.value)}
                                    placeholder="Deputy Head, Games"
                                />
                                {errors.official_role && <div className="tfe-form-error">{errors.official_role}</div>}
                            </div>

                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="ri-phone">
                                    Phone <span className="text-white-50">(optional)</span>
                                </label>
                                <input
                                    id="ri-phone" type="tel" className="tfe-input"
                                    value={data.contact_phone}
                                    onChange={(e) => setData('contact_phone', e.target.value)}
                                    placeholder="+254 20 555 0142"
                                />
                                {errors.contact_phone && <div className="tfe-form-error">{errors.contact_phone}</div>}
                            </div>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div className="tfe-form-field">
                            <label className="tfe-form-label" htmlFor="ri-email">Institution email</label>
                            <input
                                id="ri-email" type="email" className="tfe-input" autoFocus
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="games@school.ac.ke"
                            />
                            <div className="tfe-form-help">
                                Use the institution's own address, not a personal one — it is what a
                                partner replies to, and what identifies the account later.
                            </div>
                            {errors.email && <div className="tfe-form-error">{errors.email}</div>}
                        </div>

                        <div className="tfe-form-grid tfe-form-grid--2">
                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="ri-pass">Password</label>
                                <input
                                    id="ri-pass" type="password" className="tfe-input"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                {errors.password && <div className="tfe-form-error">{errors.password}</div>}
                            </div>

                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="ri-pass2">Confirm password</label>
                                <input
                                    id="ri-pass2" type="password" className="tfe-input"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-3 mt-3">
                            <label className="tfe-check">
                                <input
                                    type="checkbox"
                                    checked={data.authority_confirmed}
                                    onChange={(e) => setData('authority_confirmed', e.target.checked)}
                                />
                                <span>
                                    <strong>I am authorised to act for this institution</strong>
                                    <small className="text-white-50">
                                        Group requests made from this account are made on the institution's
                                        behalf. TFE verifies institutions before a group trip is confirmed.
                                    </small>
                                </span>
                            </label>
                            {errors.authority_confirmed && <div className="tfe-form-error">{errors.authority_confirmed}</div>}

                            <label className="tfe-check">
                                <input
                                    type="checkbox"
                                    checked={data.terms_agreed}
                                    onChange={(e) => setData('terms_agreed', e.target.checked)}
                                />
                                <span>I agree to the platform's terms and conditions.</span>
                            </label>
                            {errors.terms_agreed && <div className="tfe-form-error">{errors.terms_agreed}</div>}

                            <label className="tfe-check">
                                <input
                                    type="checkbox"
                                    checked={data.privacy_consent}
                                    onChange={(e) => setData('privacy_consent', e.target.checked)}
                                />
                                <span>I have read the privacy policy.</span>
                            </label>
                            {errors.privacy_consent && <div className="tfe-form-error">{errors.privacy_consent}</div>}
                        </div>
                    </>
                )}

                <div className="d-flex justify-content-between align-items-center gap-2 mt-4">
                    {step > 1 ? (
                        <button type="button" className="tfe-btn" onClick={() => setStep(step - 1)}>
                            Back
                        </button>
                    ) : (
                        <Link href={route('register')} className="tfe-btn">
                            Individual instead
                        </Link>
                    )}

                    {step < STEPS.length ? (
                        <button
                            type="button"
                            className="tfe-btn tfe-btn--filled"
                            disabled={step === 1 ? !institutionReady : !officialReady}
                            onClick={() => setStep(step + 1)}
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="tfe-btn tfe-btn--filled"
                            disabled={processing || !accountReady}
                        >
                            {processing ? 'Creating…' : 'Create institution account'}
                        </button>
                    )}
                </div>
            </form>

            <p className="tfe-form-help text-center mt-4 mb-0">
                Already registered? <Link href={route('login')} className="text-white">Sign in</Link>
            </p>
        </AuthLayout>
    );
}
