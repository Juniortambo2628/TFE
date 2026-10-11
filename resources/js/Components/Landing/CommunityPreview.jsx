import React from 'react';
import { Link, usePoll } from '@inertiajs/react';
import { SkeletonCards } from '@/Components/Common/Skeleton';
import { PublicPostCard, TribeCard } from '@/Components/Landing/CommunityCards';

/**
 * "What fans are saying" on the landing page (Sprint 70): recent public
 * posts beside the busiest tribes. Live without WebSockets (shared cPanel
 * hosting cannot run Reverb): it re-requests just this deferred prop once a
 * minute while the tab is visible — Inertia pauses polling in background tabs.
 */
export default function CommunityPreview({ preview }) {
    usePoll(60_000, { only: ['communityPreview'] }, { keepAlive: false });

    if (preview && !preview.posts?.length && !preview.tribes?.length) return null;

    return (
        <section className="landing-community" aria-labelledby="community-title">
            <div className="container">
                <div className="landing-community__head">
                    <div>
                        <p className="landing-community__eyebrow"><span className="community-live-dot" aria-hidden="true"></span> Live from the community</p>
                        <h2 id="community-title" className="landing-community__title">What fans are saying</h2>
                        <p className="landing-community__sub">Public posts from fans planning the trip, and the tribes they travel with.</p>
                    </div>
                    <Link href={route('community.tribes')} className="tfe-btn">
                        <i className="fas fa-layer-group" aria-hidden="true"></i> Browse tribes
                    </Link>
                </div>

                {!preview ? (
                    <SkeletonCards count={3} />
                ) : (
                    <div className={`community-grid${preview.posts.length ? '' : ' community-grid--tribes-only'}`}>
                        {preview.posts.length > 0 && (
                            <div className="community-grid__posts">
                                {preview.posts.map((p) => <PublicPostCard key={p.id} post={p} />)}
                            </div>
                        )}
                        <aside className="community-grid__tribes" aria-label="Popular tribes">
                            {preview.tribes.map((t) => <TribeCard key={t.slug} tribe={t} />)}
                        </aside>
                    </div>
                )}
            </div>
        </section>
    );
}
