import React from 'react';
import { useForm } from '@inertiajs/react';
import InstitutionLayout from '@/Layouts/InstitutionLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import ContentCard from '@/Components/Common/ContentCard';
import SplitEditorLayout from '@/Components/Common/SplitEditorLayout';
import IdentityPreview from '@/Components/Common/IdentityPreview';

/**
 * The institution's own record (Sprint 62).
 *
 * Form left, live preview right, like every other account surface on the
 * platform. `verification_status` is shown but never editable — an account
 * that could mark itself verified is an account whose verification is worth
 * nothing.
 */
export default function InstitutionProfile({ profile, institutionTypes = {} }) {
    const { data, setData, put, processing, errors, isDirty } = useForm({
        institution_name: profile.institution_name || '',
        institution_type: profile.institution_type || 'school',
        registration_number: profile.registration_number || '',
        country: profile.country || '',
        city: profile.city || '',
        address: profile.address || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        official_role: profile.official_role || '',
        contact_phone: profile.contact_phone || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('institution.profile.update'), { preserveScroll: true });
    };

    const location = [data.city, data.country].filter(Boolean).join(', ');

    const preview = (
        <IdentityPreview
            name={data.institution_name || 'Your institution'}
            sub={institutionTypes[data.institution_type] || 'Institution'}
            accent="#0d9488"
            badge={`Verification ${profile.verification_status || 'pending'}`}
            rows={[
                { icon: 'fas fa-user-tie', value: [`${data.first_name} ${data.last_name}`.trim(), data.official_role].filter(Boolean).join(' · ') },
                { icon: 'fas fa-envelope', value: profile.email },
                { icon: 'fas fa-phone', value: data.contact_phone },
                { icon: 'fas fa-location-dot', value: location },
                { icon: 'fas fa-hashtag', value: data.registration_number },
            ]}
        />
    );

    return (
        <InstitutionLayout title="Institution">
            <div className="container-fluid">
                <DashboardHero
                    role="institution"
                    title="Institution details"
                    subtitle="Who you are, and who is authorised to act for you."
                    breadcrumbs={[
                        { label: 'Group Dashboard', href: route('institution.dashboard') },
                        { label: 'Institution' },
                    ]}
                    bgImage="/assets/img/backdrops/stadium-fans.jpg"
                />

                <div className="mt-4">
                    <SplitEditorLayout preview={preview}>
                        <form onSubmit={submit} id="institution-form">
                            <ContentCard title="The institution">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="ip-name">Institution name</label>
                                    <input
                                        id="ip-name" type="text" className="tfe-input"
                                        value={data.institution_name}
                                        onChange={(e) => setData('institution_name', e.target.value)}
                                    />
                                    {errors.institution_name && <div className="tfe-form-error">{errors.institution_name}</div>}
                                </div>

                                <div className="tfe-form-grid tfe-form-grid--2">
                                    <div className="tfe-form-field">
                                        <label className="tfe-form-label" htmlFor="ip-type">Type</label>
                                        <select
                                            id="ip-type" className="tfe-select"
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
                                        <label className="tfe-form-label" htmlFor="ip-reg">
                                            Registration number <span className="text-white-50">(optional)</span>
                                        </label>
                                        <input
                                            id="ip-reg" type="text" className="tfe-input"
                                            value={data.registration_number}
                                            onChange={(e) => setData('registration_number', e.target.value)}
                                        />
                                        {errors.registration_number && <div className="tfe-form-error">{errors.registration_number}</div>}
                                    </div>

                                    <div className="tfe-form-field">
                                        <label className="tfe-form-label" htmlFor="ip-country">Country</label>
                                        <input
                                            id="ip-country" type="text" className="tfe-input"
                                            value={data.country}
                                            onChange={(e) => setData('country', e.target.value)}
                                        />
                                        {errors.country && <div className="tfe-form-error">{errors.country}</div>}
                                    </div>

                                    <div className="tfe-form-field">
                                        <label className="tfe-form-label" htmlFor="ip-city">
                                            City or town <span className="text-white-50">(optional)</span>
                                        </label>
                                        <input
                                            id="ip-city" type="text" className="tfe-input"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                        />
                                        {errors.city && <div className="tfe-form-error">{errors.city}</div>}
                                    </div>

                                    <div className="tfe-form-field tfe-form-field--wide">
                                        <label className="tfe-form-label" htmlFor="ip-address">
                                            Address <span className="text-white-50">(optional)</span>
                                        </label>
                                        <textarea
                                            id="ip-address" className="tfe-textarea" rows="2" maxLength={500}
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                        />
                                        {errors.address && <div className="tfe-form-error">{errors.address}</div>}
                                    </div>
                                </div>
                            </ContentCard>

                            <div className="mt-3">
                                <ContentCard
                                    title="Appointed official"
                                    subtitle="Who a travel partner contacts, and who TFE reaches about a group request."
                                >
                                    <div className="tfe-form-grid tfe-form-grid--2">
                                        <div className="tfe-form-field">
                                            <label className="tfe-form-label" htmlFor="ip-first">First name</label>
                                            <input
                                                id="ip-first" type="text" className="tfe-input"
                                                value={data.first_name}
                                                onChange={(e) => setData('first_name', e.target.value)}
                                            />
                                            {errors.first_name && <div className="tfe-form-error">{errors.first_name}</div>}
                                        </div>

                                        <div className="tfe-form-field">
                                            <label className="tfe-form-label" htmlFor="ip-last">Last name</label>
                                            <input
                                                id="ip-last" type="text" className="tfe-input"
                                                value={data.last_name}
                                                onChange={(e) => setData('last_name', e.target.value)}
                                            />
                                            {errors.last_name && <div className="tfe-form-error">{errors.last_name}</div>}
                                        </div>

                                        <div className="tfe-form-field">
                                            <label className="tfe-form-label" htmlFor="ip-role">Their role</label>
                                            <input
                                                id="ip-role" type="text" className="tfe-input"
                                                value={data.official_role}
                                                onChange={(e) => setData('official_role', e.target.value)}
                                            />
                                            {errors.official_role && <div className="tfe-form-error">{errors.official_role}</div>}
                                        </div>

                                        <div className="tfe-form-field">
                                            <label className="tfe-form-label" htmlFor="ip-phone">
                                                Phone <span className="text-white-50">(optional)</span>
                                            </label>
                                            <input
                                                id="ip-phone" type="tel" className="tfe-input"
                                                value={data.contact_phone}
                                                onChange={(e) => setData('contact_phone', e.target.value)}
                                            />
                                            {errors.contact_phone && <div className="tfe-form-error">{errors.contact_phone}</div>}
                                        </div>
                                    </div>

                                    <p className="tfe-form-help mt-3 mb-0">
                                        Sign-in email is <strong className="text-white">{profile.email}</strong>. Change it on your
                                        security page.
                                    </p>
                                </ContentCard>
                            </div>

                            <div className="tfe-form-actions tfe-form-actions--sticky mt-3">
                                <span className="tfe-form-actions__note">
                                    {isDirty ? 'Unsaved changes' : 'All changes saved'}
                                </span>
                                <button type="submit" className="tfe-btn tfe-btn--filled" disabled={processing || !isDirty}>
                                    {processing ? 'Saving…' : 'Save institution details'}
                                </button>
                            </div>
                        </form>
                    </SplitEditorLayout>
                </div>
            </div>
        </InstitutionLayout>
    );
}
