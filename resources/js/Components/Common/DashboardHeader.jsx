import React from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import useHeaderLogic from '@/Hooks/useHeaderLogic';
import HeaderDropdown from './HeaderDropdown';
import { useSidebar } from '@/Components/ui/sidebar';

const ROLE_CONFIG = {
    fan: {
        accentColor: '#e31b23',
        avatarBg: '#333',
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
        accentColor: '#3b82f6',
        avatarBg: '#3b82f6',
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
        accentColor: '#d97706',
        avatarBg: '#d97706',
        routePrefix: 'partner',
        roleBadge: { label: 'Travel Partner', icon: 'fas fa-handshake' },
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

function NotificationItem({ notif, accentColor }) {
    return (
        <div className="dash-activity-item">
            <div className="dash-activity-icon" style={{ background: `${accentColor}1a`, color: accentColor }}>
                <i className={notif.data?.icon || 'fas fa-info-circle'}></i>
            </div>
            <div className="dash-activity-info">
                <div className="dash-activity-title">{notif.data?.title || 'Notification'}</div>
                <div className="dash-activity-label">{notif.data?.body || ''}</div>
                <small style={{ color: 'var(--text-dim)' }}>{new Date(notif.created_at).toLocaleString()}</small>
            </div>
        </div>
    );
}

function MessageItem({ msg, accentColor, href }) {
    return (
        <Link
            href={href}
            className="dash-activity-item text-decoration-none"
        >
            <div className="dash-avatar dash-avatar-sm" style={{ background: `${accentColor}1a`, color: accentColor }}>
                {msg.sender?.name?.charAt(0) || 'U'}
            </div>
            <div className="dash-activity-info">
                <div className="dash-activity-title">{msg.sender?.name || 'User'}</div>
                <div className="dash-activity-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.body || msg.subject}
                </div>
            </div>
            <small style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
                {new Date(msg.created_at).toLocaleDateString()}
            </small>
        </Link>
    );
}

export default function DashboardHeader({ role = 'fan', user, assetUrl, toggleSidebar, extraActions }) {
    const config = ROLE_CONFIG[role];
    const { dropdowns, toggleDropdown, closeAllDropdowns } = useHeaderLogic();
    const { auth, assetUrl: pageAssetUrl } = usePage().props;
    const { toggleSidebar: toggleShadcnSidebar } = useSidebar();
    const baseUrl = assetUrl || pageAssetUrl || '';
    const prefix = config.routePrefix;

    const doToggleSidebar = toggleSidebar || toggleShadcnSidebar;

    const notifications = auth?.notifications || [];
    const unreadNotifications = auth?.unreadNotificationsCount || 0;
    const messages = auth?.messages || [];
    const unreadMessages = auth?.unreadMessagesCount || 0;

    const markAllRead = (type) => {
        const routeName = config.markReadRoute(type);
        if (!routeName) return;
        router.post(route(routeName), {}, {
            preserveScroll: true,
            onSuccess: () => closeAllDropdowns(),
        });
    };

    return (
        <div className="dashboard-header">
            <button
                className="dashboard-hamburger"
                id="dashboardHamburger"
                onClick={(e) => { e.stopPropagation(); doToggleSidebar(); }}
            >
                <i className="fas fa-bars"></i>
            </button>

            <div className="dashboard-title">
                <img
                    src={`${baseUrl}assets/img/logo/TFE-logo.png`}
                    alt="TFE Logo"
                    style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                />
            </div>

            {/* Desktop nav area */}
            <div className="d-none d-lg-flex align-items-center gap-2 ms-4 me-auto">
                {config.roleBadge && (
                    <span className="dash-badge" style={{
                        background: `${config.accentColor}33`,
                        color: config.accentColor,
                        border: `1px solid ${config.accentColor}`,
                        padding: 'var(--space-xs) var(--space-md)',
                    }}>
                        <i className={`${config.roleBadge.icon} me-2`}></i>
                        {config.roleBadge.label}
                    </span>
                )}

                {config.navLinks.map((link) => (
                    <Link
                        key={link.route}
                        id={`nav-link-${link.label.toLowerCase()}`}
                        href={route(link.route)}
                        className="text-white text-decoration-none d-flex align-items-center gap-2"
                    >
                        <i className={`${link.icon} text-white-50`}></i>
                        <span className="fw-medium">{link.label}</span>
                    </Link>
                ))}

                {extraActions}
            </div>

            <div className="dashboard-header-actions d-flex align-items-center gap-3">
                {/* Notifications */}
                <div style={{ position: 'relative' }}>
                    <button
                        id="header-notifications-btn"
                        className="dash-btn-icon"
                        style={{ background: `${config.accentColor}1a` }}
                        onClick={(e) => toggleDropdown('notifications', e)}
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
                            <Link href={route(config.messagesLink)} className="d-block text-center p-3 text-decoration-none" style={{ color: config.accentColor }}>
                                View All Notifications <i className="fas fa-arrow-right ms-1"></i>
                            </Link>
                        ) : null}
                    >
                        {notifications.length > 0 ? (
                            notifications.map((n, i) => <NotificationItem key={i} notif={n} accentColor={config.accentColor} />)
                        ) : (
                            <div className="dash-empty" style={{ padding: 'var(--space-xl)' }}>
                                <i className="fas fa-bell-slash"></i>
                                <p>No new notifications</p>
                            </div>
                        )}
                    </HeaderDropdown>
                </div>

                {/* Messages */}
                <div style={{ position: 'relative' }}>
                    <button
                        id="header-messages-btn"
                        className="dash-btn-icon"
                        style={{ background: `${config.accentColor}1a` }}
                        onClick={(e) => toggleDropdown('messages', e)}
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
                            <Link href={route(config.messagesLink)} className="d-block text-center p-3 text-decoration-none" style={{ color: config.accentColor }}>
                                View All Messages <i className="fas fa-arrow-right ms-1"></i>
                            </Link>
                        }
                    >
                        {messages.length > 0 ? (
                            messages.map((m, i) => (
                                <MessageItem key={i} msg={m} accentColor={config.accentColor} href={route(config.messagesLink)} />
                            ))
                        ) : (
                            <div className="dash-empty" style={{ padding: 'var(--space-xl)' }}>
                                <i className="fas fa-envelope-open"></i>
                                <p>No recent messages</p>
                            </div>
                        )}
                    </HeaderDropdown>
                </div>

                {/* User Profile */}
                <div
                    id="header-user-profile"
                    className="dashboard-user-profile"
                    style={{ position: 'relative' }}
                    onClick={(e) => toggleDropdown('user', e)}
                >
                    <div className="user-avatar" style={{ flexShrink: 0 }}>
                        <div className="dash-avatar dash-avatar-sm" style={{ background: config.avatarBg }}>
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                    </div>
                    <span className="user-name">{user?.name}</span>
                    <i className="fas fa-chevron-down chevron"></i>

                    {dropdowns.user && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 'var(--z-dropdown)' }}>
                            <div className="dashboard-dropdown-header">
                                <div className="user-info">
                                    <div className="user-name">{user?.name}</div>
                                    <div className="user-email">{user?.email}</div>
                                </div>
                            </div>
                            <div className="dashboard-dropdown-divider"></div>
                            {config.profileLinks.map((link) => (
                                <Link key={link.route} href={route(link.route)} className="dashboard-dropdown-item">
                                    <i className={link.icon}></i> {link.label}
                                </Link>
                            ))}
                            <div className="dashboard-dropdown-divider"></div>
                            <Link href={route('logout')} method="post" as="button" className="dashboard-dropdown-item w-100 text-start">
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
