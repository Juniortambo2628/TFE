import React, { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Common/Breadcrumbs';
import '../../../css/fan/fan-pages.css';
import { formatMoney } from '@/lib/utils';

export default function Communication({ threads = [], stats = {} }) {
    const { flash } = usePage().props;
    const [selectedThread, setSelectedThread] = useState(null);

    const messageForm = useForm({
        budget_id: '',
        body: '',
    });

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!selectedThread) return;

        messageForm.setData('budget_id', selectedThread.budget_id);
        messageForm.post(route('partner.messages.store'), {
            onSuccess: () => {
                messageForm.reset('body');
            },
        });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved': return 'dash-badge-success';
            case 'modified': return 'dash-badge-warning';
            case 'pending': return 'dash-badge-info';
            default: return 'dash-badge-neutral';
        }
    };

    return (
        <PartnerLayout title="Messages">
            <Head title="Messages - Partner" />

            {/* Hero Section */}
            <div className="partner-hero">
                <Breadcrumbs 
                    title="Messages" 
                    breadcrumbs={[{ label: 'Messages' }]}
                    accentColor="#d97706"
                    homeRoute="partner.dashboard"
                />
                <h1 className="dash-section-title">
                    <i className="fas fa-envelope accent-partner"></i>
                    Communication Center
                </h1>
                <p className="dash-text-muted dash-no-margin">
                    Communicate with fans about their travel requests. Messages are linked to budget reference IDs for anonymity.
                </p>
            </div>

            {/* Success Message */}
            {flash?.success && (
                <div className="dash-flash-success">
                    <i className="fas fa-check-circle me-2"></i>
                    {flash.success}
                </div>
            )}

            {/* Stats Row */}
            <div className="dash-stat-grid dash-mb-lg">
                <div className="dash-stat-card">
                    <i className="fas fa-comments accent-partner dash-stat-icon partner-stat-icon-lg"></i>
                    <div className="dash-stat-value">{stats.total_threads || 0}</div>
                    <div className="dash-stat-label">Total Threads</div>
                </div>
                <div className="dash-stat-card">
                    <i className="fas fa-envelope-open accent-danger dash-stat-icon partner-stat-icon-lg"></i>
                    <div className="dash-stat-value">{stats.unread_messages || 0}</div>
                    <div className="dash-stat-label">Unread Messages</div>
                </div>
                <div className="dash-stat-card">
                    <i className="fas fa-clock accent-admin dash-stat-icon partner-stat-icon-lg"></i>
                    <div className="dash-stat-value">{stats.pending_requests || 0}</div>
                    <div className="dash-stat-label">Pending Requests</div>
                </div>
            </div>

            {/* Main Content - Split View */}
            <div className={`partner-comm-grid ${selectedThread ? 'has-thread' : ''}`}>
                {/* Thread List */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h3>
                            <i className="fas fa-inbox accent-partner"></i>
                            Message Threads
                        </h3>
                    </div>
                    <div className="dash-scroll partner-comm-thread-list">
                        {threads.length > 0 ? (
                            threads.map((thread) => (
                                <div
                                    key={thread.budget_id}
                                    onClick={() => setSelectedThread(thread)}
                                    className={`dash-activity-item partner-comm-thread-item ${selectedThread?.budget_id === thread.budget_id ? 'bg-accent-partner' : ''}`}
                                >
                                    <div className="dash-flex-between">
                                        <div>
                                            <span className="accent-partner dash-fw-semibold dash-text-base">
                                                {thread.reference_id}
                                            </span>
                                            <div className="dash-flex dash-gap-sm dash-mb-xs">
                                                <span className={`dash-badge ${getStatusBadgeClass(thread.status)}`}>
                                                    {thread.status}
                                                </span>
                                                <span className="dash-text-dim dash-text-sm">
                                                    {formatMoney(thread.total_cost)}
                                                </span>
                                            </div>
                                            <div className="dash-text-dim dash-text-sm dash-mb-xs">
                                                {thread.messages.length} messages • {thread.last_message_at}
                                            </div>
                                        </div>
                                        {thread.unread_count > 0 && (
                                            <span className="dash-badge dash-badge-danger">
                                                {thread.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="dash-empty">
                                <i className="fas fa-inbox"></i>
                                <h4>No message threads yet.</h4>
                                <p>Messages will appear here when fans respond to your quotes.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Message View */}
                {selectedThread && (
                    <div className="dash-card dash-flex-col">
                        {/* Thread Header */}
                        <div className="dash-card-header">
                            <div>
                                <h3 className="accent-partner">
                                    {selectedThread.reference_id}
                                </h3>
                                <span className="dash-text-muted dash-text-sm">
                                    {selectedThread.match_count} Matches • {formatMoney(selectedThread.total_cost)}
                                </span>
                            </div>
                            <Link 
                                href={route('partner.requests.show', selectedThread.budget_id)}
                                className="dash-btn dash-btn-outline dash-text-sm"
                            >
                                View Request
                            </Link>
                        </div>

                        {/* Messages */}
                        <div className="dash-scroll partner-comm-messages">
                            {selectedThread.messages.length > 0 ? (
                                selectedThread.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`partner-comm-msg-row ${msg.sender_type === 'partner' ? 'is-partner' : 'is-fan'}`}
                                    >
                                        <div className={`partner-comm-msg-bubble ${msg.sender_type === 'partner' ? 'is-partner' : 'is-fan'}`}>
                                            <p className="dash-text-primary dash-no-margin dash-text-base partner-comm-msg-body">
                                                {msg.body}
                                            </p>
                                            <span className="dash-text-dim dash-text-2xs partner-comm-msg-time">
                                                {msg.sender_type === 'partner' ? 'You' : 'Fan'} • {msg.created_at}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="dash-empty">
                                    <p>No messages in this thread. Start the conversation!</p>
                                </div>
                            )}
                        </div>

                        {/* Reply Form */}
                        <div className="dash-top-divider partner-comm-reply-area">
                            <form onSubmit={handleSendMessage} className="dash-flex dash-gap-md">
                                <input
                                    type="text"
                                    value={messageForm.data.body}
                                    onChange={(e) => messageForm.setData('body', e.target.value)}
                                    placeholder="Type your message..."
                                    className="dash-input partner-comm-reply-input"
                                />
                                <button
                                    type="submit"
                                    disabled={messageForm.processing || !messageForm.data.body.trim()}
                                    className="dash-btn dash-btn-primary"
                                    style={{ opacity: messageForm.processing || !messageForm.data.body.trim() ? 'var(--opacity-disabled)' : 1 }}
                                >
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </PartnerLayout>
    );
}
