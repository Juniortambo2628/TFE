import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, router, usePage } from '@inertiajs/react';
import '../../../css/fan/fan-pages.css';
import DashboardHero from '@/Components/Common/DashboardHero';
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
        <FanLayout user={auth.user} header="Messages & Inbox">
            <Head title="Messages" />

            <div>
                {/* Hero Section */}
                <DashboardHero role="fan" 
                    title="Messages & Inbox"
                    subtitle="Stay updated with the latest news, announcements, and messages"
                    breadcrumbs={[{ label: 'Messages' }]}
                    bgImage="/assets/img/fan/backgrounds/social_hero.png"
                />

                {/* Stats Cards */}
                <div className="summary-cards-grid">
                    <div className="fan-card-premium glow-red">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                                <i className="fas fa-bullhorn"></i>
                            </div>
                            <h3 className="card-title-gaming">Announcements</h3>
                            <div className="card-value-gaming">{announcements.length}</div>
                            <div className="text-white-50 small mt-1">Latest Updates</div>
                        </div>
                    </div>
                    
                    <div className="fan-card-premium glow-blue">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                                <i className="fas fa-envelope"></i>
                            </div>
                            <h3 className="card-title-gaming">Unread Messages</h3>
                            <div className="card-value-gaming">{messages.filter(m => !m.is_read).length}</div>
                            <div className="text-white-50 small mt-1">Check Inbox</div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="schedule-tabs">
                    <button 
                        onClick={() => setActiveTab('announcements')}
                        className={`schedule-tab ${activeTab === 'announcements' ? 'active' : ''}`}
                    >
                        <i className="fas fa-bullhorn"></i> Official Announcements
                    </button>
                    <button 
                        onClick={() => setActiveTab('messages')}
                        className={`schedule-tab ${activeTab === 'messages' ? 'active' : ''}`}
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
                                            <div className="announcement-meta">
                                                <span className={`badge bg-${announcement.priority === 'urgent' ? 'danger' : 'primary'} me-2`}>
                                                    {announcement.priority.toUpperCase()}
                                                </span>
                                                <span className="text-muted small">
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
                            <div className="empty-state-inline">
                                <i className="fas fa-newspaper"></i>
                                <p>No announcements at this time.</p>
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
                                        className={`message-item ${!message.is_read ? 'unread' : ''}`}
                                        onClick={() => setSelectedMessage(message)}
                                        style={{ cursor: 'pointer' }}
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
                                                            className="btn btn-sm btn-outline-primary me-2"
                                                            onClick={(e) => { e.stopPropagation(); handleMarkRead(message.id); }}
                                                            title="Mark as read"
                                                        >
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={(e) => { e.stopPropagation(); setMessageToDelete(message.id); }}
                                                        title="Delete message"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="message-body text-truncate" style={{ maxWidth: '80%' }}>{message.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state-inline">
                                <i className="fas fa-inbox"></i>
                                <p>Your inbox is empty.</p>
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
                            <button className="btn btn-link text-white text-decoration-none" onClick={() => setSelectedMessage(null)}>
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
                                <div className="mb-4 dash-modal-subtle" style={{ 
                                    border: '1px solid #333', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden',
                                }}>
                                    <div className="p-3 border-bottom border-secondary d-flex align-items-center dash-modal-subtle-sm">
                                        <img 
                                            src={getAvatar(selectedMessage.shared_story.user)} 
                                            alt={selectedMessage.shared_story.user.name}
                                            className="dash-avatar dash-avatar-sm"
                                            style={{ marginRight: '10px' }}
                                        />
                                        <div>
                                            <div className="text-white fw-bold">Shared story from {selectedMessage.shared_story.user.name}</div>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        {selectedMessage.shared_story.media_url && (
                                            <div className="mb-3" style={{ textAlign: 'center' }}>
                                                {selectedMessage.shared_story.media_type === 'video' ? (
                                                    <video 
                                                        src={selectedMessage.shared_story.media_url} 
                                                        controls 
                                                        style={{ 
                                                            maxWidth: '100%', 
                                                            maxHeight: '400px',
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                ) : (
                                                    <img 
                                                        src={selectedMessage.shared_story.media_url} 
                                                        alt="Shared story"
                                                        style={{ 
                                                            maxWidth: '100%', 
                                                            maxHeight: '400px',
                                                            borderRadius: '8px',
                                                            objectFit: 'contain'
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        {selectedMessage.shared_story.caption && (
                                            <div className="text-white" style={{ whiteSpace: 'pre-wrap' }}>
                                                {selectedMessage.shared_story.caption}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Shared Post Display */}
                            {selectedMessage.share_type === 'post' && selectedMessage.shared_post && (
                                <div className="mb-4 dash-modal-subtle" style={{ 
                                    border: '1px solid #333', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden',
                                }}>
                                    <div className="p-3 border-bottom border-secondary d-flex align-items-center dash-modal-subtle-sm">
                                        <img 
                                            src={getAvatar(selectedMessage.shared_post.user)} 
                                            alt={selectedMessage.shared_post.user.name}
                                            className="dash-avatar dash-avatar-sm"
                                            style={{ marginRight: '10px' }}
                                        />
                                        <div>
                                            <div className="text-white fw-bold">Shared post from {selectedMessage.shared_post.user.name}</div>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        {selectedMessage.shared_post.image_url && (
                                            <div className="mb-3" style={{ textAlign: 'center' }}>
                                                <img 
                                                    src={selectedMessage.shared_post.image_url} 
                                                    alt="Shared post"
                                                    style={{ 
                                                        maxWidth: '100%', 
                                                        maxHeight: '400px',
                                                        borderRadius: '8px',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {selectedMessage.shared_post.content && (
                                            <div className="text-white" style={{ whiteSpace: 'pre-wrap' }}>
                                                {selectedMessage.shared_post.content}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Regular Message Content */}
                            {selectedMessage.content && (
                                <div className="text-white" style={{ whiteSpace: 'pre-wrap', color: '#fff' }}>
                                    {selectedMessage.content}
                                </div>
                            )}
                        </div>
                         <div className="p-3 border-top border-secondary text-end bg-dark">
                            {!selectedMessage.is_read && (
                                <button className="btn btn-primary me-2" onClick={() => {
                                    handleMarkRead(selectedMessage.id);
                                    setSelectedMessage({...selectedMessage, is_read: true});
                                }}>
                                    Mark as Read
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={() => setSelectedMessage(null)}>Close</button>
                         </div>
                    </div>
                </div>
            )}
        </FanLayout>
    );
}
