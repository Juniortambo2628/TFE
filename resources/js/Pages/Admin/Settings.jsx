import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import ImageUpload from '@/Components/Common/ImageUpload';
import SplitEditorLayout from '@/Components/Common/SplitEditorLayout';
import IdentityPreview from '@/Components/Common/IdentityPreview';
import { assetPath } from '@/lib/assets';
import { useForm, usePage } from '@inertiajs/react';

/**
 * Site settings — site identity, branding, social, SEO, maintenance. Every
 * image field goes through <ImageUpload> so a non-technical admin picks a
 * file, sees the preview, and hits save; URL inputs are only for public
 * social/website links.
 *
 * Anything tournament-scoped lives under Admin → Tournaments (Sprint 49).
 */
export default function Settings({ settings = {} }) {
    const { props: pageProps } = usePage();
    const TOURNAMENTS = pageProps.tournament_list || [];
    const defaultTournamentId = TOURNAMENTS.find(t => t.status !== 'concluded')?.id
        || TOURNAMENTS[0]?.id
        || '';

    const [activeTab, setActiveTab] = useState('site');
    const initial = {
        site_name: settings.site_name || 'The Football Experience',
        site_tagline: settings.site_tagline || '',
        logo: null,
        favicon: null,
        social_facebook: settings.social_facebook || '',
        social_twitter: settings.social_twitter || '',
        social_instagram: settings.social_instagram || '',
        social_youtube: settings.social_youtube || '',
        meta_title: settings.meta_title || '',
        meta_description: settings.meta_description || '',
        google_analytics: settings.google_analytics || '',
        maintenance_mode: !!settings.maintenance_mode,
        active_tournament: settings.active_tournament || defaultTournamentId,
    };
    const { data, setData, post, processing } = useForm(initial);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Settings' },
    ];

    const tabs = [
        { key: 'site', label: 'Site Identity', icon: 'fas fa-globe' },
        { key: 'social', label: 'Social Links', icon: 'fas fa-share-alt' },
        { key: 'seo', label: 'SEO', icon: 'fas fa-search' },
        { key: 'maintenance', label: 'Maintenance', icon: 'fas fa-tools' },
    ];

    const handleSave = () => {
        post(route('admin.settings.update'), { preserveScroll: true, forceFormData: true });
    };

    return (
        <AdminLayout title="Settings">
            <DashboardHero
                role="admin"
                title="Site Settings"
                subtitle="Configure site identity, social links, SEO and maintenance."
                breadcrumbs={breadcrumbs}
                action={{ label: 'Save all settings', icon: 'fas fa-save', onClick: handleSave }}
            />

            <div className="admin-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <i className={tab.icon}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'site' && (
                <SplitEditorLayout
                    preview={(
                        <IdentityPreview
                            name={data.site_name || 'The Football Experience'}
                            sub={data.site_tagline}
                            avatar={settings.logo ? assetPath(settings.logo) : null}
                            accent="#3b82f6"
                            badge={data.maintenance_mode ? 'Maintenance' : 'Live'}
                        />
                    )}
                >
                    <div className="admin-editor-stack">
                        <div className="tfe-slab">
                            <div className="tfe-slab__header">
                                <div>
                                    <h2 className="tfe-slab__title">Site information</h2>
                                    <p className="tfe-slab__title-sub">Public identity across every surface.</p>
                                </div>
                            </div>
                            <div className="tfe-slab__body">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="site_name">Site name</label>
                                    <input id="site_name" type="text" className="tfe-input" value={data.site_name} onChange={e => setData('site_name', e.target.value)} />
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="site_tagline">Site tagline</label>
                                    <input id="site_tagline" type="text" className="tfe-input" value={data.site_tagline} onChange={e => setData('site_tagline', e.target.value)} placeholder="A short description" />
                                </div>
                            </div>
                        </div>
                        <div className="tfe-slab">
                            <div className="tfe-slab__header">
                                <div>
                                    <h2 className="tfe-slab__title">Branding</h2>
                                    <p className="tfe-slab__title-sub">Logo shows in the header; favicon in the browser tab.</p>
                                </div>
                            </div>
                            <div className="tfe-slab__body">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label">Logo</label>
                                    <ImageUpload
                                        value={settings.logo || null}
                                        onFile={(f) => setData('logo', f)}
                                        onClear={() => setData('logo', null)}
                                        hint="PNG or WebP, ~256px tall"
                                    />
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label">Favicon</label>
                                    <ImageUpload
                                        value={settings.favicon || null}
                                        onFile={(f) => setData('favicon', f)}
                                        onClear={() => setData('favicon', null)}
                                        hint="Square PNG, 512×512 recommended"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </SplitEditorLayout>
            )}

            {/* The Tournament tab moved to Admin → Tournaments (Sprint 49):
                featured pick, Wikipedia refresh, per-tournament tagline,
                accent, trophy, hero background, organiser card watermark and
                venue imagery are all on one page per tournament now. */}

            {activeTab === 'social' && (
                <div className="tfe-slab">
                    <div className="tfe-slab__header">
                        <div>
                            <h2 className="tfe-slab__title">Social media links</h2>
                            <p className="tfe-slab__title-sub">Rendered in the footer + share cards.</p>
                        </div>
                    </div>
                    <div className="tfe-slab__body">
                        <div className="row g-4">
                            {[
                                { key: 'social_facebook',  icon: 'fab fa-facebook',  label: 'Facebook',   placeholder: 'https://facebook.com/yourpage' },
                                { key: 'social_twitter',   icon: 'fab fa-twitter',   label: 'Twitter / X', placeholder: 'https://twitter.com/yourhandle' },
                                { key: 'social_instagram', icon: 'fab fa-instagram', label: 'Instagram',  placeholder: 'https://instagram.com/yourhandle' },
                                { key: 'social_youtube',   icon: 'fab fa-youtube',   label: 'YouTube',    placeholder: 'https://youtube.com/yourchannel' },
                            ].map(({ key, icon, label, placeholder }) => (
                                <div key={key} className="col-md-6">
                                    <div className="tfe-form-field">
                                        <label className="tfe-form-label" htmlFor={key}>
                                            <i className={`${icon} me-2`}></i>{label}
                                        </label>
                                        <input id={key} type="url" className="tfe-input" value={data[key]} onChange={e => setData(key, e.target.value)} placeholder={placeholder} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'seo' && (
                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="tfe-slab">
                            <div className="tfe-slab__header">
                                <div>
                                    <h2 className="tfe-slab__title">SEO defaults</h2>
                                    <p className="tfe-slab__title-sub">Fallback title + description when a page doesn't specify its own.</p>
                                </div>
                            </div>
                            <div className="tfe-slab__body">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label">Default meta title</label>
                                    <input type="text" className="tfe-input" value={data.meta_title} onChange={e => setData('meta_title', e.target.value)} />
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label">Default meta description</label>
                                    <textarea className="tfe-textarea" rows={3} value={data.meta_description} onChange={e => setData('meta_description', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="tfe-slab">
                            <div className="tfe-slab__header">
                                <div>
                                    <h2 className="tfe-slab__title">Analytics</h2>
                                    <p className="tfe-slab__title-sub">Google Analytics 4 measurement ID.</p>
                                </div>
                            </div>
                            <div className="tfe-slab__body">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label">GA4 measurement ID</label>
                                    <input type="text" className="tfe-input" value={data.google_analytics} onChange={e => setData('google_analytics', e.target.value)} placeholder="G-XXXXXXXXXX" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'maintenance' && (
                <div className="tfe-slab">
                    <div className="tfe-slab__header">
                        <div>
                            <h2 className="tfe-slab__title">Maintenance mode</h2>
                            <p className="tfe-slab__title-sub">Puts a maintenance page in front of visitors. Admins can still access the site.</p>
                        </div>
                    </div>
                    <div className="tfe-slab__body">
                        <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div>
                                <h5 className="text-white mb-1">Enable maintenance mode</h5>
                                <p className="tfe-form-help mb-0">When enabled, visitors see a maintenance page.</p>
                            </div>
                            <label className="admin-toggle">
                                <input
                                    type="checkbox"
                                    checked={data.maintenance_mode}
                                    onChange={e => setData('maintenance_mode', e.target.checked)}
                                />
                                <span className="admin-toggle-slider"></span>
                            </label>
                        </div>
                        {data.maintenance_mode && (
                            <div className="mt-3 p-3 rounded-3" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                                <div className="d-flex align-items-center gap-2 text-warning">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <strong>Maintenance mode is on</strong>
                                </div>
                                <p className="tfe-form-help mb-0 mt-1">Regular users can't access the site.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
