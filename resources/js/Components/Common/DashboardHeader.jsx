import React, { useEffect, useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import useHeaderLogic from '@/Hooks/useHeaderLogic';
import HeaderDropdown from './HeaderDropdown';
import { useSidebar } from '@/Components/ui/sidebar';
import FanTournamentSwitcher from '@/Components/Common/TournamentSwitcher';
import { toast } from 'sonner';

/**
 * DashboardHeader — one header for every dashboard role.
 *
 * The role only decides content (which nav pills, which role badge,
 * which mark-all-read behaviour); every visual concern — accent
 * colour, spacing, tokens — lives in fan-dashboard-header.css and
 * dashboard-header-extras.css and is scoped via `data-role` on the
 * .dashboard-header element. There are no inline styles.
 */

// Partner badge is contextual: a finance_partner sees "Finance Partner",
// a travel_agent sees "Travel Partner", other types fall back to the
// title-cased partner_type. Non-partner roles keep their base label.
const PARTNER_TYPE_LABEL = {
    travel_agent: 'Travel Partner',
    finance_partner: 'Finance Partner',
    airline: 'Airline Partner',
    hotel_provider: 'Hospitality Partner',
    destination: 'Destination Partner',
    club: 'Club Partner',
    federation: 'Federation Partner',
    event_organiser: 'Event Organiser',
    sponsor: 'Sponsor',
    ticketing_partner: 'Ticketing Partner',
};

function resolveRoleLabel(role, base, user) {
    if (role !== 'partner') return base;
    const type = user?.partner_type;
    return PARTNER_TYPE_LABEL[type] || base;
}

const ROLE_CONFIG = {
    fan: {
        routePrefix: 'fan',
        roleBadge: null,
        navLinks: [
            { label: 'Social', icon: 'fas fa-users', route: 'fan.feed' },
            { label: 'Tribes', icon: 'fas fa-layer-group', route: 'fan.tribes' },
            { label: 'Store', icon: 'fas fa-tshirt', route: 'fan.store' },
            { label: 'Predict', icon: 'fas fa-futbol', route: 'fan.predict-win' },
        ],
        profileLinks: [
            { label: 'My Profile', icon: 'fas fa-user', route: 'fan.profile' },
            { label: 'Settings', icon: 'fas fa-cog', route: 'fan.security' },
        ],
        markReadRoute: (type) => `fan.${type}.read-all`,
        messagesLink: 'fan.communication',
        useMarkAllButton: true,
    },
    admin: {
        routePrefix: 'admin',
        roleBadge: { label: 'System Admin', icon: 'fas fa-shield-alt' },
        navLinks: [],
        profileLinks: [
            { label: 'Dashboard', icon: 'fas fa-home', route: 'admin.dashboard' },
            { label: 'My Profile', icon: 'fas fa-user-circle', route: 'admin.profile' },
            { label: 'Settings', icon: 'fas fa-cog', route: 'admin.settings' },
        ],
        markReadRoute: null,
        messagesLink: 'admin.messages',
        useMarkAllButton: false,
    },
    partner: {
        routePrefix: 'partner',
        // Base label — the actual role badge is derived from
        // user.partner_type below so finance partners see "Finance
        // Partner" rather than the hard-coded "Travel Partner".
        roleBadge: { label: 'Partner', icon: 'fas fa-handshake' },
        navLinks: [],
        profileLinks: [
            { label: 'Dashboard', icon: 'fas fa-home', route: 'partner.dashboard' },
            { label: 'Messages', icon: 'fas fa-envelope', route: 'partner.messages' },
            { label: 'My Profile', icon: 'fas fa-user', route: 'partner.profile' },
            { label: 'Security', icon: 'fas fa-shield-alt', route: 'partner.security' },
        ],
        markReadRoute: null,
        messagesLink: 'partner.messages',
        useMarkAllButton: false,
    },
};

function NotificationItem({ notif }) {
    return (
        <div className="dash-activity-item">
            <div className="dash-activity-icon">
                <i className={notif.data?.icon || 'fas fa-info-circle'}></i>
            </div>
            <div className="dash-activity-info">
                <div className="dash-activity-title">{notif.data?.title || 'Notification'}</div>
                <div className="dash-activity-label">{notif.data?.body || ''}</div>
                <small className="dash-activity-timestamp">
                    {new Date(notif.created_at).toLocaleString()}
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
                {new Date(msg.created_at).toLocaleDateString()}
            </small>
        </Link>
    );
}

export default function DashboardHeader({ role = 'fan', user, assetUrl, toggleSidebar }) {
    const config = ROLE_CONFIG[role];
    const { dropdowns, toggleDropdown, closeAllDropdowns } = useHeaderLogic();
    const { auth, assetUrl: pageAssetUrl } = usePage().props;
    const { toggleSidebar: toggleShadcnSidebar } = useSidebar();
    const baseUrl = assetUrl || pageAssetUrl || '';
    const doToggleSidebar = toggleSidebar || toggleShadcnSidebar;

    // Sprint 35 — start from the server-rendered notifications, then
    // let a Reverb subscription push new ones onto the head of the
    // list as they broadcast. Falls back to the plain server payload
    // when Echo isn't configured on the build.
    const [liveNotifications, setLiveNotifications] = useState(auth?.notifications || []);
    const [liveUnread, setLiveUnread] = useState(auth?.unreadNotificationsCount || 0);

    useEffect(() => {
        // Keep local state in sync when Inertia replaces the page
        // props (nav / partial reload); the server truth wins.
        setLiveNotifications(auth?.notifications || []);
        setLiveUnread(auth?.unreadNotificationsCount || 0);
    }, [auth?.notifications, auth?.unreadNotificationsCount]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo || !user?.id) return;
        let channel;
        try {
            channel = window.Echo.private(`App.Models.User.${user.id}`);
        } catch (_e) {
            return;
        }
        const handler = (payload) => {
            // Notifiable::notify broadcasts payload as { id, type, data, … }
            const data = payload?.data || payload || {};
            setLiveNotifications((prev) => [data, ...prev].slice(0, 5));
            setLiveUnread((n) => n + 1);
            if (data?.title) {
                toast(data.title, { description: data.body });
            }
        };
        channel.notification(handler);
        return () => {
            try {
                window.Echo.leave(`private-App.Models.User.${user.id}`);
            } catch (_e) {
                /* transport already torn down */
            }
        };
    }, [user?.id]);

    const notifications = liveNotifications;
    const unreadNotifications = liveUnread;
    const messages = auth?.messages || [];
    const unreadMessages = auth?.unreadMessagesCount || 0;

    const markAllRead = (type) => {
        const routeName = config.markReadRoute?.(type);
        if (!routeName) return;
        router.post(route(routeName), {}, {
            preserveScroll: true,
            onSuccess: () => closeAllDropdowns(),
        });
    };

    return (
        <div className="dashboard-header" data-role={role}>
            <button
                className="dashboard-hamburger"
                id="dashboardHamburger"
                onClick={(e) => { e.stopPropagation(); doToggleSidebar(); }}
                aria-label="Toggle sidebar"
            >
                <i className="fas fa-bars"></i>
            </button>

            <div className="dashboard-title">
                <img src={`${baseUrl}assets/img/logo/TFE-logo.png`} alt="TFE Logo" />
            </div>

            <div className="dashboard-header-nav">
                {config.roleBadge && (
                    <span className="dash-badge">
                        <i className={config.roleBadge.icon}></i>
                        {resolveRoleLabel(role, config.roleBadge.label, user)}
                    </span>
                )}

                {config.navLinks.map((link) => (
                    <Link
                        key={link.route}
                        id={`nav-link-${link.label.toLowerCase()}`}
                        href={route(link.route)}
                        className="dashboard-header-nav__link"
                    >
                        <i className={link.icon}></i>
                        <span>{link.label}</span>
                    </Link>
                ))}
            </div>

            <div className="dashboard-header-actions">
                {role === 'fan' && <FanTournamentSwitcher variant="dashboard" />}

                <div className="dashboard-header-item">
                    <button
                        id="header-notifications-btn"
                        className="dash-btn-icon"
                        onClick={(e) => toggleDropdown('notifications', e)}
                        aria-label="Notifications"
                    >
                        <i className="fas fa-bell"></i>
                        {unreadNotifications > 0 && (
                            <span className="dash-badge-count">{unreadNotifications}</span>
                        )}
                    </button>
                    <HeaderDropdown
                        isOpen={dropdowns.notifications}
                        title="Notifications"
                        badge={
                            config.useMarkAllButton
                                ? <button onClick={(e) => { e.stopPropagation(); markAllRead('notifications'); }} className="manage-btn">Mark all read</button>
                                : `${unreadNotifications} new`
                        }
                        footer={!config.useMarkAllButton ? (
                            <Link href={route(config.messagesLink)} className="dashboard-dropdown-footer-link">
                                View All Notifications <i className="fas fa-arrow-right"></i>
                            </Link>
                        ) : null}
                    >
                        {notifications.length > 0 ? (
                            notifications.map((n, i) => <NotificationItem key={i} notif={n} />)
                        ) : (
                            <div className="dash-empty">
                                <i className="fas fa-bell-slash"></i>
                                <p>No new notifications</p>
                            </div>
                        )}
                    </HeaderDropdown>
                </div>

                <div className="dashboard-header-item">
                    <button
                        id="header-messages-btn"
                        className="dash-btn-icon"
                        onClick={(e) => toggleDropdown('messages', e)}
                        aria-label="Messages"
                    >
                        <i className="fas fa-envelope"></i>
                        {unreadMessages > 0 && (
                            <span className="dash-badge-count">{unreadMessages}</span>
                        )}
                    </button>
                    <HeaderDropdown
                        isOpen={dropdowns.messages}
                        title="Messages"
                        badge={
                            config.useMarkAllButton
                                ? <button onClick={(e) => { e.stopPropagation(); markAllRead('messages'); }} className="manage-btn">Mark all read</button>
                                : `${unreadMessages} new`
                        }
                        footer={
                            <Link href={route(config.messagesLink)} className="dashboard-dropdown-footer-link">
                                View All Messages <i className="fas fa-arrow-right"></i>
                            </Link>
                        }
                    >
                        {messages.length > 0 ? (
                            messages.map((m, i) => (
                                <MessageItem key={i} msg={m} href={route(config.messagesLink)} />
                            ))
                        ) : (
                            <div className="dash-empty">
                                <i className="fas fa-envelope-open"></i>
                                <p>No recent messages</p>
                            </div>
                        )}
                    </HeaderDropdown>
                </div>

                <div
                    id="header-user-profile"
                    className="dashboard-user-profile"
                    onClick={(e) => toggleDropdown('user', e)}
                >
                    <div className="user-avatar">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
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
                                {config.profileLinks.map((link) => (
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
            </div>
        </div>
    );
}
