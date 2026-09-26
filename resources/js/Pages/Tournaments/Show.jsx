import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import PageHero from '@/Components/Common/PageHero';
import AccentCard from '@/Components/Common/AccentCard';
import GlassPill from '@/Components/Common/GlassPill';
import CapacityBar from '@/Components/Common/CapacityBar';
import { TEAM_NAMES } from '@/Data/countryFlags';
import { formatMoney } from '@/lib/utils';
import assetPath from '@/lib/assets';
import '../../../css/tournament-page.css';

// Organiser eyebrow per tournament (matches the hero background brand).
const ORGANIZER = { wc_2026: 'FIFA', euro_2024: 'UEFA', afcon_2027: 'CAF' };

export default function TournamentShow({ tournament = {}, listings = [], upcoming }) {
    const { assetUrl } = usePage().props;
    const baseUrl = assetUrl || '';
    const t = tournament;
    const accent = t.color_accent || '#dc143c';
    const isPast = t.status === 'concluded';
    const organizer = ORGANIZER[t.id] || 'Official';
    const statusLabel = isPast ? 'Concluded' : (t.status === 'ongoing' ? 'Live now' : 'Upcoming');
    const teamCodes = t.team_flag_codes || [];

    const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
    const datesLabel = t.start_date ? `${fmtDate(t.start_date)} – ${fmtDate(t.end_date)}` : '';

    const heroCtas = isPast
        ? [upcoming
            ? { label: `Plan for ${upcoming.short_name}`, href: `/tournaments/${upcoming.slug}`, icon: 'fas fa-arrow-right', filled: true }
            : { label: 'Start planning your trip', href: '/register', icon: 'fas fa-arrow-right', filled: true }]
        : [
            { label: 'Sign up & attend', href: '/register', icon: 'fas fa-user-plus', filled: true },
            { label: 'Explore packages', href: '/services', icon: 'fas fa-suitcase-rolling' },
        ];

    const stats = [
        { label: 'Teams', value: t.num_teams || t.facts?.teams || '—', variant: 'red' },
        { label: 'Matches', value: t.matches_played || '—', variant: 'amber' },
        isPast
            ? { label: 'Goals', value: t.total_goals || '—', variant: 'teal' }
            : { label: 'Host nations', value: (t.hosts || []).length || '—', variant: 'teal' },
    ];

    const hero = (
        <PageHero
            accent={accent}
            background={t.organizer_card_bg}
            eyebrow={`${organizer} · ${statusLabel}`}
            title={t.name}
            tagline={t.tagline || (t.wikipedia_extract ? t.wikipedia_extract.substring(0, 150) : '')}
            media={t.trophy_image ? { src: t.trophy_image, alt: `${t.short_name || t.name} trophy` } : undefined}
            ctas={heroCtas}
        >
            <div className="tourpage-hero-meta">
                {datesLabel && <GlassPill size="sm"><i className="fas fa-calendar-alt" /> {datesLabel}</GlassPill>}
                {(t.hosts || []).map((h, i) => (
                    <GlassPill key={i} size="sm"><i className="fas fa-map-marker-alt" /> {h}</GlassPill>
                ))}
            </div>
        </PageHero>
    );

    return (
        <SectionPageShell title={t.name} heroSlot={hero}>
            <div className="tourpage" style={{ '--partner-accent': accent }}>
                <div className="container">
                    {/* Snapshot stat tiles */}
                    <div className="tfe-stat-grid tourpage-stats">
                        {stats.map((s, i) => (
                            <div key={i} className={`tfe-tile tfe-tile--${s.variant}`}>
                                <div className="tfe-tile__value">{s.value}</div>
                                <div className="tfe-tile__label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {isPast ? (
                        <>
                            <Highlights t={t} />
                            <TeamsGrid title="Participating teams" codes={teamCodes} baseUrl={baseUrl} wikiFlags={t.wikipedia_flags || {}} />
                            <div className="tourpage-cta-band">
                                <h3 className="tourpage-cta-band__title">The next tournament is already in motion.</h3>
                                <p className="tourpage-cta-band__sub">Lock in your plans early and travel with the fans who live for the game.</p>
                                <Link
                                    href={upcoming ? `/tournaments/${upcoming.slug}` : '/register'}
                                    className="tfe-btn tfe-btn--filled tfe-btn--lg"
                                >
                                    {upcoming ? `Plan for ${upcoming.short_name}` : 'Start planning'}
                                    <i className="fas fa-arrow-right" />
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <Offerings listings={listings} accent={accent} baseUrl={baseUrl} />
                            <TeamsGrid title="Teams to watch" codes={teamCodes} baseUrl={baseUrl} wikiFlags={t.wikipedia_flags || {}} />
                        </>
                    )}
                </div>
            </div>
        </SectionPageShell>
    );
}

// ── Past-tournament highlights: champion, runner-up, top scorer, POTT ──
function Highlights({ t }) {
    const cards = [
        t.winner && { icon: 'fas fa-trophy', label: 'Champions', value: t.winner, tone: 'gold' },
        t.runner_up && { icon: 'fas fa-medal', label: 'Runners-up', value: t.runner_up, tone: 'silver' },
        t.top_scorer && t.top_scorer.name && {
            icon: 'fas fa-futbol', label: 'Top scorer',
            value: t.top_scorer.name + (t.top_scorer.goals ? ` · ${t.top_scorer.goals} goals` : ''),
        },
        t.player_of_tournament && { icon: 'fas fa-star', label: 'Player of the tournament', value: t.player_of_tournament },
    ].filter(Boolean);

    if (cards.length === 0) return null;

    return (
        <section className="tourpage-block">
            <h2 className="tourpage-block__title">Tournament highlights</h2>
            <div className="tourpage-highlights">
                {cards.map((c, i) => (
                    <div key={i} className={'tourpage-highlight' + (c.tone ? ` tourpage-highlight--${c.tone}` : '')}>
                        <span className="tourpage-highlight__icon"><i className={c.icon} /></span>
                        <div>
                            <div className="tourpage-highlight__label">{c.label}</div>
                            <div className="tourpage-highlight__value">{c.value}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ── Participating / qualified teams (flags) ──
function TeamsGrid({ title, codes = [], baseUrl, wikiFlags }) {
    if (!codes.length) return null;
    return (
        <section className="tourpage-block">
            <h2 className="tourpage-block__title">{title} <span className="tourpage-block__count">{codes.length}</span></h2>
            <div className="tourpage-teams">
                {codes.map((code) => {
                    const name = TEAM_NAMES[code] || code.toUpperCase();
                    return (
                        <span key={code} className="tourpage-team" title={name}>
                            <img
                                src={assetPath(`${baseUrl}assets/Flags/${code}.png`)}
                                alt={name}
                                loading="lazy"
                                onError={(e) => { if (wikiFlags[code]) { e.currentTarget.src = wikiFlags[code]; } else { e.currentTarget.style.visibility = 'hidden'; } }}
                            />
                            <span className="tourpage-team__name">{name}</span>
                        </span>
                    );
                })}
            </div>
        </section>
    );
}

// ── Upcoming-tournament offerings (partner listings, or curated fallbacks) ──
function Offerings({ listings = [], accent, baseUrl }) {
    const fallback = [
        { icon: 'fas fa-wallet', title: 'Plan a budget', desc: 'Build a full trip budget — tickets, flights, stays — in your currency.', href: '/register', cta: 'Start planning' },
        { icon: 'fas fa-hand-holding-usd', title: 'Finance your trip', desc: 'Spread the cost over 12–24 months with a finance partner.', href: '/features', cta: 'See financing' },
        { icon: 'fas fa-handshake', title: 'Browse partners', desc: 'Verified travel agents and providers packaging experiences you can book.', href: '/partners', cta: 'View partners' },
    ];

    return (
        <section className="tourpage-block">
            <h2 className="tourpage-block__title">Plan your trip</h2>
            <p className="tourpage-block__sub">Everything you need to get to the tournament — sign up to lock it in.</p>
            <div className="row g-4">
                {listings.length > 0
                    ? listings.map((l) => (
                        <div key={l.id} className="col-md-6 col-lg-4">
                            <AccentCard
                                LinkComponent={Link}
                                href="/register"
                                accent={l.publisher?.theme_accent || accent}
                                artwork={l.hero_image ? { src: l.hero_image, alt: l.name, variant: 'thumb' } : undefined}
                                eyebrow={l.publisher ? `By ${l.publisher.display_name}` : undefined}
                                title={l.name}
                                desc={l.description}
                                meta={[{ label: 'From', value: formatMoney(l.base_price, l.currency) }]}
                                cta={{ label: l.is_sold_out ? 'Sold out' : 'Sign up to book', icon: l.is_sold_out ? null : 'fas fa-arrow-right' }}
                            >
                                <CapacityBar sold={l.sold_count} capacity={l.capacity} pct={l.availability_pct} />
                            </AccentCard>
                        </div>
                    ))
                    : fallback.map((f, i) => (
                        <div key={i} className="col-md-6 col-lg-4">
                            <AccentCard
                                LinkComponent={Link}
                                href={f.href}
                                accent={accent}
                                artwork={{ icon: `fas ${f.icon.replace('fas ', '')}` }}
                                title={f.title}
                                desc={f.desc}
                                cta={{ label: f.cta, icon: 'fas fa-arrow-right' }}
                                className="tfe-acard--content"
                            />
                        </div>
                    ))}
            </div>
        </section>
    );
}
