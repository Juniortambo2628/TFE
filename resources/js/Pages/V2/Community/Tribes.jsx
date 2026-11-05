import React from 'react';
import { usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import { V2Section, closingProps } from '@/Components/Landing/V2/V2Blocks';
import { PublicPostCard, TribeCard } from '@/Components/Landing/CommunityCards';

/** /v2/tribes: the same public directory as /tribes. Joining asks for an account. */
export default function Tribes({ hero, tribes = [], posts = [] }) {
    const { v2Pages, tournament } = usePage().props;
    const sections = [{ id: 'tribes', label: 'Tribes' }, ...(posts.length ? [{ id: 'posts', label: 'Latest from fans' }] : [])];

    return (
        <V2PageShell
            title="Tribes"
            hero={<V2PageHero crumbs={[{ label: 'Tribes' }]} eyebrow={hero.eyebrow} title={hero.title} tagline={hero.tagline} background={hero.background} />}
            sections={sections}
            closing={closingProps(v2Pages.tribes.closing, { primary: { action: 'route:register' }, secondary: { action: 'planner' }, tournamentId: tournament?.id })}
        >
            <V2Section id="tribes" eyebrow="Tribes" title={`${tribes.length} ${tribes.length === 1 ? 'tribe' : 'tribes'} to join`}>
                {tribes.length === 0 ? (
                    <div className="tfe-empty">
                        <div className="tfe-empty__icon"><i className="fas fa-layer-group" aria-hidden="true"></i></div>
                        <div className="tfe-empty__title">No tribes yet</div>
                        <div className="tfe-empty__body">Sign up and start the first one for this tournament.</div>
                    </div>
                ) : (
                    <div className="community-tribe-grid landing-community">{tribes.map((t) => <TribeCard key={t.slug} tribe={t} />)}</div>
                )}
            </V2Section>

            {posts.length > 0 && (
                <V2Section id="posts" eyebrow="Community" title="Latest from fans" tinted>
                    <div className="community-grid__posts community-grid__posts--wide landing-community">
                        {posts.map((p) => <PublicPostCard key={p.id} post={p} />)}
                    </div>
                </V2Section>
            )}
        </V2PageShell>
    );
}
