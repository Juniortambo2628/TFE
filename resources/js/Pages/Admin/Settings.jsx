import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import { router, useForm } from '@inertiajs/react';

export default function Settings({ auth, settings = {} }) {
    const [activeTab, setActiveTab] = useState('site');
    const [logoFiles, setLogoFiles] = useState([]);
    const [faviconFiles, setFaviconFiles] = useState([]);
    
    // Dynamic background states
    const [bgDashboardFiles, setBgDashboardFiles] = useState([]);
    const [bgUsersFiles, setBgUsersFiles] = useState([]);
    const [bgRevenueFiles, setBgRevenueFiles] = useState([]);
    const [bgAnalyticsFiles, setBgAnalyticsFiles] = useState([]);
    const [bgEventsFiles, setBgEventsFiles] = useState([]);
    
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
