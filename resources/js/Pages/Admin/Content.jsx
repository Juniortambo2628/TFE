import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminHero from '@/Components/Admin/AdminHero';
import AdminToolbar from '@/Components/Admin/AdminToolbar';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import { router, useForm } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';

/**
 * Content Management Page
 * - Landing Page sections
 * - All 18 Fan Dashboard pages
 * - Posts management
 */
export default function Content({ auth, posts = { data: [] }, settings = {}, tribes = [] }) {
    const [mainTab, setMainTab] = useState('landing');
    const [landingSection, setLandingSection] = useState('about');
    const [fanPage, setFanPage] = useState('dashboard');
    const [search, setSearch] = useState('');
    const [postToDelete, setPostToDelete] = useState(null);
    
    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Content' }
    ];

    // Landing page sections
    const landingSections = [
        { key: 'about', label: 'About', icon: 'fas fa-info-circle' },
        { key: 'features', label: 'Features', icon: 'fas fa-star' },
        { key: 'services', label: 'Services', icon: 'fas fa-concierge-bell' },
        { key: 'contact', label: 'Contact', icon: 'fas fa-envelope' },
        { key: 'footer', label: 'Footer', icon: 'fas fa-shoe-prints' }
    ];

    // All 18 Fan Dashboard pages
    const fanPages = [
        { key: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
        { key: 'profile', label: 'Profile', icon: 'fas fa-user' },
        { key: 'wallet', label: 'Wallet', icon: 'fas fa-wallet' },
        { key: 'events', label: 'Events', icon: 'fas fa-calendar' },
        { key: 'tribes', label: 'Tribes', icon: 'fas fa-users' },
        { key: 'feed', label: 'Feed', icon: 'fas fa-rss' },
        { key: 'stories', label: 'Stories', icon: 'fas fa-book-open' },
        { key: 'journey', label: 'Journey', icon: 'fas fa-road' },
        { key: 'match_schedule', label: 'Match Schedule', icon: 'fas fa-futbol' },
        { key: 'fan_store', label: 'Fan Store', icon: 'fas fa-shopping-bag' },
        { key: 'predict_win', label: 'Predict & Win', icon: 'fas fa-trophy' },
        { key: 'communication', label: 'Communication', icon: 'fas fa-comments' },
        { key: 'payments', label: 'Payments', icon: 'fas fa-credit-card' },
        { key: 'security', label: 'Security', icon: 'fas fa-shield-alt' },
        { key: 'budget_calculator', label: 'Budget Calculator', icon: 'fas fa-calculator' },
        { key: 'contact', label: 'Contact', icon: 'fas fa-phone' },
        { key: 'tribe_detail', label: 'Tribe Detail', icon: 'fas fa-user-friends' },
        { key: 'post_detail', label: 'Post Detail', icon: 'fas fa-newspaper' }
    ];

    // Reusable setting input
    const SettingInput = ({ label, settingKey, type = 'text', placeholder = '', rows = 3, group = 'landing' }) => {
        const [value, setValue] = useState(settings[`${group}_${settingKey}`] || '');
        const [saving, setSaving] = useState(false);

        const handleSave = () => {
            setSaving(true);
            router.post('/admin/content/settings', {
                key: `${group}_${settingKey}`,
                value: value
            }, {
                preserveScroll: true,
                onFinish: () => setSaving(false)
            });
        };

        return (
            <div className="admin-form-group">
                <label className="admin-form-label">{label}</label>
                {type === 'textarea' ? (
                    <textarea
                        className="admin-form-input admin-form-textarea"
                        rows={rows}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder={placeholder}
                    />
                ) : (
                    <input
                        type={type}
                        className="admin-form-input"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder={placeholder}
                    />
                )}
                <button 
                    className="btn-admin-outline btn-admin-sm mt-2" 
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>
        );
    };

    // Hero settings for fan pages
    const HeroSettings = ({ pageKey, pageLabel }) => {
        const [bgFiles, setBgFiles] = useState([]);
        const [title, setTitle] = useState(settings[`fan_${pageKey}_title`] || '');
        const [subtitle, setSubtitle] = useState(settings[`fan_${pageKey}_subtitle`] || '');
        const [saving, setSaving] = useState(false);

        const handleSave = () => {
            setSaving(true);
            router.post('/admin/content/hero', {
                page: pageKey,
                title,
                subtitle
            }, {
                preserveScroll: true,
                onFinish: () => setSaving(false)
            });
        };

        return (
            <div className="admin-card-dark h-100">
                <div className="card-header">
                    <h3><i className={fanPages.find(p => p.key === pageKey)?.icon || 'fas fa-file'}></i> {pageLabel} Hero</h3>
                </div>
                <div className="card-body">
                    <div className="admin-form-group">
                        <label className="admin-form-label">Hero Title</label>
                        <input
                            type="text"
                            className="admin-form-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={`${pageLabel} page title`}
                        />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Subtitle (optional)</label>
                        <input
                            type="text"
                            className="admin-form-input"
                            value={subtitle}
                            onChange={e => setSubtitle(e.target.value)}
                            placeholder="Short description"
                        />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Background Image</label>
                        <FilePondUploader
                            files={bgFiles}
                            onUpdateFiles={setBgFiles}
                            server={`/api/upload?page=${pageKey}&type=hero_bg`}
                            labelIdle='Drop background image'
                        />
                    </div>
                    <button className="btn-admin" onClick={handleSave} disabled={saving}>
                        <i className="fas fa-save"></i> {saving ? 'Saving...' : 'Save Hero'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout title="Content Management">
            <AdminHero 
                title="Content Management"
                subtitle="Manage landing page sections, fan dashboard heroes, and community posts."
                breadcrumbs={breadcrumbs}
            />

            {/* Main Tabs */}
            <div className="admin-tabs mb-4">
                <button
                    className={`admin-tab ${mainTab === 'landing' ? 'active' : ''}`}
                    onClick={() => setMainTab('landing')}
                >
                    <i className="fas fa-globe"></i> Landing Page
                </button>
                <button
                    className={`admin-tab ${mainTab === 'fan' ? 'active' : ''}`}
                    onClick={() => setMainTab('fan')}
                >
                    <i className="fas fa-user-circle"></i> Fan Dashboard
                </button>
                <button
                    className={`admin-tab ${mainTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setMainTab('posts')}
                >
                    <i className="fas fa-newspaper"></i> Posts
                </button>
            </div>

            {/* Landing Page Content */}
            {mainTab === 'landing' && (
                <>
                    {/* Section Tabs */}
                    <div className="admin-tabs mb-4">
                        {landingSections.map(sec => (
                            <button
                                key={sec.key}
                                className={`admin-tab ${landingSection === sec.key ? 'active' : ''}`}
                                onClick={() => setLandingSection(sec.key)}
                            >
                                <i className={sec.icon}></i> {sec.label}
                            </button>
                        ))}
                    </div>

                    {/* About Section */}
                    {landingSection === 'about' && (
                        <div className="row g-4">
                            <div className="col-lg-6">
                                <div className="admin-card-dark h-100">
                                    <div className="card-header">
                                        <h3><i className="fas fa-heading"></i> About Header</h3>
                                    </div>
                                    <div className="card-body">
                                        <SettingInput label="Section Title" settingKey="about_title" placeholder="What is The Football Experience?" group="landing" />
                                        <SettingInput label="Section Description" settingKey="about_description" type="textarea" placeholder="About section text..." group="landing" />
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="admin-card-dark h-100">
                                    <div className="card-header">
                                        <h3><i className="fas fa-chart-bar"></i> About Stats</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-6">
                                                <SettingInput label="Stat 1 Value" settingKey="about_stat1_value" placeholder="KES 450,000" group="landing" />
                                            </div>
                                            <div className="col-6">
                                                <SettingInput label="Stat 1 Label" settingKey="about_stat1_label" placeholder="Planned Budget" group="landing" />
                                            </div>
                                            <div className="col-6">
                                                <SettingInput label="Stat 2 Value" settingKey="about_stat2_value" placeholder="KES 150,000" group="landing" />
                                            </div>
                                            <div className="col-6">
                                                <SettingInput label="Stat 2 Label" settingKey="about_stat2_label" placeholder="Total Paid" group="landing" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Features Section */}
                    {landingSection === 'features' && (
                        <div className="row g-4">
                            <div className="col-lg-6">
                                <div className="admin-card-dark">
                                    <div className="card-header">
                                        <h3><i className="fas fa-star"></i> Features Header</h3>
                                    </div>
                                    <div className="card-body">
                                        <SettingInput label="Section Title" settingKey="features_title" placeholder="Why Choose TFE?" group="landing" />
                                        <SettingInput label="Section Subtitle" settingKey="features_subtitle" placeholder="Your benefits..." group="landing" />
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="admin-card-dark">
                                    <div className="card-header">
                                        <h3><i className="fas fa-list"></i> Feature Items</h3>
                                    </div>
                                    <div className="card-body">
                                        <p className="text-muted small mb-3">Feature items are defined in code. Contact developer to modify.</p>
                                        <div className="admin-empty-state" style={{ padding: '1.5rem' }}>
                                            <i className="fas fa-code" style={{ fontSize: '2rem' }}></i>
                                            <h4>Code-defined features</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Services Section */}
                    {landingSection === 'services' && (
                        <div className="row g-4">
                            <div className="col-lg-6">
                                <div className="admin-card-dark">
                                    <div className="card-header">
                                        <h3><i className="fas fa-concierge-bell"></i> Services Header</h3>
                                    </div>
                                    <div className="card-body">
                                        <SettingInput label="Section Title" settingKey="services_title" placeholder="Our Services" group="landing" />
                                        <SettingInput label="Section Subtitle" settingKey="services_subtitle" placeholder="What we offer..." group="landing" />
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="admin-card-dark">
                                    <div className="card-header">
                                        <h3><i className="fas fa-list"></i> Service Items</h3>
                                    </div>
                                    <div className="card-body">
                                        <p className="text-muted small mb-3">Service cards are defined in code. Contact developer to modify.</p>
                                        <div className="admin-empty-state" style={{ padding: '1.5rem' }}>
                                            <i className="fas fa-code" style={{ fontSize: '2rem' }}></i>
                                            <h4>Code-defined services</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact Section */}
                    {landingSection === 'contact' && (
                        <div className="row g-4">
                            <div className="col-lg-6">
                                <div className="admin-card-dark">
                                    <div className="card-header">
                                        <h3><i className="fas fa-envelope"></i> Contact Header</h3>
                                    </div>
                                    <div className="card-body">
                                        <SettingInput label="Section Title" settingKey="contact_title" placeholder="Get in touch" group="landing" />
                                        <SettingInput label="Section Subtitle" settingKey="contact_subtitle" placeholder="Have questions?" group="landing" />
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="admin-card-dark">
                                    <div className="card-header">
                                        <h3><i className="fas fa-map-marker-alt"></i> Contact Info</h3>
                                    </div>
                                    <div className="card-body">
                                        <SettingInput label="Email" settingKey="contact_email" type="email" placeholder="info@tfe.com" group="landing" />
                                        <SettingInput label="Phone" settingKey="contact_phone" placeholder="+254 700 000 000" group="landing" />
                                        <SettingInput label="Address" settingKey="contact_address" placeholder="Nairobi, Kenya" group="landing" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Section */}
                    {landingSection === 'footer' && (
                        <div className="row g-4">
                            <div className="col-lg-6">
                                <div className="admin-card-dark">
                                    <div className="card-header">
                                        <h3><i className="fas fa-shoe-prints"></i> Footer Content</h3>
                                    </div>
                                    <div className="card-body">
                                        <SettingInput label="Copyright Text" settingKey="footer_copyright" placeholder="© 2026 The Football Experience" group="landing" />
                                        <SettingInput label="Footer Description" settingKey="footer_description" type="textarea" placeholder="Footer text..." group="landing" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Fan Dashboard Content */}
            {mainTab === 'fan' && (
                <>
                    {/* Page selector - scrollable horizontal */}
                    <div className="admin-tabs mb-4" style={{ overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '0.5rem' }}>
                        {fanPages.map(page => (
                            <button
                                key={page.key}
                                className={`admin-tab ${fanPage === page.key ? 'active' : ''}`}
                                onClick={() => setFanPage(page.key)}
                                style={{ flexShrink: 0 }}
                            >
                                <i className={page.icon}></i> {page.label}
                            </button>
                        ))}
                    </div>

                    {/* Selected page hero settings */}
                    <div className="row g-4">
                        <div className="col-lg-6">
                            <HeroSettings 
                                pageKey={fanPage} 
                                pageLabel={fanPages.find(p => p.key === fanPage)?.label || fanPage} 
                            />
                        </div>
                        <div className="col-lg-6">
                            <div className="admin-card-dark h-100">
                                <div className="card-header">
                                    <h3><i className="fas fa-info-circle"></i> Page Information</h3>
                                </div>
                                <div className="card-body">
                                    <div className="p-3 rounded-3 mb-3" style={{ background: 'var(--admin-bg-dark)', border: '1px solid var(--admin-border)' }}>
                                        <h5 className="text-white mb-2">
                                            <i className={fanPages.find(p => p.key === fanPage)?.icon + ' me-2'}></i>
                                            {fanPages.find(p => p.key === fanPage)?.label} Page
                                        </h5>
                                        <p className="text-muted small mb-0">
                                            Customize the hero section and background image for this fan dashboard page.
                                        </p>
                                    </div>
                                    <div className="alert" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--admin-primary)', color: 'var(--admin-primary)' }}>
                                        <i className="fas fa-lightbulb me-2"></i>
                                        <strong>Tip:</strong> Use high-quality images (1920x400px recommended) for best results.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Posts Tab */}
            {mainTab === 'posts' && (
                <>
                    <AdminToolbar
                        search={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Search posts..."
                        showSort={false}
                        showViewToggle={false}
                    />

                    <div className="admin-card-dark">
                        <div className="card-header">
                            <h3><i className="fas fa-newspaper"></i> Community Posts</h3>
                            <span className="admin-badge admin-badge-gray">{posts.data?.length || 0} posts</span>
                        </div>
                        <div className="card-body p-0">
                            <table className="admin-table-dark">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Author</th>
                                        <th>Tribe</th>
                                        <th>Likes</th>
                                        <th>Date</th>
                                        <th style={{ width: '100px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.data && posts.data.length > 0 ? (
                                        posts.data
                                            .filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()))
                                            .map(post => (
                                                <tr key={post.id}>
                                                    <td className="fw-semibold">{post.title || post.content?.substring(0, 50) + '...'}</td>
                                                    <td className="text-muted">{post.user?.name || 'Unknown'}</td>
                                                    <td>
                                                        <span className="admin-badge admin-badge-blue">{post.tribe?.name || 'General'}</span>
                                                    </td>
                                                    <td>{post.likes_count || 0}</td>
                                                    <td className="text-muted small">{post.created_at}</td>
                                                    <td>
                                                        <button 
                                                            className="btn-admin-icon"
                                                            title="Delete Post"
                                                            onClick={() => setPostToDelete(post.id)}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6">
                                                <div className="admin-empty-state">
                                                    <i className="fas fa-newspaper"></i>
                                                    <h4>No posts yet</h4>
                                                    <p>Community posts will appear here.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <ConfirmationDialog
                open={!!postToDelete}
                onOpenChange={(open) => !open && setPostToDelete(null)}
                title="Delete Post?"
                description="Are you sure you want to delete this post?"
                onConfirm={() => {
                    if (postToDelete) {
                        router.delete(`/admin/posts/${postToDelete}`, {
                            onSuccess: () => setPostToDelete(null)
                        });
                    }
                }}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
