import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { TournamentProvider } from '@/Context/TournamentContext';
import '../../css/partners-index.css';

/**
 * PartnersIndex — public /partners directory.
 *
 * Search bar (name/tagline/about), partner_type chip filter, and
 * tournament chip filter. Each row is a tiled card that links to the
 * partner's branded hub. This closes the discovery loop so partners
 * publishing under Sprint 10 actually get seen by fans.
 */
export default function PartnersIndex({ profiles = [], partner_types = {}, tournaments = [], filters = {} }) {
    const { assetUrl } = usePage().props;
    const [q, setQ] = useState(filters.q || '');
    const [type, setType] = useState(filters.type || '');
    const [tournamentId, setTournamentId] = useState(filters.tournament_id || '');

    // Debounced search — 350ms after the fan stops typing.
    useEffect(() => {
        const t = setTimeout(() => {
            const params = {};
            if (q) params.q = q;
            if (type) params.type = type;
            if (tournamentId) params.tournament_id = tournamentId;
            router.get(route('partners.index'), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, type, tournamentId]);

    const clearFilters = () => {
        setQ('');
        setType('');
        setTournamentId('');
    };

    const heroBg = `${assetUrl}assets/img/backdrops/stadium-fans.jpg`;

    return (
        <TournamentProvider>
            <Head title="Partners" />
            <Header />

            <div className="partners-index-page">
                <section
                    className="partners-index-hero"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.9) 100%), url(${heroBg})` }}
                >
                    <div className="container">
                        <div className="partners-index-hero__eyebrow">The Football Experience</div>
                        <h1 className="partners-index-hero__title">Every partner behind your trip</h1>
                        <p className="partners-index-hero__subtitle">
                            Verified travel agents, hospitality providers, finance partners, clubs and federations
                            packaging experiences fans can actually book.
                        </p>

                        <div className="partners-index-search">
                            <i className="fas fa-search partners-index-search__icon"></i>
                            <input
                                type="text"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search partners by name, service or destination…"
                                className="partners-index-search__input"
                            />
                            {(q || type || tournamentId) && (
                                <button className="partners-index-search__clear" onClick={clearFilters}>
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <section className="partners-index-filters">
                    <div className="container">
                        <div className="partners-index-filter-group">
                            <span className="partners-index-filter-label">Partner type</span>
                            <div className="partners-index-chip-row">
                                <button
                                    className={`partners-index-chip${type === '' ? ' is-active' : ''}`}
                                    onClick={() => setType('')}
                                >
                                    All
                                </button>
                                {Object.entries(partner_types).map(([key, label]) => (
                                    <button
                                        key={key}
                                        className={`partners-index-chip${type === key ? ' is-active' : ''}`}
                                        onClick={() => setType(type === key ? '' : key)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="partners-index-filter-group">
                            <span className="partners-index-filter-label">Tournament</span>
                            <div className="partners-index-chip-row">
                                <button
                                    className={`partners-index-chip${tournamentId === '' ? ' is-active' : ''}`}
                                    onClick={() => setTournamentId('')}
                                >
                                    All
                                </button>
                                {tournaments.map((t) => (
                                    <button
                                        key={t.id}
                                        className={`partners-index-chip${tournamentId === t.id ? ' is-active' : ''}`}
                                        onClick={() => setTournamentId(tournamentId === t.id ? '' : t.id)}
                                    >
                                        {t.short_name || t.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="partners-index-results">
                    <div className="container">
                        <div className="partners-index-count">
                            {profiles.length} {profiles.length === 1 ? 'partner' : 'partners'}
                        </div>

                        {profiles.length === 0 ? (
                            <div className="partners-index-empty">
                                <i className="fas fa-search"></i>
                                <h3>No partners match those filters</h3>
                                <p>Try widening the type or clearing the tournament filter.</p>
                            </div>
                        ) : (
                            <div className="partners-index-grid">
                                {profiles.map((p) => (
                                    <PartnerCard key={p.slug} profile={p} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <Footer />
            </div>
        </TournamentProvider>
    );
}

function PartnerCard({ profile }) {
    const accent = profile.theme_accent || '#dc143c';
    return (
        <Link
            href={route('partners.hub', profile.slug)}
            className="partner-card"
            style={{ '--partner-accent': accent }}
        >
            <div
                className="partner-card__hero"
                style={{ backgroundImage: profile.hero_image ? `url(${profile.hero_image})` : undefined }}
            >
                {profile.logo_url && (
                    <img src={profile.logo_url} alt={profile.display_name} className="partner-card__logo" />
                )}
                {profile.verification_status === 'verified' && (
                    <span className="partner-card__verified">
                        <i className="fas fa-check-circle"></i>
                        Verified
                    </span>
                )}
            </div>
            <div className="partner-card__body">
                <div className="partner-card__type">{profile.partner_type_label}</div>
                <h3 className="partner-card__name">{profile.display_name}</h3>
                {profile.tagline && <p className="partner-card__tagline">{profile.tagline}</p>}
                {profile.service_tags.length > 0 && (
                    <div className="partner-card__tags">
                        {profile.service_tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="partner-card__tag">{tag}</span>
                        ))}
                        {profile.service_tags.length > 3 && (
                            <span className="partner-card__tag partner-card__tag--more">
                                +{profile.service_tags.length - 3}
                            </span>
                        )}
                    </div>
                )}
                <div className="partner-card__footer">
                    <span className="partner-card__listings">
                        {profile.listings_count} {profile.listings_count === 1 ? 'listing' : 'listings'}
                    </span>
                    <span className="partner-card__cta">
                        Visit hub <i className="fas fa-arrow-right"></i>
                    </span>
                </div>
            </div>
        </Link>
    );
}
