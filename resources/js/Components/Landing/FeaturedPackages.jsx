import React from 'react';
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
 */
export default function FeaturedPackages({ packages, tournamentName }) {
    if (Array.isArray(packages) && packages.length === 0) return null;

    return (
        <section className="landing-featured" aria-labelledby="featured-trips-title">
            <div className="container">
                <div className="landing-featured__head">
                    <div>
                        <p className="landing-featured__eyebrow">Book in a few taps</p>
                        <h2 id="featured-trips-title" className="landing-featured__title">
                            Trips you can book now{tournamentName ? ` for ${tournamentName}` : ''}
                        </h2>
                        <p className="landing-featured__sub">
                            Fixed-price packages from verified partners. Pick one, sign in, and pay — no quote to wait for.
                        </p>
                    </div>
                    <button type="button" className="tfe-btn" onClick={() => openTripPlanner()}>
                        <i className="fas fa-sliders-h" aria-hidden="true"></i> Build my own trip
                    </button>
                </div>

                {packages === undefined ? (
                    <SkeletonCards count={3} />
                ) : (
                    <div className="row g-4">
                        {packages.map((l) => (
                            <div key={l.id} className="col-md-6 col-lg-4">
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
            </div>
        </section>
    );
}
