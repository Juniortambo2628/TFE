import React from 'react';
import { usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import { V2Section, closingProps } from '@/Components/Landing/V2/V2Blocks';
import { formatNumber } from '@/lib/utils';

/**
 * /v2/tribes/{slug}: what a tribe is and how big — never its posts or
 * members, as on /tribes/{slug}. Joining signs the visitor up and lands them
 * on the tribe's fan page, where its privacy rules decide.
 */
export default function TribeShow({ tribe }) {
    const { v2Pages, tournament } = usePage().props;
    const isPrivate = tribe.privacy === 'private';
    const joinHref = route('community.tribes.join', tribe.slug);

    return (
        <V2PageShell
            title={tribe.name}
            hero={(
                <V2PageHero
                    crumbs={[{ label: 'Tribes', href: route('v2.community.tribes') }, { label: tribe.name }]}
                    eyebrow={isPrivate ? 'Tribe · join by request' : 'Tribe · open to all'}
                    title={tribe.name}
                    tagline={tribe.excerpt}
                    background={tribe.banner || '/assets/img/backdrops/argentina-fans.jpg'}
                    actions={<a href={joinHref} className="tfe-btn tfe-btn--filled tfe-btn--lg"><i className="fas fa-user-plus" aria-hidden="true"></i> {isPrivate ? 'Sign up to request to join' : 'Sign up to join'}</a>}
                />
            )}
            closing={closingProps(v2Pages.tribes.closing, { primary: { action: 'route:register' }, secondary: { action: 'planner' }, tournamentId: tournament?.id })}
        >
            <section className="v2-facts" aria-label={`${tribe.name} in numbers`}>
                <div className="container">
                    <dl className="v2-facts__grid v2-facts__grid--2">
                        <div className="v2-facts__item"><dt>members</dt><dd>{formatNumber(tribe.member_count)}</dd></div>
                        <div className="v2-facts__item"><dt>discussions</dt><dd>{formatNumber(tribe.posts_count)}</dd></div>
                    </dl>
                </div>
            </section>

            <V2Section id="about" eyebrow="About this tribe" title={tribe.name}>
                {/* Fan-authored: rendered as text, never HTML. */}
                {tribe.description && <p className="v2-head__text v2-prose">{tribe.description}</p>}
                <div className="v2-locked">
                    <i className="fas fa-lock" aria-hidden="true"></i>
                    <div>
                        <strong>Posts and members are for members.</strong>
                        <p>{isPrivate ? 'Create a free account and ask to join — a tribe admin approves requests.' : 'Create a free account and you are in straight away.'}</p>
                    </div>
                    <a href={joinHref} className="tfe-btn tfe-btn--filled">{isPrivate ? 'Request to join' : 'Join tribe'}</a>
                </div>
            </V2Section>
        </V2PageShell>
    );
}
