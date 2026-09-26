import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import '../../../css/fan/tribes.css';
import DashboardHero from '@/Components/Common/DashboardHero';

/**
 * A single tribe discussion with its whole reply thread.
 *
 * The tribe page only ever rendered the first three replies with no route to
 * the rest, so a busy thread was unreadable. This page is also where a post's
 * view_count is incremented (once per reader per session) — that used to happen
 * when someone *replied*, which measured nothing.
 */
export default function TribePost({ tribe, post }) {
    const replyForm = useForm({ content: '' });

    const submitReply = (e) => {
        e.preventDefault();
        replyForm.post(route('fan.tribes.posts.reply', [tribe.id, post.id]), {
            preserveScroll: true,
            onSuccess: () => replyForm.reset(),
        });
    };

    const deleteReply = (replyId) => {
        router.delete(route('fan.tribes.replies.destroy', [tribe.id, replyId]), { preserveScroll: true });
    };

    const title = post.title || 'Discussion';

    return (
        <FanLayout title={title}>
            <Head title={`${title} · ${tribe.name}`} />

            <DashboardHero
                role="fan"
                title={title}
                subtitle={`in ${tribe.name} · started by ${post.author.name} ${post.created_at}`}
                breadcrumbs={[
                    { label: 'Tribes', href: route('fan.tribes') },
                    { label: tribe.name, href: route('fan.tribes.show', tribe.id) },
                    { label: title },
                ]}
                bgImage={tribe.banner || '/assets/img/fan/backgrounds/gaming_hero.png'}
            >
                <Link href={route('fan.tribes.show', tribe.id)} className="tfe-btn tfe-btn--sm">
                    <i className="fas fa-arrow-left" /> Back to Tribe
                </Link>
            </DashboardHero>

            <div className="tribe-thread-page">
                <section className="tfe-slab">
                    <div className="tfe-slab__header">
                        <div>
                            <h3 className="tfe-slab__title">{title}</h3>
                            <div className="tfe-slab__title-sub">
                                by {post.author.name} · {post.created_at}
                            </div>
                        </div>
                        <div className="tribe-thread__tools">
                            {post.is_pinned && (
                                <span className="tfe-pill tfe-pill--pending">
                                    <i className="fas fa-thumbtack" /> Pinned
                                </span>
                            )}
                            <span className="tribe-thread__counts">
                                <i className="fas fa-eye" /> {post.view_count}
                                <i className="fas fa-comment" /> {post.replies_count}
                            </span>
                        </div>
                    </div>
                    <div className="tfe-slab__body">
                        <p className="tribe-thread__body">{post.content}</p>
                    </div>
                </section>

                <section className="tfe-slab">
                    <div className="tfe-slab__header">
                        <h3 className="tfe-slab__title">
                            {post.replies_count === 1 ? '1 reply' : `${post.replies_count} replies`}
                        </h3>
                    </div>

                    <div className="tfe-slab__body tfe-slab__body--flush">
                        {post.replies.length > 0 ? (
                            <ul className="tribe-replies tribe-replies--page">
                                {post.replies.map((reply) => (
                                    <li key={reply.id} className="tribe-reply">
                                        <div className="tribe-reply__meta">
                                            <strong>{reply.author}</strong>
                                            <span>{reply.created_at}</span>
                                            {reply.can_delete && (
                                                <button
                                                    type="button"
                                                    className="tribe-reply__remove"
                                                    onClick={() => deleteReply(reply.id)}
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
                        ) : (
                            <div className="tfe-empty tfe-empty--inline">
                                <div className="tfe-empty__icon"><i className="fas fa-reply" /></div>
                                <p className="tfe-empty__body">No replies yet — be the first.</p>
                            </div>
                        )}
                    </div>

                    {tribe.is_member ? (
                        <div className="tribe-post-form">
                            <form onSubmit={submitReply}>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="tribe-thread-reply">Your reply</label>
                                    <textarea
                                        id="tribe-thread-reply"
                                        className="tfe-textarea"
                                        rows={3}
                                        placeholder="Add to the conversation…"
                                        value={replyForm.data.content}
                                        onChange={(e) => replyForm.setData('content', e.target.value)}
                                        required
                                    />
                                    {replyForm.errors.content && (
                                        <div className="tfe-form-error">{replyForm.errors.content}</div>
                                    )}
                                </div>
                                <div className="tribe-post-form__foot">
                                    <button type="submit" className="tfe-btn tfe-btn--filled" disabled={replyForm.processing}>
                                        <i className="fas fa-reply" /> Post Reply
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="tribe-post-form">
                            <p className="tribe-danger__copy">Join this tribe to take part in the discussion.</p>
                        </div>
                    )}
                </section>
            </div>
        </FanLayout>
    );
}
