import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import '../../../css/fan/tribes.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import TfeModal from '@/Components/Common/TfeModal';
import ImageUpload from '@/Components/Common/ImageUpload';
import { PRIVACY } from './Tribes';

export default function TribeDetail({ auth, tribe, members, posts, joinRequests = [] }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [confirmDeleteTribe, setConfirmDeleteTribe] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [showPostForm, setShowPostForm] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

    const privacy = PRIVACY[tribe.privacy] || PRIVACY.public;

    const postForm = useForm({ title: '', content: '' });
    const replyForm = useForm({ content: '' });
    const editForm = useForm({
        name: tribe.name,
        description: tribe.description || '',
        privacy: tribe.privacy,
        banner: null,
        avatar: null,
    });

    const handleCreatePost = (e) => {
        e.preventDefault();
        postForm.post(route('fan.tribes.posts.store', tribe.id), {
            preserveScroll: true,
            onSuccess: () => {
                postForm.reset();
                setShowPostForm(false);
            },
        });
    };

    const handleReply = (e, postId) => {
        e.preventDefault();
        replyForm.post(route('fan.tribes.posts.reply', [tribe.id, postId]), {
            preserveScroll: true,
            onSuccess: () => {
                replyForm.reset();
                setReplyingTo(null);
            },
        });
    };

    const handleUpdateTribe = (e) => {
        e.preventDefault();
        // _method spoofing + forceFormData so the two image fields arrive as
        // real uploads on a PUT route.
        router.post(route('fan.tribes.update', tribe.id), {
            _method: 'put',
            name: editForm.data.name,
            description: editForm.data.description || '',
            privacy: editForm.data.privacy,
            ...(editForm.data.banner ? { banner: editForm.data.banner } : {}),
            ...(editForm.data.avatar ? { avatar: editForm.data.avatar } : {}),
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setShowEditModal(false),
        });
    };

    const act = (url, options = {}) => router.post(url, {}, { preserveScroll: true, ...options });
    const remove = (url, options = {}) => router.delete(url, { preserveScroll: true, ...options });

    const handleToggleRole = (userId) => act(route('fan.tribes.members.toggle-role', [tribe.id, userId]));
    const handleTogglePin = (postId) => act(route('fan.tribes.posts.pin', [tribe.id, postId]));
    const handleJoin = () => act(route('fan.tribes.join', tribe.id));
    const handleLeave = () => act(route('fan.tribes.leave', tribe.id), { onSuccess: () => setConfirmLeave(false) });
    const handleApprove = (id) => act(route('fan.tribes.requests.approve', [tribe.id, id]));
    const handleReject = (id) => act(route('fan.tribes.requests.reject', [tribe.id, id]));
    const handleDeleteReply = (replyId) => remove(route('fan.tribes.replies.destroy', [tribe.id, replyId]));

    const handleDeletePost = () => {
        if (!postToDelete) return;
        remove(route('fan.tribes.posts.destroy', [tribe.id, postToDelete]), {
            onSuccess: () => setPostToDelete(null),
        });
    };

    const handleRemoveMember = () => {
        if (!memberToRemove) return;
        remove(route('fan.tribes.members.remove', [tribe.id, memberToRemove.id]), {
            onSuccess: () => setMemberToRemove(null),
        });
    };

    const handleDeleteTribe = () => {
        remove(route('fan.tribes.destroy', tribe.id), { preserveScroll: false });
    };

    return (
        <FanLayout title={tribe.name}>
            <Head title={tribe.name} />

            <DashboardHero
                role="fan"
                title={tribe.name}
                subtitle={`${privacy.label} tribe • Created ${tribe.created_at}`}
                breadcrumbs={[
                    { label: 'Tribes', href: route('fan.tribes') },
                    { label: tribe.name },
                ]}
                bgImage={tribe.banner || '/assets/img/fan/backgrounds/gaming_hero.png'}
            >
                {tribe.is_member ? (
                    <>
                        {tribe.is_admin && (
                            <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled" onClick={() => setShowEditModal(true)}>
                                <i className="fas fa-cog" /> Manage
                            </button>
                        )}
                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setConfirmLeave(true)}>
                            <i className="fas fa-sign-out-alt" /> Leave
                        </button>
                    </>
                ) : (
                    tribe.privacy !== 'invite_only' && (
                        <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled" onClick={handleJoin}>
                            <i className="fas fa-sign-in-alt" />{' '}
                            {tribe.privacy === 'private' ? 'Request to Join' : 'Join Tribe'}
                        </button>
                    )
                )}
            </DashboardHero>

            <SummaryTiles
                className="mb-4"
                items={[
                    { label: 'Members', value: tribe.member_count, icon: 'fa-users', accent: 'red', subtext: 'Active Fans' },
                    { label: 'Discussions', value: tribe.posts_count, icon: 'fa-comments', accent: 'blue', subtext: 'Total Posts' },
                    { label: 'Views', value: tribe.view_count, icon: 'fa-eye', accent: 'rose', subtext: 'Engagement' },
                ]}
            />

            <div className="tribe-layout">
                <div className="tribe-main">
                    {/* ── About ───────────────────────────────────────── */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">About this tribe</h3>
                        </div>
                        <div className="tfe-slab__body">
                            <p className="tribe-about">
                                {tribe.description || 'No description provided yet.'}
                            </p>
                            <div className="tribe-about__meta">
                                <span className="tfe-pill tfe-pill--info">
                                    <i className={`fas ${privacy.icon}`} /> {privacy.label}
                                </span>
                                <span className="tribe-about__creator">
                                    Founded by {tribe.creator?.name || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* ── Discussions ─────────────────────────────────── */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">Discussions</h3>
                            {tribe.is_member && !showPostForm && (
                                <button
                                    type="button"
                                    className="tfe-btn tfe-btn--sm tfe-btn--filled"
                                    onClick={() => setShowPostForm(true)}
                                >
                                    <i className="fas fa-plus" /> New Discussion
                                </button>
                            )}
                        </div>

                        {showPostForm && (
                            <div className="tribe-post-form">
                                <form onSubmit={handleCreatePost}>
                                    <div className="tfe-form-field">
                                        <label className="tfe-form-label" htmlFor="tribe-post-title">
                                            Title <span className="tribe-optional">(optional)</span>
                                        </label>
                                        <input
                                            id="tribe-post-title"
                                            type="text"
                                            className="tfe-input"
                                            placeholder="What is this about?"
                                            value={postForm.data.title}
                                            onChange={(e) => postForm.setData('title', e.target.value)}
                                        />
                                    </div>
                                    <div className="tfe-form-field">
                                        <label className="tfe-form-label" htmlFor="tribe-post-content">Message</label>
                                        <textarea
                                            id="tribe-post-content"
                                            className="tfe-textarea"
                                            placeholder="Share it with the tribe…"
                                            rows={4}
                                            value={postForm.data.content}
                                            onChange={(e) => postForm.setData('content', e.target.value)}
                                            required
                                        />
                                        {postForm.errors.content && (
                                            <div className="tfe-form-error">{postForm.errors.content}</div>
                                        )}
                                    </div>
                                    <div className="tribe-post-form__foot">
                                        <button type="button" className="tfe-btn" onClick={() => setShowPostForm(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="tfe-btn tfe-btn--filled" disabled={postForm.processing}>
                                            <i className="fas fa-paper-plane" /> Post
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="tfe-slab__body tfe-slab__body--flush">
                            {posts.length > 0 ? (
                                <ul className="tribe-threads">
                                    {posts.map((post) => (
                                        <li key={post.id} className="tribe-thread">
                                            <div className="tribe-thread__head">
                                                <div className="tribe-thread__heading">
                                                    {post.is_pinned && (
                                                        <span className="tfe-pill tfe-pill--pending">
                                                            <i className="fas fa-thumbtack" /> Pinned
                                                        </span>
                                                    )}
                                                    <Link
                                                        href={route('fan.tribes.posts.show', [tribe.id, post.id])}
                                                        className="tribe-thread__title"
                                                    >
                                                        {post.title || 'Discussion'}
                                                    </Link>
                                                    <span className="tribe-thread__byline">
                                                        by {post.author.name} · {post.created_at}
                                                    </span>
                                                </div>
                                                <div className="tribe-thread__tools">
                                                    <span className="tribe-thread__counts">
                                                        <i className="fas fa-eye" /> {post.view_count}
                                                        <i className="fas fa-comment" /> {post.replies_count}
                                                    </span>
                                                    {tribe.is_admin && (
                                                        <button
                                                            type="button"
                                                            className={`tfe-btn tfe-btn--sm tfe-btn--icon${post.is_pinned ? ' is-active' : ''}`}
                                                            onClick={() => handleTogglePin(post.id)}
                                                            aria-label={post.is_pinned ? 'Unpin discussion' : 'Pin discussion'}
                                                            title={post.is_pinned ? 'Unpin' : 'Pin'}
                                                        >
                                                            <i className="fas fa-thumbtack" />
                                                        </button>
                                                    )}
                                                    {post.can_delete && (
                                                        <button
                                                            type="button"
                                                            className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                            onClick={() => setPostToDelete(post.id)}
                                                            aria-label="Delete discussion"
                                                            title="Delete"
                                                        >
                                                            <i className="fas fa-trash" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="tribe-thread__body">{post.content}</p>

                                            {post.replies.length > 0 && (
                                                <ul className="tribe-replies">
                                                    {post.replies.map((reply) => (
                                                        <li key={reply.id} className="tribe-reply">
                                                            <div className="tribe-reply__meta">
                                                                <strong>{reply.author}</strong>
                                                                <span>{reply.created_at}</span>
                                                                {reply.can_delete && (
                                                                    <button
                                                                        type="button"
                                                                        className="tribe-reply__remove"
                                                                        onClick={() => handleDeleteReply(reply.id)}
                                                                        aria-label="Delete reply"
                                                                        title="Delete reply"
                                                                    >
                                                                        <i className="fas fa-times" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="tribe-reply__body">{reply.content}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {post.replies_count > post.replies.length && (
                                                <Link
                                                    href={route('fan.tribes.posts.show', [tribe.id, post.id])}
                                                    className="tribe-thread__more"
                                                >
                                                    Read all {post.replies_count} replies
                                                </Link>
                                            )}

                                            {tribe.is_member && (
                                                replyingTo === post.id ? (
                                                    <form onSubmit={(e) => handleReply(e, post.id)} className="tribe-reply-form">
                                                        <textarea
                                                            className="tfe-textarea"
                                                            placeholder="Write a reply…"
                                                            rows={2}
                                                            value={replyForm.data.content}
                                                            onChange={(e) => replyForm.setData('content', e.target.value)}
                                                            required
                                                        />
                                                        <div className="tribe-reply-form__foot">
                                                            <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setReplyingTo(null)}>
                                                                Cancel
                                                            </button>
                                                            <button type="submit" className="tfe-btn tfe-btn--sm tfe-btn--filled" disabled={replyForm.processing}>
                                                                <i className="fas fa-reply" /> Reply
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="tfe-btn tfe-btn--sm tribe-thread__reply-cta"
                                                        onClick={() => {
                                                            replyForm.reset();
                                                            setReplyingTo(post.id);
                                                        }}
                                                    >
                                                        <i className="fas fa-reply" /> Reply
                                                    </button>
                                                )
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="tfe-empty">
                                    <div className="tfe-empty__icon"><i className="fas fa-comments" /></div>
                                    <h4 className="tfe-empty__title">No discussions yet</h4>
                                    <p className="tfe-empty__body">
                                        {tribe.is_member
                                            ? 'Start the first conversation in this tribe.'
                                            : 'Join the tribe to start a conversation.'}
                                    </p>
                                    {tribe.is_member && (
                                        <button type="button" className="tfe-btn tfe-empty__action" onClick={() => setShowPostForm(true)}>
                                            <i className="fas fa-plus" /> New Discussion
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <aside className="tribe-aside">
                    {/* ── Join requests (admins) ──────────────────────── */}
                    {tribe.is_admin && joinRequests.length > 0 && (
                        <section className="tfe-slab">
                            <div className="tfe-slab__header">
                                <h3 className="tfe-slab__title">Join requests</h3>
                                <span className="tfe-pill tfe-pill--pending">{joinRequests.length}</span>
                            </div>
                            <div className="tfe-slab__body tfe-slab__body--flush">
                                <ul className="tribe-requests">
                                    {joinRequests.map((req) => (
                                        <li key={req.id} className="tribe-request">
                                            <div className="tribe-request__who">
                                                <strong>{req.user.name}</strong>
                                                <span>{req.created_at}</span>
                                            </div>
                                            {req.message && <p className="tribe-request__msg">“{req.message}”</p>}
                                            <div className="tribe-request__actions">
                                                <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled" onClick={() => handleApprove(req.id)}>
                                                    <i className="fas fa-check" /> Approve
                                                </button>
                                                <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => handleReject(req.id)}>
                                                    Decline
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}

                    {/* ── Members ─────────────────────────────────────── */}
                    <section className="tfe-slab">
                        <div className="tfe-slab__header">
                            <h3 className="tfe-slab__title">Members</h3>
                            <span className="tfe-pill tfe-pill--info">{tribe.member_count}</span>
                        </div>
                        <div className="tfe-slab__body tfe-slab__body--flush">
                            <ul className="tribe-members">
                                {members.map((member) => (
                                    <li key={member.id} className="tribe-member">
                                        <div className="tribe-member__who">
                                            <span className="tribe-member__name">{member.name}</span>
                                            <span className="tribe-member__joined">Joined {member.joined_at}</span>
                                        </div>
                                        <div className="tribe-member__tools">
                                            {member.is_owner ? (
                                                <span className="tfe-pill tfe-pill--upcoming">Owner</span>
                                            ) : member.role === 'admin' ? (
                                                <span className="tfe-pill tfe-pill--approved">Admin</span>
                                            ) : null}

                                            {tribe.is_admin && !member.is_owner && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                        onClick={() => handleToggleRole(member.id)}
                                                        aria-label={member.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                                                        title={member.role === 'admin' ? 'Remove admin' : 'Make admin'}
                                                    >
                                                        <i className={`fas fa-user-${member.role === 'admin' ? 'minus' : 'shield'}`} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                        onClick={() => setMemberToRemove(member)}
                                                        aria-label={`Remove ${member.name}`}
                                                        title="Remove from tribe"
                                                    >
                                                        <i className="fas fa-user-xmark" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* ── Danger zone (owner) ─────────────────────────── */}
                    {tribe.is_owner && (
                        <section className="tfe-slab">
                            <div className="tfe-slab__header">
                                <h3 className="tfe-slab__title">Danger zone</h3>
                            </div>
                            <div className="tfe-slab__body">
                                <p className="tribe-danger__copy">
                                    Deleting the tribe removes every discussion, reply and membership. It cannot be undone.
                                </p>
                                <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setConfirmDeleteTribe(true)}>
                                    <i className="fas fa-trash" /> Delete Tribe
                                </button>
                            </div>
                        </section>
                    )}
                </aside>
            </div>

            {/* ── Manage modal ───────────────────────────────────────── */}
            <TfeModal open={showEditModal} title="Tribe settings" onClose={() => setShowEditModal(false)} size="lg">
                <form onSubmit={handleUpdateTribe}>
                    <h4 className="tfe-form-section">Details</h4>

                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="edit-tribe-name">Tribe name</label>
                        <input
                            id="edit-tribe-name"
                            type="text"
                            className="tfe-input"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                            required
                        />
                        {editForm.errors.name && <div className="tfe-form-error">{editForm.errors.name}</div>}
                    </div>

                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="edit-tribe-description">Description</label>
                        <textarea
                            id="edit-tribe-description"
                            className="tfe-textarea"
                            rows="4"
                            value={editForm.data.description}
                            onChange={(e) => editForm.setData('description', e.target.value)}
                        />
                    </div>

                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="edit-tribe-privacy">Privacy</label>
                        <select
                            id="edit-tribe-privacy"
                            className="tfe-select"
                            value={editForm.data.privacy}
                            onChange={(e) => editForm.setData('privacy', e.target.value)}
                        >
                            {Object.entries(PRIVACY).map(([value, meta]) => (
                                <option key={value} value={value}>{meta.label} — {meta.blurb}</option>
                            ))}
                        </select>
                    </div>

                    <h4 className="tfe-form-section">Imagery</h4>

                    <div className="tribe-image-fields">
                        <div className="tfe-form-field">
                            <label className="tfe-form-label">Cover image</label>
                            <ImageUpload
                                value={tribe.banner}
                                onFile={(file) => editForm.setData('banner', file)}
                                onClear={() => editForm.setData('banner', null)}
                                hint="1200×400 recommended — JPG, PNG or WebP, up to 4MB"
                            />
                            {editForm.errors.banner && <div className="tfe-form-error">{editForm.errors.banner}</div>}
                        </div>

                        <div className="tfe-form-field">
                            <label className="tfe-form-label">Tribe badge</label>
                            <ImageUpload
                                value={tribe.avatar}
                                onFile={(file) => editForm.setData('avatar', file)}
                                onClear={() => editForm.setData('avatar', null)}
                                hint="Square — JPG, PNG or WebP, up to 2MB"
                            />
                            {editForm.errors.avatar && <div className="tfe-form-error">{editForm.errors.avatar}</div>}
                        </div>
                    </div>

                    <div className="tribes-modal__foot">
                        <button type="button" className="tfe-btn" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="tfe-btn tfe-btn--filled" disabled={editForm.processing}>
                            Save Changes
                        </button>
                    </div>
                </form>
            </TfeModal>

            <ConfirmationDialog
                open={confirmLeave}
                onOpenChange={setConfirmLeave}
                title={`Leave ${tribe.name}?`}
                description="You will lose access to member-only discussions."
                onConfirm={handleLeave}
                confirmText="Leave Tribe"
                variant="destructive"
            />

            <ConfirmationDialog
                open={!!postToDelete}
                onOpenChange={(open) => !open && setPostToDelete(null)}
                title="Delete discussion?"
                description="The discussion and all of its replies will be removed. This cannot be undone."
                onConfirm={handleDeletePost}
                confirmText="Delete"
                variant="destructive"
            />

            <ConfirmationDialog
                open={!!memberToRemove}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
                title={memberToRemove ? `Remove ${memberToRemove.name}?` : 'Remove member?'}
                description="They will lose access to this tribe's discussions. They can rejoin if the tribe is public."
                onConfirm={handleRemoveMember}
                confirmText="Remove"
                variant="destructive"
            />

            <ConfirmationDialog
                open={confirmDeleteTribe}
                onOpenChange={setConfirmDeleteTribe}
                title={`Delete ${tribe.name}?`}
                description="Every discussion, reply and membership will be permanently deleted."
                onConfirm={handleDeleteTribe}
                confirmText="Delete Tribe"
                variant="destructive"
            />
        </FanLayout>
    );
}
