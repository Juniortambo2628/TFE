import React, { useState, useRef, useEffect } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import ShareModal from '@/Components/ShareModal';
import FanHero from '@/Components/Fan/FanHero';
import '../../../css/fan/stories.css';
export default function Stories({ auth, stories, myStories, storyAds = [] }) {
    const { user } = auth;
    const { assetUrl } = usePage().props;
    const [selectedUserIndex, setSelectedUserIndex] = useState(null);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
    const [isViewing, setIsViewing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareItem, setShareItem] = useState(null);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedStoryForReply, setSelectedStoryForReply] = useState(null);
    const [storyReplies, setStoryReplies] = useState([]);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const progressIntervalRef = useRef(null);
    const storyTimeoutRef = useRef(null);
    const adShownRef = useRef(new Set());
    
    const { data, setData, post, processing, reset } = useForm({
        media: null,
        caption: ''
    });

    const replyForm = useForm({
        content: ''
    });

    const getAvatar = (u) => {
        return u?.avatar || `${assetUrl}assets/img/avatars/default-avatar.png`;
    };

    // Combine my stories with other users' stories
    // Filter out user's own stories from the stories array to avoid duplicates
    const otherUsersStories = stories.filter(storyGroup => {
        if (!storyGroup || !storyGroup.user || !storyGroup.user.id) {
            return false;
        }
        return storyGroup.user.id !== user.id;
    });
    
    // Ensure myStories is properly formatted
    const myStoriesGroup = myStories.length > 0 ? [{
        user: {
            id: user.id,
            name: user.name,
            avatar: user.avatar || null,
        },
        stories: Array.isArray(myStories) ? myStories : [],
        has_unviewed: false,
    }] : [];
    
    const allStories = [
        ...myStoriesGroup,
        ...otherUsersStories
    ];

    const handleStoryClick = (userIndex, storyIndex = 0) => {
        setSelectedUserIndex(userIndex);
        setSelectedStoryIndex(storyIndex);
        setIsViewing(true);
        setProgress(0);
        startProgress();
        markAsViewed(userIndex, storyIndex);
    };

    const startProgress = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
        if (storyTimeoutRef.current) {
            clearTimeout(storyTimeoutRef.current);
        }

        const duration = 5000; // 5 seconds per story
        const interval = 50; // Update every 50ms
        let currentProgress = 0;

        progressIntervalRef.current = setInterval(() => {
            currentProgress += (interval / duration) * 100;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(progressIntervalRef.current);
                nextStory();
            } else {
                setProgress(currentProgress);
            }
        }, interval);
    };

    const nextStory = () => {
        if (selectedUserIndex === null) return;

        const storyGroup = allStories[selectedUserIndex];
        if (!storyGroup || !storyGroup.stories) {
            closeViewer();
            return;
        }
        
        const userStories = storyGroup.stories;
        
        if (selectedStoryIndex < userStories.length - 1) {
            // Next story in same user's collection
            setSelectedStoryIndex(selectedStoryIndex + 1);
            setProgress(0);
            startProgress();
            markAsViewed(selectedUserIndex, selectedStoryIndex + 1);
        } else if (selectedUserIndex < allStories.length - 1) {
            // Next user's first story
            const nextUserIndex = selectedUserIndex + 1;
            const nextStoryGroup = allStories[nextUserIndex];
            if (nextStoryGroup && nextStoryGroup.stories && nextStoryGroup.stories.length > 0) {
                setSelectedUserIndex(nextUserIndex);
                setSelectedStoryIndex(0);
                setProgress(0);
                startProgress();
                markAsViewed(nextUserIndex, 0);
            } else {
                closeViewer();
            }
        } else {
            // End of all stories
            closeViewer();
        }
    };

    const prevStory = () => {
        if (selectedUserIndex === null) return;

        if (selectedStoryIndex > 0) {
            // Previous story in same user's collection
            setSelectedStoryIndex(selectedStoryIndex - 1);
            setProgress(0);
            startProgress();
        } else if (selectedUserIndex > 0) {
            // Previous user's last story
            const prevUserStories = allStories[selectedUserIndex - 1]?.stories || [];
            setSelectedUserIndex(selectedUserIndex - 1);
            setSelectedStoryIndex(prevUserStories.length - 1);
            setProgress(0);
            startProgress();
        }
    };

    const closeViewer = () => {
        setIsViewing(false);
        setSelectedUserIndex(null);
        setSelectedStoryIndex(0);
        setProgress(0);
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
        if (storyTimeoutRef.current) {
            clearTimeout(storyTimeoutRef.current);
        }
    };

    const markAsViewed = (userIndex, storyIndex) => {
        if (userIndex === null || userIndex === undefined || storyIndex === null || storyIndex === undefined) {
            return;
        }
        const storyGroup = allStories[userIndex];
        if (!storyGroup || !storyGroup.stories || !Array.isArray(storyGroup.stories) || storyIndex >= storyGroup.stories.length) {
            return;
        }
        const story = storyGroup.stories[storyIndex];
        if (!story || !story.id) {
            return;
        }
        // Check if story has user property or use storyGroup.user
        const storyUser = story.user || storyGroup.user;
        if (!storyUser || !storyUser.id) {
            return;
        }
        // Only mark as viewed if it's not the current user's story and hasn't been viewed
        if (!story.is_viewed && storyUser.id !== user.id) {
            router.post(route('fan.stories.view', story.id), {}, {
                preserveScroll: true,
                only: []
            });
        }
    };

    const handleCreateStory = (e) => {
        e.preventDefault();
        post(route('fan.stories.store'), {
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
            },
            forceFormData: true
        });
    };

    const handleReply = (storyId) => {
        setSelectedStoryForReply(storyId);
        setShowReplyModal(true);
        fetchStoryReplies(storyId);
    };

    const handleReplySubmit = (e) => {
        e.preventDefault();
        if (!selectedStoryForReply) return;
        
        replyForm.post(route('fan.stories.reply', selectedStoryForReply), {
            onSuccess: () => {
                replyForm.reset();
                fetchStoryReplies(selectedStoryForReply);
            },
            preserveScroll: true
        });
    };

    const fetchStoryReplies = async (storyId) => {
        try {
            const response = await fetch(route('fan.stories.replies', storyId));
            const replies = await response.json();
            setStoryReplies(replies);
        } catch (error) {
            console.error('Error fetching replies:', error);
        }
    };

    const handleLinkStory = (storyId) => {
        setShowLinkModal(true);
        setData('linked_story_id', storyId);
    };

    const trackAdImpression = (adId) => {
        if (!adShownRef.current.has(adId)) {
            fetch(route('fan.ads.impression', adId), { method: 'POST' });
            adShownRef.current.add(adId);
        }
    };

    const handleAdClick = (ad) => {
        if (ad.link_url) {
            fetch(route('fan.ads.click', ad.id), { method: 'POST' });
            window.open(ad.link_url, '_blank');
        }
    };

    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            if (storyTimeoutRef.current) {
                clearTimeout(storyTimeoutRef.current);
            }
        };
    }, []);

    // Track ad impressions when viewing
    useEffect(() => {
        if (isViewing && storyAds.length > 0 && selectedStoryIndex % 3 === 0) {
            storyAds.slice(0, 1).forEach(ad => {
                if (!adShownRef.current.has(ad.id)) {
                    trackAdImpression(ad.id);
                }
            });
        }
    }, [isViewing, selectedStoryIndex, storyAds]);

    const currentStoryGroup = selectedUserIndex !== null ? allStories[selectedUserIndex] : null;
    const currentStory = currentStoryGroup && currentStoryGroup.stories && currentStoryGroup.stories[selectedStoryIndex] 
        ? currentStoryGroup.stories[selectedStoryIndex] 
        : null;
    const currentUser = currentStoryGroup ? currentStoryGroup.user : null;

    return (
        <FanLayout title="Stories">
            <Head title="Stories" />
            
            <FanHero 
                title="Fan Stories"
                subtitle="Share your favorite moments and follow other fans' journeys."
                breadcrumbs={[{ label: 'Social' }, { label: 'Stories' }]}
                bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
            />
            
            <div className="stories-container">
                {/* Stories Bar */}
                <div className="stories-bar">
                    <div className="stories-scroll">
                        {/* Create Story Button */}
                        <div className="story-item story-create" onClick={() => setShowCreateModal(true)}>
                            <div className="story-avatar-wrapper">
                                <img src={getAvatar(user)} alt={user.name} className="story-avatar" />
                                <div className="story-add-icon">
                                    <i className="fas fa-plus"></i>
                                </div>
                            </div>
                            <div className="story-username">Your Story</div>
                        </div>

                        {/* Other Users' Stories */}
                        {allStories.map((storyGroup, index) => (
                            <div
                                key={`story-group-${storyGroup.user.id}-${index}`}
                                className={`story-item ${storyGroup.has_unviewed ? 'has-unviewed' : ''}`}
                                onClick={() => handleStoryClick(index, 0)}
                            >
                                <div className="story-avatar-wrapper">
                                    <img
                                        src={getAvatar(storyGroup.user)}
                                        alt={storyGroup.user.name}
                                        className="story-avatar"
                                    />
                                </div>
                                <div className="story-username">{storyGroup.user.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Story Viewer Modal */}
                {isViewing && currentStory && currentUser && (
                    <div className="story-viewer-overlay" onClick={closeViewer}>
                        <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
                            {/* Progress Bars */}
                            <div className="story-progress-container">
                                {allStories[selectedUserIndex]?.stories.map((story, index) => (
                                    <div key={`progress-${story.id}-${index}`} className="story-progress-bar">
                                        <div
                                            className={`story-progress-fill ${index === selectedStoryIndex ? 'active' : ''} ${index < selectedStoryIndex ? 'completed' : ''}`}
                                            style={index === selectedStoryIndex ? { width: `${progress}%` } : {}}
                                        ></div>
                                    </div>
                                ))}
                            </div>

                            {/* Story Header */}
                            <div className="story-header">
                                <div className="story-header-user">
                                    <img
                                        src={getAvatar(currentUser)}
                                        alt={currentUser.name}
                                        className="story-header-avatar"
                                    />
                                    <span className="story-header-name">{currentUser.name}</span>
                                    <span className="story-header-time">{currentStory.created_at}</span>
                                </div>
                                <div className="story-header-actions">
                                    {currentStory.reply_count > 0 && (
                                        <button 
                                            className="story-reply-count-btn" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReply(currentStory.id);
                                            }}
                                            title="View replies"
                                        >
                                            <i className="far fa-comment me-1"></i>
                                            {currentStory.reply_count}
                                        </button>
                                    )}
                                    <button 
                                        className="story-share-btn" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShareItem({
                                                type: 'story',
                                                id: currentStory.id,
                                                content: currentStory.caption || 'Shared story'
                                            });
                                            setShowShareModal(true);
                                        }}
                                        title="Share story"
                                    >
                                        <i className="far fa-share-square"></i>
                                    </button>
                                    <button className="story-close-btn" onClick={closeViewer}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Story Content */}
                            <div className="story-content">
                                {currentStory.media_type === 'video' ? (
                                    <video
                                        src={currentStory.media_url}
                                        className="story-media"
                                        autoPlay
                                        muted
                                        loop={false}
                                        onEnded={nextStory}
                                    />
                                ) : (
                                    <img
                                        src={currentStory.media_url}
                                        alt="Story"
                                        className="story-media"
                                    />
                                )}
                                
                                {currentStory.caption && (
                                    <div className="story-caption">{currentStory.caption}</div>
                                )}

                                {/* Linked Stories */}
                                {currentStory.linked_stories && currentStory.linked_stories.length > 0 && (
                                    <div className="story-linked-section">
                                        <div className="story-linked-header">
                                            <i className="fas fa-link me-2"></i>
                                            <span>Linked Stories</span>
                                        </div>
                                        <div className="story-linked-list">
                                            {currentStory.linked_stories.map((linked, idx) => (
                                                <div key={`linked-${linked.id}-${idx}`} className="story-linked-item">
                                                    <img src={getAvatar(linked.user)} alt={linked.user.name} className="story-linked-avatar" />
                                                    <div className="story-linked-info">
                                                        <span className="story-linked-name">{linked.user.name}</span>
                                                        <span className="story-linked-time">{linked.created_at}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Reply Button */}
                                <div className="story-actions-bottom">
                                    <button 
                                        className="story-reply-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReply(currentStory.id);
                                        }}
                                    >
                                        <i className="far fa-comment me-2"></i>Reply
                                    </button>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="story-nav-left" onClick={prevStory}></div>
                            <div className="story-nav-right" onClick={nextStory}></div>
                        </div>
                    </div>
                )}

                {/* Create Story Modal */}
                {showCreateModal && (
                    <div className="story-create-modal-overlay" onClick={() => setShowCreateModal(false)}>
                        <div className="story-create-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="story-create-header">
                                <h3>Create Story</h3>
                                <button
                                    className="story-create-close"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <form onSubmit={handleCreateStory} encType="multipart/form-data">
                                <div className="story-create-body">
                                    <div className="filepond-container-story">
                                        <FilePond
                                            files={data.media ? [data.media] : []}
                                            onupdatefiles={(fileItems) => {
                                                if (fileItems.length > 0) {
                                                    setData('media', fileItems[0].file || fileItems[0]);
                                                } else {
                                                    setData('media', null);
                                                }
                                            }}
                                            allowMultiple={false}
                                            maxFiles={1}
                                            acceptedFileTypes={['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi']}
                                            labelIdle='<span class="filepond-label"><i class="far fa-image me-2"></i>Drag & drop or <span class="filepond-link">browse</span> image/video</span>'
                                            stylePanelLayout="compact"
                                            server={null}
                                            instantUpload={false}
                                        />
                                    </div>
                                    <textarea
                                        className="story-caption-input"
                                        placeholder="Add a caption (optional)"
                                        value={data.caption}
                                        onChange={e => setData('caption', e.target.value)}
                                        rows="3"
                                        maxLength={500}
                                    ></textarea>
                                </div>
                                <div className="story-create-footer">
                                    <button
                                        type="button"
                                        className="btn-story-cancel"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-story-submit"
                                        disabled={processing || !data.media}
                                    >
                                        {processing ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin me-2"></i>Posting...
                                            </>
                                        ) : (
                                            'Share Story'
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

                {/* Reply Modal */}
                {showReplyModal && selectedStoryForReply && (
                    <div className="story-reply-modal-overlay" onClick={() => setShowReplyModal(false)}>
                        <div className="story-reply-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="story-reply-header">
                                <h4>Replies</h4>
                                <button className="story-reply-close" onClick={() => setShowReplyModal(false)}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="story-reply-list">
                                {storyReplies.length > 0 ? (
                                    storyReplies.map((reply, idx) => (
                                        <div key={`reply-${reply.id}-${idx}`} className="story-reply-item">
                                            <img src={getAvatar(reply.user)} alt={reply.user.name} className="story-reply-avatar" />
                                            <div className="story-reply-content">
                                                <span className="story-reply-author">{reply.user.name}</span>
                                                <p className="story-reply-text">{reply.content}</p>
                                                <span className="story-reply-time">{reply.created_at}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="story-reply-empty">No replies yet</div>
                                )}
                            </div>
                            <form onSubmit={handleReplySubmit} className="story-reply-form">
                                <textarea
                                    className="story-reply-input"
                                    placeholder="Write a reply..."
                                    value={replyForm.data.content}
                                    onChange={e => replyForm.setData('content', e.target.value)}
                                    rows="3"
                                ></textarea>
                                <button
                                    type="submit"
                                    className="story-reply-submit"
                                    disabled={replyForm.processing || !replyForm.data.content.trim()}
                                >
                                    {replyForm.processing ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin me-2"></i>Posting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane me-2"></i>Reply
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Ad Slots in Story Viewer - Show occasionally */}
                {isViewing && storyAds.length > 0 && selectedStoryIndex % 3 === 0 && (
                    <div className="story-ad-slot">
                        {storyAds.slice(0, 1).map((ad, adIdx) => (
                            <div key={`story-ad-${ad.id}-${adIdx}`} className="story-ad-card" onClick={() => handleAdClick(ad)}>
                                <div className="story-ad-badge">Sponsored</div>
                                {ad.image_url && (
                                    <img src={ad.image_url} alt={ad.title} className="story-ad-image" />
                                )}
                                <div className="story-ad-content">
                                    <h5 className="story-ad-title">{ad.title}</h5>
                                    {ad.description && (
                                        <p className="story-ad-description">{ad.description}</p>
                                    )}
                                    {ad.partner_name && (
                                        <span className="story-ad-partner">by {ad.partner_name}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FanLayout>
    );
}
