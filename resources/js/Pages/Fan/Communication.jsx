import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, router, usePage } from '@inertiajs/react';
import '../../../css/fan/fan-pages.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import ConfirmationDialog from '@/Components/ConfirmationDialog';

export default function Communication({ auth, announcements, messages }) {
    const { assetUrl } = usePage().props;
    const [activeTab, setActiveTab] = useState('announcements');

    const [selectedMessage, setSelectedMessage] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);

    const getAvatar = (user) => {
        if (!user) return `${assetUrl}assets/img/avatars/default-avatar.png`;
        return user.avatar || `${assetUrl}assets/img/avatars/default-avatar.png`;
    };

    const handleMarkRead = (id) => {
        router.post(route('fan.communication.read', id), {}, {
            preserveScroll: true
        });
    };

    const handleDelete = () => {
        if (messageToDelete) {
            router.delete(route('fan.communication.delete', messageToDelete), {
                preserveScroll: true,
                onSuccess: () => setMessageToDelete(null)
            });
        }
    };

    return (
        <FanLayout title="Messages">
            <Head title="Messages" />

            <div>
                {/* Hero Section */}
                <DashboardHero role="fan" 
                    title="Messages & Inbox"
                    subtitle="Stay updated with the latest news, announcements, and messages"
                    breadcrumbs={[{ label: 'Messages' }]}
                    bgImage="/assets/img/fan/backgrounds/social_hero.png"
                />

                <SummaryTiles
                    items={[
                        { label: 'Announcements',   value: announcements.length,                          icon: 'fa-bullhorn', accent: 'red',  subtext: 'Latest updates' },
                        { label: 'Unread messages', value: messages.filter(m => !m.is_read).length,       icon: 'fa-envelope', accent: 'blue', subtext: 'Check inbox' },
                    ]}
                />

                {/* Tab Navigation */}
                <div className="d-flex flex-wrap gap-2 my-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab('announcements')}
                        aria-pressed={activeTab === 'announcements'}
                        className="tfe-btn tfe-btn--sm"
                    >
                        <i className="fas fa-bullhorn"></i> Official Announcements
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('messages')}
                        aria-pressed={activeTab === 'messages'}
                        className="tfe-btn tfe-btn--sm"
                    >
                        <i className="fas fa-envelope"></i> My Messages
                    </button>
                </div>

                {/* Announcements Content */}
                {activeTab === 'announcements' && (
                    <div className="content-card">
                        <div className="card-header">
                            <i className="fas fa-newspaper"></i>
                            <h3>Latest News</h3>
                        </div>
                        {announcements.length > 0 ? (
                            <div className="announcements-list">
                                {announcements.map((announcement) => (
                                    <div key={announcement.id} className="announcement-item">
                                        <div className="announcement-icon">
                                            <i className={`fas ${announcement.priority === 'urgent' ? 'fa-exclamation-circle text-danger' : 'fa-info-circle text-primary'}`}></i>
                                        </div>
                                        <div className="announcement-content">
                                            <div className="announcement-meta d-flex align-items-center gap-2 mb-1">
                                                <span className={`tfe-pill ${announcement.priority === 'urgent' ? 'tfe-pill--rejected' : 'tfe-pill--info'}`}>
                                                    {announcement.priority}
                                                </span>
                                                <span className="text-white-50 small">
                                                    {announcement.created_at}
                                                </span>
                                            </div>
                                            <h4 className="announcement-title">{announcement.title}</h4>
                                            <div className="announcement-body" dangerouslySetInnerHTML={{ __html: announcement.content }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="tfe-empty tfe-empty--inline">
                                <div className="tfe-empty__icon"><i className="fas fa-newspaper"></i></div>
                                <div className="tfe-empty__body">No announcements at this time.</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Messages Content */}
                {activeTab === 'messages' && (
                    <div className="content-card">
                        <div className="card-header">
                            <i className="fas fa-inbox"></i>
                            <h3>Inbox</h3>
                        </div>
                        {messages.length > 0 ? (
                            <div className="messages-list">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`message-item cursor-pointer ${!message.is_read ? 'unread' : ''}`}
                                        onClick={() => setSelectedMessage(message)}
                                    >
                                        <div className="message-icon">
                                            <i className="fas fa-envelope"></i>
                                        </div>
                                        <div className="message-content w-100">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h5 className="message-subject">{message.subject}</h5>
                                                    <span className="message-date">{message.created_at}</span>
                                                </div>
                                                <div className="message-actions">
                                                    {!message.is_read && (
                                                        <button 
                                                            className="tfe-btn tfe-btn--sm me-2"
                                                            onClick={(e) => { e.stopPropagation(); handleMarkRead(message.id); }}
                                                            title="Mark as read"
                                                        >
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="tfe-btn tfe-btn--sm"
                                                        onClick={(e) => { e.stopPropagation(); setMessageToDelete(message.id); }}
                                                        title="Delete message"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="message-body message-body-truncate">{message.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="tfe-empty tfe-empty--inline">
                                <div className="tfe-empty__icon"><i className="fas fa-inbox"></i></div>
                                <div className="tfe-empty__body">Your inbox is empty.</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ConfirmationDialog
                open={!!messageToDelete}
                onOpenChange={(open) => !open && setMessageToDelete(null)}
                title="Delete Message?"
                description="Are you sure you want to delete this message? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />

            {/* Message Details Modal */}
            {selectedMessage && (
                <div className="dash-modal-overlay" onClick={() => setSelectedMessage(null)}>
                    <div className="dash-modal" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
                            <h5 className="m-0 text-white">{selectedMessage.subject}</h5>
                            <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setSelectedMessage(null)}>
                                <i className="fas fa-times fa-lg"></i>
                            </button>
                        </div>
                        <div className="p-4 dash-modal-body">
                            <div className="d-flex justify-content-between text-white-50 small mb-3">
                                <span>From: {selectedMessage.sender}</span>
                                <span>{selectedMessage.created_at}</span>
                            </div>
                            
                            {/* Shared Story Display */}
                            {selectedMessage.share_type === 'story' && selectedMessage.shared_story && (
                                <div className="dash-shared-embed mb-4">
                                    <div className="dash-shared-embed__head">
                                        <img
                                            src={getAvatar(selectedMessage.shared_story.user)}
                                            alt={selectedMessage.shared_story.user.name}
                                            className="dash-avatar dash-avatar-sm"
                                        />
                                        <div className="text-white fw-bold">
                                            Shared story from {selectedMessage.shared_story.user.name}
                                        </div>
                                    </div>
                                    <div className="dash-shared-embed__body">
                                        {selectedMessage.shared_story.media_url && (
                                            <div className="dash-shared-embed__media">
                                                {selectedMessage.shared_story.media_type === 'video' ? (
                                                    <video src={selectedMessage.shared_story.media_url} controls />
                                                ) : (
                                                    <img src={selectedMessage.shared_story.media_url} alt="Shared story" />
                                                )}
                                            </div>
                                        )}
                                        {selectedMessage.shared_story.caption && (
                                            <div className="dash-shared-embed__text">
                                                {selectedMessage.shared_story.caption}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Shared Post Display */}
                            {selectedMessage.share_type === 'post' && selectedMessage.shared_post && (
                                <div className="dash-shared-embed mb-4">
                                    <div className="dash-shared-embed__head">
                                        <img
                                            src={getAvatar(selectedMessage.shared_post.user)}
                                            alt={selectedMessage.shared_post.user.name}
                                            className="dash-avatar dash-avatar-sm"
                                        />
                                        <div className="text-white fw-bold">
                                            Shared post from {selectedMessage.shared_post.user.name}
                                        </div>
                                    </div>
                                    <div className="dash-shared-embed__body">
                                        {selectedMessage.shared_post.image_url && (
                                            <div className="dash-shared-embed__media">
                                                <img src={selectedMessage.shared_post.image_url} alt="Shared post" />
                                            </div>
                                        )}
                                        {selectedMessage.shared_post.content && (
                                            <div className="dash-shared-embed__text">
                                                {selectedMessage.shared_post.content}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Regular Message Content */}
                            {selectedMessage.content && (
                                <div className="dash-shared-embed__text text-white">
                                    {selectedMessage.content}
                                </div>
                            )}
                        </div>
                         <div className="dash-modal-footer">
                            <button type="button" className="tfe-btn" onClick={() => setSelectedMessage(null)}>Close</button>
                            {!selectedMessage.is_read && (
                                <button type="button" className="tfe-btn tfe-btn--filled" onClick={() => {
                                    handleMarkRead(selectedMessage.id);
                                    setSelectedMessage({...selectedMessage, is_read: true});
                                }}>
                                    Mark as Read
                                </button>
                            )}
                         </div>
                    </div>
                </div>
            )}
        </FanLayout>
    );
}
