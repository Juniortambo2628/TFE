import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import AccentCard from '@/Components/Common/AccentCard';
import CapacityBar from '@/Components/Common/CapacityBar';
import GlassPill from '@/Components/Common/GlassPill';
import { V2IconCards, V2Section, V2Steps, closingProps, fill } from '@/Components/Landing/V2/V2Blocks';
import { PartnerHubTicket, partnerEyebrow, scheduleFacts } from '@/Components/Public/PartnerHubPieces';
import '../../css/partner-hub.css';
import '../../css/tickets.css';

/**
 * /v2/partners/{slug}: the partner's own hub in the v2 structure — who they
 * are (the panel under the hero), their numbers, what they do and how it
 * works (their archetype's pillars and steps, from the server, as on the v1
 * hub), then what they have on sale. The v1 hub's docked step bar becomes a
 * section here, like the /v2 journey. Copy: `pages.hub`.
 */
export default function PartnerHub({ profile, listings = [], tickets = [], steps = [], pillars = [] }) {
    const { v2Pages, tournament } = usePage().props;
    const copy = v2Pages.hub;
    const name = profile.display_name;
    const accent = profile.theme_accent || '#dc143c';
    const tags = profile.service_tags || [];

    const present = {
        about: !!(profile.about || tags.length),
        support: pillars.length > 0,
        steps: steps.length > 0,
        tickets: tickets.length > 0,
        listings: true,
    };

    return (
        <V2PageShell
            title={name}
            hero={(
                <V2PageHero
                    crumbs={[{ label: 'Partners', href: route('partners.index') }, { label: name }]}
                    accent={accent}
                    eyebrow={`Official ${partnerEyebrow(profile.partner_type_label)} Partner`}
                    title={name}
                    tagline={profile.tagline}
                    background={profile.hero_image || '/assets/img/backdrops/stadium-fans.jpg'}
                    media={profile.logo_url ? { src: profile.logo_url, alt: name } : undefined}
                    actions={(
                        <>
                            {profile.contact_email && (
                                <a href={`mailto:${profile.contact_email}`} className="tfe-btn tfe-btn--filled tfe-btn--lg">
                                    <i className="fas fa-envelope" aria-hidden="true"></i> {copy.contact}
                                </a>
                            )}
                            {profile.website_url && (
                                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="tfe-btn tfe-btn--lg">
                                    {copy.website} <i className="fas fa-external-link-alt" aria-hidden="true"></i>
                                </a>
                            )}
                        </>
                    )}
                >
                    {profile.verification_status === 'verified' && (
                        <GlassPill className="v2-pagehero__pill"><i className="fas fa-check-circle"></i> {copy.verified}</GlassPill>
                    )}
                </V2PageHero>
            )}
            sections={copy.sections.filter((s) => present[s.id])}
            closing={closingProps(
                { ...copy.closing, title: fill(copy.closing.title, name) },
                { primary: { action: 'planner' }, secondary: { action: 'link:/partners' }, tournamentId: tournament?.id },
            )}
        >
            <div style={{ '--v2-accent': accent }}>
                {present.about && (
                    <div id="about" className="v2-anchor container v2-panel-wrap">
                        <div className="v2-panel v2-panel--hub">
                            <div className="v2-panel__about">
                                <p className="v2-eyebrow">{profile.partner_type_label}</p>
                                <h2 className="v2-panel__title">About {name}</h2>
                                {/* Partner-authored: text, never HTML. */}
                                {profile.about && <p className="v2-panel__text">{profile.about}</p>}
                            </div>
                            {tags.length > 0 && (
                                <div className="v2-panel__about">
                                    <p className="v2-eyebrow">{copy.offer_title}</p>
                                    <div className="v2-tags">{tags.map((t) => <GlassPill key={t} size="sm">{t}</GlassPill>)}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {profile.stats?.length > 0 && (
                    <section className="v2-facts" aria-label={`${name} in numbers`}>
                        <div className="container">
                            <dl className={`v2-facts__grid v2-facts__grid--${Math.min(profile.stats.length, 4)}`}>
                                {profile.stats.map((s) => (
                                    <div key={s.label} className="v2-facts__item">
                                        <dt>{s.label}</dt>
                                        <dd>{s.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>
                )}

                {present.support && (
                    <V2Section id="support" eyebrow={copy.support_eyebrow} title={fill(copy.support_title, name)}>
                        <V2IconCards items={pillars.map((p) => ({ icon: `fas ${p.icon}`, title: p.title, text: p.body }))} />
                    </V2Section>
                )}

                {present.steps && (
                    <V2Section id="steps" eyebrow={copy.steps_eyebrow} title={copy.steps_title} tinted>
                        <V2Steps steps={steps.map((s) => ({ title: s.title || s.label, text: s.body || s.description }))} />
                    </V2Section>
                )}

                {present.tickets && (
                    <V2Section id="tickets" eyebrow={copy.tickets_eyebrow} title={copy.tickets_title}>
                        <div className="v2-cardgrid v2-cardgrid--3">
                            {tickets.map((t) => <PartnerHubTicket key={t.id} ticket={t} accent={accent} />)}
                        </div>
                    </V2Section>
                )}

                <V2Section id="listings" eyebrow={copy.listings_eyebrow} title={fill(copy.listings_title, name)}>
                    {listings.length === 0 ? (
                        <div className="tfe-empty">
                            <div className="tfe-empty__icon"><i className="fas fa-box-open" aria-hidden="true"></i></div>
                            <div className="tfe-empty__title">{copy.listings_empty}</div>
                        </div>
                    ) : (
                        <div className="v2-cardgrid">
                            {listings.map((l) => (
                                <AccentCard
                                    key={l.id}
                                    LinkComponent={Link}
                                    href={route('listings.show', l.id)}
                                    accent={accent}
                                    artwork={l.hero_image ? { src: l.hero_image, alt: l.name, variant: 'thumb' } : undefined}
                                    status={l.tournament_short || undefined}
                                    title={l.name}
                                    desc={l.description}
                                    meta={scheduleFacts(l)}
                                    cta={{ label: l.is_sold_out ? 'Sold out' : 'View details', icon: l.is_sold_out ? null : 'fas fa-arrow-right' }}
                                >
                                    <CapacityBar sold={l.sold_count} capacity={l.capacity} pct={l.availability_pct} />
                                </AccentCard>
                            ))}
                        </div>
                    )}
                </V2Section>
            </div>
        </V2PageShell>
    );
}
