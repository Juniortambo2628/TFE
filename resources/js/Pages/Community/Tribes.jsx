import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import { PublicPostCard, TribeCard } from '@/Components/Landing/CommunityCards';

/** Public tribe directory (Sprint 70). Joining asks for an account. */
export default function Tribes({ hero, tribes = [], posts = [] }) {
    return (
        <SectionPageShell title="Tribes" hero={hero}>
            <section className="landing-community">
                <div className="container">
                    {tribes.length === 0 ? (
                        <div className="tfe-empty">
                            <div className="tfe-empty__icon"><i className="fas fa-layer-group" aria-hidden="true"></i></div>
                            <div className="tfe-empty__title">No tribes yet</div>
                            <div className="tfe-empty__body">Sign up and start the first one for this tournament.</div>
                        </div>
                    ) : (
                        <div className="community-tribe-grid">
                            {tribes.map((t) => <TribeCard key={t.slug} tribe={t} />)}
                        </div>
                    )}

                    {posts.length > 0 && (
                        <>
                            <h2 className="landing-community__title community-section-title">Latest from fans</h2>
                            <div className="community-grid__posts community-grid__posts--wide">
                                {posts.map((p) => <PublicPostCard key={p.id} post={p} />)}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </SectionPageShell>
    );
}
