import React from 'react';
import AppSidebar from '@/Components/Common/AppSidebar';

export default function AdminSidebar({ user }) {
    const menuItems = [
        { label: 'Dashboard', icon: 'fas fa-home', route: 'admin.dashboard', path: '/admin/dashboard' },
        { label: 'News', icon: 'fas fa-newspaper', route: 'admin.news.index', path: '/admin/news' },
        { label: 'Ads', icon: 'fas fa-ad', route: 'admin.ads.index', path: '/admin/ads' },
        { label: 'Events', icon: 'fas fa-calendar', route: 'admin.events', path: '/admin/events' },
        { label: 'Users', icon: 'fas fa-users', route: 'admin.users', path: '/admin/users' },
        { label: 'Messages', icon: 'fas fa-envelope', route: 'admin.messages', path: '/admin/messages' },
        { label: 'Announcements', icon: 'fas fa-bullhorn', route: 'admin.announcements', path: '/admin/announcements' },
        { label: 'Analytics', icon: 'fas fa-chart-line', route: 'admin.analytics', path: '/admin/analytics' },
        { label: 'Profile', icon: 'fas fa-user-circle', route: 'admin.profile', path: '/admin/profile' },
        { label: 'Payments', icon: 'fas fa-credit-card', route: 'admin.payments', path: '/admin/payments' },
        { label: 'Bookings', icon: 'fas fa-calendar-check', route: 'admin.bookings.index', path: '/admin/bookings' },
        { label: 'Packages', icon: 'fas fa-gift', route: 'admin.packages.index', path: '/admin/packages' },
        { label: 'Partners', icon: 'fas fa-handshake', route: 'admin.partners.index', path: '/admin/partners' },
        { label: 'Approvals', icon: 'fas fa-clipboard-check', route: 'admin.listing-approvals.index', path: '/admin/listing-approvals' },
        { label: 'Products', icon: 'fas fa-box-open', route: 'admin.products.index', path: '/admin/products' },
        { label: 'Loans', icon: 'fas fa-hand-holding-usd', route: 'admin.loan-applications', path: '/admin/loan-applications' },
        { label: 'Prizes', icon: 'fas fa-trophy', route: 'admin.prizes.index', path: '/admin/prizes' },
        { label: 'Savings', icon: 'fas fa-piggy-bank', route: 'admin.savings-goals.index', path: '/admin/savings-goals' },
        { label: 'Content', icon: 'fas fa-layer-group', route: 'admin.content', path: '/admin/content' },
        { label: 'Settings', icon: 'fas fa-cog', route: 'admin.settings', path: '/admin/settings' },
    ];

    return (
        <AppSidebar
            user={user}
            roleLabel="System Admin"
            accentColor="#3b82f6" // blue-500
            menuItems={menuItems}
            showActiveDot={true}
        />
    );
}
