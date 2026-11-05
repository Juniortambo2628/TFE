import React, { useRef } from 'react';
import { Link } from '@inertiajs/react';
import AccentCard from '@/Components/Common/AccentCard';
import CapacityBar from '@/Components/Common/CapacityBar';
import { SkeletonCards } from '@/Components/Common/Skeleton';
import { openTripPlanner } from '@/lib/tripPlanner';
import { formatMoney } from '@/lib/utils';
import '../../../css/landing-sections.css';

/**
 * "Trips you can book now" on the landing page (Sprint 70).
 *
 * Testers asked for fewer steps between arriving and paying. A published
 * package IS the quote, so the fastest route is to show the packages on the
 * first screen: card → public listing page → Book now → sign in → pay.
 * Each card opens /listings/{id}, which works without an account.
 *
 * `packages` is a deferred prop: undefined while loading (skeleton), [] when
 * the tournament has none (the section steps aside — the planner below the
 * hero still covers that case).
 *
 * `variant="carousel"` (landing page v2) lays the same cards out in one
 * sideways-scrolling row with previous/next buttons instead of the grid —
 * the two versions answer the UX review's "scrolling or static?" question in
 * the same test. `eyebrow`/`title`/`sub` let v2 use its CMS-editable copy.
 */
export default function FeaturedPackages({
    packages,
    tournamentName,
    variant = 'grid',
    id,
    eyebrow = 'Book in a few taps',
    title = 'Trips you can book now',
    sub = 'Fixed-price packages from verified partners. Pick one, sign in, and pay — no quote to wait for.',
}) {
    const trackRef = useRef(null);
    if (Array.isArray(packages) && packages.length === 0) return null;
    const carousel = variant === 'carousel';

    const page = (dir) => {
        const track = trackRef.current;
        if (!track) return;
        const card = track.querySelector('.landing-featured__slide');
        const step = card ? card.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
        track.scrollBy({ left: dir * step, behavior: 'smooth' });
    };

    return (
        <section id={id} className={'landing-featured' + (carousel ? ' landing-featured--carousel' : '')} aria-labelledby="featured-trips-title">
            <div className="container">
                <div className="landing-featured__head">
                    <div>
                        <p className="landing-featured__eyebrow">{eyebrow}</p>
                        <h2 id="featured-trips-title" className="landing-featured__title">
                            {title}{tournamentName ? ` for ${tournamentName}` : ''}
                        </h2>
                        <p className="landing-featured__sub">{sub}</p>
                    </div>
                    <button type="button" className="tfe-btn" onClick={() => openTripPlanner()}>
                        <i className="fas fa-sliders-h" aria-hidden="true"></i> Build my own trip
                    </button>
                </div>

                {packages === undefined ? (
                    <SkeletonCards count={3} />
                ) : (
                    <div
                        ref={trackRef}
                        className={carousel ? 'landing-featured__track' : 'row g-4'}
                        {...(carousel ? { role: 'list', 'aria-label': title } : {})}
                    >
                        {packages.map((l) => (
                            <div
                                key={l.id}
                                className={carousel ? 'landing-featured__slide' : 'col-md-6 col-lg-4'}
                                {...(carousel ? { role: 'listitem' } : {})}
                            >
                                <AccentCard
                                    LinkComponent={Link}
                                    href={route('listings.show', l.id)}
                                    accent={l.publisher?.theme_accent || undefined}
                                    artwork={l.hero_image ? { src: l.hero_image, alt: l.name, variant: 'thumb' } : undefined}
                                    eyebrow={l.publisher ? `By ${l.publisher.display_name}` : undefined}
                                    title={l.name}
                                    desc={l.description}
                                    meta={[
                                        { label: 'From', value: formatMoney(l.base_price, l.currency || 'USD') },
                                        ...(l.nights ? [{ label: 'Nights', value: String(l.nights) }] : []),
                                    ]}
                                    cta={{ label: l.is_sold_out ? 'Sold out' : 'View & book', icon: l.is_sold_out ? null : 'fas fa-arrow-right' }}
                                >
                                    <CapacityBar sold={l.sold_count} capacity={l.capacity} pct={l.availability_pct} />
                                </AccentCard>
                            </div>
                        ))}
                    </div>
                )}

                {carousel && Array.isArray(packages) && packages.length > 1 && (
                    <div className="landing-featured__nav">
                        <button type="button" className="tfe-btn tfe-btn--icon" aria-label="Previous trips" onClick={() => page(-1)}>
                            <i className="fas fa-chevron-left" aria-hidden="true"></i>
                        </button>
                        <button type="button" className="tfe-btn tfe-btn--icon" aria-label="More trips" onClick={() => page(1)}>
                            <i className="fas fa-chevron-right" aria-hidden="true"></i>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
