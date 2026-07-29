import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import ShareModal from '@/Components/ShareModal';
import DashboardHero from '@/Components/Common/DashboardHero';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import '../../../css/fan/feed.css';
import '../../../css/fan/budget-calculator.css';

export default function PostDetail({ auth, post, comments, likers, threadReplies = [] }) {
    const { user } = auth;
    const { assetUrl } = usePage().props;
    const [showShareModal, setShowShareModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(false);
    
    // Comment form
    const { data: commentData, setData: setCommentData, post: postComment, processing: commentProcessing, reset: resetComment } = useForm({
        content: ''
    });

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!commentData.content.trim()) return;
        
        postComment(route('fan.feed.comment', post.id), {
            onSuccess: () => {
                resetComment('content');
            },
            preserveScroll: true
        });
    };

    const handleLike = (e) => {
        e?.stopPropagation();
        router.post(route('fan.feed.like', post.id), {}, {
            preserveScroll: true
        });
    };

    const handleRepost = (e) => {
        e?.stopPropagation();
        router.post(route('fan.feed.repost', post.id), {}, {
            preserveScroll: true
        });
    };

    const handleShare = (e) => {
        e?.stopPropagation();
        setShowShareModal(true);
    };

    const handleDelete = () => {
        router.delete(route('fan.feed.destroy', post.id), {
            onSuccess: () => {
                setPostToDelete(false);
                router.visit(route('fan.feed'));
            }
        });
    };

    const getAvatar = (u) => {
        return u?.avatar || `${assetUrl}assets/img/avatars/default-avatar.png`;
    };

    return (
        <FanLayout title="Post Details">
            <Head title="Post Details" />
            
            <div className="calculator-container">
                <DashboardHero role="fan" 
                    title="Post Details"
                    subtitle="View all comments and likes"
                    breadcrumbs={[
                        { label: 'Feed', href: route('fan.feed') },
                        { label: 'Post Detail' }
                    ]}
                    bgImage="/assets/img/fan/backgrounds/social_hero.png"
                />

                {/* Post Card */}
                <div className="section-card">
                    <div className="section-header">
                        <div className="section-icon">
                            <i className="fas fa-comment"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3>Post Details</h3>
                            <p className="section-subtitle">View all comments and likes</p>
                        </div>
                        {post.user.id === user.id && (
                            <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setPostToDelete(true)}
                            >
                                <i className="fas fa-trash me-1"></i>Delete
                            </button>
                        )}
                    </div>

                    {/* Original Post */}
                    <div className="feed-post" style={{ borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div className="post-avatar">
                            <img src={getAvatar(post.user)} alt={post.user.name} />
                        </div>
                        <div className="post-content">
                            <div className="post-header">
                                <div className="post-author-info">
                                    <span className="author-name">{post.user.name}</span>
                                    <span className="author-handle">@{post.user.name.replace(/\s+/g, '').toLowerCase()}</span>
                                    <span className="text-white-50 mx-1">·</span>
                                    <span className="post-time">{post.created_at}</span>
                                </div>
                            </div>
                            
                            <div className="post-text" style={{ fontSize: '1.1rem', marginBottom: '15px' }}>{post.content}</div>
                            
                            {/* Post Image */}
                            {post.image_url && (
                                <div className="post-image-container" style={{ marginBottom: '15px' }}>
                                    <img src={post.image_url} alt="Post attachment" className="post-image" />
                                </div>
                            )}
                            
                            <div className="post-actions">
                                <button 
                                    className="action-item action-reply"
                                    title="Comment"
                                >
                                    <i className="far fa-comment"></i>
                                    <span>{post.comment_count > 0 && post.comment_count}</span>
                                </button>
                                <button 
                                    className="action-item action-retweet"
                                    onClick={handleRepost}
                                    title="Repost"
                                >
                                    <i className="fas fa-retweet"></i>
                                    <span>{post.share_count > 0 && post.share_count}</span>
                                </button>
                                <button 
                                    className={`action-item action-like ${post.is_liked ? 'liked' : ''}`}
                                    onClick={handleLike}
                                    title={post.is_liked ? "Unlike" : "Like"}
                                >
                                    <i className={post.is_liked ? "fas fa-heart text-danger" : "far fa-heart"}></i>
                                    {(post.like_count > 0 || likers.length > 0) && (
                                        <span>{post.like_count || likers.length}</span>
                                    )}
                                </button>
                                <button 
                                    className="action-item action-share"
                                    onClick={handleShare}
                                    title="Share"
                                >
                                    <i className="far fa-share-square"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Likers Section */}
                    {likers.length > 0 && (
                        <div className="mb-4">
                            <h5 className="text-white mb-3">
                                <i className="fas fa-heart text-danger me-2"></i>
                                Liked by {likers.length} {likers.length === 1 ? 'person' : 'people'}
                            </h5>
                            <div className="likers-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                {likers.map(liker => (
                                    <Link
                                        key={liker.id}
                                        href={route('fan.profile')}
                                        className="liker-item"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '8px 12px',
                                            background: '#111',
                                            border: '1px solid #222',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            color: '#fff',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#dc143c';
                                            e.currentTarget.style.background = 'rgba(220, 20, 60, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#222';
                                            e.currentTarget.style.background = '#111';
                                        }}
                                    >
                                        <img 
                                            src={getAvatar(liker)} 
                                            alt={liker.name}
                                            className="dash-avatar dash-avatar-sm"
                                        />
                                        <span style={{ fontSize: '0.9rem' }}>{liker.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                    {/* Thread Replies Section */}
                    {threadReplies.length > 0 && (
                        <div className="section-card mb-4">
                            <div className="section-header">
                                <div className="section-icon">
                                    <i className="fas fa-comments"></i>
                                </div>
                                <div>
                                    <h3>Thread Replies ({threadReplies.length})</h3>
                                    <p className="section-subtitle">Additional posts in this thread</p>
                                </div>
                            </div>
                            <div className="thread-replies-list">
                                {threadReplies.map(reply => (
                                    <div 
                                        key={reply.id} 
                                        className="thread-reply-item"
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            padding: '15px',
                                            borderBottom: '1px solid #222',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <img 
                                            src={getAvatar(reply.user)} 
                                            alt={reply.user.name}
                                            className="dash-avatar dash-avatar-md"
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <span className="author-name">{reply.user.name}</span>
                                                <span className="post-time" style={{ fontSize: '0.85rem' }}>{reply.created_at}</span>
                                            </div>
                                            <div className="post-text" style={{ fontSize: '0.95rem', marginBottom: '10px' }}>{reply.content}</div>
                                            {reply.image_url && (
                                                <div className="post-image-container" style={{ maxWidth: '400px' }}>
                                                    <img src={reply.image_url} alt="Reply attachment" className="post-image" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments Section */}
                <div className="section-card">
                    <div className="section-header">
                        <div className="section-icon">
                            <i className="fas fa-comments"></i>
                        </div>
                        <div>
                            <h3>Comments ({comments.length})</h3>
                            <p className="section-subtitle">Join the conversation</p>
                        </div>
                    </div>

                    {/* Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="mb-4">
                        <div className="d-flex gap-3">
                            <img 
                                src={getAvatar(user)} 
                                alt={user.name}
                                className="dash-avatar dash-avatar-md"
                            />
                            <div style={{ flex: 1 }}>
                                <textarea
                                    className="comment-textarea"
                                    placeholder="Write a comment..."
                                    value={commentData.content}
                                    onChange={e => setCommentData('content', e.target.value)}
                                    rows="3"
                                ></textarea>
                                <div className="d-flex justify-content-end mt-2">
                                    <button
                                        type="submit"
                                        className="btn-comment-submit"
                                        disabled={commentProcessing || !commentData.content.trim()}
                                    >
                                        {commentProcessing ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin me-2"></i>Posting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane me-2"></i>Post Comment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="comments-list">
                        {comments.length > 0 ? (
                            comments.map(comment => (
                                <div 
                                    key={comment.id} 
                                    className="comment-item"
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                        padding: '15px',
                                        borderBottom: '1px solid #222',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <img 
                                        src={getAvatar(comment.user)} 
                                        alt={comment.user.name}
                                        className="dash-avatar dash-avatar-md"
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <span className="author-name">{comment.user.name}</span>
                                            <span className="post-time" style={{ fontSize: '0.85rem' }}>{comment.created_at}</span>
                                        </div>
                                        <div className="post-text" style={{ fontSize: '0.95rem' }}>{comment.content}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state-inline py-4">
                                <i className="fas fa-comments"></i>
                                <p>No comments yet. Be the first to comment!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    shareType="post"
                    shareId={post.id}
                    shareContent={post.content || 'Shared post'}
                />
            )}

            <ConfirmationDialog
                open={postToDelete}
                onOpenChange={setPostToDelete}
                title="Delete Post?"
                description="Are you sure you want to delete this post? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </FanLayout>
    );
}
