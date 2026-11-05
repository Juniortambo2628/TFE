import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import LandingAction from '@/Components/Landing/V2/LandingAction';
import AccentCard from '@/Components/Common/AccentCard';
import CapacityBar from '@/Components/Common/CapacityBar';
import GlassPill from '@/Components/Common/GlassPill';
import { V2Section, closingProps, fill } from '@/Components/Landing/V2/V2Blocks';
import { Highlights, TeamsGrid } from '@/Pages/Tournaments/Show';
import { formatDateRange } from '@/lib/schedule';
import { formatMoney } from '@/lib/utils';
import '../../../../css/tournament-page.css';

const ORGANIZER = { wc_2026: 'FIFA', euro_2024: 'UEFA', afcon_2027: 'CAF' };

/**
 * /v2/tournaments/{slug}: the same tournament payload as the v1 page. An
 * upcoming tournament leads to its trips; a concluded one is a recap with a
 * way on to the next. Copy: `pages.tournament`.
 */
export default function TournamentShow({ tournament: t = {}, listings = [], upcoming }) {
    const { v2Pages, assetUrl } = usePage().props;
    const copy = v2Pages.tournament;
    const name = t.short_name || t.name;
    const accent = t.color_accent || '#dc143c';
    const isPast = t.status === 'concluded';
    const status = isPast ? 'Concluded' : (t.status === 'ongoing' ? 'Live now' : 'Upcoming');
    const dates = t.start_date ? formatDateRange(t.start_date, t.end_date) : null;

    const facts = [
        { label: 'Teams', value: t.num_teams || t.facts?.teams },
        { label: 'Matches', value: t.matches_played },
        isPast ? { label: 'Goals', value: t.total_goals } : { label: 'Host nations', value: (t.hosts || []).length },
    ].filter((f) => f.value);

    const hasHighlights = isPast && (t.winner || t.runner_up || t.top_scorer?.name || t.player_of_tournament);
    const present = { glance: facts.length > 0, highlights: !!hasHighlights, offers: !isPast, teams: (t.team_flag_codes || []).length > 0 };
    const closingCopy = isPast ? copy.closing_past : { ...copy.closing, title: fill(copy.closing.title, name) };

    return (
        <V2PageShell
            title={t.name}
            hero={(
                <V2PageHero
                    crumbs={[{ label: t.name }]}
                    accent={accent}
                    eyebrow={`${ORGANIZER[t.id] || 'Official'} · ${status}`}
                    title={t.name}
                    tagline={t.tagline || (t.wikipedia_extract ? `${t.wikipedia_extract.substring(0, 150)}…` : '')}
                    background={t.organizer_card_bg}
                    media={t.trophy_image ? { src: t.trophy_image, alt: `${name} trophy` } : undefined}
                    actions={isPast
                        ? (upcoming && <LandingAction action={`link:/tournaments/${upcoming.slug}`} label={`Plan for ${upcoming.short_name}`} icon="fas fa-arrow-right" filled />)
                        : <LandingAction action="planner" label="Plan my trip" icon="fas fa-plane" filled tournamentId={t.id} />}
                >
                    <div className="v2-tags v2-tags--hero">
                        {dates && <GlassPill size="sm"><i className="fas fa-calendar-alt" /> {dates}</GlassPill>}
                        {(t.hosts || []).map((h) => <GlassPill key={h} size="sm"><i className="fas fa-map-marker-alt" /> {h}</GlassPill>)}
                    </div>
                </V2PageHero>
            )}
            sections={copy.sections.filter((s) => present[s.id])}
            closing={closingProps(closingCopy, {
                primary: isPast && upcoming ? { action: `link:/tournaments/${upcoming.slug}` } : { action: 'planner' },
                secondary: { action: 'link:/partners' },
                tournamentId: isPast ? undefined : t.id,
            })}
        >
            <div className="tourpage" style={{ '--partner-accent': accent, '--v2-accent': accent }}>
                {present.glance && (
                    <section id="glance" className="v2-facts v2-anchor" aria-label={copy.glance_eyebrow}>
                        <div className="container">
                            <dl className={`v2-facts__grid v2-facts__grid--${facts.length}`}>
                                {facts.map((f) => (
                                    <div key={f.label} className="v2-facts__item"><dt>{f.label}</dt><dd>{f.value}</dd></div>
                                ))}
                            </dl>
                        </div>
                    </section>
                )}

                {present.highlights && (
                    <div id="highlights" className="v2-anchor container"><Highlights t={t} /></div>
                )}

                {present.offers && (
                    <V2Section id="offers" eyebrow={copy.offers_eyebrow} title={fill(copy.offers_title, name)} text={copy.offers_text}>
                        {listings.length === 0 ? (
                            <div className="tfe-empty">
                                <div className="tfe-empty__icon"><i className="fas fa-suitcase-rolling" aria-hidden="true"></i></div>
                                <div className="tfe-empty__title">No packages yet — price your own trip instead.</div>
                                <div className="tfe-empty__action"><LandingAction action="planner" label="Plan my trip" filled tournamentId={t.id} /></div>
                            </div>
                        ) : (
                            <div className="v2-cardgrid v2-cardgrid--3">
                                {listings.map((l) => (
                                    <AccentCard
                                        key={l.id}
                                        LinkComponent={Link}
                                        href={route('v2.listings.show', l.id)}
                                        accent={l.publisher?.theme_accent || accent}
                                        artwork={l.hero_image ? { src: l.hero_image, alt: l.name, variant: 'thumb' } : undefined}
                                        eyebrow={l.publisher ? `By ${l.publisher.display_name}` : undefined}
                                        title={l.name}
                                        desc={l.description}
                                        meta={[{ label: 'From', value: formatMoney(l.base_price, l.currency) }]}
                                        cta={{ label: l.is_sold_out ? 'Sold out' : 'View details', icon: l.is_sold_out ? null : 'fas fa-arrow-right' }}
                                    >
                                        <CapacityBar sold={l.sold_count} capacity={l.capacity} pct={l.availability_pct} />
                                    </AccentCard>
                                ))}
                            </div>
                        )}
                    </V2Section>
                )}

                {present.teams && (
                    <div id="teams" className="v2-anchor container v2-teams">
                        <TeamsGrid title={isPast ? 'Participating teams' : 'Teams to watch'} codes={t.team_flag_codes} baseUrl={assetUrl || ''} wikiFlags={t.wikipedia_flags || {}} />
                    </div>
                )}
            </div>
        </V2PageShell>
    );
}
