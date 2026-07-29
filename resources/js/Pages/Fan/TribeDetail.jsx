import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import '../../../css/fan/fan-pages.css';
import '../../../css/fan/tribes.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import DashboardModal from '@/Components/Fan/DashboardModal';

export default function TribeDetail({ auth, tribe, members, posts, stats }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [editTab, setEditTab] = useState('info');
    const [bannerFiles, setBannerFiles] = useState([]);
    
    // Post related state
    const [showPostForm, setShowPostForm] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

    const postForm = useForm({
        title: '',
        content: '',
    });

    const replyForm = useForm({
        content: '',
    });

    const editForm = useForm({
        name: tribe.name,
        description: tribe.description || '',
        privacy: tribe.privacy,
        banner: tribe.banner
    });

    const handleCreatePost = (e) => {
        e.preventDefault();
        postForm.post(route('fan.tribes.posts.store', tribe.id), {
            onSuccess: () => {
                postForm.reset();
                setShowPostForm(false);
            }
        });
    };

    const handleReply = (e, postId) => {
        e.preventDefault();
        replyForm.post(route('fan.tribes.posts.reply', [tribe.id, postId]), {
            onSuccess: () => {
                replyForm.reset();
                setReplyingTo(null);
            }
        });
    };

    const handleUpdateTribe = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', editForm.data.name);
        formData.append('description', editForm.data.description || '');
        formData.append('privacy', editForm.data.privacy);
        if (bannerFiles.length > 0 && bannerFiles[0].file) {
            formData.append('banner', bannerFiles[0].file);
        } else {
            formData.append('banner', editForm.data.banner || '');
        }
        
        router.post(route('fan.tribes.update', tribe.id), formData, {
            forceFormData: true,
            onSuccess: () => {
                setShowEditModal(false);
                setBannerFiles([]);
            }
        });
    };

    const handleToggleRole = (userId) => {
        router.post(route('fan.tribes.members.role', [tribe.id, userId]));
    };

    const handleJoin = () => {
        router.post(route('fan.tribes.join', tribe.id));
    };

    const handleLeave = () => {
        router.post(route('fan.tribes.leave', tribe.id), {
            onSuccess: () => setConfirmLeave(false)
        });
    };

    const modalTabs = [
        { id: 'info', label: 'Tribe Info', icon: 'fas fa-th-large' },
        { id: 'media', label: 'Cover Photo', icon: 'fas fa-image' }
    ];

    return (
        <FanLayout user={auth.user} header={tribe.name}>
            <Head title={tribe.name} />

            <div className="container-fluid p-0">
                <DashboardHero role="fan" 
                    title={tribe.name}
                    subtitle={`${tribe.privacy.charAt(0).toUpperCase() + tribe.privacy.slice(1)} Group • Created ${tribe.created_at}`}
                    breadcrumbs={[
                        { label: 'Tribes', href: route('fan.tribes') },
                        { label: tribe.name }
                    ]}
                    bgImage={tribe.banner || '/assets/img/logo/TFE-logo.png'}
                >
                    {tribe.is_admin && (
                        <button className="btn-fan-custom" onClick={() => setShowEditModal(true)}>
                            <i className="fas fa-cog me-2"></i> Manage Settings
                        </button>
                    )}
                </DashboardHero>

                <div className="tribes-container pt-0">
                    {/* Summary Cards */}
                    <div className="summary-cards-grid mb-5">
                        <div className="fan-card-premium glow-red">
                            <div className="card-content-gaming">
                                <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                                    <i className="fas fa-users"></i>
                                </div>
                                <h3 className="card-title-gaming">Members</h3>
                                <div className="card-value-gaming">{tribe.member_count}</div>
                                <div className="text-white-50 small mt-1">Active Fans</div>
                            </div>
                        </div>
                        
                        <div className="fan-card-premium glow-blue">
                            <div className="card-content-gaming">
                                <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                                    <i className="fas fa-comments"></i>
                                </div>
                                <h3 className="card-title-gaming">Discussions</h3>
                                <div className="card-value-gaming">{posts.length}</div>
                                <div className="text-white-50 small mt-1">Total Posts</div>
                            </div>
                        </div>

                        <div className="fan-card-premium glow-red">
                            <div className="card-content-gaming">
                                <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                                    <i className="fas fa-eye"></i>
                                </div>
                                <h3 className="card-title-gaming">Views</h3>
                                <div className="card-value-gaming">{posts.reduce((sum, p) => sum + p.view_count, 0)}</div>
                                <div className="text-white-50 small mt-1">Engagement</div>
                            </div>
                        </div>

                        {tribe.is_member && (
                            <div className="fan-card-premium glow-blue pointer" onClick={() => setShowPostForm(true)}>
                                <div className="card-content-gaming">
                                    <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                                        <i className="fas fa-plus"></i>
                                    </div>
                                    <h3 className="card-title-gaming">Discussion</h3>
                                    <div className="card-value-gaming">New</div>
                                    <div className="text-white-50 small mt-1">Join Flow</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="row">
                    <div className="col-lg-8">
                        {/* About Card */}
                        <div className="content-card mb-4">
                            <div className="card-header">
                                <i className="fas fa-info-circle"></i>
                                <h3>About Implementation</h3>
                            </div>
                            <div className="p-4 pt-0">
                                <p className="text-white-50">{tribe.description || 'No description provided.'}</p>
                            </div>
                        </div>

                         {/* Discussions */}
                         <div className="content-card mb-4">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="fas fa-comments"></i>
                                    <h3>Discussions</h3>
                                </div>
                            </div>
                            
                            {/* Create Post Form */}
                            {showPostForm && (
                                <div className="p-3 border-bottom border-secondary">
                                    <form onSubmit={handleCreatePost}>
                                        <input
                                            type="text"
                                            className="form-control bg-dark text-white border-secondary mb-2"
                                            placeholder="Discussion title (optional)"
                                            value={postForm.data.title}
                                            onChange={e => postForm.setData('title', e.target.value)}
                                        />
                                        <textarea
                                            className="form-control bg-dark text-white border-secondary mb-2"
                                            placeholder="What's on your mind?"
                                            rows={3}
                                            value={postForm.data.content}
                                            onChange={e => postForm.setData('content', e.target.value)}
                                            required
                                        ></textarea>
                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPostForm(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-primary" disabled={postForm.processing}>
                                                <i className="fas fa-paper-plane me-1"></i> Post
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Posts List */}
                            <div className="p-3">
                                {posts.length > 0 ? posts.map(post => (
                                    <div key={post.id} className="mb-4 p-3 rounded border border-secondary">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                {post.is_pinned && <span className="badge bg-warning me-2"><i className="fas fa-thumbtack"></i> Pinned</span>}
                                                <h5 className="text-white mb-1">{post.title || 'Discussion'}</h5>
                                                <small className="text-white-50">by {post.author.name} · {post.created_at}</small>
                                            </div>
                                            <div className="text-white-50 small">
                                                <i className="fas fa-eye me-1"></i>{post.view_count}
                                                <i className="fas fa-comment ms-3 me-1"></i>{post.replies_count}
                                            </div>
                                        </div>
                                        <p className="text-white-50">{post.content}</p>

                                        {/* Replies */}
                                        {post.replies.length > 0 && (
                                            <div className="ms-4 mt-3 border-start border-secondary ps-3">
                                                {post.replies.map(reply => (
                                                    <div key={reply.id} className="mb-2">
                                                        <small className="text-white">{reply.author}</small>
                                                        <small className="text-white-50 ms-2">{reply.created_at}</small>
                                                        <p className="text-white-50 mb-0 small">{reply.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Reply Form */}
                                        {tribe.is_member && (
                                            replyingTo === post.id ? (
                                                <form onSubmit={(e) => handleReply(e, post.id)} className="mt-3">
                                                    <div className="d-flex gap-2">
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm bg-dark text-white border-secondary"
                                                            placeholder="Write a reply..."
                                                            value={replyForm.data.content}
                                                            onChange={e => replyForm.setData('content', e.target.value)}
                                                            required
                                                        />
                                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setReplyingTo(null)}>Cancel</button>
                                                        <button type="submit" className="btn btn-sm btn-primary" disabled={replyForm.processing}>Reply</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button className="btn btn-link btn-sm text-white-50 p-0 mt-2" onClick={() => setReplyingTo(post.id)}>
                                                    <i className="fas fa-reply me-1"></i> Reply
                                                </button>
                                            )
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-5">
                                        <i className="fas fa-comments fa-3x text-white-50 mb-3"></i>
                                        <h5 className="text-white">No discussions yet</h5>
                                        <p className="text-white-50">Be the first to start a conversation!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        {/* Members Card */}
                        <div className="content-card">
                            <div className="card-header">
                                <i className="fas fa-users"></i>
                                <h3>Members ({tribe.member_count})</h3>
                            </div>
                            <div className="p-3">
                                {members.map(member => (
                                    <div key={member.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="text-white">{member.name}</span>
                                            {member.role === 'admin' && (
                                                <span className="badge bg-danger">Admin</span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            {tribe.is_admin && tribe.creator.id !== member.id && (
                                                <button 
                                                    className="btn btn-link btn-sm p-0 text-white-50"
                                                    onClick={() => handleToggleRole(member.id)}
                                                    title={member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                >
                                                    <i className={`fas fa-user-${member.role === 'admin' ? 'minus' : 'shield'}`}></i>
                                                </button>
                                            )}
                                            <small className="text-white-50">{member.joined_at}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Tribe Modal — Tabbed Layout */}
            <DashboardModal
                open={showEditModal}
                onOpenChange={setShowEditModal}
                title={tribe.name}
                label="Tribe Settings"
                activeTab={editTab}
                onTabChange={setEditTab}
                tabs={modalTabs}
            >
                <form onSubmit={handleUpdateTribe} className="flex flex-col h-full">
                    <div className="modal-body">
                        {editTab === 'info' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Tribe Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={editForm.data.name}
                                        onChange={e => editForm.setData('name', e.target.value)}
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea 
                                        className="form-control" 
                                        value={editForm.data.description}
                                        onChange={e => editForm.setData('description', e.target.value)}
                                        rows="4"
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Privacy</label>
                                    <select 
                                        className="form-select"
                                        value={editForm.data.privacy}
                                        onChange={e => editForm.setData('privacy', e.target.value)}
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                        <option value="invite_only">Invite Only</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {editTab === 'media' && (
                            <>
                                {/* Current banner preview */}
                                {tribe.banner && bannerFiles.length === 0 && (
                                    <div className="mb-3">
                                        <label className="form-label">Current Cover</label>
                                        <div style={{ borderRadius: 10, overflow: 'hidden', maxHeight: 180 }}>
                                            <img 
                                                src={tribe.banner} 
                                                alt="Current banner" 
                                                style={{ width: '100%', height: 180, objectFit: 'cover' }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="form-label">Upload New Cover</label>
                                    <FilePondUploader
                                        files={bannerFiles}
                                        onUpdateFiles={setBannerFiles}
                                        acceptedFileTypes={['image/*']}
                                        labelIdle='Drag & Drop cover image or <span class="filepond--label-action">Browse</span>'
                                        maxFiles={1}
                                    />
                                    <p className="form-hint">Recommended: 1200×400px, max 2MB.</p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                        <button type="submit" className="btn-submit-modal">Save Changes</button>
                    </div>
                </form>
            </DashboardModal>

            <ConfirmationDialog
                open={confirmLeave}
                onOpenChange={setConfirmLeave}
                title={`Leave ${tribe.name}?`}
                description="Are you sure you want to leave this tribe? You will lose access to member-only discussions."
                onConfirm={handleLeave}
                confirmText="Leave Tribe"
                variant="destructive"
            />
        </div>
    </FanLayout>
    );
}
