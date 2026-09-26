import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import AdminToolbar from '@/Components/Admin/AdminToolbar';
import SettingField from '@/Components/Admin/SettingField';
import { router } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import ListingGrid from '@/Components/Common/ListingGrid';

/**
 * Content Management — the CMS for public page content.
 *
 * Tabs: Page Heroes (the /about, /features, /services, /news, /contact hero
 * band), Section Cards (the content cards beneath each of those heroes) and
 * Posts moderation.
 *
 * Every editor on this page is a <SettingField>, so an image setting is an
 * upload with a live preview rather than a text box asking an admin to type a
 * file path. Stadium imagery used to be a fourth tab here; it now sits with
 * everything else about a tournament under Admin → Tournaments.
 */

// The standalone public section pages that render the shared PageHero.
const HERO_PAGES = [
    { slug: 'about', label: 'About', icon: 'fas fa-info-circle' },
    { slug: 'features', label: 'Features', icon: 'fas fa-star' },
    { slug: 'services', label: 'Services', icon: 'fas fa-concierge-bell' },
    { slug: 'news', label: 'News', icon: 'fas fa-newspaper' },
    { slug: 'contact', label: 'Contact', icon: 'fas fa-envelope' },
];

// One row per hero field, so the five cards below are a map rather than five
// copies of the same six inputs.
const HERO_FIELDS = [
    { field: 'eyebrow', label: 'Eyebrow', type: 'text' },
    { field: 'title', label: 'Title', type: 'text' },
    { field: 'tagline', label: 'Tagline', type: 'textarea' },
    { field: 'background', label: 'Background image', type: 'image', hint: '1920×800 landscape — JPG, PNG or WebP' },
    { field: 'cta_label', label: 'CTA label', type: 'text' },
    { field: 'cta_href', label: 'CTA link', type: 'text' },
];

const CARD_FIELDS = [
    { field: 'image', label: 'Card image', type: 'image', hint: 'Square or 4:3 — JPG, PNG or WebP' },
    { field: 'title', label: 'Title', type: 'text' },
    { field: 'subtitle', label: 'Subtitle', type: 'text' },
    { field: 'description', label: 'Description', type: 'textarea', rows: 4 },
];

const TABS = [
    { key: 'heroes', label: 'Page Heroes', icon: 'fas fa-image' },
    { key: 'cards', label: 'Section Cards', icon: 'fas fa-th-large' },
    { key: 'posts', label: 'Posts', icon: 'fas fa-newspaper' },
];

export default function Content({
    posts = { data: [] },
    settings = {},
    heroDefaults = {},
    sectionCards = [],
}) {
    const [mainTab, setMainTab] = useState('heroes');
    const [search, setSearch] = useState('');
    const [postToDelete, setPostToDelete] = useState(null);
    const [openSection, setOpenSection] = useState(sectionCards[0]?.slug || null);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Content' },
    ];

    return (
        <AdminLayout title="Content Management">
            <DashboardHero
                role="admin"
                title="Content Management"
                subtitle="Public page heroes, section cards and community posts."
                breadcrumbs={breadcrumbs}
            />

            <div className="admin-tabs mb-4">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={`admin-tab ${mainTab === tab.key ? 'active' : ''}`}
                        onClick={() => setMainTab(tab.key)}
                    >
                        <i className={tab.icon}></i> {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Page heroes ─────────────────────────────────────────── */}
            {mainTab === 'heroes' && (
                <div className="admin-cms-grid">
                    {HERO_PAGES.map((page) => (
                        <section className="tfe-slab" key={page.slug}>
                            <div className="tfe-slab__header">
                                <div>
                                    <h2 className="tfe-slab__title">
                                        <i className={page.icon}></i> {page.label} hero
                                    </h2>
                                    <p className="tfe-slab__title-sub">
                                        Leave a field blank to use the built-in default.
                                    </p>
                                </div>
                            </div>
                            <div className="tfe-slab__body">
                                {HERO_FIELDS.map((f) => (
                                    <SettingField
                                        key={f.field}
                                        group="page_hero"
                                        settingKey={`${page.slug}_${f.field}`}
                                        label={f.label}
                                        type={f.type}
                                        hint={f.hint}
                                        rows={f.rows}
                                        value={settings[`page_hero_${page.slug}_${f.field}`] || ''}
                                        defaultValue={heroDefaults?.[page.slug]?.[f.field] || null}
                                        placeholder={heroDefaults?.[page.slug]?.[f.field] || ''}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {/* ── Section cards ───────────────────────────────────────── */}
            {mainTab === 'cards' && (
                <>
                    <div className="feed-tabs mb-4">
                        {sectionCards.map((section) => (
                            <button
                                key={section.slug}
                                type="button"
                                className={`tfe-btn tfe-btn--sm${openSection === section.slug ? ' is-active' : ''}`}
                                onClick={() => setOpenSection(section.slug)}
                            >
                                {section.label}
                                <span className="tfe-pill tfe-pill--info ms-2">{section.cards.length}</span>
                            </button>
                        ))}
                    </div>

                    {sectionCards
                        .filter((section) => section.slug === openSection)
                        .map((section) => (
                            <div className="admin-cms-grid" key={section.slug}>
                                {section.cards.map((card) => (
                                    <section className="tfe-slab" key={card.index}>
                                        <div className="tfe-slab__header">
                                            <div>
                                                <h2 className="tfe-slab__title">
                                                    {card.fields.title.value || card.label}
                                                </h2>
                                                <p className="tfe-slab__title-sub">
                                                    Card {card.index + 1} on /{section.slug}
                                                </p>
                                            </div>
                                            {card.tags?.length > 0 && (
                                                <span className="tfe-pill tfe-pill--concluded">
                                                    {card.tags.join(' · ')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="tfe-slab__body">
                                            {CARD_FIELDS.map((f) => {
                                                const meta = card.fields[f.field];
                                                return (
                                                    <SettingField
                                                        key={f.field}
                                                        group="section_card"
                                                        settingKey={meta.field_key}
                                                        label={f.label}
                                                        type={f.type}
                                                        hint={f.hint}
                                                        rows={f.rows}
                                                        value={meta.value}
                                                        defaultValue={meta.default}
                                                        placeholder={meta.default}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ))}
                </>
            )}

            {/* ── Posts ───────────────────────────────────────────────── */}
            {mainTab === 'posts' && (
                <>
                    <AdminToolbar
                        search={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Search posts..."
                        showSort={false}
                        showViewToggle={false}
                    />

                    <ListingGrid
                        items={(posts.data || []).filter(
                            (p) => !search || (p.content || '').toLowerCase().includes(search.toLowerCase()),
                        )}
                        emptyIcon="fas fa-newspaper"
                        emptyTitle="No posts yet"
                        emptyBody="Community posts will appear here."
                        to={(post) => ({
                            title: post.content?.substring(0, 60) || 'Post',
                            eyebrow: post.author,
                            desc: post.content,
                            accent: '#3b82f6',
                            artwork: { icon: 'fas fa-comment' },
                            meta: [{ label: 'Posted', value: post.created_at }],
                            cornerButton: {
                                icon: 'fas fa-trash',
                                label: 'Delete post',
                                onClick: () => setPostToDelete(post.id),
                            },
                        })}
                        tableView={
                            <table className="tfe-table">
                                <thead>
                                    <tr>
                                        <th>Content</th>
                                        <th>Author</th>
                                        <th>Date</th>
                                        <th style={{ width: 90 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(posts.data || []).map((post) => (
                                        <tr key={post.id}>
                                            <td>{post.content}</td>
                                            <td>{post.author}</td>
                                            <td>{post.created_at}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                    aria-label="Delete post"
                                                    onClick={() => setPostToDelete(post.id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        }
                    />
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
                            onSuccess: () => setPostToDelete(null),
                        });
                    }
                }}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
