import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminHero from '@/Components/Admin/AdminHero';
import AdminToolbar from '@/Components/Admin/AdminToolbar';
import StatCard from '@/Components/Common/StatCard';
import { router } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';

export default function Messages({ auth, contactMessages = { data: [] }, internalMessages = { data: [] }, sentMessages = { data: [] }, notifications = { data: [] }, stats = {} }) {
    const [activeTab, setActiveTab] = useState('inbox');
    const [search, setSearch] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Messages' }
    ];

    const tabs = [
        { key: 'inbox', label: 'Inbox', icon: 'fas fa-inbox', count: stats.inbox || 0 },
        { key: 'sent', label: 'Sent', icon: 'fas fa-paper-plane', count: stats.sent || 0 },
        { key: 'notifications', label: 'Notifications', icon: 'fas fa-bell', count: stats.notifications || 0 }
    ];

    const handleDelete = () => {
        if (messageToDelete) {
            const { id, source } = messageToDelete;
            const url = source === 'internal' ? `/admin/internal-messages/${id}` : `/admin/messages/${id}`;
            router.delete(url, {
                onSuccess: () => setMessageToDelete(null)
            });
        }
    };

    const handleMarkRead = (id, source) => {
        const url = source === 'internal' ? `/admin/internal-messages/${id}/read` : `/admin/messages/${id}/read`;
        router.put(url);
    };

    // Combine and normalize data for display
    const normalizedMessages = [
        ...(contactMessages?.data || []).map(m => ({
            id: m.id,
            from: m.name || 'External User',
            subject: m.subject || 'Contact Inquiry',
            excerpt: m.message,
            date: new Date(m.created_at).toLocaleDateString(),
            read: !!m.is_read,
            type: 'inbox',
            source: 'external',
            raw: m
        })),
        ...(internalMessages?.data || []).map(m => ({
            id: m.id,
            from: m.sender?.name || 'Internal User',
            subject: m.subject || 'System Message',
            excerpt: m.body,
            date: new Date(m.created_at).toLocaleDateString(),
            read: !!m.is_read,
            type: 'inbox',
            source: 'internal',
            raw: m
        }))
    ].sort((a, b) => new Date(b.raw.created_at) - new Date(a.raw.created_at));

    const currentData = activeTab === 'notifications' 
        ? notifications.data.map(n => ({
            id: n.id,
            from: 'System',
            subject: n.data?.title || 'System Notification',
            excerpt: n.data?.message || n.data?.body || 'New system update',
            date: new Date(n.created_at).toLocaleDateString(),
            read: !!n.read_at,
            type: 'notifications',
            raw: n
        }))
        : activeTab === 'sent'
        ? sentMessages.data.map(m => ({
            id: m.id,
            from: `To: ${m.recipient?.name || 'User'}`,
            subject: m.subject || 'Internal Message',
            excerpt: m.body,
            date: new Date(m.created_at).toLocaleDateString(),
            read: true,
            type: 'sent',
            source: 'internal',
            raw: m
        }))
        : normalizedMessages;

    const filteredItems = currentData.filter(m => 
        (!search || m.subject?.toLowerCase().includes(search.toLowerCase()) || m.from?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <AdminLayout title="Messages">
            <AdminHero 
                title="Messages & Notifications"
                subtitle="Manage contact messages and system notifications."
                breadcrumbs={breadcrumbs}
            />

            {/* Dashboard Stats */}
            <div className="admin-visual-cards mb-4 dash-visual-cards">
                <StatCard 
                    type="visual"
                    label="Total Inbox" 
                    value={stats.inbox || 0} 
                    icon="fas fa-inbox"
                    bgType="dashboard"
                    settingsKey="bg_card_messages_inbox"
                    image="/assets/images/bgimage05.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Unread" 
                    value={stats.unread || 0} 
                    icon="fas fa-envelope-open"
                    bgType="dashboard"
                    settingsKey="bg_card_messages_unread"
                    image="/assets/images/bgimage06.jpg"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Notifications" 
                    value={stats.notifications || 0} 
                    icon="fas fa-bell"
                    bgType="dashboard"
                    settingsKey="bg_card_messages_notifications"
                    image="/assets/images/bgimage07.jpg"
                    className="flex-grow-1"
                />
            </div>

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
                        {tab.count > 0 && (
                            <span className="admin-badge admin-badge-blue ms-2">{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <AdminToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search messages..."
                showSort={false}
                showViewToggle={false}
            />

            {/* Messages List */}
            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className={activeTab === 'notifications' ? 'fas fa-bell' : 'fas fa-envelope'}></i> {activeTab === 'notifications' ? 'Notifications' : 'Messages'}</h3>
                    <span className="admin-badge admin-badge-gray">{filteredItems.length} items</span>
                </div>
                <div className="card-body p-0">
                    {filteredItems.length > 0 ? (
                        <div className="d-flex flex-column">
                            {filteredItems.map(msg => (
                                <div 
                                    key={msg.id}
                                    className="d-flex align-items-start gap-3 p-3"
                                    style={{ 
                                        borderBottom: '1px solid var(--admin-border)',
                                        background: msg.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedMessage(msg)}
                                >
                                    <div 
                                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ 
                                            width: '40px', 
                                            height: '40px', 
                                            background: msg.read ? 'var(--admin-bg-dark)' : 'var(--admin-primary-light)',
                                            color: msg.read ? 'var(--admin-text-muted)' : 'var(--admin-primary)',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {msg.type === 'notifications' ? (
                                            <i className="fas fa-bell"></i>
                                        ) : (
                                            msg.from?.charAt(0) || 'M'
                                        )}
                                    </div>
                                    <div className="flex-grow-1 min-w-0">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <div className="fw-semibold text-white" style={{ opacity: msg.read ? 0.7 : 1 }}>
                                                    {msg.from}
                                                    {!msg.read && (
                                                        <span 
                                                            className="ms-2" 
                                                            style={{ 
                                                                width: '8px', 
                                                                height: '8px', 
                                                                background: 'var(--admin-primary)', 
                                                                borderRadius: '50%',
                                                                display: 'inline-block'
                                                            }}
                                                        ></span>
                                                    )}
                                                </div>
                                                <div className="text-white small" style={{ opacity: msg.read ? 0.6 : 0.9 }}>
                                                    {msg.subject}
                                                </div>
                                            </div>
                                            <small className="text-white flex-shrink-0" style={{ opacity: 0.6 }}>{msg.date}</small>
                                        </div>
                                        <p className="text-white small mb-0 mt-1 text-truncate" style={{ opacity: 0.8 }}>{msg.excerpt}</p>
                                    </div>
                                    <div className="d-flex gap-2 flex-shrink-0">
                                        {!msg.read && (
                                            <button 
                                                className="btn-admin-icon"
                                                title="Mark as read"
                                                onClick={(e) => { e.stopPropagation(); handleMarkRead(msg.id, msg.source); }}
                                                style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--admin-primary)', borderColor: 'var(--admin-primary)' }}
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>
                                        )}
                                        <button 
                                            className="btn-admin-icon"
                                            title="Delete"
                                            onClick={(e) => { e.stopPropagation(); setMessageToDelete({ id: msg.id, source: msg.source }); }}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="admin-empty-state">
                            <i className={activeTab === 'notifications' ? 'fas fa-bell-slash' : 'fas fa-inbox'}></i>
                            <h4>No {activeTab === 'notifications' ? 'notifications' : 'messages'} yet</h4>
                            <p>Messages will appear here when users contact you.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Detail Modal */}
            {selectedMessage && (
                <div 
                    className="dash-modal-overlay"
                    onClick={() => setSelectedMessage(null)}
                >
                    <div 
                        className="admin-card-dark"
                        style={{ width: '600px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="card-header">
                            <h3><i className="fas fa-envelope-open"></i> {selectedMessage.subject}</h3>
                            <button className="btn-admin-icon" onClick={() => setSelectedMessage(null)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="card-body">
                                    <div className="d-flex gap-3 mb-3 pb-3 dash-top-divider">
                                        <div 
                                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 dash-avatar dash-avatar-lg"
                                            style={{ 
                                                background: 'var(--admin-primary-light)',
                                                color: 'var(--admin-primary)',
                                            }}
                                >
                                    {selectedMessage.from?.charAt(0) || 'M'}
                                </div>
                                <div>
                                    <div className="fw-semibold text-white">{selectedMessage.from}</div>
                                    <small className="text-white" style={{ opacity: 0.6 }}>{selectedMessage.date}</small>
                                </div>
                            </div>
                            <p className="text-white">{selectedMessage.excerpt}</p>
                            <p className="text-white" style={{ opacity: 0.7 }}>This is a preview. Full message content will be displayed from the database.</p>
                        </div>
                        <div className="card-footer d-flex gap-2">
                            <button className="btn-admin">
                                <i className="fas fa-reply"></i> Reply
                            </button>
                            <button className="btn-admin-outline" onClick={() => setSelectedMessage(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationDialog
                open={!!messageToDelete}
                onOpenChange={(open) => !open && setMessageToDelete(null)}
                title="Delete Message?"
                description="Are you sure you want to delete this message?"
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
