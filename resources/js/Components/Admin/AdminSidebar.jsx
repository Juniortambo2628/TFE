import React from 'react';
import AppSidebar from '@/Components/Common/AppSidebar';

/**
 * Admin sidebar — Phase E buckets.
 *
 * REACH: Dashboard, Analytics, Partners, Users.
 * CONTENT: Content, News, Announcements, Ads, Events, Prizes, Products.
 * SAFETY: Listing safety, Tribes, Stories, Messages.
 * PLATFORM: Settings, Profile.
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
        { label: 'News', icon: 'fas fa-newspaper', route: 'admin.news.index', path: '/admin/news' },
        { label: 'Announcements', icon: 'fas fa-bullhorn', route: 'admin.announcements', path: '/admin/announcements' },
        { label: 'Ads', icon: 'fas fa-ad', route: 'admin.ads.index', path: '/admin/ads' },
        { label: 'Events', icon: 'fas fa-calendar', route: 'admin.events', path: '/admin/events' },
        { label: 'Prizes', icon: 'fas fa-trophy', route: 'admin.prizes.index', path: '/admin/prizes' },
        { label: 'Products', icon: 'fas fa-box-open', route: 'admin.products.index', path: '/admin/products' },

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
