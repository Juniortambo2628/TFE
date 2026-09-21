import React, { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Common/Breadcrumbs';
import TfeModal from '@/Components/Common/TfeModal';
import ImageUpload from '@/Components/Common/ImageUpload';
import '../../../css/fan/fan-pages.css';

/**
 * Partner Profile — account details plus the branding that drives the
 * partner's public card (/partners) and hub (/partners/{slug}). Editing
 * happens in the shared TfeModal (matches the New-listing dialog), so a
 * partner can self-serve their appearance without an admin.
 */
export default function Profile({ profile }) {
    const { flash } = usePage().props;
    const [open, setOpen] = useState(false);
    const b = profile.branding || {};

    const form = useForm({
        name: profile.name || '',
        phone: profile.phone || '',
        company_name: profile.company_name || '',
        company_address: profile.company_address || '',
        avatar: profile.avatar || '',
        avatar_file: null,
        display_name: b.display_name || '',
        tagline: b.tagline || '',
        about: b.about || '',
        theme_accent: b.theme_accent || '#dc2626',
        website_url: b.website_url || '',
        contact_email: b.contact_email || '',
        service_tags_text: (b.service_tags || []).join(', '),
        is_public: !!b.is_public,
        logo_url: b.logo_url || '',
        logo_file: null,
        hero_image: b.hero_image || '',
        hero_image_file: null,
    });
    const { data, setData, processing, errors } = form;

    const submit = (e) => {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            service_tags: d.service_tags_text.split(',').map((t) => t.trim()).filter(Boolean),
        }));
        form.post(route('partner.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <PartnerLayout title="Profile">
            <Head title="Profile - Partner" />

            <div className={`dash-card partner-profile-hero`}
                style={b.hero_image ? { backgroundImage: `url(${b.hero_image})` } : {}}>
                {!b.hero_image && <div className="partner-profile-overlay"></div>}
                <div className="partner-profile-content">
                    <Breadcrumbs title="Profile" breadcrumbs={[{ label: 'Profile' }]} accentColor="#d97706" homeRoute="partner.dashboard" />
                    <h1 className="dash-section-title"><i className="fas fa-user accent-partner"></i> My Profile</h1>
                    <p className="partner-profile-subtitle">Manage your account details and how your public hub looks to fans.</p>
                </div>
            </div>

            {flash?.success && (
                <div className="dash-flash-success"><i className="fas fa-check-circle me-2"></i>{flash.success}</div>
            )}

            <div className="dash-card dash-card-body">
                <div className="dash-flex-between dash-mb-xl">
                    <div className="dash-flex dash-gap-lg">
                        <div className="dash-avatar dash-avatar-xl partner-avatar" style={{ borderColor: b.theme_accent }}>
                            {profile.avatar ? <img src={profile.avatar} alt={profile.name} className="dash-avatar-img" /> : profile.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="dash-text-primary dash-no-margin">{b.display_name || profile.name}</h3>
                            <p className="dash-text-muted dash-no-margin dash-text-base">{profile.email}</p>
                            <span className="dash-badge dash-badge-warning partner-badge-margin">{profile.partner_type_label || 'Partner'}</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        {b.hub_url && (
                            <a href={b.hub_url} target="_blank" rel="noopener noreferrer" className="tfe-btn tfe-btn--sm">
                                <i className="fas fa-arrow-up-right-from-square" /> View hub
                            </a>
                        )}
                        <button onClick={() => setOpen(true)} className="tfe-btn tfe-btn--sm tfe-btn--filled">
                            <i className="fas fa-pen" /> Edit profile
                        </button>
                    </div>
                </div>

                {/* Read-only summary */}
                <div className="dash-form-grid">
                    <Field label="Tagline" value={b.tagline} />
                    <Field label="Phone" value={profile.phone} />
                    <Field label="Company" value={profile.company_name} />
                    <Field label="Website" value={b.website_url} />
                    <div className="dash-col-full"><Field label="About" value={b.about} /></div>
                    <div className="dash-col-full">
                        <label className="dash-label">Service tags</label>
                        {(b.service_tags || []).length ? (
                            <div className="d-flex flex-wrap gap-2">
                                {b.service_tags.map((t) => <span key={t} className="tfe-pill tfe-pill--info">{t}</span>)}
                            </div>
                        ) : <div className="dash-field-value">Not set</div>}
                    </div>
                    <div className="dash-col-full">
                        <label className="dash-label">Public hub</label>
                        <div className="dash-field-value">
                            {b.is_public
                                ? <span className="accent-success"><i className="fas fa-circle-check me-1" /> Live at {b.hub_url}</span>
                                : <span className="dash-text-muted">Hidden — turn on "Show my hub publicly" to go live.</span>}
                        </div>
                    </div>
                </div>

                <div className="dash-top-divider">
                    <h4 className="dash-text-muted dash-text-base dash-mb-lg">Account Information</h4>
                    <div className="dash-flex dash-gap-xl dash-flex-wrap">
                        <div><span className="dash-info-label">Member since</span><p className="dash-info-value">{profile.created_at}</p></div>
                        <div><span className="dash-info-label">Account Type</span><p className="accent-partner dash-info-value">{profile.partner_type_label || 'Partner'}</p></div>
                    </div>
                </div>
            </div>

            <TfeModal open={open} title="Edit profile" onClose={() => setOpen(false)} size="lg">
                <form onSubmit={submit}>
                    <h4 className="tfe-form-section">Account</h4>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="tfe-form-label">Full name</label>
                            <input type="text" className="tfe-input" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            {errors.name && <div className="tfe-form-error">{errors.name}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="tfe-form-label">Phone</label>
                            <input type="text" className="tfe-input" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="tfe-form-label">Company name</label>
                            <input type="text" className="tfe-input" value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="tfe-form-label">Avatar / logo image</label>
                            <ImageUpload value={data.avatar} onFile={(f) => setData('avatar_file', f)} onClear={() => { setData('avatar', ''); setData('avatar_file', null); }} />
                        </div>
                        <div className="col-12">
                            <label className="tfe-form-label">Company address</label>
                            <textarea className="tfe-textarea" rows={2} value={data.company_address} onChange={(e) => setData('company_address', e.target.value)} />
                        </div>
                    </div>

                    <h4 className="tfe-form-section mt-4">Public hub appearance</h4>
                    <div className="row g-3">
                        <div className="col-md-8">
                            <label className="tfe-form-label">Display name</label>
                            <input type="text" className="tfe-input" value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} placeholder="How your brand appears to fans" />
                        </div>
                        <div className="col-md-4">
                            <label className="tfe-form-label">Accent colour</label>
                            <div className="d-flex gap-2 align-items-center">
                                <input type="color" className="tfe-color-swatch" value={data.theme_accent} onChange={(e) => setData('theme_accent', e.target.value)} aria-label="Accent colour" />
                                <input type="text" className="tfe-input" value={data.theme_accent} onChange={(e) => setData('theme_accent', e.target.value)} />
                            </div>
                        </div>
                        <div className="col-12">
                            <label className="tfe-form-label">Tagline</label>
                            <input type="text" className="tfe-input" value={data.tagline} onChange={(e) => setData('tagline', e.target.value)} placeholder="One line that sells your brand" />
                        </div>
                        <div className="col-12">
                            <label className="tfe-form-label">About</label>
                            <textarea className="tfe-textarea" rows={3} value={data.about} onChange={(e) => setData('about', e.target.value)} />
                        </div>
                        <div className="col-12">
                            <label className="tfe-form-label">Service tags <span className="tfe-form-help">(comma-separated)</span></label>
                            <input type="text" className="tfe-input" value={data.service_tags_text} onChange={(e) => setData('service_tags_text', e.target.value)} placeholder="Matchday flights, Group fares, Flexible dates" />
                        </div>
                        <div className="col-md-6">
                            <label className="tfe-form-label">Website</label>
                            <input type="url" className="tfe-input" value={data.website_url} onChange={(e) => setData('website_url', e.target.value)} placeholder="https://…" />
                            {errors.website_url && <div className="tfe-form-error">{errors.website_url}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="tfe-form-label">Public contact email</label>
                            <input type="email" className="tfe-input" value={data.contact_email} onChange={(e) => setData('contact_email', e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="tfe-form-label">Hub hero image</label>
                            <ImageUpload value={data.hero_image} onFile={(f) => setData('hero_image_file', f)} onClear={() => { setData('hero_image', ''); setData('hero_image_file', null); }} />
                        </div>
                        <div className="col-md-6 d-flex align-items-end">
                            <label className="tfe-check">
                                <input type="checkbox" checked={data.is_public} onChange={(e) => setData('is_public', e.target.checked)} />
                                <span>Show my hub publicly at /partners</span>
                            </label>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button type="button" className="tfe-btn" onClick={() => setOpen(false)}>Cancel</button>
                        <button type="submit" className="tfe-btn tfe-btn--filled" disabled={processing}>
                            {processing ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </TfeModal>
        </PartnerLayout>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <label className="dash-label">{label}</label>
            <div className="dash-field-value">{value || 'Not set'}</div>
        </div>
    );
}
