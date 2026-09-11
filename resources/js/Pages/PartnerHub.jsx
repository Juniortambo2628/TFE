import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import CapacityBar from '@/Components/Common/CapacityBar';
import TournamentPill from '@/Components/Common/TournamentPill';
import { TournamentProvider } from '@/Context/TournamentContext';

/**
 * PartnerHub — public /partners/{slug} page.
 *
 * MVP shape (Sprint 9): partner-branded hero, tagline, about copy,
 * stats band, service tags, and a grid of the partner's published
 * listings. Themed by `profile.theme_accent`; falls back to the
 * platform crimson if the partner hasn't set one.
 *
 * Sprint 10 will add the "How we support the sports ecosystem"
 * segment strip and the "How it works" onboarding pipeline (see the
 * Ecobank Finance Hub deck slide).
 */
export default function PartnerHub({ profile, listings = [] }) {
    const { assetUrl } = usePage().props;
    const accent = profile?.theme_accent || '#dc143c';
    const heroBg = profile?.hero_image
        ? profile.hero_image
        : `${assetUrl}assets/img/backdrops/stadium-fans.jpg`;

    return (
        <TournamentProvider>
            <Head title={profile?.display_name || 'Partner'} />
            <Header />

            <div className="page-wrapper overflow-hidden bg-black text-white">
                {/* Branded hero */}
                <section
                    className="position-relative"
                    style={{
                        minHeight: 460,
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%), url(${heroBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'flex-end',
                    }}
                >
                    <div className="container py-5">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            {profile?.logo_url && (
                                <img
                                    src={profile.logo_url}
                                    alt={profile.display_name}
                                    style={{ height: 56, width: 56, objectFit: 'contain', background: '#fff', borderRadius: 12, padding: 6 }}
                                />
                            )}
                            <div>
                                <div className="text-white-50 small text-uppercase" style={{ letterSpacing: '2px' }}>
                                    Official {formatPartnerType(profile?.partner_type)} Partner
                                </div>
                                <h1 className="text-white fw-bold mb-0" style={{ fontSize: '2.5rem' }}>
                                    {profile?.display_name}
                                </h1>
                            </div>
                            {profile?.verification_status === 'verified' && (
                                <span
                                    className="ms-auto d-inline-flex align-items-center gap-1 px-3 py-1"
                                    style={{
                                        background: 'rgba(16,185,129,0.15)',
                                        color: '#10b981',
                                        borderRadius: 999,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    <i className="fas fa-check-circle"></i>
                                    Verified partner
                                </span>
                            )}
                        </div>

                        {profile?.tagline && (
                            <p className="text-white" style={{ fontSize: '1.35rem', maxWidth: 720, opacity: 0.92 }}>
                                {profile.tagline}
                            </p>
                        )}

                        <div className="d-flex flex-wrap gap-2 mt-3">
                            {profile?.contact_email && (
                                <a
                                    href={`mailto:${profile.contact_email}`}
                                    className="btn btn-lg"
                                    style={{ background: accent, color: '#fff', border: 'none', borderRadius: 999, padding: '10px 24px' }}
                                >
                                    Contact us
                                </a>
                            )}
                            {profile?.website_url && (
                                <a
                                    href={profile.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-lg btn-outline-light"
                                    style={{ borderRadius: 999, padding: '10px 24px' }}
                                >
                                    Visit website
                                    <i className="fas fa-external-link-alt ms-2" style={{ fontSize: '0.75rem' }}></i>
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* Stats band */}
                {profile?.stats && profile.stats.length > 0 && (
                    <section className="py-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="container">
                            <div className="row g-3 text-center">
                                {profile.stats.map((stat, idx) => (
                                    <div key={idx} className="col-6 col-md-3">
                                        <div className="fw-bold" style={{ fontSize: '2rem', color: accent }}>
                                            {stat.value}
                                        </div>
                                        <div className="text-white-50 small text-uppercase" style={{ letterSpacing: '1px' }}>
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* About + service tags */}
                {(profile?.about || (profile?.service_tags && profile.service_tags.length > 0)) && (
                    <section className="py-5">
                        <div className="container">
                            <div className="row g-5">
                                <div className="col-lg-7">
                                    <h2 className="text-white fw-bold mb-3">About {profile?.display_name}</h2>
                                    <p className="text-white-50" style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
                                        {profile?.about}
                                    </p>
                                </div>
                                {profile?.service_tags && profile.service_tags.length > 0 && (
                                    <div className="col-lg-5">
                                        <h3 className="text-white fw-bold mb-3" style={{ fontSize: '1.15rem' }}>
                                            What we offer
                                        </h3>
                                        <div className="d-flex flex-wrap gap-2">
                                            {profile.service_tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-2"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: `1px solid ${accent}`,
                                                        color: '#fff',
                                                        borderRadius: 999,
                                                        fontSize: '0.85rem',
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* How we support the sports ecosystem (deck p.8) */}
                <HowWeSupportStrip accent={accent} />

                {/* How it works — end-to-end pipeline (deck p.9) */}
                <HowItWorksPipeline accent={accent} />

                {/* Published listings */}
                <section className="py-5" style={{ background: 'rgba(20,20,20,0.4)' }}>
                    <div className="container">
                        <div className="d-flex align-items-baseline justify-content-between mb-4">
                            <h2 className="text-white fw-bold mb-0">
                                {listings.length > 0 ? 'Available now' : 'No listings yet'}
                            </h2>
                            <span className="text-white-50 small">
                                {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
                            </span>
                        </div>

                        {listings.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="fas fa-box-open" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.15)' }}></i>
                                <p className="text-white-50 mt-3 mb-0">
                                    This partner hasn't published any listings yet. Check back soon.
                                </p>
                            </div>
                        ) : (
                            <div className="row g-4">
                                {listings.map((l) => (
                                    <div key={l.id} className="col-md-6 col-lg-4">
                                        <Link
                                            href={route('fan.packages.show', l.id)}
                                            className="text-decoration-none d-block h-100"
                                            style={{
                                                background: 'rgba(20,20,20,0.6)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: 16,
                                                overflow: 'hidden',
                                                transition: 'transform 200ms, border-color 200ms',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-3px)';
                                                e.currentTarget.style.borderColor = accent;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                            }}
                                        >
                                            {l.hero_image && (
                                                <img src={l.hero_image} alt={l.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                                            )}
                                            <div className="p-4">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h4 className="text-white mb-1" style={{ fontSize: '1.05rem' }}>
                                                            {l.name}
                                                        </h4>
                                                        {l.tournament_short && (
                                                            <TournamentPill
                                                                tournamentId={l.tournament_id}
                                                                shortName={l.tournament_short}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="text-end">
                                                        <div className="text-white fw-bold">
                                                            {l.currency} {Number(l.base_price).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                {l.description && (
                                                    <p className="text-white-50 small mb-3" style={{ minHeight: 44 }}>
                                                        {l.description.length > 90 ? l.description.slice(0, 90) + '…' : l.description}
                                                    </p>
                                                )}
                                                <CapacityBar
                                                    sold={l.sold_count}
                                                    capacity={l.capacity}
                                                    pct={l.availability_pct}
                                                    className="mb-2"
                                                />
                                                <div className="d-flex align-items-center gap-2 mt-3" style={{ color: accent }}>
                                                    <span className="fw-semibold small">
                                                        {l.is_sold_out ? 'Sold out' : 'View details'}
                                                    </span>
                                                    {!l.is_sold_out && <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
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

function formatPartnerType(t) {
    if (!t) return '';
    return t.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * "How we support the sports ecosystem" — three pillars mapping to the
 * partner-side dashboard tabs (Publish / Convert / Measure). Style is
 * intentionally quiet so it doesn't compete with the partner's brand.
 */
function HowWeSupportStrip({ accent }) {
    const pillars = [
        {
            icon: 'fa-tags',
            title: 'Publish',
            body: 'Package experiences fans actually want — matches, stays, transfers — and put them in front of every buyer on the platform.',
        },
        {
            icon: 'fa-handshake',
            title: 'Convert',
            body: 'Fans submit briefs against your listings. You quote, they book. No cold pipeline to chase.',
        },
        {
            icon: 'fa-chart-line',
            title: 'Measure',
            body: 'Track sell-through, turnaround and revenue per listing. Iterate on what wins.',
        },
    ];

    return (
        <section className="py-5">
            <div className="container">
                <h2 className="text-white fw-bold mb-4">How we support the sports ecosystem</h2>
                <div className="row g-4">
                    {pillars.map((p, i) => (
                        <div key={i} className="col-md-4">
                            <div
                                className="h-100 p-4"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: 16,
                                }}
                            >
                                <div
                                    className="d-inline-flex align-items-center justify-content-center mb-3"
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 10,
                                        background: `${accent}22`,
                                        color: accent,
                                        fontSize: '1.1rem',
                                    }}
                                >
                                    <i className={`fas ${p.icon}`}></i>
                                </div>
                                <h3 className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>
                                    {p.title}
                                </h3>
                                <p className="text-white-50 small mb-0" style={{ lineHeight: 1.6 }}>
                                    {p.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * "How it works" — the fan-to-delivery pipeline as a four-step strip.
 * Each step is numbered and connected by a hair line so the whole flow
 * reads as one journey. Renders horizontally on md+ and stacks below.
 */
function HowItWorksPipeline({ accent }) {
    const steps = [
        { n: 1, title: 'Fan brief', body: 'Fan picks matches and preferences in the calculator.' },
        { n: 2, title: 'Partner quote', body: 'You review the brief and return a priced quote.' },
        { n: 3, title: 'Payment', body: 'Fan pays; funds land against the confirmed booking.' },
        { n: 4, title: 'Delivery', body: 'You deliver the trip; feedback rolls back to metrics.' },
    ];

    return (
        <section className="py-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="container">
                <h2 className="text-white fw-bold mb-4">How it works</h2>
                <div className="row g-3 g-md-0 align-items-stretch">
                    {steps.map((s, i) => (
                        <div key={s.n} className="col-md-3 position-relative">
                            <div className="d-flex align-items-start gap-3 pe-md-3">
                                <div
                                    className="flex-shrink-0 d-flex align-items-center justify-content-center fw-bold"
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        background: accent,
                                        color: '#fff',
                                        fontSize: '0.95rem',
                                    }}
                                >
                                    {s.n}
                                </div>
                                <div>
                                    <div className="text-white fw-bold">{s.title}</div>
                                    <div className="text-white-50 small" style={{ lineHeight: 1.5 }}>
                                        {s.body}
                                    </div>
                                </div>
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    className="d-none d-md-block position-absolute"
                                    style={{
                                        top: 18,
                                        right: -6,
                                        width: 12,
                                        height: 1,
                                        background: 'rgba(255,255,255,0.2)',
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
