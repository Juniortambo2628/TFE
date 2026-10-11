import React from 'react';
import { Link } from '@inertiajs/react';
import { formatDateTime, formatNumber } from '@/lib/utils';
import assetPath from '@/lib/assets';
import '../../../css/landing-sections.css';

/** Shared public community cards (Sprint 70) — the landing preview and /tribes. */

const PRIVACY = {
    public: { label: 'Open to all', icon: 'fas fa-globe-africa' },
    private: { label: 'Join by request', icon: 'fas fa-lock' },
};

export function TribeCard({ tribe }) {
    const p = PRIVACY[tribe.privacy] || PRIVACY.public;
    return (
        <Link href={route('community.tribes.show', tribe.slug)} className="community-tribe">
            <div className="community-tribe__cover" style={tribe.banner ? { backgroundImage: `url(${assetPath(tribe.banner)})` } : undefined}>
                <span className="community-tribe__avatar">
                    {tribe.avatar ? <img src={assetPath(tribe.avatar)} alt="" /> : tribe.name.charAt(0)}
                </span>
            </div>
            <div className="community-tribe__body">
                <h3 className="community-tribe__name">{tribe.name}</h3>
                {tribe.excerpt && <p className="community-tribe__excerpt">{tribe.excerpt}</p>}
                <div className="community-tribe__meta">
                    <span><i className="fas fa-users" aria-hidden="true"></i> {formatNumber(tribe.member_count)} members</span>
                    <span><i className={p.icon} aria-hidden="true"></i> {p.label}</span>
                </div>
            </div>
        </Link>
    );
}

/** A public feed post. Opening it asks for sign-in (the thread is fan-only). */
export function PublicPostCard({ post }) {
    return (
        <article className="community-post">
            <header className="community-post__head">
                <span className="community-post__avatar">
                    {post.author?.avatar ? <img src={assetPath(post.author.avatar)} alt="" /> : (post.author?.name || '?').charAt(0)}
                </span>
                <div>
                    <div className="community-post__author">{post.author?.name || 'A fan'}</div>
                    <time className="community-post__time" dateTime={post.created_at}>{formatDateTime(post.created_at)}</time>
                </div>
            </header>
            <p className="community-post__text">{post.excerpt}</p>
            {post.image && <img className="community-post__image" src={assetPath(post.image)} alt="" loading="lazy" />}
            <footer className="community-post__foot">
                <span><i className="far fa-heart" aria-hidden="true"></i> {formatNumber(post.likes)}</span>
                <span><i className="far fa-comment" aria-hidden="true"></i> {formatNumber(post.comments)}</span>
                {/* A plain link into the auth-only thread: Laravel sends a
                    guest to sign in and back here afterwards (url.intended). */}
                <a href={route('fan.feed.post.show', post.id)} className="community-post__join">Join the conversation</a>
            </footer>
        </article>
    );
}
