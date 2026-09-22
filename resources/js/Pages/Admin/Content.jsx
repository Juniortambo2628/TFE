import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import AdminToolbar from '@/Components/Admin/AdminToolbar';
import { router } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import StadiumImageCard from '@/Components/Admin/StadiumImageCard';

/**
 * Content Management Page — Page Heroes (public /about, /features, /services,
 * /news, /contact), Stadium Images (hero-slider venue photography) and
 * community Posts moderation.
 */
export default function Content({ auth, posts = { data: [] }, settings = {}, stadiums = [] }) {
    const [mainTab, setMainTab] = useState('heroes');
    const [search, setSearch] = useState('');
    const [postToDelete, setPostToDelete] = useState(null);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Content' }
    ];

    // The standalone public section pages that render the shared PageHero.
    const heroPages = [
        { slug: 'about', label: 'About', icon: 'fas fa-info-circle' },
        { slug: 'features', label: 'Features', icon: 'fas fa-star' },
        { slug: 'services', label: 'Services', icon: 'fas fa-concierge-bell' },
        { slug: 'news', label: 'News', icon: 'fas fa-newspaper' },
        { slug: 'contact', label: 'Contact', icon: 'fas fa-envelope' },
    ];

    // Reusable setting input
    const SettingInput = ({ label, settingKey, type = 'text', placeholder = '', rows = 3, group = 'landing' }) => {
        const [value, setValue] = useState(settings[`${group}_${settingKey}`] || '');
        const [saving, setSaving] = useState(false);

        const handleSave = () => {
            setSaving(true);
            // `type` and `group` are required server-side; omitting them
            // made every save here fail validation silently.
            router.post(route('admin.content.settings.update'), {
                key: `${group}_${settingKey}`,
                value: value,
                type: type === 'textarea' ? 'text' : type,
                group: group,
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

    return (
        <AdminLayout title="Content Management">
            <DashboardHero role="admin"
                title="Content Management"
                subtitle="Manage public page heroes and community posts."
                breadcrumbs={breadcrumbs}
            />

            {/* Main Tabs */}
            <div className="admin-tabs mb-4">
                <button
                    className={`admin-tab ${mainTab === 'heroes' ? 'active' : ''}`}
                    onClick={() => setMainTab('heroes')}
                >
                    <i className="fas fa-image"></i> Page Heroes
                </button>
                <button
                    className={`admin-tab ${mainTab === 'stadiums' ? 'active' : ''}`}
                    onClick={() => setMainTab('stadiums')}
                >
                    <i className="fas fa-futbol"></i> Stadium Images
                </button>
                <button
                    className={`admin-tab ${mainTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setMainTab('posts')}
                >
                    <i className="fas fa-newspaper"></i> Posts
                </button>
            </div>

            {/* Page Heroes — the /about, /features, /services, /news, /contact
                hero content (leave a field blank to fall back to
                config/site_pages.php). */}
            {mainTab === 'heroes' && (
                <div className="row g-4">
                    {heroPages.map((page) => (
                        <div className="col-lg-6" key={page.slug}>
                            <div className="admin-card-dark h-100">
                                <div className="card-header">
                                    <h3><i className={page.icon}></i> {page.label} Hero</h3>
                                </div>
                                <div className="card-body">
                                    <SettingInput label="Eyebrow" settingKey={`${page.slug}_eyebrow`} placeholder={`${page.label}`} group="page_hero" />
                                    <SettingInput label="Title" settingKey={`${page.slug}_title`} placeholder={`${page.label} page title`} group="page_hero" />
                                    <SettingInput label="Tagline" settingKey={`${page.slug}_tagline`} type="textarea" placeholder="Short intro line" group="page_hero" />
                                    <SettingInput label="Background image (public path or /storage URL)" settingKey={`${page.slug}_background`} placeholder="assets/img/backdrops/stadium-fans.jpg" group="page_hero" />
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <SettingInput label="CTA label" settingKey={`${page.slug}_cta_label`} placeholder="Get started" group="page_hero" />
                                        </div>
                                        <div className="col-6">
                                            <SettingInput label="CTA link" settingKey={`${page.slug}_cta_href`} placeholder="/services" group="page_hero" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stadium Images — the hero-slider venue photography. Images ship
                committed under public/stadiums/; anything uploaded here
                overrides one of them and can be reset back. */}
            {mainTab === 'stadiums' && (
                <>
                    {stadiums.length === 0 ? (
                        <div className="tfe-empty">
                            <div className="tfe-empty__icon"><i className="fas fa-futbol" /></div>
                            <h4 className="tfe-empty__title">No stadium catalogue</h4>
                            <p className="tfe-empty__body">
                                No tournament in <code>config/stadiums.php</code> has a stadium set yet.
                            </p>
                        </div>
                    ) : stadiums.map((set) => (
                        <div className="mb-5" key={set.tournament_id}>
                            <div className="d-flex align-items-baseline justify-content-between mb-3">
                                <h3 className="admin-section-title mb-0">{set.tournament_name}</h3>
                                <span className="text-white-50 small">
                                    {set.venues.length} venue{set.venues.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            <div className="row g-4">
                                {set.venues.map((venue) => (
                                    <div className="col-lg-4 col-md-6" key={venue.slug}>
                                        <StadiumImageCard
                                            venue={venue}
                                            tournamentId={set.tournament_id}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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
                        router.delete(route('admin.content.posts.delete', postToDelete), {
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
