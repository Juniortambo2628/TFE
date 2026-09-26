import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import HeaderDropdown from '@/Components/Common/HeaderDropdown';
import useHeaderLogic from '@/Hooks/useHeaderLogic';

/**
 * HeaderUserCluster — the shared right-side chrome (notifications bell,
 * messages, profile dropdown) reused by both the public site header and
 * every dashboard header. The public Header shows this cluster whenever
 * a visitor is signed in; the dashboards use it always.
 *
 * The role prop drives where each item routes to: fan → /fan/*, admin →
 * /admin/*, partner → /partner/*. When the visitor is on the public site
 * (role='auto') we default to 'fan' unless the user is an admin/partner,
 * so tapping "My Profile" from a public page lands you in the right dashboard.
 */
const PROFILE_LINKS = {
    fan: [
        { label: 'Dashboard', icon: 'fas fa-home', route: 'fan.dashboard' },
        { label: 'My Profile', icon: 'fas fa-user', route: 'fan.profile' },
        { label: 'My Tickets', icon: 'fas fa-ticket-alt', route: 'fan.tickets.purchases' },
        { label: 'Virtual Card', icon: 'fas fa-credit-card', route: 'fan.virtual-card' },
        { label: 'Settings', icon: 'fas fa-cog', route: 'fan.security' },
    ],
    admin: [
        { label: 'Dashboard', icon: 'fas fa-home', route: 'admin.dashboard' },
        { label: 'My Profile', icon: 'fas fa-user-circle', route: 'admin.profile' },
        { label: 'Settings', icon: 'fas fa-cog', route: 'admin.settings' },
    ],
    partner: [
        { label: 'Dashboard', icon: 'fas fa-home', route: 'partner.dashboard' },
        { label: 'My Profile', icon: 'fas fa-user', route: 'partner.profile' },
        { label: 'Messages', icon: 'fas fa-envelope', route: 'partner.messages' },
        { label: 'Security', icon: 'fas fa-shield-alt', route: 'partner.security' },
    ],
};

const MESSAGES_ROUTE = {
    fan: 'fan.communication',
    admin: 'admin.messages',
    partner: 'partner.messages',
};

function resolveRole(explicitRole, user) {
    if (explicitRole && explicitRole !== 'auto') return explicitRole;
    if (user?.is_admin) return 'admin';
    if (user?.is_partner) return 'partner';
    return 'fan';
}

function NotificationItem({ notif }) {
    return (
        <div className="dash-activity-item">
            <div className="dash-activity-icon">
                <i className={notif.data?.icon || notif.icon || 'fas fa-info-circle'}></i>
            </div>
            <div className="dash-activity-info">
                <div className="dash-activity-title">{notif.data?.title || notif.title || 'Notification'}</div>
                <div className="dash-activity-label">{notif.data?.body || notif.body || ''}</div>
                <small className="dash-activity-timestamp">
                    {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                </small>
            </div>
        </div>
    );
}

function MessageItem({ msg, href }) {
    return (
        <Link href={href} className="dash-activity-item">
            <div className="dash-avatar dash-avatar-sm">
                {msg.sender?.name?.charAt(0) || 'U'}
            </div>
            <div className="dash-activity-info">
                <div className="dash-activity-title">{msg.sender?.name || 'User'}</div>
                <div className="dash-activity-label">{msg.body || msg.subject}</div>
            </div>
            <small className="dash-activity-timestamp">
                {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}
            </small>
        </Link>
    );
}

export default function HeaderUserCluster({ user, role = 'auto' }) {
    const { auth } = usePage().props;
    const resolvedRole = resolveRole(role, user);
    const { dropdowns, toggleDropdown } = useHeaderLogic();

    // Live notifications: start from server-rendered payload, subscribe to
    // the private user channel when Echo is configured.
    const [liveNotifications, setLiveNotifications] = useState(auth?.notifications || []);
    const [liveUnread, setLiveUnread] = useState(auth?.unreadNotificationsCount || 0);

    useEffect(() => {
        setLiveNotifications(auth?.notifications || []);
        setLiveUnread(auth?.unreadNotificationsCount || 0);
    }, [auth?.notifications, auth?.unreadNotificationsCount]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo || !user?.id) return;
        let channel;
        try { channel = window.Echo.private(`App.Models.User.${user.id}`); } catch { return; }
        const handler = (payload) => {
            const data = payload?.data || payload || {};
            setLiveNotifications((prev) => [data, ...prev].slice(0, 5));
            setLiveUnread((n) => n + 1);
            if (data?.title) toast(data.title, { description: data.body });
        };
        channel.notification(handler);
        return () => {
            try { window.Echo.leave(`private-App.Models.User.${user.id}`); } catch { /* noop */ }
        };
    }, [user?.id]);

    const messages = auth?.messages || [];
    const unreadMessages = auth?.unreadMessagesCount || 0;
    const messagesRoute = MESSAGES_ROUTE[resolvedRole] || MESSAGES_ROUTE.fan;
    const profileLinks = PROFILE_LINKS[resolvedRole] || PROFILE_LINKS.fan;

    return (
        <>
            <div className="dashboard-header-item">
                <button
                    className="dash-btn-icon"
                    onClick={(e) => toggleDropdown('notifications', e)}
                    aria-label="Notifications"
                >
                    <i className="fas fa-bell"></i>
                    {liveUnread > 0 && <span className="dash-badge-count">{liveUnread}</span>}
                </button>
                <HeaderDropdown
                    isOpen={dropdowns.notifications}
                    title="Notifications"
                    badge={`${liveUnread} new`}
                    footer={
                        <Link href={route(messagesRoute)} className="dashboard-dropdown-footer-link">
                            View all <i className="fas fa-arrow-right"></i>
                        </Link>
                    }
                >
                    {liveNotifications.length > 0
                        ? liveNotifications.map((n, i) => <NotificationItem key={i} notif={n} />)
                        : (
                            <div className="dash-empty">
                                <i className="fas fa-bell-slash"></i>
                                <p>No new notifications</p>
                            </div>
                        )}
                </HeaderDropdown>
            </div>

            <div className="dashboard-header-item">
                <button
                    className="dash-btn-icon"
                    onClick={(e) => toggleDropdown('messages', e)}
                    aria-label="Messages"
                >
                    <i className="fas fa-envelope"></i>
                    {unreadMessages > 0 && <span className="dash-badge-count">{unreadMessages}</span>}
                </button>
                <HeaderDropdown
                    isOpen={dropdowns.messages}
                    title="Messages"
                    badge={`${unreadMessages} new`}
                    footer={
                        <Link href={route(messagesRoute)} className="dashboard-dropdown-footer-link">
                            View all <i className="fas fa-arrow-right"></i>
                        </Link>
                    }
                >
                    {messages.length > 0
                        ? messages.map((m, i) => <MessageItem key={i} msg={m} href={route(messagesRoute)} />)
                        : (
                            <div className="dash-empty">
                                <i className="fas fa-envelope-open"></i>
                                <p>No recent messages</p>
                            </div>
                        )}
                </HeaderDropdown>
            </div>

            <div className="dashboard-user-profile" onClick={(e) => toggleDropdown('user', e)}>
                <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                <span className="user-name">{user?.name}</span>
                <i className="fas fa-chevron-down chevron"></i>

                {dropdowns.user && (
                    <div className="tfe-menu-surface tfe-menu-surface--profile" role="menu">
                        <div className="tfe-menu-surface__head">
                            <div className="tfe-menu-surface__user">
                                <div className="tfe-menu-surface__user-name">{user?.name}</div>
                                <div className="tfe-menu-surface__user-email">{user?.email}</div>
                            </div>
                        </div>
                        <div className="tfe-menu-surface__body">
                            {profileLinks.map((link) => (
                                <Link key={link.route} href={route(link.route)} className="tfe-menu-surface__item">
                                    <i className={link.icon}></i> {link.label}
                                </Link>
                            ))}
                        </div>
                        <div className="tfe-menu-surface__foot">
                            <Link href={route('logout')} method="post" as="button" className="tfe-menu-surface__item tfe-menu-surface__item--danger">
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
