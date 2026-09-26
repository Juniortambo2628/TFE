import React, { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import { formatMoney } from '@/lib/utils';

/**
 * Messages / Communication centre. The two-pane layout (`partner-comm-*`)
 * is specialised and kept; the card chrome is migrated onto the shared
 * primitives (`tfe-slab` / `tfe-pill` / `tfe-empty` / `tfe-btn`) so it reads
 * as part of the same system as the Profile and the rest of the partner
 * surfaces, instead of the old bespoke `dash-card` / `dash-badge` chrome.
 */
const STATUS_PILL = {
    approved: 'tfe-pill--approved',
    modified: 'tfe-pill--pending',
    pending: 'tfe-pill--info',
};

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

    return (
        <PartnerLayout title="Messages">
            <Head title="Messages - Partner" />

            <DashboardHero
                role="partner"
                title="Communication Center"
                subtitle="Communicate with fans about their travel requests. Messages are linked to budget reference IDs for anonymity."
                breadcrumbs={[
                    { label: 'Partner', icon: 'fas fa-home', href: route('partner.dashboard') },
                    { label: 'Messages' },
                ]}
            />

            {flash?.success && (
                <div className="dash-flash-success">
                    <i className="fas fa-check-circle me-2"></i>
                    {flash.success}
                </div>
            )}

            <SummaryTiles
                className="mb-4"
                items={[
                    { label: 'Total Threads',   value: stats.total_threads || 0,   icon: 'fa-comments',      accent: 'blue' },
                    { label: 'Unread Messages', value: stats.unread_messages || 0, icon: 'fa-envelope-open', accent: 'red' },
                    { label: 'Pending Requests',value: stats.pending_requests || 0,icon: 'fa-clock',         accent: 'amber' },
                ]}
            />

            <div className={`partner-comm-grid ${selectedThread ? 'has-thread' : ''}`}>
                {/* Thread List */}
                <section className="tfe-slab">
                    <div className="tfe-slab__header">
                        <h3 className="tfe-slab__title">
                            <i className="fas fa-inbox me-2" aria-hidden="true" /> Message Threads
                        </h3>
                    </div>
                    <div className="tfe-slab__body tfe-slab__body--flush">
                        <div className="dash-scroll partner-comm-thread-list">
                            {threads.length > 0 ? (
                                threads.map((thread) => (
                                    <button
                                        type="button"
                                        key={thread.budget_id}
                                        onClick={() => setSelectedThread(thread)}
                                        className={`partner-comm-thread-item ${selectedThread?.budget_id === thread.budget_id ? 'is-active' : ''}`}
                                    >
                                        <div className="dash-flex-between">
                                            <div>
                                                <span className="accent-partner dash-fw-semibold dash-text-base">
                                                    {thread.reference_id}
                                                </span>
                                                <div className="dash-flex dash-gap-sm dash-mb-xs">
                                                    <span className={`tfe-pill ${STATUS_PILL[thread.status] || 'tfe-pill--info'}`}>
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
                                                <span className="tfe-pill tfe-pill--rejected">
                                                    {thread.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="tfe-empty tfe-empty--inline">
                                    <div className="tfe-empty__icon"><i className="fas fa-inbox"></i></div>
                                    <h4 className="tfe-empty__title">No message threads yet.</h4>
                                    <p className="tfe-empty__body">Messages will appear here when fans respond to your quotes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Message View */}
                {selectedThread && (
                    <section className="tfe-slab dash-flex-col">
                        <div className="tfe-slab__header">
                            <div>
                                <h3 className="tfe-slab__title accent-partner">
                                    {selectedThread.reference_id}
                                </h3>
                                <span className="tfe-slab__title-sub">
                                    {selectedThread.match_count} Matches • {formatMoney(selectedThread.total_cost)}
                                </span>
                            </div>
                            <Link
                                href={route('partner.requests.show', selectedThread.budget_id)}
                                className="tfe-btn tfe-btn--sm"
                            >
                                View Request
                            </Link>
                        </div>

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
                                <div className="tfe-empty tfe-empty--inline">
                                    <p className="tfe-empty__body">No messages in this thread. Start the conversation!</p>
                                </div>
                            )}
                        </div>

                        <div className="dash-top-divider partner-comm-reply-area">
                            <form onSubmit={handleSendMessage} className="dash-flex dash-gap-md">
                                <input
                                    type="text"
                                    value={messageForm.data.body}
                                    onChange={(e) => messageForm.setData('body', e.target.value)}
                                    placeholder="Type your message..."
                                    className="tfe-input partner-comm-reply-input"
                                />
                                <button
                                    type="submit"
                                    disabled={messageForm.processing || !messageForm.data.body.trim()}
                                    className="tfe-btn tfe-btn--filled tfe-btn--icon"
                                    aria-label="Send message"
                                >
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>
                    </section>
                )}
            </div>
        </PartnerLayout>
    );
}
