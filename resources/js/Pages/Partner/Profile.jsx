import React from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { useForm, usePage } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import SplitEditorLayout from '@/Components/Common/SplitEditorLayout';
import HubPreview from '@/Components/Common/HubPreview';
import ImageUpload from '@/Components/Common/ImageUpload';

/**
 * Partner Profile — account details plus the branding that drives the
 * partner's public card (/partners) and hub (/partners/{slug}).
 *
 * Sprint 53: rebuilt on SplitEditorLayout, the same form-left /
 * live-preview-right arrangement as Admin → Tournaments and the Content CMS.
 * It used to be a read-only summary card with an "Edit profile" button that
 * opened a modal — so a partner could not see what their hub looked like
 * while they changed it, and the page's own chrome (`dash-card`,
 * `dash-field-value`, badges) matched nothing else on the platform. The
 * preview is the real `HubPreview` the admin partner editor uses, reading
 * live form state, so what the partner types is what fans will see.
 *
 * Sprint 56 gave it the same pass as the fan profile:
 *
 *  - the save bar sticks to the bottom of the viewport and says whether
 *    there is anything to save, instead of waiting at the end of a long
 *    scroll;
 *  - the avatar field renders as a round thumbnail (`variant="avatar"`)
 *    rather than through `compact`, whose preview is 320px tall — the
 *    default silhouette was filling half the form;
 *  - the two banner-sized image drops moved into their own "Hub imagery"
 *    card, out of the middle of a column of text inputs;
 *  - "Show my hub publicly" — the switch that decides whether any of this is
 *    visible at all — is a labelled setting row at the end, not a bare
 *    checkbox under the logo field;
 *  - and the Bootstrap `row` / `col-md-*` grid is gone in favour of
 *    `.tfe-form-grid`. (Those classes do work here — dashboards load
 *    Bootstrap's utilities + grid deliberately, Sprint 32 — but they are a
 *    second layout system with their own breakpoints, and the platform's
 *    own grid is what every other form should reach for.)
 */
export default function Profile({ profile }) {
    const { flash } = usePage().props;
    const b = profile.branding || {};

    const form = useForm({
        name: profile.name || '',
        company_name: profile.company_name || '',
        avatar: profile.avatar || '',
        avatar_file: null,
        display_name: b.display_name || '',
        tagline: b.tagline || '',
        about: b.about || '',
        theme_accent: b.theme_accent || '#dc2626',
        website_url: b.website_url || '',
        contact_email: b.contact_email || '',
        contact_phone: b.contact_phone || '',
        service_tags_text: (b.service_tags || []).join(', '),
        is_public: !!b.is_public,
        logo_url: b.logo_url || '',
        logo_file: null,
        hero_image: b.hero_image || '',
        hero_image_file: null,
    });
    const { data, setData, processing, errors, isDirty } = form;

    const submit = (e) => {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            service_tags: d.service_tags_text.split(',').map((t) => t.trim()).filter(Boolean),
        }));
        form.post(route('partner.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    // HubPreview reads form state directly, so the pane updates as you type.
    // An image only changes on save — the stored URL is what it renders.
    const previewData = {
        ...data,
        slug: b.slug,
        service_tags: data.service_tags_text.split(',').map((t) => t.trim()).filter(Boolean),
    };

    return (
        <PartnerLayout title="Profile">
            <DashboardHero
                role="partner"
                title="My Profile"
                subtitle="Manage your account details and how your public hub looks to fans."
                breadcrumbs={[{ label: 'Profile' }]}
                bgImage={b.hero_image || undefined}
            />

            {flash?.success && (
                <div className="dash-flash-success"><i className="fas fa-check-circle me-2" />{flash.success}</div>
            )}

            <SplitEditorLayout
                previewTitle="Live preview"
                preview={(
                    <>
                        <HubPreview
                            data={previewData}
                            partnerName={profile.name}
                            partnerTypeLabel={profile.partner_type_label}
                        />
                        <div className="tfe-slab">
                            <div className="tfe-slab__body">
                                <div className="tfe-security-stat">
                                    <span>Public hub</span>
                                    <span className={`tfe-pill ${data.is_public ? 'tfe-pill--approved' : 'tfe-pill--pending'}`}>
                                        {data.is_public ? 'Live' : 'Hidden'}
                                    </span>
                                </div>
                                <div className="tfe-security-stat">
                                    <span>Account type</span>
                                    <strong>{profile.partner_type_label || 'Partner'}</strong>
                                </div>
                                <div className="tfe-security-stat">
                                    <span>Member since</span>
                                    <strong>{profile.created_at}</strong>
                                </div>
                            </div>
                            {b.hub_url && (
                                <div className="tfe-slab__body pt-0">
                                    <a href={b.hub_url} target="_blank" rel="noopener noreferrer" className="tfe-btn tfe-btn--sm w-100 justify-content-center">
                                        <i className="fas fa-arrow-up-right-from-square" /> View hub
                                    </a>
                                </div>
                            )}
                        </div>
                    </>
                )}
            >
                <form onSubmit={submit} className="tfe-editor-stack">
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">
                                <i className="fas fa-user-circle me-2" aria-hidden="true" /> Account
                            </h3>
                            <span className="tfe-slab__title-sub">{profile.partner_type_label || 'Partner'}</span>
                        </div>
                        <div className="tfe-slab__body">
                            <div className="tfe-form-field">
                                <label className="tfe-form-label">Avatar / logo image</label>
                                <ImageUpload
                                    variant="avatar"
                                    label="Choose image"
                                    value={data.avatar}
                                    onFile={(f) => setData('avatar_file', f)}
                                    onClear={() => { setData('avatar', ''); setData('avatar_file', null); }}
                                />
                                {errors.avatar_file && <div className="tfe-form-error">{errors.avatar_file}</div>}
                            </div>

                            <div className="tfe-form-grid tfe-form-grid--2">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="partner-name">Full name</label>
                                    <input
                                        id="partner-name"
                                        type="text"
                                        className="tfe-input"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    {errors.name && <div className="tfe-form-error">{errors.name}</div>}
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="partner-company">Company name</label>
                                    <input
                                        id="partner-company"
                                        type="text"
                                        className="tfe-input"
                                        value={data.company_name}
                                        onChange={(e) => setData('company_name', e.target.value)}
                                    />
                                    {errors.company_name && <div className="tfe-form-error">{errors.company_name}</div>}
                                </div>
                                <div className="tfe-form-field tfe-form-field--wide">
                                    <label className="tfe-form-label" htmlFor="partner-email">Email address</label>
                                    <input
                                        id="partner-email"
                                        type="email"
                                        className="tfe-input"
                                        value={profile.email}
                                        disabled
                                        title="Email cannot be changed"
                                    />
                                    <p className="tfe-form-help">
                                        Your sign-in address. Fans reach you on the public contact details below,
                                        not here.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">
                                <i className="fas fa-palette me-2" aria-hidden="true" /> Public hub appearance
                            </h3>
                            <span className="tfe-slab__title-sub">What fans see at /partners</span>
                        </div>
                        <div className="tfe-slab__body">
                            <div className="tfe-form-grid tfe-form-grid--2">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="partner-display-name">Display name</label>
                                    <input
                                        id="partner-display-name"
                                        type="text"
                                        className="tfe-input"
                                        value={data.display_name}
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        placeholder="How your brand appears to fans"
                                    />
                                    {errors.display_name && <div className="tfe-form-error">{errors.display_name}</div>}
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="partner-accent">Accent colour</label>
                                    <div className="tfe-color-field">
                                        <input
                                            type="color"
                                            className="tfe-color-swatch"
                                            value={data.theme_accent}
                                            onChange={(e) => setData('theme_accent', e.target.value)}
                                            aria-label="Accent colour"
                                        />
                                        <input
                                            id="partner-accent"
                                            type="text"
                                            className="tfe-input"
                                            value={data.theme_accent}
                                            onChange={(e) => setData('theme_accent', e.target.value)}
                                        />
                                    </div>
                                    {errors.theme_accent && <div className="tfe-form-error">{errors.theme_accent}</div>}
                                </div>
                                <div className="tfe-form-field tfe-form-field--wide">
                                    <label className="tfe-form-label" htmlFor="partner-tagline">Tagline</label>
                                    <input
                                        id="partner-tagline"
                                        type="text"
                                        className="tfe-input"
                                        value={data.tagline}
                                        onChange={(e) => setData('tagline', e.target.value)}
                                        placeholder="One line that sells your brand"
                                    />
                                    {errors.tagline && <div className="tfe-form-error">{errors.tagline}</div>}
                                </div>
                                <div className="tfe-form-field tfe-form-field--wide">
                                    <label className="tfe-form-label" htmlFor="partner-about">About</label>
                                    <textarea
                                        id="partner-about"
                                        className="tfe-textarea"
                                        rows={4}
                                        value={data.about}
                                        onChange={(e) => setData('about', e.target.value)}
                                    />
                                    {errors.about && <div className="tfe-form-error">{errors.about}</div>}
                                </div>
                                <div className="tfe-form-field tfe-form-field--wide">
                                    <label className="tfe-form-label" htmlFor="partner-tags">Service tags</label>
                                    <input
                                        id="partner-tags"
                                        type="text"
                                        className="tfe-input"
                                        value={data.service_tags_text}
                                        onChange={(e) => setData('service_tags_text', e.target.value)}
                                        placeholder="Matchday flights, Group fares, Flexible dates"
                                    />
                                    <p className="tfe-form-help">
                                        Comma-separated. They render as the chips under “What we offer”.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Imagery is its own card: two banner-sized drop zones do
                        not belong in the middle of a column of text inputs. */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">
                                <i className="fas fa-image me-2" aria-hidden="true" /> Hub imagery
                            </h3>
                            <span className="tfe-slab__title-sub">Hero banner + logo</span>
                        </div>
                        <div className="tfe-slab__body">
                            <div className="tfe-form-grid tfe-form-grid--2">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label">Hub hero image</label>
                                    <ImageUpload
                                        value={data.hero_image}
                                        onFile={(f) => setData('hero_image_file', f)}
                                        onClear={() => { setData('hero_image', ''); setData('hero_image_file', null); }}
                                    />
                                    {errors.hero_image_file && <div className="tfe-form-error">{errors.hero_image_file}</div>}
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label">Hub logo</label>
                                    <ImageUpload
                                        value={data.logo_url}
                                        onFile={(f) => setData('logo_file', f)}
                                        onClear={() => { setData('logo_url', ''); setData('logo_file', null); }}
                                    />
                                    {errors.logo_file && <div className="tfe-form-error">{errors.logo_file}</div>}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">
                                <i className="fas fa-address-card me-2" aria-hidden="true" /> Public contact
                            </h3>
                            <span className="tfe-slab__title-sub">Shown on your hub</span>
                        </div>
                        <div className="tfe-slab__body">
                            <div className="tfe-form-grid tfe-form-grid--3">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="partner-website">Website</label>
                                    <input
                                        id="partner-website"
                                        type="url"
                                        className="tfe-input"
                                        value={data.website_url}
                                        onChange={(e) => setData('website_url', e.target.value)}
                                        placeholder="https://…"
                                    />
                                    {errors.website_url && <div className="tfe-form-error">{errors.website_url}</div>}
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="partner-contact-email">Contact email</label>
                                    <input
                                        id="partner-contact-email"
                                        type="email"
                                        className="tfe-input"
                                        value={data.contact_email}
                                        onChange={(e) => setData('contact_email', e.target.value)}
                                    />
                                    {errors.contact_email && <div className="tfe-form-error">{errors.contact_email}</div>}
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="partner-contact-phone">Contact phone</label>
                                    <input
                                        id="partner-contact-phone"
                                        type="tel"
                                        className="tfe-input"
                                        value={data.contact_phone}
                                        onChange={(e) => setData('contact_phone', e.target.value)}
                                        placeholder="+254 700 000 000"
                                    />
                                    {errors.contact_phone && <div className="tfe-form-error">{errors.contact_phone}</div>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* The one switch that decides whether any of the above is
                        visible to a fan, so it gets its own card at the end
                        rather than a stray checkbox under the logo field. */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">
                                <i className="fas fa-eye me-2" aria-hidden="true" /> Visibility
                            </h3>
                        </div>
                        <div className="tfe-slab__body">
                            <div className="tfe-setting-row">
                                <div>
                                    <h4>Show my hub publicly</h4>
                                    <p>
                                        Lists you in the partner directory at /partners
                                        {b.slug ? ` and publishes /partners/${b.slug}.` : '.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className={`toggle-switch ${data.is_public ? 'active' : ''}`}
                                    onClick={() => setData('is_public', !data.is_public)}
                                    aria-pressed={data.is_public}
                                    aria-label="Show my hub publicly"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="tfe-form-actions tfe-form-actions--sticky">
                        <p className="tfe-form-actions__note">
                            {isDirty ? 'You have unsaved changes.' : 'Everything is saved.'}
                        </p>
                        <button type="submit" className="tfe-btn tfe-btn--filled" disabled={processing || !isDirty}>
                            {processing ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </SplitEditorLayout>
        </PartnerLayout>
    );
}
