import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import ImageUpload from '@/Components/Common/ImageUpload';
import { router, useForm, usePage } from '@inertiajs/react';

/**
 * Site settings — site identity, branding, per-tournament content, social,
 * SEO, maintenance. Every image field goes through <ImageUpload> so a
 * non-technical admin picks a file, sees the preview, and hits save;
 * URL inputs are only for public social/website links.
 */
export default function Settings({ auth, settings = {}, tournament_hero_images = {} }) {
    const { props: pageProps } = usePage();
    const flash = pageProps.flash || {};
    const TOURNAMENTS = pageProps.tournament_list || [];
    const defaultTournamentId = TOURNAMENTS.find(t => t.status !== 'concluded')?.id
        || TOURNAMENTS[0]?.id
        || '';

    const [activeTab, setActiveTab] = useState('site');
    const [refreshing, setRefreshing] = useState(false);
    const [refreshOutput, setRefreshOutput] = useState('');

    useEffect(() => {
        if (flash.tournament_refresh_output) {
            setRefreshOutput(flash.tournament_refresh_output);
        }
    }, [flash.tournament_refresh_output]);

    const handleRefresh = () => {
        setRefreshing(true);
        setRefreshOutput('');
        router.post(route('admin.settings.tournaments.refresh'), {}, {
            preserveScroll: true,
            onFinish: () => setRefreshing(false),
            onError: () => setRefreshing(false),
        });
    };

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
    // Per-tournament fields (tagline, trophy, accent, hero_bg) share the
    // same shape; walk the tournament list once here rather than repeat.
    for (const t of TOURNAMENTS) {
        initial[`tournament_tagline_${t.id}`] = settings[`tournament_tagline_${t.id}`] ?? '';
        initial[`tournament_accent_${t.id}`] = settings[`tournament_accent_${t.id}`] ?? t.color_accent ?? '#dc143c';
        initial[`tournament_trophy_${t.id}`] = null; // File slot
        initial[`hero_bg_${t.id}`] = null;           // File slot
    }

    const { data, setData, post, processing } = useForm(initial);

    const heroFor = (tid) => settings[`hero_bg_${tid}`] || tournament_hero_images[tid] || null;
    const trophyFor = (t) => {
        const stored = settings[`tournament_trophy_${t.id}`];
        if (stored) return stored;
        // config trophy paths are relative to /public — normalise.
        return t.trophy_image ? '/' + t.trophy_image.replace(/^\//, '') : null;
    };

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Settings' },
    ];

    const tabs = [
        { key: 'site', label: 'Site Identity', icon: 'fas fa-globe' },
        { key: 'tournament', label: 'Tournament', icon: 'fas fa-trophy' },
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
                subtitle="Configure site identity, tournaments, social links, SEO and maintenance."
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
                <div className="row g-4">
                    <div className="col-lg-6">
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
                    </div>
                    <div className="col-lg-6">
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
                </div>
            )}

            {activeTab === 'tournament' && (
                <>
                    <div className="tfe-slab">
                        <div className="tfe-slab__header">
                            <div>
                                <h2 className="tfe-slab__title">Active tournament</h2>
                                <p className="tfe-slab__title-sub">The default featured across the site when a visitor hasn't picked one.</p>
                            </div>
                        </div>
                        <div className="tfe-slab__body">
                            <div className="tfe-form-field">
                                <label className="tfe-form-label" htmlFor="active_tournament">Featured tournament</label>
                                <select
                                    id="active_tournament"
                                    className="tfe-select"
                                    value={data.active_tournament}
                                    onChange={e => setData('active_tournament', e.target.value)}
                                >
                                    {TOURNAMENTS.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                                    ))}
                                </select>
                                <p className="tfe-form-help">Visitors can override by passing <code>?tournament=slug</code> in the URL or the header dropdown.</p>
                            </div>
                            <div className="tfe-form-field" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <label className="tfe-form-label">Wikipedia data refresh</label>
                                <p className="tfe-form-help">Pull the latest venues, teams and key facts. Cached values are cleared so the next page load fetches fresh data.</p>
                                <div className="d-flex gap-2 align-items-center flex-wrap mt-2">
                                    <button type="button" className="tfe-btn tfe-btn--filled" disabled={refreshing} onClick={handleRefresh}>
                                        <i className="fas fa-sync-alt"></i> {refreshing ? 'Refreshing…' : 'Refresh all tournaments'}
                                    </button>
                                    {refreshing && <span className="tfe-form-help">Can take 30–60s for Wikipedia's rate limit.</span>}
                                </div>
                                {refreshOutput && (
                                    <pre className="mt-3 p-3 rounded-2 small text-white" style={{ background: 'rgba(0,0,0,0.4)', opacity: 0.85, whiteSpace: 'pre-wrap' }}>{refreshOutput}</pre>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="tfe-slab" style={{ marginTop: 20 }}>
                        <div className="tfe-slab__header">
                            <div>
                                <h2 className="tfe-slab__title">Hero backgrounds</h2>
                                <p className="tfe-slab__title-sub">Landscape image behind the tournament card on the landing hero. Recommended 1920×800.</p>
                            </div>
                        </div>
                        <div className="tfe-slab__body">
                            <div className="row g-4">
                                {TOURNAMENTS.map(t => (
                                    <div key={t.id} className="col-md-6 col-lg-4">
                                        <div className="tfe-form-field">
                                            <label className="tfe-form-label">{t.name}</label>
                                            <ImageUpload
                                                value={heroFor(t.id)}
                                                onFile={(f) => setData(`hero_bg_${t.id}`, f)}
                                                onClear={() => setData(`hero_bg_${t.id}`, null)}
                                                hint="1920×800 landscape"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="tfe-slab" style={{ marginTop: 20 }}>
                        <div className="tfe-slab__header">
                            <div>
                                <h2 className="tfe-slab__title">Per-tournament content</h2>
                                <p className="tfe-slab__title-sub">Override tagline, trophy image and accent colour without editing config.</p>
                            </div>
                        </div>
                        <div className="tfe-slab__body">
                            {TOURNAMENTS.map(t => (
                                <div key={t.id} className="pb-4 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div className="text-white fw-semibold mb-3">
                                        {t.name}
                                        <span className="tfe-pill tfe-pill--info ms-2">{t.status}</span>
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="tfe-form-field">
                                                <label className="tfe-form-label">Tagline</label>
                                                <input
                                                    className="tfe-input"
                                                    placeholder={t.tagline || 'e.g. East Africa welcomes AFCON…'}
                                                    value={data[`tournament_tagline_${t.id}`]}
                                                    onChange={e => setData(`tournament_tagline_${t.id}`, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="tfe-form-field">
                                                <label className="tfe-form-label">Trophy image</label>
                                                <ImageUpload
                                                    value={trophyFor(t)}
                                                    onFile={(f) => setData(`tournament_trophy_${t.id}`, f)}
                                                    onClear={() => setData(`tournament_trophy_${t.id}`, null)}
                                                    hint="Transparent PNG, portrait"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <div className="tfe-form-field">
                                                <label className="tfe-form-label">Accent</label>
                                                <input
                                                    type="color"
                                                    className="tfe-color-swatch"
                                                    style={{ width: '100%', height: 44 }}
                                                    value={data[`tournament_accent_${t.id}`]}
                                                    onChange={e => setData(`tournament_accent_${t.id}`, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

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
