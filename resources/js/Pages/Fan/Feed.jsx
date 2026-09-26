import React, { useState, useRef, useEffect } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { useForm, router, usePage, Link } from '@inertiajs/react';
import EmojiPicker from 'emoji-picker-react';
import ShareModal from '@/Components/ShareModal';
import AdPostCard from '@/Components/AdPostCard';
import '../../../css/fan/feed.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import TfeModal from '@/Components/Common/TfeModal';
import ImageUpload from '@/Components/Common/ImageUpload';
import { useTournament } from '@/Context/TournamentContext';

const FILTERS = [
    { key: 'latest', label: 'Latest', icon: 'fa-clock' },
    { key: 'trending', label: 'Trending', icon: 'fa-fire' },
    { key: 'following', label: 'Following', icon: 'fa-user-group' },
];

// Feed uploads take GIFs too, so the shared picker is widened here to match
// the server rule (mimes:jpeg,png,jpg,gif,webp — never SVG).
const FEED_IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const FEED_IMAGE_HINT = 'JPG, PNG, GIF or WebP — up to 10MB';

const handleOf = (name) => `@${String(name || '').replace(/\s+/g, '').toLowerCase()}`;

export default function Feed({
    auth,
    posts,
    stats,
    trendingHashtags,
    feedAds = [],
    suggestedUsers = [],
    filter = 'latest',
}) {
    const { tournament } = useTournament();
    const { user } = auth;
    const { assetUrl } = usePage().props;
    const [selectedPost, setSelectedPost] = useState(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [profilePreview, setProfilePreview] = useState(null);
    const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
    const previewTimeoutRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showThreadComposer, setShowThreadComposer] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareItem, setShareItem] = useState(null);
    const emojiPickerRef = useRef(null);
    const [postToDelete, setPostToDelete] = useState(null);

    // Post form
    const { data, setData, post, processing, reset, errors } = useForm({
        content: '',
        visibility: 'public',
        image: null,
        parent_post_id: null,
    });

    // Comment form
    const {
        data: commentData,
        setData: setCommentData,
        post: postComment,
        processing: commentProcessing,
        reset: resetComment,
    } = useForm({ content: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('fan.feed.store'), {
            onSuccess: () => {
                reset('content', 'image', 'parent_post_id');
                setShowThreadComposer(null);
            },
            forceFormData: true,
        });
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

    const applyFilter = (key) => {
        if (key === filter) return;
        router.get(route('fan.feed'), { filter: key }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['posts', 'filter'],
        });
    };

    const handleLike = (postId, e) => {
        e?.stopPropagation();
        router.post(route('fan.feed.like', postId), {}, { preserveScroll: true });
    };

    const handleComment = (postId) => {
        setSelectedPost(postId);
        setShowCommentModal(true);
    };

    const closeCommentModal = () => {
        setShowCommentModal(false);
        setSelectedPost(null);
        resetComment('content');
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!commentData.content.trim()) return;

        postComment(route('fan.feed.comment', selectedPost), {
            onSuccess: closeCommentModal,
            preserveScroll: true,
        });
    };

    const handleRepost = (postId, e) => {
        e?.stopPropagation();
        router.post(route('fan.feed.repost', postId), {}, { preserveScroll: true });
    };

    // Opens the shared ShareModal (send to fans / tribes) rather than silently
    // bumping the share counter, which is what the bare POST used to do.
    const handleShare = (pst, e) => {
        e?.stopPropagation();
        setShareItem({ type: 'post', id: pst.id, content: pst.content });
        setShowShareModal(true);
    };

    const handleDelete = () => {
        if (postToDelete) {
            router.delete(route('fan.feed.destroy', postToDelete), {
                preserveScroll: true,
                onSuccess: () => setPostToDelete(null),
            });
        }
    };

    // Helper for avatar logic
    const getAvatar = (u) => u?.avatar || `${assetUrl}assets/img/avatars/default-avatar.png`;

    // Profile preview handlers
    const handleProfileHover = async (userId, e) => {
        if (userId === user.id) return;

        const target = e.currentTarget;
        clearTimeout(previewTimeoutRef.current);

        previewTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(route('fan.follow.preview', userId));
                const previewData = await response.json();

                const rect = target.getBoundingClientRect();
                setPreviewPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 10,
                });
                setProfilePreview(previewData);
            } catch (error) {
                console.error('Error loading profile preview:', error);
            }
        }, 500);
    };

    const handleProfileLeave = () => {
        clearTimeout(previewTimeoutRef.current);
        setTimeout(() => setProfilePreview(null), 200);
    };

    const handleFollowToggle = (userId, e) => {
        e?.stopPropagation();
        router.post(route('fan.follow.toggle', userId), {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (profilePreview && profilePreview.id === userId) {
                    setProfilePreview((prev) => ({ ...prev, is_following: !prev.is_following }));
                }
            },
        });
    };

    const canPost = Boolean(data.content.trim() || data.image);

    /** The emoji trigger + its popover, shared by both composers. */
    const emojiTrigger = (
        <div className="feed-composer__emoji" ref={emojiPickerRef}>
            <button
                type="button"
                className="tfe-btn tfe-btn--sm tfe-btn--icon"
                aria-label="Add emoji"
                aria-expanded={showEmojiPicker}
                onClick={(e) => {
                    e.preventDefault();
                    setShowEmojiPicker(!showEmojiPicker);
                }}
            >
                <i className="far fa-smile" />
            </button>
            {showEmojiPicker && (
                <div className="feed-composer__emoji-pop">
                    <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" width="100%" height="360px" />
                </div>
            )}
        </div>
    );

    return (
        <FanLayout title="Social Feed">
            <DashboardHero
                role="fan"
                title="Social Feed"
                subtitle={`Connect with fellow ${tournament?.short_name || 'tournament'} fans and share your journey.`}
                breadcrumbs={[{ label: 'Feed' }]}
            />

            <SummaryTiles
                items={[
                    { label: 'Followers', value: stats.followers, icon: 'fa-user-friends', accent: 'blue', subtext: 'Fan Connections' },
                    { label: 'Following', value: stats.following, icon: 'fa-users', accent: 'red', subtext: 'Fans you follow' },
                    { label: 'Likes Received', value: stats.likes_received || 0, icon: 'fa-heart', accent: 'rose', subtext: 'Total Engagement' },
                    { label: 'My Posts', value: stats.posts, icon: 'fa-edit', accent: 'teal', subtext: 'Your Shares' },
                ]}
            />

            <div className="feed-layout">
                <div className="feed-main">
                    {/* ── Composer ─────────────────────────────────────── */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <div>
                                <h3 className="tfe-slab__title">Share an update</h3>
                                <div className="tfe-slab__title-sub">
                                    Matchday plans, travel tips, or a scoreline call.
                                </div>
                            </div>
                        </div>
                        <div className="tfe-slab__body">
                            <form onSubmit={handleSubmit} encType="multipart/form-data" className="feed-composer">
                                <img className="feed-composer__avatar" src={getAvatar(user)} alt={user.name} />

                                <div className="feed-composer__main">
                                    <textarea
                                        className="tfe-textarea"
                                        placeholder="What's happening?"
                                        value={data.content}
                                        onChange={(e) => setData('content', e.target.value)}
                                        rows="3"
                                    />

                                    <ImageUpload
                                        compact
                                        accept={FEED_IMAGE_ACCEPT}
                                        hint={FEED_IMAGE_HINT}
                                        label="Add a photo or GIF"
                                        onFile={(file) => setData('image', file)}
                                        onClear={() => setData('image', null)}
                                    />

                                    {errors.content && <div className="tfe-form-error">{errors.content}</div>}
                                    {errors.image && <div className="tfe-form-error">{errors.image}</div>}

                                    <div className="feed-composer__foot">
                                        <div className="feed-composer__tools">
                                            {emojiTrigger}
                                            <select
                                                className="tfe-select tfe-select--sm feed-composer__visibility"
                                                value={data.visibility}
                                                onChange={(e) => setData('visibility', e.target.value)}
                                                aria-label="Who can see this post"
                                            >
                                                <option value="public">🌍 Public</option>
                                                <option value="friends">👥 Friends</option>
                                                <option value="tribe">🛡️ Tribe</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            className="tfe-btn tfe-btn--filled"
                                            disabled={processing || !canPost}
                                        >
                                            {processing ? (
                                                <><i className="fas fa-spinner fa-spin" /> Posting…</>
                                            ) : (
                                                <><i className="fas fa-paper-plane" /> Post</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* ── Feed ─────────────────────────────────────────── */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header feed-slab__header">
                            <h3 className="tfe-slab__title">Feed</h3>
                            <div className="feed-tabs" role="tablist" aria-label="Feed order">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={filter === f.key}
                                        className={`tfe-btn tfe-btn--sm${filter === f.key ? ' is-active' : ''}`}
                                        onClick={() => applyFilter(f.key)}
                                    >
                                        <i className={`fas ${f.icon}`} /> {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="tfe-slab__body tfe-slab__body--flush">
                            {posts.length > 0 ? (
                                <div className="feed-scroll-container">
                                    {posts.map((pst, index) => {
                                        // Slot an ad in every 5 posts.
                                        const shouldShowAd = feedAds.length > 0 && index > 0 && index % 5 === 0;
                                        const adIndex = Math.floor((index - 1) / 5) % feedAds.length;

                                        return (
                                            <React.Fragment key={pst.id}>
                                                {shouldShowAd && feedAds[adIndex] && (
                                                    <AdPostCard ad={feedAds[adIndex]} assetUrl={assetUrl} />
                                                )}
                                                <article
                                                    className="feed-post"
                                                    onClick={() => router.visit(route('fan.feed.post.show', pst.id))}
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
                                                                <span className="author-handle">{handleOf(pst.user.name)}</span>
                                                                <span className="post-dot">·</span>
                                                                <span className="post-time">{pst.created_at}</span>
                                                            </div>
                                                            {pst.user.id === user.id && (
                                                                <button
                                                                    type="button"
                                                                    className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                                    aria-label="Delete post"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPostToDelete(pst.id);
                                                                    }}
                                                                >
                                                                    <i className="fas fa-trash" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="post-text">{pst.content}</div>

                                                        {pst.image_url && (
                                                            <div className="post-image-container" onClick={(e) => e.stopPropagation()}>
                                                                <img src={pst.image_url} alt="Post attachment" className="post-image" />
                                                            </div>
                                                        )}

                                                        {pst.thread_replies?.length > 0 && (
                                                            <div className="thread-replies-preview" onClick={(e) => e.stopPropagation()}>
                                                                {pst.thread_replies.map((reply) => (
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
                                                                type="button"
                                                                className="action-item action-reply"
                                                                onClick={(e) => { e.stopPropagation(); handleComment(pst.id); }}
                                                                title="Comment"
                                                            >
                                                                <i className="far fa-comment" />
                                                                {pst.comment_count > 0 && <span>{pst.comment_count}</span>}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="action-item action-retweet"
                                                                onClick={(e) => handleRepost(pst.id, e)}
                                                                title="Repost"
                                                            >
                                                                <i className="fas fa-retweet" />
                                                                {pst.share_count > 0 && <span>{pst.share_count}</span>}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={`action-item action-like ${pst.is_liked ? 'liked' : ''}`}
                                                                onClick={(e) => handleLike(pst.id, e)}
                                                                title={pst.is_liked ? 'Unlike' : 'Like'}
                                                            >
                                                                <i className={pst.is_liked ? 'fas fa-heart' : 'far fa-heart'} />
                                                                {pst.like_count > 0 && <span>{pst.like_count}</span>}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="action-item action-share"
                                                                onClick={(e) => handleShare(pst, e)}
                                                                title="Share"
                                                            >
                                                                <i className="far fa-share-square" />
                                                            </button>
                                                            {pst.user.id === user.id && (
                                                                <button
                                                                    type="button"
                                                                    className="action-item action-thread"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleThreadReply(pst.id);
                                                                    }}
                                                                    title="Add to thread"
                                                                >
                                                                    <i className="fas fa-comments" />
                                                                    {pst.thread_reply_count > 0 && <span>{pst.thread_reply_count}</span>}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {showThreadComposer === pst.id && (
                                                            <div className="feed-thread-composer" onClick={(e) => e.stopPropagation()}>
                                                                <div className="feed-thread-composer__head">
                                                                    <span className="feed-thread-composer__label">
                                                                        <i className="fas fa-comments" /> Add to your thread
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                                        aria-label="Close thread composer"
                                                                        onClick={() => {
                                                                            setShowThreadComposer(null);
                                                                            setData('parent_post_id', null);
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-times" />
                                                                    </button>
                                                                </div>
                                                                <form onSubmit={handleSubmit} encType="multipart/form-data">
                                                                    <textarea
                                                                        className="tfe-textarea"
                                                                        placeholder="Add another post to your thread…"
                                                                        value={data.content}
                                                                        onChange={(e) => setData('content', e.target.value)}
                                                                        rows="2"
                                                                    />
                                                                    <ImageUpload
                                                                        compact
                                                                        accept={FEED_IMAGE_ACCEPT}
                                                                        hint={FEED_IMAGE_HINT}
                                                                        label="Add a photo or GIF"
                                                                        onFile={(file) => setData('image', file)}
                                                                        onClear={() => setData('image', null)}
                                                                    />
                                                                    <div className="feed-composer__foot">
                                                                        <div className="feed-composer__tools">{emojiTrigger}</div>
                                                                        <button
                                                                            type="submit"
                                                                            className="tfe-btn tfe-btn--filled tfe-btn--sm"
                                                                            disabled={processing || !canPost}
                                                                        >
                                                                            {processing ? (
                                                                                <><i className="fas fa-spinner fa-spin" /> Posting…</>
                                                                            ) : (
                                                                                <><i className="fas fa-plus" /> Add to Thread</>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                        )}
                                                    </div>
                                                </article>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="tfe-empty">
                                    <div className="tfe-empty__icon"><i className="fas fa-comments" /></div>
                                    <h4 className="tfe-empty__title">
                                        {filter === 'following' ? 'Nothing from your circle yet' : 'No posts yet'}
                                    </h4>
                                    <p className="tfe-empty__body">
                                        {filter === 'following'
                                            ? 'Follow a few fans from the Connect list and their posts will land here.'
                                            : 'Be the first to share something with the community.'}
                                    </p>
                                    {filter !== 'latest' && (
                                        <button type="button" className="tfe-btn tfe-btn--sm tfe-empty__action" onClick={() => applyFilter('latest')}>
                                            Show latest posts
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* ── Sidebar ─────────────────────────────────────────── */}
                <aside className="feed-aside">
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">Connect</h3>
                        </div>
                        <div className="tfe-slab__body tfe-slab__body--flush">
                            {suggestedUsers.length > 0 ? (
                                <ul className="feed-connect">
                                    {suggestedUsers.map((suggested) => (
                                        <li key={suggested.id} className="feed-connect__row">
                                            <button
                                                type="button"
                                                className="feed-connect__who"
                                                onClick={() => router.visit(route('fan.profile.user', suggested.id))}
                                                onMouseEnter={(e) => handleProfileHover(suggested.id, e)}
                                                onMouseLeave={handleProfileLeave}
                                            >
                                                <img src={getAvatar(suggested)} alt={suggested.name} />
                                                <span className="feed-connect__names">
                                                    <span className="feed-connect__name">{suggested.name}</span>
                                                    <span className="feed-connect__handle">{handleOf(suggested.name)}</span>
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                className="tfe-btn tfe-btn--sm"
                                                onClick={(e) => handleFollowToggle(suggested.id, e)}
                                            >
                                                Follow
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="tfe-empty tfe-empty--inline">
                                    <div className="tfe-empty__icon"><i className="fas fa-user-plus" /></div>
                                    <p className="tfe-empty__body">No suggestions at the moment.</p>
                                </div>
                            )}

                            <div className="feed-aside__foot">
                                <Link href={route('fan.profile')} className="tfe-btn tfe-btn--sm">
                                    <i className="fas fa-search" /> Find More Friends
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">Trending</h3>
                        </div>
                        <div className="tfe-slab__body tfe-slab__body--flush">
                            {trendingHashtags.length > 0 ? (
                                <ul className="feed-trending">
                                    {trendingHashtags.map((tag, index) => (
                                        <li key={tag.id} className="feed-trending__row">
                                            <span className="tfe-rank" data-medal={index < 3 ? index + 1 : undefined}>
                                                {index + 1}
                                            </span>
                                            <span className="feed-trending__body">
                                                <span className="feed-trending__tag">#{tag.name}</span>
                                                <span className="feed-trending__count">{tag.count} posts</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="tfe-empty tfe-empty--inline">
                                    <div className="tfe-empty__icon"><i className="fas fa-fire" /></div>
                                    <p className="tfe-empty__body">No trending topics yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </aside>
            </div>

            {/* Profile preview popover */}
            {profilePreview && !profilePreview.is_self && (
                <div
                    className="feed-preview"
                    style={{ left: `${previewPosition.x}px`, top: `${previewPosition.y}px` }}
                    onMouseEnter={() => clearTimeout(previewTimeoutRef.current)}
                    onMouseLeave={handleProfileLeave}
                >
                    <div className="feed-preview__head">
                        <img src={getAvatar(profilePreview)} alt={profilePreview.name} />
                        <div>
                            <h5 className="feed-preview__name">{profilePreview.name}</h5>
                            <p className="feed-preview__handle">{handleOf(profilePreview.name)}</p>
                        </div>
                    </div>
                    <div className="feed-preview__stats">
                        <div><strong>{profilePreview.posts}</strong><span>Posts</span></div>
                        <div><strong>{profilePreview.followers}</strong><span>Followers</span></div>
                        <div><strong>{profilePreview.following}</strong><span>Following</span></div>
                    </div>
                    <div className="feed-preview__actions">
                        <Link
                            href={route('fan.profile.user', profilePreview.id)}
                            className="tfe-btn tfe-btn--sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            View Profile
                        </Link>
                        <button
                            type="button"
                            className={`tfe-btn tfe-btn--sm${profilePreview.is_following ? ' is-active' : ' tfe-btn--filled'}`}
                            onClick={(e) => handleFollowToggle(profilePreview.id, e)}
                        >
                            {profilePreview.is_following ? (
                                <><i className="fas fa-check" /> Following</>
                            ) : (
                                <><i className="fas fa-user-plus" /> Follow</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <TfeModal open={showCommentModal} title="Add a comment" onClose={closeCommentModal} size="sm">
                <form onSubmit={handleCommentSubmit}>
                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="feed-comment">Your comment</label>
                        <textarea
                            id="feed-comment"
                            className="tfe-textarea"
                            placeholder="Write your comment…"
                            value={commentData.content}
                            onChange={(e) => setCommentData('content', e.target.value)}
                            rows="4"
                            autoFocus
                        />
                        {errors.content && <div className="tfe-form-error">{errors.content}</div>}
                    </div>
                    <div className="feed-modal__foot">
                        <button type="button" className="tfe-btn" onClick={closeCommentModal}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="tfe-btn tfe-btn--filled"
                            disabled={commentProcessing || !commentData.content.trim()}
                        >
                            {commentProcessing ? (
                                <><i className="fas fa-spinner fa-spin" /> Posting…</>
                            ) : (
                                <><i className="fas fa-paper-plane" /> Post Comment</>
                            )}
                        </button>
                    </div>
                </form>
            </TfeModal>

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
