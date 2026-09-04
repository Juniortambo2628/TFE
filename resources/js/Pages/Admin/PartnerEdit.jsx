import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import { Link, useForm } from '@inertiajs/react';

/**
 * Admin partner edit page — Sprint 9.
 *
 * One form for both the user-side fields (partner_type,
 * verification_status, services_offered) AND the profile-side content
 * (hero, tagline, about, theme, stats, service_tags, contact, hub
 * visibility). Save posts to /admin/partners/{user}.
 *
 * Stats + service_tags are edited as newline-separated text areas that
 * we serialise on submit — a full JSON editor is overkill for MVP.
 */
export default function PartnerEdit({ auth, partner, profile, partner_types = {} }) {
    const { data, setData, put, processing, errors } = useForm({
        partner_type: partner.partner_type || '',
        verification_status: partner.verification_status || 'unverified',
        services_offered: (partner.services_offered || []).join('\n'),
        display_name: profile.display_name || '',
        tagline: profile.tagline || '',
        about: profile.about || '',
        hero_image: profile.hero_image || '',
        logo_url: profile.logo_url || '',
        theme_accent: profile.theme_accent || '#dc143c',
        stats_text: stringifyStats(profile.stats),
        service_tags: (profile.service_tags || []).join('\n'),
        contact_email: profile.contact_email || '',
        contact_phone: profile.contact_phone || '',
        website_url: profile.website_url || '',
        is_public: !!profile.is_public,
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Partners', href: route('admin.partners.index') },
        { label: partner.name },
    ];

    const submit = (e) => {
        e.preventDefault();
        const payload = {
            ...data,
            // Newline-separated → array. Empty lines dropped.
            services_offered: linesToArray(data.services_offered),
            service_tags: linesToArray(data.service_tags),
            stats: parseStats(data.stats_text),
        };
        // Drop the raw text field the server doesn't expect.
        delete payload.stats_text;
        put(route('admin.partners.update', partner.id), {
            data: payload,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title={`Edit ${partner.name}`}>
            <DashboardHero
                role="admin"
                title={`Edit ${profile.display_name || partner.name}`}
                subtitle="Manage archetype, verification and the partner's branded /partners/{slug} hub."
                breadcrumbs={breadcrumbs}
                action={profile.public_url ? {
                    label: 'View hub',
                    icon: 'fas fa-external-link-alt',
                    onClick: () => window.open(profile.public_url, '_blank'),
                } : null}
            />

            <form onSubmit={submit}>
                <div className="row g-4">
                    {/* Left: user-side controls */}
                    <div className="col-lg-4">
                        <div className="admin-card-dark">
                            <div className="card-header">
                                <h3><i className="fas fa-user-shield"></i> Partner controls</h3>
                            </div>
                            <div className="card-body">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Archetype</label>
                                    <select
                                        className="admin-form-input"
                                        value={data.partner_type}
                                        onChange={(e) => setData('partner_type', e.target.value)}
                                    >
                                        <option value="">— Select —</option>
                                        {Object.entries(partner_types).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Verification</label>
                                    <select
                                        className="admin-form-input"
                                        value={data.verification_status}
                                        onChange={(e) => setData('verification_status', e.target.value)}
                                    >
                                        <option value="unverified">Unverified</option>
                                        <option value="pending">Pending review</option>
                                        <option value="verified">Verified</option>
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Services offered</label>
                                    <textarea
                                        className="admin-form-input"
                                        rows="4"
                                        value={data.services_offered}
                                        onChange={(e) => setData('services_offered', e.target.value)}
                                        placeholder={'One service per line\nTicket bundling\nHotel bookings'}
                                    />
                                    <small className="text-white-50">One per line.</small>
                                </div>
                                <div className="admin-form-group">
                                    <label className="d-flex align-items-center gap-2 text-white">
                                        <input
                                            type="checkbox"
                                            checked={data.is_public}
                                            onChange={(e) => setData('is_public', e.target.checked)}
                                        />
                                        <span>
                                            <span className="fw-semibold">Publish hub</span>
                                            <span className="d-block text-white-50 small">
                                                /partners/{profile.slug} becomes public.
                                            </span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: hub content */}
                    <div className="col-lg-8">
                        <div className="admin-card-dark">
                            <div className="card-header">
                                <h3><i className="fas fa-store"></i> Branded hub content</h3>
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-8">
                                        <label className="admin-form-label">Display name *</label>
                                        <input
                                            className="admin-form-input"
                                            value={data.display_name}
                                            onChange={(e) => setData('display_name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="admin-form-label">Theme accent</label>
                                        <input
                                            type="color"
                                            className="admin-form-input"
                                            style={{ height: 40, padding: 4 }}
                                            value={data.theme_accent}
                                            onChange={(e) => setData('theme_accent', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="admin-form-label">Tagline</label>
                                        <input
                                            className="admin-form-input"
                                            value={data.tagline}
                                            onChange={(e) => setData('tagline', e.target.value)}
                                            placeholder="One-line hero subtitle"
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="admin-form-label">About</label>
                                        <textarea
                                            className="admin-form-input"
                                            rows="4"
                                            value={data.about}
                                            onChange={(e) => setData('about', e.target.value)}
                                            placeholder="Long-form partner description."
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="admin-form-label">Hero image URL</label>
                                        <input
                                            className="admin-form-input"
                                            value={data.hero_image}
                                            onChange={(e) => setData('hero_image', e.target.value)}
                                            placeholder="/storage/…jpg or full URL"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="admin-form-label">Logo URL</label>
                                        <input
                                            className="admin-form-input"
                                            value={data.logo_url}
                                            onChange={(e) => setData('logo_url', e.target.value)}
                                            placeholder="/storage/…png"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="admin-form-label">Contact email</label>
                                        <input
                                            className="admin-form-input"
                                            type="email"
                                            value={data.contact_email}
                                            onChange={(e) => setData('contact_email', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="admin-form-label">Website</label>
                                        <input
                                            className="admin-form-input"
                                            value={data.website_url}
                                            onChange={(e) => setData('website_url', e.target.value)}
                                            placeholder="https://…"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="admin-form-label">Service tags</label>
                                        <textarea
                                            className="admin-form-input"
                                            rows="4"
                                            value={data.service_tags}
                                            onChange={(e) => setData('service_tags', e.target.value)}
                                            placeholder={'One per line — chips on the hub.'}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="admin-form-label">Stats band</label>
                                        <textarea
                                            className="admin-form-input"
                                            rows="4"
                                            value={data.stats_text}
                                            onChange={(e) => setData('stats_text', e.target.value)}
                                            placeholder={'One per line as label|value\nCountries|15+\nFans reached|100K+'}
                                        />
                                        <small className="text-white-50">Format: <code>Label|Value</code>, one per line.</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 d-flex gap-2">
                    <Link href={route('admin.partners.index')} className="btn-admin-outline">
                        <i className="fas fa-arrow-left me-2"></i>Back
                    </Link>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={processing}
                        style={{ marginLeft: 'auto' }}
                    >
                        <i className="fas fa-save me-2"></i>
                        {processing ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}

function linesToArray(text) {
    return (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
}

function stringifyStats(stats) {
    if (!Array.isArray(stats)) return '';
    return stats.map((s) => `${s.label || ''}|${s.value || ''}`).join('\n');
}

function parseStats(text) {
    return (text || '').split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
            const [label, value] = l.split('|').map((s) => (s || '').trim());
            return { label, value };
        })
        .filter((s) => s.label && s.value);
}
