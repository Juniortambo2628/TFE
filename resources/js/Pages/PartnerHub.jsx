import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import CapacityBar from '@/Components/Common/CapacityBar';
import GlassPill from '@/Components/Common/GlassPill';
import AccentCard from '@/Components/Common/AccentCard';
import { TournamentProvider } from '@/Context/TournamentContext';
import '../../css/partner-hub.css';

/**
 * PartnerHub — public /partners/{slug} page.
 *
 * Partner-branded hero (identity + About + What we offer), stats band,
 * the support pillars, and a grid of the partner's listings rendered with
 * the shared AccentCard. A slim "How it works" strip stays pinned to the
 * bottom of the viewport until the footer scrolls into view.
 */
export default function PartnerHub({ profile, listings = [] }) {
    const { assetUrl } = usePage().props;
    const accent = profile?.theme_accent || '#dc143c';
    const heroBg = profile?.hero_image
        ? profile.hero_image
        : `${assetUrl}assets/img/backdrops/stadium-fans.jpg`;
    const tags = profile?.service_tags || [];

    return (
        <TournamentProvider>
            <Head title={profile?.display_name || 'Partner'} />
            <Header />

            <div className="page-wrapper overflow-hidden bg-black text-white partner-hub">
                {/* Branded hero — identity on the left, About + What we offer on the right */}
                <section
                    className="partner-hub-hero"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 100%), url(${heroBg})` }}
                >
                    <div className="container">
                        <div className="partner-hub-hero__grid">
                            <div className="partner-hub-hero__identity">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    {profile?.logo_url && (
                                        <img src={profile.logo_url} alt={profile.display_name} className="partner-hub-hero__logo" />
                                    )}
                                    <div>
                                        <div className="partner-hub-hero__eyebrow">
                                            Official {formatPartnerType(profile?.partner_type)} Partner
                                        </div>
                                        <h1 className="partner-hub-hero__title">{profile?.display_name}</h1>
                                    </div>
                                </div>

                                {profile?.verification_status === 'verified' && (
                                    <GlassPill className="mb-3"><i className="fas fa-check-circle"></i> Verified partner</GlassPill>
                                )}

                                {profile?.tagline && (
                                    <p className="partner-hub-hero__tagline">{profile.tagline}</p>
                                )}

                                <div className="d-flex flex-wrap gap-2 mt-3">
                                    {profile?.contact_email && (
                                        <a href={`mailto:${profile.contact_email}`} className="tfe-btn tfe-btn--filled tfe-btn--lg">
                                            Contact us
                                        </a>
                                    )}
                                    {profile?.website_url && (
                                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="tfe-btn tfe-btn--lg">
                                            Visit website
                                            <i className="fas fa-external-link-alt" style={{ fontSize: '0.75rem' }} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {(profile?.about || tags.length > 0) && (
                                <div className="partner-hub-hero__about">
                                    {profile?.about && (
                                        <>
                                            <h2 className="partner-hub-hero__about-title">About {profile?.display_name}</h2>
                                            <p className="partner-hub-hero__about-text">{profile.about}</p>
                                        </>
                                    )}
                                    {tags.length > 0 && (
                                        <>
                                            <h3 className="partner-hub-hero__offer-title">What we offer</h3>
                                            <div className="d-flex flex-wrap gap-2">
                                                {tags.map((tag, idx) => (
                                                    <GlassPill key={idx} size="sm">{tag}</GlassPill>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Stats band */}
                {profile?.stats && profile.stats.length > 0 && (
                    <section className="py-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="container">
                            <div className="tfe-stat-grid" style={{ '--partner-accent': accent }}>
                                {profile.stats.map((stat, idx) => {
                                    const variant = ['red', 'amber', 'teal', 'violet'][idx % 4];
                                    return (
                                        <div key={idx} className={`tfe-tile tfe-tile--${variant}`}>
                                            <div className="tfe-tile__value">{stat.value}</div>
                                            <div className="tfe-tile__label">{stat.label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* How we support the sports ecosystem */}
                <HowWeSupportStrip accent={accent} />

                {/* Published listings — shared AccentCard */}
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
                            <div className="row g-4" style={{ paddingBottom: '96px' }}>
                                {listings.map((l) => (
                                    <div key={l.id} className="col-md-6 col-lg-4">
                                        <AccentCard
                                            LinkComponent={Link}
                                            href={route('fan.packages.show', l.id)}
                                            accent={accent}
                                            artwork={l.hero_image ? { src: l.hero_image, alt: l.name, variant: 'thumb' } : undefined}
                                            status={l.tournament_short || undefined}
                                            title={l.name}
                                            desc={l.description}
                                            meta={[
                                                { label: 'From', value: `${l.currency} ${Number(l.base_price).toLocaleString()}` },
                                            ]}
                                            cta={{ label: l.is_sold_out ? 'Sold out' : 'View details', icon: l.is_sold_out ? null : 'fas fa-arrow-right' }}
                                        >
                                            <CapacityBar sold={l.sold_count} capacity={l.capacity} pct={l.availability_pct} />
                                        </AccentCard>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <Footer />
            </div>

            {/* Slim, sticky "How it works" strip — pinned to the bottom of
                the viewport until the footer scrolls into view. */}
            <HowItWorksBar accent={accent} />
        </TournamentProvider>
    );
}

// Strip the trailing "_partner" before title-casing so "Official {type}
// Partner" doesn't read "Official Finance Partner Partner".
function formatPartnerType(t) {
    if (!t) return '';
    return t.replace(/_partner$/i, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * "How we support the sports ecosystem" — three pillars mapping to the
 * partner dashboard tabs (Publish / Convert / Measure).
 */
function HowWeSupportStrip({ accent }) {
    const pillars = [
        { icon: 'fa-tags', title: 'Publish', body: 'Package experiences fans actually want — matches, stays, transfers — and put them in front of every buyer on the platform.' },
        { icon: 'fa-handshake', title: 'Convert', body: 'Fans submit briefs against your listings. You quote, they book. No cold pipeline to chase.' },
        { icon: 'fa-chart-line', title: 'Measure', body: 'Track sell-through, turnaround and revenue per listing. Iterate on what wins.' },
    ];

    return (
        <section className="py-5">
            <div className="container">
                <h2 className="text-white fw-bold mb-4">How we support the sports ecosystem</h2>
                <div className="row g-4">
                    {pillars.map((p, i) => (
                        <div key={i} className="col-md-4">
                            <AccentCard
                                LinkComponent="div"
                                accent={accent}
                                icon={`fas ${p.icon}`}
                                title={p.title}
                                desc={p.body}
                                className="tfe-acard--content"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * HowItWorksBar — the fan-to-delivery pipeline as a slim glass bar pinned
 * to the bottom of the viewport. It appears once the user scrolls past the
 * hero and slides away when the footer enters view so it never covers it.
 */
function HowItWorksBar({ accent }) {
    const [visible, setVisible] = useState(false);

    const steps = [
        { n: 1, title: 'Fan brief' },
        { n: 2, title: 'Partner quote' },
        { n: 3, title: 'Payment' },
        { n: 4, title: 'Delivery' },
    ];

    useEffect(() => {
        const footer = document.querySelector('.tfe-footer, .footer');
        let footerVisible = false;

        const io = footer
            ? new IntersectionObserver(
                  ([entry]) => { footerVisible = entry.isIntersecting; update(); },
                  { threshold: 0 }
              )
            : null;
        if (io && footer) io.observe(footer);

        const update = () => {
            setVisible(window.scrollY > 320 && !footerVisible);
        };
        const onScroll = () => window.requestAnimationFrame(update);
        window.addEventListener('scroll', onScroll, { passive: true });
        update();

        return () => {
            window.removeEventListener('scroll', onScroll);
            if (io) io.disconnect();
        };
    }, []);

    return (
        <div className={'partner-hub-hiw' + (visible ? ' is-visible' : '')} style={{ '--partner-accent': accent }} aria-hidden={!visible}>
            <div className="partner-hub-hiw__inner">
                <span className="partner-hub-hiw__label">How it works</span>
                <ol className="partner-hub-hiw__steps">
                    {steps.map((s, i) => (
                        <li key={s.n} className="partner-hub-hiw__step">
                            <span className="partner-hub-hiw__num">{s.n}</span>
                            <span className="partner-hub-hiw__title">{s.title}</span>
                            {i < steps.length - 1 && <i className="fas fa-chevron-right partner-hub-hiw__sep"></i>}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
