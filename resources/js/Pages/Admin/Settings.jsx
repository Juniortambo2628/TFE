import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import { router, useForm, usePage } from '@inertiajs/react';

export default function Settings({ auth, settings = {}, tournament_hero_images = {} }) {
    const { props: pageProps } = usePage();
    const flash = pageProps.flash || {};
    // Tournament list is shared globally by HandleInertiaRequests — mirrors
    // config/tournaments.php with computed status. Never hardcoded here.
    const TOURNAMENTS = pageProps.tournament_list || [];
    // First upcoming/ongoing tournament in the list is the sensible default
    // when the admin hasn't picked one yet.
    const defaultTournamentId = TOURNAMENTS.find(t => t.status !== 'concluded')?.id
        || TOURNAMENTS[0]?.id
        || '';

    const [activeTab, setActiveTab] = useState('site');
    const [logoFiles, setLogoFiles] = useState([]);
    const [faviconFiles, setFaviconFiles] = useState([]);
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
        router.post('/admin/settings/tournaments/refresh', {}, {
            preserveScroll: true,
            onFinish: () => setRefreshing(false),
            onError: () => setRefreshing(false),
        });
    };

    // Dynamic background states
    const [bgDashboardFiles, setBgDashboardFiles] = useState([]);
    const [bgUsersFiles, setBgUsersFiles] = useState([]);
    const [bgRevenueFiles, setBgRevenueFiles] = useState([]);
    const [bgAnalyticsFiles, setBgAnalyticsFiles] = useState([]);
    const [bgEventsFiles, setBgEventsFiles] = useState([]);
    // Hero background states (per tournament)
    const [heroBgFiles, setHeroBgFiles] = useState({});

    const { data, setData, post, processing } = useForm({
        // Site Identity
        site_name: settings.site_name || 'The Football Experience',
        site_tagline: settings.site_tagline || '',
        // Social
        social_facebook: settings.social_facebook || '',
        social_twitter: settings.social_twitter || '',
        social_instagram: settings.social_instagram || '',
        social_youtube: settings.social_youtube || '',
        // SEO
        meta_title: settings.meta_title || '',
        meta_description: settings.meta_description || '',
        // Analytics
        google_analytics: settings.google_analytics || '',
        // Maintenance
        maintenance_mode: settings.maintenance_mode || false,
        // Active Tournament (admin-managed)
        active_tournament: settings.active_tournament || defaultTournamentId,
        // Visual Card Backgrounds
        bg_card_dashboard: null,
        bg_card_users: null,
        bg_card_revenue: null,
        bg_card_analytics: null,
        bg_card_events: null,
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Settings' }
    ];

    const tabs = [
        { key: 'site', label: 'Site Identity', icon: 'fas fa-globe' },
        { key: 'tournament', label: 'Tournament', icon: 'fas fa-trophy' },
        { key: 'visual', label: 'Visual Cards', icon: 'fas fa-th-large' },
        { key: 'social', label: 'Social Links', icon: 'fas fa-share-alt' },
        { key: 'seo', label: 'SEO', icon: 'fas fa-search' },
        { key: 'maintenance', label: 'Maintenance', icon: 'fas fa-tools' }
    ];

    const handleSave = () => {
        post('/admin/settings', { preserveScroll: true });
    };

    return (
        <AdminLayout title="Settings">
            <DashboardHero role="admin" 
                title="Site Settings"
                subtitle="Configure site identity, social links, SEO, and announcements."
                breadcrumbs={breadcrumbs}
                action={{
                    label: 'Save All Settings',
                    icon: 'fas fa-save',
                    onClick: handleSave
                }}
            />

            {/* Tabs */}
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

            {/* Site Identity */}
            {activeTab === 'site' && (
                <div className="row g-4">
                    <div className="col-lg-6">
                        <div className="admin-card-dark">
                            <div className="card-header">
                                <h3><i className="fas fa-info-circle"></i> Site Information</h3>
                            </div>
                            <div className="card-body">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Site Name</label>
                                    <input 
                                        type="text" 
                                        className="admin-form-input" 
                                        value={data.site_name} 
                                        onChange={e => setData('site_name', e.target.value)}
                                        placeholder="Your site name"
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Site Tagline</label>
                                    <input 
                                        type="text" 
                                        className="admin-form-input" 
                                        value={data.site_tagline} 
                                        onChange={e => setData('site_tagline', e.target.value)}
                                        placeholder="A short description"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="admin-card-dark">
                            <div className="card-header">
                                <h3><i className="fas fa-image"></i> Branding</h3>
                            </div>
                            <div className="card-body">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Logo</label>
                                    <FilePondUploader 
                                        files={logoFiles}
                                        onUpdateFiles={setLogoFiles}
                                        labelIdle='Upload logo'
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Favicon</label>
                                    <FilePondUploader 
                                        files={faviconFiles}
                                        onUpdateFiles={setFaviconFiles}
                                        labelIdle='Upload favicon (square)'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Tournament */}
            {activeTab === 'tournament' && (
                <div className="admin-card-dark">
                    <div className="card-header">
                        <h3><i className="fas fa-trophy"></i> Active Tournament Settings</h3>
                        <p className="text-white small mb-0 ms-auto" style={{ opacity: 0.6 }}>Sets the default tournament featured across the site when visitors don't specify one in the URL</p>
                   </div>
                    <div className="card-body">
                        <div className="admin-form-group">
                            <label className="admin-form-label">Featured Tournament</label>
                            <select
                                className="admin-form-input"
                                value={data.active_tournament}
                                onChange={e => setData('active_tournament', e.target.value)}
                            >
                                {TOURNAMENTS.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.status.toUpperCase()})
                                   </option>
                                ))}
                           </select>
                            <small className="text-white d-block mt-2" style={{ opacity: 0.7 }}>
                                Note: Individual visitors can still override this by passing <code>?tournament=slug</code> in the URL or using the header dropdown.
                           </small>
                       </div>

                        <div className="admin-form-group mt-4 pt-4 border-top border-white border-opacity-10">
                            <label className="admin-form-label">Wikipedia Data Refresh</label>
                            <p className="text-white small mb-3" style={{ opacity: 0.7 }}>
                                Pull the latest venues, teams, and key facts from Wikipedia. Cached values are cleared so the next page load fetches fresh data.
                           </p>
                            <div className="d-flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="btn btn-admin-primary"
                                    disabled={refreshing}
                                    onClick={handleRefresh}
                                >
                                    <i className="fas fa-sync-alt me-2"></i>
                                    {refreshing ? 'Refreshing...' : 'Refresh All Tournaments'}
                               </button>
                                {refreshing && (
                                    <span className="text-white small align-self-center" style={{ opacity: 0.7 }}>
                                        This can take 30-60s for Wikipedia's rate limit. Stay on this page.
                                   </span>
                                )}
                           </div>
                            {refreshOutput && (
                                <pre className="mt-3 p-3 rounded-2 small text-white" style={{ background: 'rgba(0,0,0,0.4)', opacity: 0.85, whiteSpace: 'pre-wrap' }}>
                                    {refreshOutput}
                               </pre>
                            )}
                       </div>
                   </div>

                   <div className="admin-card-dark mt-4">
                       <div className="card-header">
                           <h3><i className="fas fa-image"></i> Hero Background Images</h3>
                           <p className="text-white small mb-0 ms-auto" style={{ opacity: 0.6 }}>Override the default hero background per tournament. Recommended: 1920x800px.</p>
                       </div>
                       <div className="card-body">
                           <div className="row g-4">
                               {TOURNAMENTS.map(tournament => {
                                   const settingKey = `hero_bg_${tournament.id}`;
                                   const currentBg = settings[settingKey] || tournament_hero_images[tournament.id];
                                   const fileState = heroBgFiles[settingKey] || [];
                                   return (
                                       <div key={tournament.id} className="col-md-6 col-lg-4">
                                           <div className="admin-form-group">
                                               <label className="admin-form-label">{tournament.name}</label>
                                               <FilePondUploader
                                                   files={fileState}
                                                   onUpdateFiles={(fileItems) => {
                                                       setHeroBgFiles(prev => ({ ...prev, [settingKey]: fileItems }));
                                                       if (fileItems[0]) setData(settingKey, fileItems[0].file);
                                                   }}
                                                   labelIdle={`${tournament.name} hero`}
                                               />
                                               {currentBg && (
                                                   <div className="mt-2 rounded overflow-hidden dash-preview-box">
                                                       <img src={currentBg} className="w-100 h-100 object-fit-cover" alt="Current hero bg" />
                                                   </div>
                                               )}
                                           </div>
                                       </div>
                                   );
                               })}
                           </div>
                       </div>
                    </div>

                    {/* Per-tournament content overrides — tagline, trophy image URL, accent colour.
                        All optional; empty falls back to config/tournaments.php. */}
                    <div className="admin-card-dark mt-4">
                        <div className="card-header">
                            <h3><i className="fas fa-palette"></i> Per-Tournament Content</h3>
                            <p className="text-white small mb-0 ms-auto" style={{ opacity: 0.6 }}>
                                Override the tagline, trophy image, and accent colour without editing config. Leave blank to use the config default.
                            </p>
                        </div>
                        <div className="card-body">
                            {TOURNAMENTS.map(tournament => {
                                const taglineKey = `tournament_tagline_${tournament.id}`;
                                const trophyKey = `tournament_trophy_${tournament.id}`;
                                const accentKey = `tournament_accent_${tournament.id}`;
                                return (
                                    <div key={tournament.id} className="pb-3 mb-3 border-bottom border-white border-opacity-10">
                                        <div className="text-white fw-semibold mb-2">
                                            {tournament.name}
                                            <span className="text-white-50 small ms-2">({tournament.status})</span>
                                        </div>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="admin-form-label">Tagline</label>
                                                <input
                                                    className="admin-form-input"
                                                    placeholder="e.g. East Africa welcomes AFCON…"
                                                    value={data[taglineKey] ?? settings[taglineKey] ?? ''}
                                                    onChange={e => setData(taglineKey, e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="admin-form-label">Trophy image URL</label>
                                                <input
                                                    className="admin-form-input"
                                                    placeholder="tournament-trophies/…png"
                                                    value={data[trophyKey] ?? settings[trophyKey] ?? ''}
                                                    onChange={e => setData(trophyKey, e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="admin-form-label">Accent colour</label>
                                                <input
                                                    type="color"
                                                    className="admin-form-input"
                                                    style={{ height: 40, padding: 4 }}
                                                    value={(data[accentKey] ?? settings[accentKey] ?? '#dc143c')}
                                                    onChange={e => setData(accentKey, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Visual Cards Backgrounds */}
            {activeTab === 'visual' && (
                <div className="admin-card-dark">
                    <div className="card-header">
                        <h3><i className="fas fa-th-large"></i> Card Background Images</h3>
                        <p className="text-white small mb-0 ms-auto" style={{ opacity: 0.6 }}>Recommended: 400x250px or higher aspect ratio.</p>
                    </div>
                    <div className="card-body">
                        <div className="row g-4">
                            <div className="col-md-6 col-lg-4">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Dashboard Summary BG</label>
                                    <FilePondUploader 
                                        files={bgDashboardFiles}
                                        onUpdateFiles={(fileItems) => {
                                            setBgDashboardFiles(fileItems);
                                            if (fileItems[0]) setData('bg_card_dashboard', fileItems[0].file);
                                        }}
                                        labelIdle='Dashboard BG'
                                    />
                                    {settings.bg_card_dashboard && (
                                        <div className="mt-2 rounded overflow-hidden dash-preview-box">
                                            <img src={settings.bg_card_dashboard} className="w-100 h-100 object-fit-cover" alt="Current" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6 col-lg-4">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Users Management BG</label>
                                    <FilePondUploader 
                                        files={bgUsersFiles}
                                        onUpdateFiles={(fileItems) => {
                                            setBgUsersFiles(fileItems);
                                            if (fileItems[0]) setData('bg_card_users', fileItems[0].file);
                                        }}
                                        labelIdle='Users BG'
                                    />
                                    {settings.bg_card_users && (
                                        <div className="mt-2 rounded overflow-hidden dash-preview-box">
                                            <img src={settings.bg_card_users} className="w-100 h-100 object-fit-cover" alt="Current" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6 col-lg-4">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Payments/Revenue BG</label>
                                    <FilePondUploader 
                                        files={bgRevenueFiles}
                                        onUpdateFiles={(fileItems) => {
                                            setBgRevenueFiles(fileItems);
                                            if (fileItems[0]) setData('bg_card_revenue', fileItems[0].file);
                                        }}
                                        labelIdle='Revenue BG'
                                    />
                                    {settings.bg_card_revenue && (
                                        <div className="mt-2 rounded overflow-hidden dash-preview-box">
                                            <img src={settings.bg_card_revenue} className="w-100 h-100 object-fit-cover" alt="Current" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6 col-lg-4">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Analytics BG</label>
                                    <FilePondUploader 
                                        files={bgAnalyticsFiles}
                                        onUpdateFiles={(fileItems) => {
                                            setBgAnalyticsFiles(fileItems);
                                            if (fileItems[0]) setData('bg_card_analytics', fileItems[0].file);
                                        }}
                                        labelIdle='Analytics BG'
                                    />
                                    {settings.bg_card_analytics && (
                                        <div className="mt-2 rounded overflow-hidden dash-preview-box">
                                            <img src={settings.bg_card_analytics} className="w-100 h-100 object-fit-cover" alt="Current" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6 col-lg-4">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Events BG</label>
                                    <FilePondUploader 
                                        files={bgEventsFiles}
                                        onUpdateFiles={(fileItems) => {
                                            setBgEventsFiles(fileItems);
                                            if (fileItems[0]) setData('bg_card_events', fileItems[0].file);
                                        }}
                                        labelIdle='Events BG'
                                    />
                                    {settings.bg_card_events && (
                                        <div className="mt-2 rounded overflow-hidden dash-preview-box">
                                            <img src={settings.bg_card_events} className="w-100 h-100 object-fit-cover" alt="Current" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Social Links */}
            {activeTab === 'social' && (
                <div className="admin-card-dark">
                    <div className="card-header">
                        <h3><i className="fas fa-share-alt"></i> Social Media Links</h3>
                    </div>
                    <div className="card-body">
                        <div className="row g-4">
                            <div className="col-md-6">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">
                                        <i className="fab fa-facebook text-primary me-2"></i> Facebook
                                    </label>
                                    <input 
                                        type="url" 
                                        className="admin-form-input" 
                                        value={data.social_facebook} 
                                        onChange={e => setData('social_facebook', e.target.value)}
                                        placeholder="https://facebook.com/yourpage"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">
                                        <i className="fab fa-twitter me-2" style={{ color: '#1da1f2' }}></i> Twitter / X
                                    </label>
                                    <input 
                                        type="url" 
                                        className="admin-form-input" 
                                        value={data.social_twitter} 
                                        onChange={e => setData('social_twitter', e.target.value)}
                                        placeholder="https://twitter.com/yourhandle"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">
                                        <i className="fab fa-instagram me-2" style={{ color: '#e1306c' }}></i> Instagram
                                    </label>
                                    <input 
                                        type="url" 
                                        className="admin-form-input" 
                                        value={data.social_instagram} 
                                        onChange={e => setData('social_instagram', e.target.value)}
                                        placeholder="https://instagram.com/yourhandle"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">
                                        <i className="fab fa-youtube me-2" style={{ color: '#ff0000' }}></i> YouTube
                                    </label>
                                    <input 
                                        type="url" 
                                        className="admin-form-input" 
                                        value={data.social_youtube} 
                                        onChange={e => setData('social_youtube', e.target.value)}
                                        placeholder="https://youtube.com/yourchannel"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEO */}
            {activeTab === 'seo' && (
                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="admin-card-dark">
                            <div className="card-header">
                                <h3><i className="fas fa-search"></i> SEO Settings</h3>
                            </div>
                            <div className="card-body">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Default Meta Title</label>
                                    <input 
                                        type="text" 
                                        className="admin-form-input" 
                                        value={data.meta_title} 
                                        onChange={e => setData('meta_title', e.target.value)}
                                        placeholder="Default page title for SEO"
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Default Meta Description</label>
                                    <textarea 
                                        className="admin-form-input admin-form-textarea" 
                                        rows={3}
                                        value={data.meta_description} 
                                        onChange={e => setData('meta_description', e.target.value)}
                                        placeholder="Brief description for search engines"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="admin-card-dark">
                            <div className="card-header">
                                <h3><i className="fas fa-chart-line"></i> Analytics</h3>
                            </div>
                            <div className="card-body">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Google Analytics ID</label>
                                    <input 
                                        type="text" 
                                        className="admin-form-input" 
                                        value={data.google_analytics} 
                                        onChange={e => setData('google_analytics', e.target.value)}
                                        placeholder="G-XXXXXXXXXX"
                                    />
                                    <small className="text-white d-block mt-1" style={{ opacity: 0.7 }}>Enter your GA4 measurement ID</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Maintenance */}
            {activeTab === 'maintenance' && (
                <div className="admin-card-dark">
                    <div className="card-header">
                        <h3><i className="fas fa-tools"></i> Maintenance Mode</h3>
                    </div>
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: 'var(--admin-bg-dark)', border: '1px solid var(--admin-border)' }}>
                            <div>
                                <h5 className="text-white mb-1">Enable Maintenance Mode</h5>
                                <p className="text-white mb-0 small" style={{ opacity: 0.7 }}>When enabled, visitors will see a maintenance page. Admins can still access the site.</p>
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
                            <div className="mt-3 p-3 rounded-3" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--admin-primary)' }}>
                                <div className="d-flex align-items-center gap-2 text-warning">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <strong>Maintenance mode is enabled</strong>
                                </div>
                                <p className="text-muted small mb-0 mt-1">Regular users won't be able to access the site.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

