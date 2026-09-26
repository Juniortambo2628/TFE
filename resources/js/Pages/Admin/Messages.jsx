import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import AdminToolbar from '@/Components/Admin/AdminToolbar';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import ListingGrid from '@/Components/Common/ListingGrid';
import DashboardModal from '@/Components/Common/DashboardModal';
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

    const iconFor = (msg) => (msg.type === 'notifications' ? 'fas fa-bell' : 'fas fa-envelope');
    // Only inbox messages and internal sent messages have a delete/read route.
    const isDeletable = (msg) => msg.source === 'external' || msg.source === 'internal';

    return (
        <AdminLayout title="Messages">
            <DashboardHero role="admin"
                title="Messages & Notifications"
                subtitle="Manage contact messages and system notifications."
                breadcrumbs={breadcrumbs}
            />

            <SummaryTiles items={[
                { label: 'Total Inbox', value: stats.inbox || 0, icon: 'fa-inbox', accent: 'blue' },
                { label: 'Unread', value: stats.unread || 0, icon: 'fa-envelope-open', accent: 'amber' },
                { label: 'Notifications', value: stats.notifications || 0, icon: 'fa-bell', accent: 'violet' },
            ]} className="mb-4" />

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
                <div className="card-body">
                    <ListingGrid
                        items={filteredItems}
                        emptyIcon={activeTab === 'notifications' ? 'fas fa-bell-slash' : 'fas fa-inbox'}
                        emptyTitle={`No ${activeTab === 'notifications' ? 'notifications' : 'messages'} yet`}
                        emptyBody="Messages will appear here when users contact you."
                        to={(msg) => ({
                            title: msg.subject,
                            eyebrow: msg.from,
                            desc: msg.excerpt,
                            accent: msg.read ? '#64748b' : '#3b82f6',
                            artwork: { icon: iconFor(msg) },
                            status: msg.read ? 'Read' : 'Unread',
                            meta: [{ label: 'Date', value: msg.date }],
                            onClick: () => setSelectedMessage(msg),
                            cornerButton: isDeletable(msg) ? {
                                icon: 'fas fa-trash',
                                label: 'Delete message',
                                onClick: () => setMessageToDelete({ id: msg.id, source: msg.source }),
                            } : undefined,
                        })}
                        tableView={
                            <table className="tfe-table">
                                <thead>
                                    <tr>
                                        <th>From</th>
                                        <th>Subject</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th style={{ width: 110 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((msg) => (
                                        <tr key={`${msg.type}-${msg.id}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedMessage(msg)}>
                                            <td className="fw-semibold">{msg.from}</td>
                                            <td>{msg.subject}</td>
                                            <td>{msg.date}</td>
                                            <td>
                                                <span className={`tfe-pill ${msg.read ? 'tfe-pill--concluded' : 'tfe-pill--info'}`}>
                                                    {msg.read ? 'Read' : 'Unread'}
                                                </span>
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div className="d-flex gap-2">
                                                    {!msg.read && isDeletable(msg) && (
                                                        <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Mark as read" onClick={() => handleMarkRead(msg.id, msg.source)}>
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                    )}
                                                    {isDeletable(msg) && (
                                                        <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Delete message" onClick={() => setMessageToDelete({ id: msg.id, source: msg.source })}>
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        }
                    />
                </div>
            </div>

            {/* Message Detail Modal */}
            <DashboardModal
                open={!!selectedMessage}
                onOpenChange={(open) => !open && setSelectedMessage(null)}
                title={selectedMessage?.subject || 'Message'}
                label={selectedMessage?.type === 'notifications' ? 'Notification' : 'Message'}
                activeTab="detail"
                onTabChange={() => {}}
                tabs={[{ id: 'detail', label: 'Details', icon: 'fas fa-envelope-open' }]}
            >
                {selectedMessage && (
                    <div className="p-4">
                        <div className="d-flex gap-3 mb-3 pb-3 dash-top-divider">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 dash-avatar dash-avatar-lg"
                                style={{ background: 'var(--admin-primary-light)', color: 'var(--admin-primary)' }}
                            >
                                {selectedMessage.type === 'notifications' ? <i className="fas fa-bell"></i> : (selectedMessage.from?.charAt(0) || 'M')}
                            </div>
                            <div>
                                <div className="fw-semibold text-white">{selectedMessage.from}</div>
                                <small className="text-white" style={{ opacity: 0.6 }}>{selectedMessage.date}</small>
                            </div>
                        </div>
                        <p className="text-white">{selectedMessage.excerpt}</p>

                        <div className="mt-4 d-flex justify-content-end gap-2">
                            {!selectedMessage.read && isDeletable(selectedMessage) && (
                                <button
                                    type="button"
                                    className="tfe-btn tfe-btn--sm"
                                    onClick={() => { handleMarkRead(selectedMessage.id, selectedMessage.source); setSelectedMessage(null); }}
                                >
                                    <i className="fas fa-check me-2"></i> Mark as read
                                </button>
                            )}
                            <button type="button" className="btn-cancel" onClick={() => setSelectedMessage(null)}>Close</button>
                        </div>
                    </div>
                )}
            </DashboardModal>

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
