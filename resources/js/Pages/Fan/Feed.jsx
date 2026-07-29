import React, { useState, useRef, useEffect } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import EmojiPicker from 'emoji-picker-react';
import ShareModal from '@/Components/ShareModal';
import AdPostCard from '@/Components/AdPostCard';
import '../../../css/fan/feed.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import ConfirmationDialog from '@/Components/ConfirmationDialog';

registerPlugin(FilePondPluginImagePreview);

export default function Feed({ auth, posts, stats, trendingHashtags, feedAds = [], suggestedUsers = [] }) {
    const { user } = auth;
    const { assetUrl } = usePage().props;
    const [activeFilter, setActiveFilter] = useState('latest');
    const [selectedPost, setSelectedPost] = useState(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [profilePreview, setProfilePreview] = useState(null);
    const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
    const previewTimeoutRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showThreadComposer, setShowThreadComposer] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareItem, setShareItem] = useState(null);
    const emojiPickerRef = useRef(null);
    const [postToDelete, setPostToDelete] = useState(null);
    
    // Post form
    const { data, setData, post, processing, reset, errors } = useForm({
        content: '',
        visibility: 'public',
        image: null,
        parent_post_id: null
    });

    // Comment form
    const { data: commentData, setData: setCommentData, post: postComment, processing: commentProcessing, reset: resetComment } = useForm({
        content: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('fan.feed.store'), {
            onSuccess: () => {
                reset('content', 'image', 'parent_post_id');
                setImagePreview(null);
                setShowThreadComposer(null);
            },
            forceFormData: true
        });
    };

    const handleFileChange = (fileItems) => {
        if (fileItems.length > 0) {
            const file = fileItems[0].file;
            setData('image', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            setData('image', null);
            setImagePreview(null);
        }
    };

    const handleEmojiClick = (emojiData) => {
        setData('content', data.content + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const handleThreadReply = (postId) => {
        setShowThreadComposer(postId);
        setData('parent_post_id', postId);
    };

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLike = (postId, e) => {
        e?.stopPropagation();
        router.post(route('fan.feed.like', postId), {}, {
            preserveScroll: true
        });
    };

    const handleComment = (postId) => {
        setSelectedPost(postId);
        setShowCommentModal(true);
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!commentData.content.trim()) return;
        
        postComment(route('fan.feed.comment', selectedPost), {
            onSuccess: () => {
                resetComment('content');
                setShowCommentModal(false);
                setSelectedPost(null);
            },
            preserveScroll: true
        });
    };

    const handleRepost = (postId, e) => {
        e?.stopPropagation();
        router.post(route('fan.feed.repost', postId), {}, {
            preserveScroll: true
        });
    };

    const handleShare = (postId, e) => {
        e?.stopPropagation();
        router.post(route('fan.feed.share', postId), {}, {
            preserveScroll: true
        });
    };

    const handleDelete = () => {
        if (postToDelete) {
            router.delete(route('fan.feed.destroy', postToDelete), {
                preserveScroll: true,
                onSuccess: () => setPostToDelete(null)
            });
        }
    };

    // Helper for avatar logic
    const getAvatar = (u) => {
        return u.avatar || `${assetUrl}assets/img/avatars/default-avatar.png`;
    };

    // Profile preview handlers
    const handleProfileHover = async (userId, e) => {
        if (userId === user.id) return;
        
        const target = e.currentTarget;
        clearTimeout(previewTimeoutRef.current);
        
        previewTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(route('fan.follow.preview', userId));
                const data = await response.json();
                
                const rect = target.getBoundingClientRect();
                setPreviewPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 10
                });
                setProfilePreview(data);
            } catch (error) {
                console.error('Error loading profile preview:', error);
            }
        }, 500);
    };

    const handleProfileLeave = () => {
        clearTimeout(previewTimeoutRef.current);
        setTimeout(() => {
            setProfilePreview(null);
        }, 200);
    };

    const handleFollowToggle = (userId, e) => {
        e?.stopPropagation();
        router.post(route('fan.follow.toggle', userId), {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (profilePreview && profilePreview.id === userId) {
                    setProfilePreview(prev => ({
                        ...prev,
                        is_following: !prev.is_following
                    }));
                }
            }
        });
    };

    return (
        <FanLayout title="Social Feed">
            <DashboardHero role="fan" 
                title="Social Feed"
                subtitle="Connect with fellow World Cup fans and share your journey."
                breadcrumbs={[{ label: 'Feed' }]}
            />

            {/* Summary Cards */}
            <div className="summary-cards-grid">
                <div className="fan-card-premium glow-blue">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                            <i className="fas fa-user-friends"></i>
                        </div>
                        <h3 className="card-title-gaming">Followers</h3>
                        <div className="card-value-gaming">{stats.followers}</div>
                        <div className="text-white-50 small mt-1">Fan Connections</div>
                    </div>
                </div>
                
                <div className="fan-card-premium glow-red">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                            <i className="fas fa-users"></i>
                        </div>
                        <h3 className="card-title-gaming">Following</h3>
                        <div className="card-value-gaming">{stats.following}</div>
                        <div className="text-white-50 small mt-1">Fans you follow</div>
                    </div>
                </div>
                
                <div className="fan-card-premium glow-blue">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                            <i className="fas fa-heart"></i>
                        </div>
                        <h3 className="card-title-gaming">Likes Received</h3>
                        <div className="card-value-gaming">{stats.likes_received || 0}</div>
                        <div className="text-white-50 small mt-1">Total Engagement</div>
                    </div>
                </div>
                
                <div className="fan-card-premium glow-red">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                            <i className="fas fa-edit"></i>
                        </div>
                        <h3 className="card-title-gaming">My Posts</h3>
                        <div className="card-value-gaming">{stats.posts}</div>
                        <div className="text-white-50 small mt-1">Your Shares</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="content-cards-grid mt-4">
                {/* Feed Column */}
                <div className="content-card" style={{flex: 2}}>
                    <div className="card-header">
                        <i className="fas fa-stream"></i>
                        <h3>Feed</h3>
                    </div>
                    
                    {/* Post Composer */}
                    <div className="post-composer">
                        <div className="composer-avatar">
                            <img src={getAvatar(user)} alt={user.name} />
                        </div>
                        <div className="composer-input-area">
                            <form onSubmit={handleSubmit} encType="multipart/form-data">
                                <textarea
                                    className="composer-textarea"
                                    placeholder="What's happening?"
                                    value={data.content}
                                    onChange={e => setData('content', e.target.value)}
                                    rows="2"
                                ></textarea>
                                
                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="image-preview-container">
                                        <img src={imagePreview} alt="Preview" className="image-preview" />
                                        <button
                                            type="button"
                                            className="image-preview-remove"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setData('image', null);
                                            }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                )}

                                {/* FilePond Upload */}
                                <div className="filepond-container">
                                    <FilePond
                                        files={data.image ? [data.image] : []}
                                        onupdatefiles={handleFileChange}
                                        allowMultiple={false}
                                        maxFiles={1}
                                        acceptedFileTypes={['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']}
                                        labelIdle='<span class="filepond-label"><i class="far fa-image me-2"></i>Drag & drop or <span class="filepond-link">browse</span> images/GIFs</span>'
                                        stylePanelLayout="compact"
                                        styleButtonRemoveItemPosition="right"
                                        styleLoadIndicatorPosition="right"
                                        styleProgressIndicatorPosition="right"
                                        server={null}
                                        instantUpload={false}
                                    />
                                </div>
                                
                                {errors.content && <div className="text-danger small">{errors.content}</div>}
                                {errors.image && <div className="text-danger small">{errors.image}</div>}

                                <div className="composer-actions">
                                    <div className="composer-tools">
                                        <div className="composer-tool-group" style={{ position: 'relative' }} ref={emojiPickerRef}>
                                            <button 
                                                type="button" 
                                                className="composer-tool-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowEmojiPicker(!showEmojiPicker);
                                                }}
                                                title="Add emoji"
                                            >
                                                <i className="far fa-smile"></i>
                                            </button>
                                            {showEmojiPicker && (
                                                <div className="emoji-picker-wrapper">
                                                    <EmojiPicker
                                                        onEmojiClick={handleEmojiClick}
                                                        theme="dark"
                                                        width="100%"
                                                        height="400px"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="composer-visibility-dropdown">
                                            <select 
                                                className="composer-privacy-select"
                                                value={data.visibility}
                                                onChange={e => setData('visibility', e.target.value)}
                                            >
                                                <option value="public">🌍 Public</option>
                                                <option value="friends">👥 Friends</option>
                                                <option value="tribe">🛡️ Tribe</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="post-submit-btn"
                                        disabled={processing || (!data.content.trim() && !data.image)}
                                    >
                                        {processing ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin me-2"></i>Posting...
                                            </>
                                        ) : (
                                            'Post'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="feed-filters">
                        <button 
                            className={`feed-filter-btn ${activeFilter === 'latest' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('latest')}
                        >
                            Latest
                        </button>
                        <button 
                            className={`feed-filter-btn ${activeFilter === 'trending' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('trending')}
                        >
                            Trending
                        </button>
                        <button 
                            className={`feed-filter-btn ${activeFilter === 'following' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('following')}
                        >
                            Following
                        </button>
                    </div>

                    {/* Posts List */}
                    <div className="feed-scroll-container">
                        {posts.length > 0 ? (
                            posts.map((pst, index) => {
                                // Insert ad every 5 posts (not too overwhelming)
                                const shouldShowAd = feedAds.length > 0 && index > 0 && index % 5 === 0;
                                const adIndex = Math.floor((index - 1) / 5) % feedAds.length;
                                
                                return (
                                    <React.Fragment key={pst.id}>
                                        {shouldShowAd && feedAds[adIndex] && (
                                            <AdPostCard 
                                                ad={feedAds[adIndex]} 
                                                assetUrl={assetUrl}
                                            />
                                        )}
                                        <div 
                                            className="feed-post"
                                            onClick={() => router.visit(route('fan.feed.post.show', pst.id))}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div 
                                                className="post-avatar"
                                                onMouseEnter={(e) => handleProfileHover(pst.user.id, e)}
                                                onMouseLeave={handleProfileLeave}
                                            >
                                                <img src={getAvatar(pst.user)} alt={pst.user.name} />
                                            </div>
                                            <div className="post-content">
                                                <div className="post-header">
                                                    <div 
                                                        className="post-author-info"
                                                        onMouseEnter={(e) => handleProfileHover(pst.user.id, e)}
                                                        onMouseLeave={handleProfileLeave}
                                                    >
                                                        <span className="author-name">{pst.user.name}</span>
                                                        <span className="author-handle">@{pst.user.name.replace(/\s+/g, '').toLowerCase()}</span>
                                                        <span className="text-white-50 mx-1">·</span>
                                                        <span className="post-time">{pst.created_at}</span>
                                                    </div>
                                                    {pst.user.id === user.id && (
                                                        <button 
                                                            className="post-menu-btn" 
                                                            onClick={(e) => { e.stopPropagation(); setPostToDelete(pst.id); }}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="post-text">{pst.content}</div>
                                        
                                                {/* Post Image */}
                                                {pst.image_url && (
                                                    <div className="post-image-container" onClick={(e) => e.stopPropagation()}>
                                                        <img src={pst.image_url} alt="Post attachment" className="post-image" />
                                                    </div>
                                                )}

                                                {/* Thread Replies Preview */}
                                                {pst.thread_replies && pst.thread_replies.length > 0 && (
                                                    <div className="thread-replies-preview" onClick={(e) => e.stopPropagation()}>
                                                        {pst.thread_replies.map(reply => (
                                                            <div key={reply.id} className="thread-reply-item">
                                                                <img src={getAvatar(reply.user)} alt={reply.user.name} className="thread-reply-avatar" />
                                                                <div className="thread-reply-content">
                                                                    <span className="thread-reply-author">{reply.user.name}</span>
                                                                    <span className="thread-reply-text">{reply.content}</span>
                                                                    {reply.image_url && (
                                                                        <img src={reply.image_url} alt="Reply attachment" className="thread-reply-image" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {pst.thread_reply_count > 2 && (
                                                            <div className="thread-reply-more">
                                                                View {pst.thread_reply_count - 2} more replies
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div className="post-actions" onClick={(e) => e.stopPropagation()}>
                                                    <button 
                                                        className="action-item action-reply"
                                                        onClick={(e) => { e.stopPropagation(); handleComment(pst.id); }}
                                                        title="Comment"
                                                    >
                                                        <i className="far fa-comment"></i>
                                                        <span>{pst.comment_count > 0 && pst.comment_count}</span>
                                                    </button>
                                                    <button 
                                                        className="action-item action-retweet"
                                                        onClick={(e) => handleRepost(pst.id, e)}
                                                        title="Repost"
                                                    >
                                                        <i className="fas fa-retweet"></i>
                                                        <span>{pst.share_count > 0 && pst.share_count}</span>
                                                    </button>
                                                    <button 
                                                        className={`action-item action-like ${pst.is_liked ? 'liked' : ''}`}
                                                        onClick={(e) => handleLike(pst.id, e)}
                                                        title={pst.is_liked ? "Unlike" : "Like"}
                                                    >
                                                        <i className={pst.is_liked ? "fas fa-heart text-danger" : "far fa-heart"}></i>
                                                        {pst.like_count > 0 && <span>{pst.like_count}</span>}
                                                    </button>
                                                    <button 
                                                        className="action-item action-share"
                                                        onClick={(e) => handleShare(pst, e)}
                                                        title="Share"
                                                    >
                                                        <i className="far fa-share-square"></i>
                                                    </button>
                                                    {pst.user.id === user.id && (
                                                        <button 
                                                            className="action-item action-thread"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleThreadReply(pst.id);
                                                            }}
                                                            title="Add to thread"
                                                        >
                                                            <i className="fas fa-comments"></i>
                                                            <span>{pst.thread_reply_count > 0 && pst.thread_reply_count}</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Thread Composer */}
                                                {showThreadComposer === pst.id && (
                                            <div className="thread-composer" onClick={(e) => e.stopPropagation()}>
                                                <div className="thread-composer-header">
                                                    <span className="thread-composer-label">
                                                        <i className="fas fa-comments me-2"></i>Add to your thread
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="thread-composer-close"
                                                        onClick={() => {
                                                            setShowThreadComposer(null);
                                                            setData('parent_post_id', null);
                                                        }}
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                                <form onSubmit={handleSubmit} encType="multipart/form-data">
                                                    <textarea
                                                        className="composer-textarea"
                                                        placeholder="Add another post to your thread..."
                                                        value={data.content}
                                                        onChange={e => setData('content', e.target.value)}
                                                        rows="2"
                                                    ></textarea>
                                                    
                                                    {imagePreview && (
                                                        <div className="image-preview-container">
                                                            <img src={imagePreview} alt="Preview" className="image-preview" />
                                                            <button
                                                                type="button"
                                                                className="image-preview-remove"
                                                                onClick={() => {
                                                                    setImagePreview(null);
                                                                    setData('image', null);
                                                                }}
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="filepond-container thread-filepond">
                                                        <FilePond
                                                            files={data.image ? [data.image] : []}
                                                            onupdatefiles={handleFileChange}
                                                            allowMultiple={false}
                                                            maxFiles={1}
                                                            acceptedFileTypes={['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']}
                                                            labelIdle='<span class="filepond-label"><i class="far fa-image me-2"></i>Add image/GIF</span>'
                                                            stylePanelLayout="compact"
                                                            server={null}
                                                            instantUpload={false}
                                                        />
                                                    </div>

                                                    <div className="composer-actions">
                                                        <div className="composer-tools">
                                                            <div className="composer-tool-group" style={{ position: 'relative' }}>
                                                                <button 
                                                                    type="button" 
                                                                    className="composer-tool-btn"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setShowEmojiPicker(!showEmojiPicker);
                                                                    }}
                                                                >
                                                                    <i className="far fa-smile"></i>
                                                                </button>
                                                                {showEmojiPicker && (
                                                                    <div className="emoji-picker-wrapper">
                                                                        <EmojiPicker
                                                                            onEmojiClick={handleEmojiClick}
                                                                            theme="dark"
                                                                            width="100%"
                                                                            height="400px"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button 
                                                            type="submit" 
                                                            className="post-submit-btn"
                                                            disabled={processing || (!data.content.trim() && !data.image)}
                                                        >
                                                            {processing ? (
                                                                <>
                                                                    <i className="fas fa-spinner fa-spin me-2"></i>Posting...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="fas fa-plus me-2"></i>Add to Thread
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <div className="empty-state py-5 text-center">
                                <i className="fas fa-comments fa-3x mb-3 text-white-50"></i>
                                <h4 className="text-white">No Posts Yet</h4>
                                <p className="text-white-50">Be the first to share something with the community!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="content-card" style={{ flex: 1 }}>
                    {/* Connect Section */}
                    <div className="connect-section mb-4">
                        <div className="card-header">
                            <i className="fas fa-user-plus"></i>
                            <h3>Connect</h3>
                        </div>
                        <div className="connect-list">
                            {suggestedUsers.length > 0 ? (
                                suggestedUsers.map(user => (
                                    <div key={user.id} className="connect-item">
                                        <div 
                                            className="connect-user-link"
                                            onClick={() => router.visit(route('fan.profile.user', user.id))}
                                            onMouseEnter={(e) => handleProfileHover(user.id, e)}
                                            onMouseLeave={handleProfileLeave}
                                        >
                                            <img src={getAvatar(user)} alt={user.name} className="connect-avatar" />
                                            <div className="connect-info">
                                                <span className="connect-name">{user.name}</span>
                                                <span className="connect-handle">@{user.name.replace(/\s+/g, '').toLowerCase()}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn-connect-follow"
                                            onClick={(e) => handleFollowToggle(user.id, e)}
                                        >
                                            Follow
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-3 text-white-50">
                                    <small>No suggestions at the moment</small>
                                </div>
                            )}
                            
                            <div className="mt-2 pt-2 border-top border-secondary opacity-50">
                                <Link 
                                    href={route('fan.profile')} 
                                    className="text-white-50 small text-decoration-none d-block text-center"
                                >
                                    <i className="fas fa-search me-1"></i> Find more friends
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="card-header">
                        <i className="fas fa-fire"></i>
                        <h3>Trending</h3>
                    </div>
                    <div className="hashtag-list p-3">
                        {trendingHashtags.length > 0 ? (
                            trendingHashtags.map(tag => (
                                <div key={tag.id} className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <div className="fw-bold text-white">#{tag.name}</div>
                                        <div className="small text-white-50">{tag.count} posts</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-white-50">
                                <p>No trending topics yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Preview Tooltip */}
            {profilePreview && !profilePreview.is_self && (
                <div 
                    className="profile-preview-tooltip"
                    style={{
                        position: 'fixed',
                        left: `${previewPosition.x}px`,
                        top: `${previewPosition.y}px`,
                        transform: 'translateX(-50%)',
                        zIndex: 1060,
                        pointerEvents: 'auto'
                    }}
                    onMouseEnter={() => clearTimeout(previewTimeoutRef.current)}
                    onMouseLeave={handleProfileLeave}
                >
                    <div className="profile-preview-card">
                        <div className="profile-preview-header">
                            <img 
                                src={getAvatar(profilePreview)} 
                                alt={profilePreview.name}
                                className="profile-preview-avatar"
                            />
                            <div className="profile-preview-info">
                                <h5 className="profile-preview-name">{profilePreview.name}</h5>
                                <p className="profile-preview-handle">@{profilePreview.name.replace(/\s+/g, '').toLowerCase()}</p>
                            </div>
                        </div>
                        <div className="profile-preview-stats">
                            <div className="profile-preview-stat">
                                <span className="stat-value">{profilePreview.posts}</span>
                                <span className="stat-label">Posts</span>
                            </div>
                            <div className="profile-preview-stat">
                                <span className="stat-value">{profilePreview.followers}</span>
                                <span className="stat-label">Followers</span>
                            </div>
                            <div className="profile-preview-stat">
                                <span className="stat-value">{profilePreview.following}</span>
                                <span className="stat-label">Following</span>
                            </div>
                        </div>
                        <div className="profile-preview-actions">
                            <Link
                                href={route('fan.profile.user', profilePreview.id)}
                                className="btn-profile-preview-view"
                                onClick={(e) => e.stopPropagation()}
                            >
                                View Profile
                            </Link>
                            <button
                                className={`btn-profile-preview-follow ${profilePreview.is_following ? 'following' : ''}`}
                                onClick={(e) => handleFollowToggle(profilePreview.id, e)}
                            >
                                {profilePreview.is_following ? (
                                    <>
                                        <i className="fas fa-check me-1"></i>Following
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-user-plus me-1"></i>Follow
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comment Modal - Matching Budget Calculator Design */}
            {showCommentModal && (
                <div 
                    className="comment-modal-overlay"
                    onClick={() => {
                        setShowCommentModal(false);
                        setSelectedPost(null);
                        resetComment('content');
                    }}
                >
                    <div 
                        className="comment-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="comment-modal-header">
                            <h5 className="comment-modal-title">
                                <i className="fas fa-comment me-2"></i>Add Comment
                            </h5>
                            <button 
                                className="comment-modal-close"
                                onClick={() => {
                                    setShowCommentModal(false);
                                    setSelectedPost(null);
                                    resetComment('content');
                                }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCommentSubmit}>
                            <div className="comment-modal-body">
                                <textarea
                                    className="comment-textarea"
                                    placeholder="Write your comment..."
                                    value={commentData.content}
                                    onChange={e => setCommentData('content', e.target.value)}
                                    rows="4"
                                    autoFocus
                                ></textarea>
                                {errors.content && (
                                    <div className="text-danger small mt-2">{errors.content}</div>
                                )}
                            </div>
                            
                            <div className="comment-modal-footer">
                                <button
                                    type="button"
                                    className="btn-comment-cancel"
                                    onClick={() => {
                                        setShowCommentModal(false);
                                        setSelectedPost(null);
                                        resetComment('content');
                                    }}
                                >
                                    Cancel
                                </button>
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
                        </form>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && shareItem && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => {
                        setShowShareModal(false);
                        setShareItem(null);
                    }}
                    shareType={shareItem.type}
                    shareId={shareItem.id}
                    shareContent={shareItem.content}
                />
            )}

            <ConfirmationDialog
                open={!!postToDelete}
                onOpenChange={(open) => !open && setPostToDelete(null)}
                title="Delete Post?"
                description="Are you sure you want to delete this post? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </FanLayout>
    );
}
