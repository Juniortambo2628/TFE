import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import PageHero from '@/Components/Common/PageHero';
import { formatNumber } from '@/lib/utils';

/**
 * A tribe's public page (Sprint 70): what it is and how big, never its posts
 * or members. Joining signs the visitor up and lands them on the tribe's fan
 * page, where its privacy rules decide (join now / request / locked).
 */
export default function TribeShow({ tribe }) {
    const isPrivate = tribe.privacy === 'private';

    return (
        <SectionPageShell
            title={tribe.name}
            heroSlot={
                <PageHero
                    eyebrow={isPrivate ? 'Tribe · join by request' : 'Tribe · open to all'}
                    title={tribe.name}
                    tagline={tribe.excerpt}
                    background={tribe.banner || '/assets/img/backdrops/argentina-fans.jpg'}
                    ctas={[
                        { label: isPrivate ? 'Sign up to request to join' : 'Sign up to join', href: route('community.tribes.join', tribe.slug), icon: 'fas fa-user-plus' },
                        { label: 'All tribes', href: route('community.tribes') },
                    ]}
                />
            }
        >
            <section className="landing-community">
                <div className="container community-tribe-page">
                    <div className="community-tribe-page__facts">
                        <div><strong>{formatNumber(tribe.member_count)}</strong><span>members</span></div>
                        <div><strong>{formatNumber(tribe.posts_count)}</strong><span>discussions</span></div>
                    </div>

                    {tribe.description && (
                        <div className="tfe-slab">
                            <div className="tfe-slab__body">
                                <h2 className="community-section-title">About this tribe</h2>
                                {/* Fan-authored: rendered as text, never HTML. */}
                                <p className="community-tribe-page__about">{tribe.description}</p>
                            </div>
                        </div>
                    )}

                    <div className="tfe-slab community-tribe-page__locked">
                        <div className="tfe-slab__body">
                            <i className="fas fa-lock" aria-hidden="true"></i>
                            <div>
                                <strong>Posts and members are for members.</strong>
                                <p>
                                    {isPrivate
                                        ? 'Create a free account and ask to join — a tribe admin approves requests.'
                                        : 'Create a free account and you are in straight away.'}
                                </p>
                            </div>
                            <a href={route('community.tribes.join', tribe.slug)} className="tfe-btn tfe-btn--filled">
                                {isPrivate ? 'Request to join' : 'Join tribe'}
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </SectionPageShell>
    );
}
