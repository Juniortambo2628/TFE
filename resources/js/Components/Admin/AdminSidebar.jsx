import React from 'react';
import AppSidebar from '@/Components/Common/AppSidebar';

/**
 * Admin sidebar — grouped into collapsible buckets (AppSidebar renders each
 * heading as a dropdown).
 *
 * REACH: Dashboard, Analytics, Partners, Users.
 * CONTENT: Content, Tournaments, News, Announcements, Ads, Events, Media.
 * SAFETY: Listing safety, Tribes, Stories, Messages.
 * PLATFORM: Settings, Profile.
 *
 * Prizes and Products moved off the admin (Sprint 50) — they are partner/store
 * concerns; the Prize + Product models still back the fan Predict and Store.
 */
export default function AdminSidebar({ user }) {
    const menuItems = [
        { heading: 'Reach' },
        { label: 'Dashboard', icon: 'fas fa-home', route: 'admin.dashboard', path: '/admin/dashboard' },
        { label: 'Analytics', icon: 'fas fa-chart-line', route: 'admin.analytics', path: '/admin/analytics' },
        { label: 'Partners', icon: 'fas fa-handshake', route: 'admin.partners.index', path: '/admin/partners' },
        { label: 'Users', icon: 'fas fa-users', route: 'admin.users', path: '/admin/users' },

        { heading: 'Content' },
        { label: 'Content', icon: 'fas fa-layer-group', route: 'admin.content', path: '/admin/content' },
        { label: 'Tournaments', icon: 'fas fa-trophy', route: 'admin.tournaments.index', path: '/admin/tournaments' },
        { label: 'News', icon: 'fas fa-newspaper', route: 'admin.news.index', path: '/admin/news' },
        { label: 'Announcements', icon: 'fas fa-bullhorn', route: 'admin.announcements', path: '/admin/announcements' },
        { label: 'Ads', icon: 'fas fa-ad', route: 'admin.ads.index', path: '/admin/ads' },
        { label: 'Events', icon: 'fas fa-calendar', route: 'admin.events', path: '/admin/events' },
        { label: 'Media', icon: 'fas fa-photo-film', route: 'admin.media.index', path: '/admin/media' },

        { heading: 'Safety' },
        { label: 'Listing safety', icon: 'fas fa-shield-alt', route: 'admin.listing-approvals.index', path: '/admin/listing-approvals' },
        { label: 'Tribes', icon: 'fas fa-layer-group', route: 'admin.tribes.index', path: '/admin/tribes' },
        { label: 'Stories', icon: 'fas fa-circle', route: 'admin.stories.index', path: '/admin/stories' },
        { label: 'Messages', icon: 'fas fa-envelope', route: 'admin.messages', path: '/admin/messages' },

        { heading: 'Platform' },
        { label: 'Settings', icon: 'fas fa-cog', route: 'admin.settings', path: '/admin/settings' },
        { label: 'Profile', icon: 'fas fa-user-circle', route: 'admin.profile', path: '/admin/profile' },
    ];

    return (
        <AppSidebar
            user={user}
            roleLabel="System Admin"
            accentColor="#3b82f6"
            menuItems={menuItems}
            showActiveDot={true}
        />
    );
}
